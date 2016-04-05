/// <reference path="three.d.ts" />
/// <reference path="effect-composer.d.ts" />

declare namespace THREE {
    export class ShaderPass implements Pass {
        constructor(shader: Shader, textureID?: string);

        render(
            renderer: WebGLRenderer,
            writeBuffer: RenderTarget,
            readBuffer: RenderTarget,
            delta: number
        ): void;

        textureID: string;
        uniforms: any;
        material: ShaderMaterial;
        renderToScreen: boolean;
        enabled: boolean;
        needsSwap: boolean;
        clear: boolean;
        camera: Camera;
        scene: Scene;
        quad: Mesh;
    }
}