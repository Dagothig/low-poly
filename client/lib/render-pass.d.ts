/// <reference path="three.d.ts" />
/// <reference path="effect-composer.d.ts" />

declare namespace THREE {
    export class RenderPass implements Pass {
        constructor(
            scene: Scene,
            camera: Camera,
            overrideMaterial?: Material,
            clearColor?: Color,
            clearAlpha?: number
        );

        render(
            renderer: WebGLRenderer,
            writeBuffer: RenderTarget,
            readBuffer: RenderTarget,
            delta: number
        ): void;

        scene: Scene;
        camera: Camera;
        overrideMaterial: Material;
        clearColor: Color;
        clearAlpha: number;
        oldClearColor: Color;
        oldClearAlpha: number;
        enabled: boolean;
        clear: boolean;
        needsSwap: boolean;
    }
}