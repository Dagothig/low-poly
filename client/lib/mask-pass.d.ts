/// <reference path="effect-composer.d.ts" />

declare namespace THREE {
    export class MaskPass implements Pass {
        constructor(scene: Scene, camera: Camera);

        render(
            renderer: WebGLRenderer,
            writeBuffer: RenderTarget,
            readBuffer: RenderTarget,
            delta: number
        );

        scene: Scene;
        camera: Camera;
        enabled: boolean;
        clear: boolean;
        needsSwap: boolean;
        inverse: boolean;
    }
}