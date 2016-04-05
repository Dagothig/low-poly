/// <reference path="extensions.ts" />

module input {
    export var keys: { [K: string]: number[] } = {
        left: [37, 65],
        up: [38, 87],
        right: [39, 68],
        down: [40, 83]
    };
    export var reverseKeys: { [K: number]: string } = {};
    Object.keys(keys).forEach((key: string) =>
        keys[key].forEach((keyCode: number) =>
            reverseKeys[keyCode] = key));

    export var buttons: { [K: string]: number[] } = {
        main: [0],
        off: [2]
    };
    export var reverseButtons: { [K: number]: string } = {};
    Object.keys(buttons).forEach((btn: string) =>
        buttons[btn].forEach((btnCode: number) =>
            reverseButtons[btnCode] = btn));

    export class SubState {
        pressed: string[] = [];
        released: string[] = [];
        down: string[] = [];

        isPressed(key: string) { return this.pressed.contains(key); }
        isReleased(key: string) { return this.released.contains(key); }
        isDown(key: string) { return this.down.contains(key); }

        finishStep() {
            this.pressed.length = 0;
            this.released.length = 0;
        }
    }
    export class State {
        keys = new SubState();
        buttons = new SubState();
        moveX = 0;
        moveY = 0;
        pointerLocked = false;

        finishStep() {
            this.keys.finishStep();
            this.buttons.finishStep();
            this.moveX = 0;
            this.moveY = 0;
        }
    }

    export class Controls {

        constructor(tag?: Element) {
            if (tag) this.tag = tag;
        }

        state = new State();
        onmousemove = (event: MouseEvent) => {
            this.state.moveX += event.movementX|0;
            this.state.moveY += event.movementY|0;
        };
        onmousedown = (event: MouseEvent) => {
            var btn = this.buttonFor(event.button);
            this.state.buttons.pressed.add(btn);
            this.state.buttons.down.add(btn);

            this.tag.requestPointerLock();
        };
        onmouseup = (event: MouseEvent) => {
            var btn = this.buttonFor(event.button);
            this.state.buttons.released.add(btn);
            this.state.buttons.down.remove(btn);
        };
        onkeydown = (event: KeyboardEvent) => {
            var key = this.keyFor(event.keyCode);
            this.state.keys.pressed.add(key);
            this.state.keys.down.add(key);
        };
        onkeyup = (event: KeyboardEvent) => {
            var key = this.keyFor(event.keyCode);
            this.state.keys.released.add(key);
            this.state.keys.down.remove(key);
        };
        onpointerlock = (event: PointerEvent) => {
            this.state.pointerLocked = document.pointerLockElement === this.tag;
        };

        _tag: Element;
        get tag(): Element {
            return this._tag;
        }
        set tag(tag: Element) {
            this.dispose();
            this._tag = tag;
            if (!tag) return;

            [
                ['mousemove', this.onmousemove],
                ['mousedown', this.onmousedown],
                ['mouseup', this.onmouseup],
                ['keydown', this.onkeydown],
                ['keyup', this.onkeyup]
            ].forEach((e: [string, EventListener]) =>
                this.tag.addEventListener(e[0], e[1])
            );

            exts.prefixCall(document, 'addEventListener',
                'pointerlockchange', ['webkit', 'moz'], this.onpointerlock
            );
        }

        dispose() {
            if (!this._tag) return;

            [
                ['mousemove', this.onmousemove],
                ['mousedown', this.onmousedown],
                ['mouseup', this.onmouseup],
                ['keydown', this.onkeydown],
                ['keyup', this.onkeyup]
            ].forEach((e: [string, EventListener]) =>
                this.tag.removeEventListener(e[0], e[1])
            );

            exts.prefixCall(document, 'removeEventListener',
                'pointerlockchange', ['webkit', 'moz'], this.onpointerlock
            );
        }

        keyFor(keyCode: number): string {
            return reverseKeys[keyCode];
        }
        buttonFor(buttonCode: number): string {
            return reverseButtons[buttonCode];
        }

        step(func: (state:State) => any) {
            func(this.state);
            this.state.finishStep();
        }
    };
    export class MouseCamera {
        constructor(transform?: (move: THREE.Vector2) => THREE.Vector2) {
            this.transform = transform ||
                ((m: THREE.Vector2) => m.multiplyScalar(0.01));
        }

        movVec = new THREE.Vector2();
        transform: (move: THREE.Vector2) => THREE.Vector2;

        euler = new THREE.Euler(0, 0, 0, "YXZ");

        quaternion = new THREE.Quaternion();

        pitch = new THREE.Vector3(0, 0, 1);
        yaw = new THREE.Vector3(1, 0, 0);

        tempPitch = new THREE.Vector3();
        tempYaw = new THREE.Vector3();
        temp = new THREE.Vector3();

        step(state: State) {
            this.movVec = this.transform(this.movVec.set(state.moveX, state.moveY));
            this.euler.y -= this.movVec.x;
            this.euler.x = Math.bound(
                this.euler.x - this.movVec.y,
                -Math.HALF_PI, Math.HALF_PI
            );
            this.quaternion.setFromEuler(this.euler, false);
        }

        directionFor(pitch: number, yaw: number, length?: number): THREE.Vector3 {
            length = length || 1;

            this.tempPitch
                .copy(this.pitch)
                .applyQuaternion(this.quaternion)
                .multiplyScalar(pitch);

            this.tempYaw
                .copy(this.yaw)
                .applyQuaternion(this.quaternion)
                .multiplyScalar(yaw);

            return this.temp
                .copy(this.tempPitch)
                .add(this.tempYaw)
                .setLength(length);
        }
    }
}