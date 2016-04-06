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
        render(shape: Shape) {
            var pad = 16;

            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.context.lineWidth = 8 * Math.sqrt(
                ((this.canvas.width - pad) * (this.canvas.height - pad)) /
                (1024 * 768)
            );
            this.context.lineCap = 'round';

            var ratio = new THREE.Vector2(
                this.canvas.width - pad * 2, this.canvas.height - pad * 2
            ).divide(shape.size);
            shape.vertices.forEach(vertex => {
                var start = vertex.getPtA();
                var end = vertex.getPtB();

                this.context.strokeStyle = 'rgb(0, 0, 255)';
                this.context.beginPath();
                this.context.moveTo(
                    pad + (start.x + end.x) / 2 * ratio.x,
                    pad + (start.y + end.y) / 2 * ratio.y
                );
                this.context.lineTo(
                    pad + ((start.x + end.x) / 2 + vertex.norm.x) * ratio.x,
                    pad + ((start.y + end.y) / 2 + vertex.norm.y) * ratio.y
                );
                this.context.stroke();

                this.context.strokeStyle = 'rgb(255, 0, 0)';
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
                this.context.strokeStyle = 'rgb(0, 255, 0)';
                this.context.beginPath();
                this.context.arc(
                    pad + (pt.x) * ratio.x,
                    pad + (pt.y) * ratio.y,
                    1, 0, Math.TAU
                );
                this.context.closePath();
                this.context.stroke();
            })
        }
    }
}