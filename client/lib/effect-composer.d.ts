/// <reference path="three.d.ts" />
/// <reference path="shader-pass.d.ts" />

declare namespace THREE {
    export interface Pass {
        render(
            renderer: WebGLRenderer,
            writeBuffer: RenderTarget,
            readBuffer: RenderTarget,
            delta: number,
            maskActive: boolean
        ): void;

        enabled: boolean;
        needsSwap: boolean;
    }

    export class EffectComposer {
        constructor(renderer: WebGLRenderer, renderTarget: RenderTarget);

        swapBuffers(): void;
        addPass(pass: Pass): void;
        insertPass(pass: Pass, index: number): void;
        render(delta?: number): void;
        reset(renderTarget: RenderTarget): void;
        setSize(width: number, height: number): void;

        renderer: WebGLRenderer;
        renderTarget1: RenderTarget;
        renderTarget2: RenderTarget;
        writeBuffer: RenderTarget;
        readBuffer: RenderTarget;
        passes: Pass[];
        copyPass: ShaderPass;
    }
}