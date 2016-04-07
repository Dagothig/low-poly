/// <reference path="extensions.ts" />
/// <reference path="lib/three.d.ts" />
/// <reference path="lib/effect-composer.d.ts" />
/// <reference path="lib/render-pass.d.ts" />
/// <reference path="lib/shader-pass.d.ts" />
/// <reference path="graph.ts" />
/// <reference path="geo/canvas-renderer.ts" />
/// <reference path="geo/shape.ts" />
/// <reference path="input.ts" />
/// <reference path="dungeon.ts" />

/* Scene */
var scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0x111111));

/* Camera */
var camera = new THREE.PerspectiveCamera(
    75, //FOV
    4/3, // aspect ratio (it will be updated in onresize)
    0.1, // near
    1000 // far
);
camera.position.set(0, 0.5, 0);
var camLight = new THREE.PointLight(0xffffff, 1, 3, 3);

/* textures */
var loader = new THREE.TextureLoader();
var onLoaded = (texture: THREE.Texture) => {
    texture.magFilter = texture.minFilter = THREE.NearestFilter;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
};
var testBrickTexture = loader.load('img/test-brick-texture.png', onLoaded);
var testBrickNormal = loader.load('img/test-brick-normal-dirt.png', onLoaded);
var testMortarTexture = loader.load('img/test-mortar-texture.png', onLoaded);
var testMortarNormal = loader.load('img/test-mortar-normal-dirt.png', onLoaded);

/* Test material */
var brickMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    side: THREE.FrontSide,
    map: testBrickTexture,
    normalMap: testBrickNormal
});
var mortarMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    side: THREE.FrontSide,
    map: testMortarTexture,
    normalMap: testMortarNormal
});

/* Renderer */
var renderer = new THREE.WebGLRenderer({
    antialias: false
});
document.body.appendChild(renderer.domElement);

var nullT: THREE.Texture = null;
var testShader = {
    uniforms: {
        tDiffuse: { type: "t", value: nullT },
        resolution: { type: "v2", value: new THREE.Vector2() },
        colSpace: { type: "f", value: 16 },
        pixelSize: { type: "f", value: 3 }
    },
    vertexShader: document.querySelector('#vertShader').textContent,
    fragmentShader: document.querySelector('#fragShader').textContent
};

/* Composer */
var composer = new THREE.EffectComposer(renderer, new THREE.WebGLRenderTarget(renderer.getSize().width, renderer.getSize().height,
    {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        stencilBuffer: false
    }
));
composer.addPass(new THREE.RenderPass(scene, camera));

var effect = new THREE.ShaderPass(testShader);
effect.renderToScreen = true;
composer.addPass(effect);

/* Geo render */
//var geoRender = new geo.CanvasRenderer();
//document.body.appendChild(geoRender.canvas);
var shape = geo.Shape.union(
    geo.Shape.fromDefinitions(
        [
            new THREE.Vector2(0, 1),
            new THREE.Vector2(10, 1),
            new THREE.Vector2(0, 10),
            new THREE.Vector2(5, 5),
            new THREE.Vector2(2.5, 5)
        ],
        [
            [0, 1, false],
            [0, 2, true],
            [1, 3, false],
            [3, 4, false],
            [4, 2, false]
        ]
    ),
    geo.Shape.fromDefinitions(
        [
            new THREE.Vector2(2.5, 2.5),
            new THREE.Vector2(5, 0),
            new THREE.Vector2(4, 8),
            new THREE.Vector2(3, 9),
            new THREE.Vector2(8, 9),
            new THREE.Vector2(3.5, 4),
            new THREE.Vector2(3, 3)
        ],
        [
            [5, 6, true],
            [6, 0, true],
            [3, 4, true],
            [0, 3, true],
            [4, 1, true],
            [1, 2, true],
            [2, 5, true],
        ]
    )
);
shape.recenter();
scene.add(new THREE.Mesh(
    dungeon.render(shape),
    new THREE.MultiMaterial([brickMaterial, mortarMaterial])
));

/* Size */
window.onresize = event => {
    var x = window.innerWidth, y = window.innerHeight;

    camera.aspect = x / y;
    camera.updateProjectionMatrix();

    testShader.uniforms.resolution.value.set(x, y);
    effect.uniforms.resolution.value.set(x, y);
    effect.material.uniforms.resolution.value.set(x, y);

    renderer.setSize(x, y, false);
    composer.setSize(x, y);

    //geoRender.updateSize();
    //geoRender.render(shape);
};
window.onresize(null);

/* Input */
var controls = new input.Controls(document.body);
var camControl = new input.MouseCamera();

/* Position */
var moveAlongPitch = 0, moveAlongYaw = 0;
scene.add(camera);
scene.add(camLight);

/* Render */
var lastRender = 0;
function render() {
    var now = window.performance.now();
    lastRender = now;

    controls.step(state => {
        if (state.pointerLocked) camControl.step(state);

        moveAlongPitch = moveAlongYaw = 0;
        if (state.keys.isDown('left')) moveAlongYaw--;
        if (state.keys.isDown('right')) moveAlongYaw++;
        if (state.keys.isDown('up')) moveAlongPitch--;
        if (state.keys.isDown('down')) moveAlongPitch++;
        let dir = camControl.directionFor(moveAlongPitch, moveAlongYaw, 0.01);

        camera.position.add(dir);
        camera.setRotationFromEuler(camControl.euler);
        camLight.position.copy(camera.position);
    });

    composer.render();

    requestAnimationFrame(render);
}
render();