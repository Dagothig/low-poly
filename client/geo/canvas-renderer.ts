/// <reference path="../extensions.ts" />
/// <reference path="../lib/three.d.ts" />
/// <reference path="shape.ts" />

module geo {
    export class CanvasRenderer {
        constructor() {
            this.canvas = document.createElement('canvas');
            this.context = this.canvas.getContext("2d");
        }

        canvas: HTMLCanvasElement;
        context: CanvasRenderingContext2D;

        updateSize() {
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
        }
        render(shape: Shape, shift: THREE.Vector2, trigs?: Triangle[]) {
            var pad = 16;

            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.context.lineWidth = 8 * Math.sqrt(
                ((this.canvas.width - pad) * (this.canvas.height - pad)) /
                (1024 * 768)
            );
            this.context.lineCap = 'round';

            var ratio = new THREE.Vector2(
                this.canvas.width - pad * 2,
                this.canvas.height - pad * 2
            ).divide(shape.size.clone());
            let start = new THREE.Vector2(), end = new THREE.Vector2();
            let ptA = new THREE.Vector2();
            let ptB = new THREE.Vector2();
            let ptC = new THREE.Vector2();

            if (trigs) trigs.forEach(trig => {
                this.context.fillStyle = 'rgba(255, 255, 255, 0.25)';
                this.context.beginPath();
                ptA.copy(trig.getPtA()).add(shift);
                ptB.copy(trig.getPtB()).add(shift);
                ptC.copy(trig.getPtC()).add(shift);
                this.context.moveTo(pad + ptA.x * ratio.x, pad + ptA.y * ratio.y);
                this.context.lineTo(pad + ptB.x * ratio.x, pad + ptB.y * ratio.y);
                this.context.lineTo(pad + ptC.x * ratio.x, pad + ptC.y * ratio.y);
                this.context.fill();
            });

            shape.edges.forEach(edge => {
                start.copy(edge.getPtA()).add(shift);
                end.copy(edge.getPtB()).add(shift);

                this.context.strokeStyle = 'rgba(0, 0, 255, 0.5)';
                this.context.beginPath();
                this.context.moveTo(
                    pad + (start.x + end.x) / 2 * ratio.x,
                    pad + (start.y + end.y) / 2 * ratio.y
                );
                if (edge.norm) this.context.lineTo(
                    pad + ((start.x + end.x) / 2 + edge.norm.x) * ratio.x,
                    pad + ((start.y + end.y) / 2 + edge.norm.y) * ratio.y
                );
                this.context.stroke();

                this.context.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                this.context.beginPath();
                this.context.moveTo(
                    pad + start.x * ratio.x,
                    pad + start.y * ratio.y
                );
                this.context.lineTo(
                    pad + end.x * ratio.x,
                    pad + end.y * ratio.y
                );
                this.context.stroke();
            });
            shape.points.forEach(pt => {
                this.context.strokeStyle = 'rgba(0, 255, 0, 0.5)';
                this.context.beginPath();
                this.context.arc(
                    pad + (pt.x + shift.x) * ratio.x,
                    pad + (pt.y + shift.y) * ratio.y,
                    1, 0, Math.TAU
                );
                this.context.closePath();
                this.context.stroke();
            });
        }
    }
}