var rnd;
(function (rnd_1) {
    var Seeded = (function () {
        function Seeded(seed) {
            this.originalSeed = this.seed = seed;
        }
        //TODO: use a sane implementation (y'know know where the constants come from)
        Seeded.prototype.next = function (max, min) {
            max = max || 1;
            min = min || 0;
            max = Math.max(max, min);
            if (max === min)
                return max;
            this.seed = (this.seed * 9301 + 49297) % 233280;
            var rnd = this.seed / 233280;
            return min + rnd * (max - min);
        };
        return Seeded;
    }());
    rnd_1.Seeded = Seeded;
    ;
})(rnd || (rnd = {}));
/// <reference path="rnd/seeded.ts" />
Object.merge = function merge(to) {
    var exts = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        exts[_i - 1] = arguments[_i];
    }
    exts.forEach(function (src) {
        Object.defineProperties(to, Object.keys(src).reduce(function (descrs, key) {
            descrs[key] = Object.getOwnPropertyDescriptor(src, key);
            return descrs;
        }, {}));
    });
    return to;
};
Array.prototype.swap = function (i1, i2) {
    var obj = this[i1];
    this[i1] = this[i2];
    this[i2] = obj;
    return this;
};
Array.prototype.shuffle = function () {
    for (var i = 0; i < this.length; i++) {
        var ri = (Math.random() * this.length) | 0;
        this.swap(this, i, ri);
    }
    return this;
};
Array.prototype.spliceRnd = function (rnd) {
    return this.splice(rnd.next(this.length) | 0, 1)[0];
};
Array.prototype.rnd = function (rnd) {
    return this[rnd.next(this.length) | 0];
};
Array.prototype.add = function (obj) {
    if (this.indexOf(obj) === -1)
        return !!(this.push(obj) || true);
    else
        return false;
};
Array.prototype.remove = function (obj) {
    return !!this.splice(this.indexOf(obj), 1).length;
};
Array.gen = function (f, c) {
    var arr = [];
    for (var i = 0; i < c; i++)
        arr.push(f(i));
    return arr;
};
/// <reference path="extensions.ts" />
/// <reference path="lib/three.d.ts" />
/* Scene */
var scene = new THREE.Scene();
/* Camera */
var camera = new THREE.PerspectiveCamera(75, //FOV
4 / 3, // aspect ratio (it will be updated in onresize)
0.1, // near
1000 // far
);
camera.position.set(0, 0, 1.5);
/* Light */
var point = new THREE.PointLight(0xffffff, 1, 2, 2);
point.position.set(0, 0, 0);
scene.add(point);
/* textures */
var loader = new THREE.TextureLoader();
var testBrickTexture = loader.load('img/test-brick-texture.png', function (texture) {
    texture.magFilter = texture.minFilter = THREE.NearestFilter;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
});
var testBrickBump = loader.load('img/test-brick-bump.png', function (texture) {
    texture.minFilter = texture.magFilter = THREE.LinearFilter;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
});
var testBrickNormal = loader.load('img/test-brick-normal-dirt.png', function (texture) {
    texture.minFilter = texture.magFilter = THREE.NearestFilter;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
});
/* Test material */
var material = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    side: THREE.BackSide,
    map: testBrickTexture,
    normalMap: testBrickNormal,
    bumpMap: testBrickBump
});
/* Test geometry */
var geometry = new THREE.BoxGeometry(1, 1, 1);
/* Test mesh */
var mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);
/* Renderer */
var renderer = new THREE.WebGLRenderer({
    antialias: false
});
document.body.appendChild(renderer.domElement);
var testShader = {
    uniforms: {
        tDiffuse: { type: "t", value: null },
        resolution: { type: "v2", value: new THREE.Vector2(1, 1) },
        colSpace: { type: "f", value: 16 },
        pixelSize: { type: "f", value: 3 }
    },
    vertexShader: document.querySelector('#vertShader').textContent,
    fragmentShader: document.querySelector('#fragShader').textContent
};
/* Composer */
var composer = new THREE.EffectComposer(renderer, new THREE.WebGLRenderTarget(renderer.getSize().width, renderer.getSize().height, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    stencilBuffer: false
}));
composer.addPass(new THREE.RenderPass(scene, camera));
var effect = new THREE.ShaderPass(testShader);
effect.renderToScreen = true;
composer.addPass(effect);
/* Size */
window.onresize = function (event) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    var x = window.innerWidth, y = window.innerHeight;
    testShader.uniforms.resolution.value.set(x, y);
    effect.uniforms.resolution.value.set(x, y);
    effect.material.uniforms.resolution.value.set(x, y);
    renderer.setSize(x, y, false);
    composer.setSize(x, y);
};
window.onresize(null);
/* Render */
var lastRender = 0;
var anim = 0;
function render() {
    var now = window.performance.now();
    anim += (now - lastRender) / 1000;
    lastRender = now;
    mesh.rotateY(0.005);
    point.position.x = Math.sin(anim) * 0.4;
    point.position.y = Math.cos(anim) * 0.4;
    point.position.z = Math.sin(anim) * Math.cos(anim) * 0.4;
    requestAnimationFrame(render);
    composer.render();
}
render();
/* Temp pos */
window.onkeydown = function (event) {
    switch (event.keyCode) {
        case 38:
            camera.position.y += 0.1;
            break;
        case 40:
            camera.position.y -= 0.1;
            break;
        case 37:
            camera.position.z += 0.1;
            break;
        case 39:
            camera.position.z -= 0.1;
            break;
    }
};
