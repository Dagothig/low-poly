var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var rnd;
(function (rnd_1) {
    var Seeded = (function () {
        function Seeded(seed) {
            if (!seed)
                seed = Math.random();
            this.originalSeed = this.seed = seed;
        }
        //TODO: use a sane implementation
        // (y'know know where the constants come from a known place)
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
/// <reference path="rnd.ts" />
Object.merge = function merge(to) {
    var exts = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        exts[_i - 1] = arguments[_i];
    }
    var initial = {};
    exts.forEach(function (src) {
        Object.defineProperties(to, Object.keys(src).reduce(function (descrs, key) {
            descrs[key] = Object.getOwnPropertyDescriptor(src, key);
            return descrs;
        }, initial));
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
Array.prototype.with = function () {
    var objs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        objs[_i - 0] = arguments[_i];
    }
    this.push.apply(this, objs);
    return this;
};
Array.prototype.remove = function (obj) {
    return !!this.splice(this.indexOf(obj), 1).length;
};
Array.prototype.contains = function (obj) {
    return this.indexOf(obj) !== -1;
};
if (!Array.prototype.find) {
    Array.prototype.find = function (predicate) {
        if (this == null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;
        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}
Array.gen = function (f, c) {
    var arr = [];
    for (var i = 0; i < c; i++)
        arr.push(f(i));
    return arr;
};
Math.bound = function (n, mn, mx) {
    return Math.min(mx, Math.max(mn, n));
};
Math.HALF_PI = Math.PI / 2;
Math.TAU = Math.PI * 2;
// Note that unprefixing elements that aren't initially defined will break them
// (which is why it conditionnally unprefixes pointerLockElement)
// ps: this assumes that if requestPointerLock is defined, then so is
// pointerLockElement (c'mon people, I am only a man!)
function unprefix(element, prop, prefixes) {
    var capitalized = prop[0].toUpperCase() + prop.substring(1);
    var props = prefixes.map(function (prefix) { return prefix + capitalized; });
    if (!element[prop])
        return Object.defineProperty(element, prop, {
            get: function () {
                for (var _i = 0, props_1 = props; _i < props_1.length; _i++) {
                    var prop_1 = props_1[_i];
                    var val = this[prop_1];
                    if (val)
                        return val;
                }
            },
            set: function (val) {
                var _this = this;
                console.log(val);
                props.forEach(function (prop) { return _this[prop] = val; });
            }
        });
    return false;
}
if (unprefix(Element.prototype, 'requestPointerLock', ['moz', 'webkit']))
    unprefix(document, 'pointerLockElement', ['moz', 'webkit']);
var exts;
(function (exts) {
    function prefixCall(obj, func, name, prefxs) {
        var args = [];
        for (var _i = 4; _i < arguments.length; _i++) {
            args[_i - 4] = arguments[_i];
        }
        prefxs.with('').forEach(function (p) { return obj[func].apply(obj, [p + name].concat(args)); });
    }
    exts.prefixCall = prefixCall;
})(exts || (exts = {}));
/// <reference path="extensions.ts" />
/// <reference path="lib/three.d.ts" />
/// <reference path="rnd.ts" />
var graph;
(function (graph) {
    var Visiteable = (function () {
        function Visiteable(data) {
            this.data = data;
            this.visited = 0;
        }
        Visiteable.prototype.wasVisited = function (visitno) {
            return this.visited === visitno;
        };
        return Visiteable;
    }());
    var Vertex = (function (_super) {
        __extends(Vertex, _super);
        function Vertex(node1, node2, data) {
            _super.call(this, data);
            this.connected = [node1, node2];
        }
        Vertex.prototype._traverse = function (visitno, nodeFunc, vertexFunc) {
            vertexFunc(this);
            var toTraverse = this.connected.filter(function (v) {
                return !v.wasVisited(visitno) ? !!(v.visited = visitno) : false;
            });
            toTraverse.forEach(function (v) { return v._traverse(visitno, nodeFunc, vertexFunc); });
        };
        return Vertex;
    }(Visiteable));
    var Node = (function (_super) {
        __extends(Node, _super);
        function Node(data) {
            _super.call(this, data);
            this.connected = [];
        }
        Node.prototype.connect = function (node, data) {
            var vertex = new Vertex(this, node, data);
            this.connected.push(vertex);
            node.connected.push(vertex);
        };
        Node.prototype._traverse = function (visitno, nodeFunc, vertexFunc) {
            nodeFunc(this);
            var toTraverse = this.connected.filter(function (v) {
                return !v.wasVisited(visitno) ? !!(v.visited = visitno) : false;
            });
            toTraverse.forEach(function (v) { return v._traverse(visitno, nodeFunc, vertexFunc); });
        };
        Node.prototype.traverse = function (seeded, nodeFunc, vertexFunc) {
            var visitno = (seeded.next(Math.pow(2, 32), 0) | 0);
            this.visited = visitno;
            this._traverse(visitno, nodeFunc, vertexFunc);
        };
        return Node;
    }(Visiteable));
    graph.Node = Node;
})(graph || (graph = {}));
/// <reference path="../extensions.ts" />
/// <reference path="../lib/three.d.ts" />
var geo;
(function (geo) {
    var Vertex = (function () {
        function Vertex(ptSource, ptAIndex, ptBIndex, norm, normC, dir) {
            this.ptSource = ptSource;
            this.ptAIndex = ptAIndex;
            this.ptBIndex = ptBIndex;
            this.norm = norm;
            this.normC = normC;
            this.dir = dir;
        }
        Vertex.getIntersection = function (a, b) {
            // Let a_1, a_2, b_1, b_2 e |R^2 and c_1, c_2 e |R
            // If we have the lines c_1 * a_1 + b_1 and c_2 * a_2 + b_2
            // Such that they define the vertices a and b
            // with a_1 = [a_11, a_12], a_2 = [a_21, a_22]
            // Then we are wondering about the linear equation
            // c_1 * a_1 + b_1 = c_2 * a_2 + b_2 with the 'a's and 'b's known
            // then, let
            // A = [a_1 a_2]
            // c = [c_1, c_2], b = [b_1 b_2]
            // and we can write
            // Ac = b <=> c = A^-1 * b
            // with A^-1 = 1/|A| * adj(A)
            // we also have that if |A| = 0, then the lines are parallel
            // Finally, we must also consider the cases where
            // c_1 and c_2 lie outside the vertices
            // Nicely, because we do (end - start) for finding the directions
            // then if c_1 or c_2 lie outside of [0, 1]
            // TODO: Before we actually start computing things left and right, we can do a simple AABB check to limit the calculations
            var startA = a.getPtA();
            var startB = b.getPtA();
            var dirA = a.getDir(), dirB = b.getDir();
            var det = -(dirA.x * dirB.y) + (dirB.x * dirA.y);
            if (det === 0)
                return null;
            var invDet = 1 / det;
            var diffX = startB.x - startA.x, diffY = startB.y - startA.y;
            var cA = invDet * (-dirB.y * diffX + dirB.x * diffY);
            if (cA < 0 || cA > 1)
                return null;
            var cB = invDet * (-dirA.y * diffX + dirA.x * diffY);
            if (cB < 0 || cB > 1)
                return null;
            return [cA, cB];
        };
        Vertex.getPtIntersection = function (v, p) {
            var start = v.getPtA();
            var dir = v.getDir();
            // Naturally, if it's parallel to our line of doom, then it's doomed
            if (dir.y === 0)
                return null;
            var diffX = p.x - start.x, diffY = p.y - start.y;
            var cV = diffY / dir.y;
            if (cV < 0 || cV > 1)
                return null;
            var c = (-dir.y * diffX + dir.x * diffY) / dir.y;
            return c;
        };
        Vertex.prototype.getPtA = function () {
            return this.ptSource.points[this.ptAIndex];
        };
        Vertex.prototype.getPtB = function () {
            return this.ptSource.points[this.ptBIndex];
        };
        Vertex.prototype.getInterpolated = function (c) {
            return this.getPtA().clone().addScaledVector(this.getDir(), c);
        };
        Vertex.prototype.getDir = function () {
            return this.dir ||
                (this.dir = this.getPtB().clone().sub(this.getPtA()));
        };
        Vertex.prototype.isInside = function (pt) {
            return this.norm.dot(pt) > this.normC;
        };
        Vertex.prototype.newSource = function (ptSource, shift) {
            shift = shift || 0;
            return new Vertex(ptSource, this.ptAIndex + shift, this.ptBIndex + shift, this.norm, this.normC, this.dir);
        };
        return Vertex;
    }());
    geo.Vertex = Vertex;
    var Triangle = (function () {
        function Triangle() {
        }
        Triangle.prototype.construtor = function (ptSource, ptAIndex, ptBIndex, ptCIndex) {
            this.ptAIndex = ptAIndex;
            this.ptBIndex = ptBIndex;
            this.ptCIndex = ptCIndex;
        };
        return Triangle;
    }());
    geo.Triangle = Triangle;
})(geo || (geo = {}));
/// <reference path="../extensions.ts" />
/// <reference path="../lib/three.d.ts" />
/// <reference path="primitive.ts" />
var geo;
(function (geo) {
    var Fate;
    (function (Fate) {
        Fate[Fate["DEAD"] = 0] = "DEAD";
        Fate[Fate["ALIVE"] = 1] = "ALIVE";
    })(Fate || (Fate = {}));
    var Shape = (function () {
        function Shape() {
        }
        Shape.fromDefinitions = function (points, vertices) {
            var shape = new Shape();
            shape.points = points;
            shape.vertices = vertices.map(function (def) {
                var ptA = shape.points[def[0]];
                var ptB = shape.points[def[1]];
                var norm = ptB.clone().sub(ptA);
                norm.set(-norm.y, norm.x);
                norm.setLength(1);
                if (def[2])
                    norm.multiplyScalar(-1);
                var normC = norm.x ? (ptA.x * norm.x) : (ptB.y * norm.y);
                return new geo.Vertex(shape, def[0], def[1], norm, normC);
            });
            shape.computeSize();
            return shape;
        };
        Shape.union = function (a, b) {
            var s = new Shape();
            s.points = a.points.concat(b.points);
            var ptsFates = [];
            var shift = a.points.length;
            var aVerts = a.vertices.map(function (v) { return v.newSource(s); });
            var bVerts = b.vertices.map(function (v) { return v.newSource(s, shift); });
            function pushorep(rep, arr, i, v) {
                if (rep)
                    arr[i] = v;
                else
                    arr.push(v);
            }
            function split(index, vert, verts, 
                // c, otherIndex, otherVertex, otherC, newPtIndex
                inters) {
                var replace = true;
                var ptA = vert.getPtA();
                var lastIndex = vert.ptAIndex;
                var alive = undefined;
                inters
                    .sort(function (lhs, rhs) { return lhs[0] - rhs[0]; })
                    .forEach(function (inter) {
                    var oVert = inter[2];
                    if (alive === undefined) {
                        alive = !oVert.isInside(ptA);
                        // If the first one is inside, then it's first pt is inside
                        // as well and must be killed (with fire)
                        if (!alive)
                            ptsFates[vert.ptAIndex] = Fate.DEAD;
                    }
                    var newPtIndex = inter[4];
                    var newPt;
                    if (!newPtIndex) {
                        newPtIndex = inter[4] = s.points.length;
                        s.points.push(newPt = vert.getInterpolated(inter[0]));
                    }
                    if (alive) {
                        pushorep(replace, verts, index, new geo.Vertex(s, lastIndex, newPtIndex, vert.norm, vert.normC));
                        ptsFates[lastIndex] = Fate.ALIVE;
                        ptsFates[newPtIndex] = Fate.ALIVE;
                        replace = false;
                    }
                    lastIndex = newPtIndex;
                    alive = !alive;
                });
                if (alive) {
                    pushorep(replace, verts, index, new geo.Vertex(s, lastIndex, vert.ptBIndex, vert.norm, vert.normC));
                    ptsFates[lastIndex] = Fate.ALIVE;
                    ptsFates[vert.ptBIndex] = Fate.ALIVE;
                }
                else if (alive === false)
                    ptsFates[vert.ptBIndex] = Fate.DEAD;
            }
            ;
            function findFate(ptIndex, verts) {
                var pt = s.points[ptIndex];
                var closest = null;
                var closestInter = null;
                verts.forEach(function (vert) {
                    var inter = geo.Vertex.getPtIntersection(vert, pt);
                    if (!inter)
                        return;
                    inter = Math.abs(inter);
                    if (closestInter === null || inter < closestInter) {
                        closest = vert;
                        closestInter = closestInter;
                    }
                });
                return (closest === null || !closest.isInside(pt)) ?
                    Fate.ALIVE : Fate.DEAD;
            }
            function handlePtFate(index, vert, verts) {
                var fateA = ptsFates[vert.ptAIndex];
                var fateB = ptsFates[vert.ptBIndex];
                if (fateA === Fate.ALIVE && fateB === Fate.ALIVE) {
                    // live
                    return;
                }
                if (fateA === Fate.DEAD || fateB === Fate.DEAD) {
                    if (fateA === undefined)
                        ptsFates[vert.ptAIndex] = Fate.DEAD;
                    if (fateB === undefined)
                        ptsFates[vert.ptBIndex] = Fate.DEAD;
                    // die
                    return;
                }
                if (fateA === undefined)
                    ptsFates[vert.ptAIndex] = findFate(vert.ptAIndex, verts);
                if (fateB === undefined)
                    ptsFates[vert.ptBIndex] = findFate(vert.ptBIndex, verts);
                handlePtFate(index, vert, verts);
            }
            // We can do the aVert splits sooner than the bSplits because we can
            // fully know after having gone through the bVerts. For the bInters,
            // we must wait until we've gone through every pair
            var aNeeded, bNeeded;
            var ptA, ptB;
            var closestToA, closestToB;
            var closestInterToA, closestInterToB;
            // bC aIndex aVert aC, newPtIndex, indexed by bVert index
            var bInters = [];
            var _loop_1 = function(i) {
                var aVert = aVerts[i];
                // aC bIndex bVert bC newPtIndex
                var inters = [];
                aNeeded = ptsFates[aVert.ptAIndex] === undefined;
                bNeeded = ptsFates[aVert.ptBIndex] === undefined;
                if (aNeeded) {
                    closestToA = closestInterToA = null;
                    ptA = aVert.getPtA();
                }
                if (bNeeded) {
                    closestToB = closestInterToB = null;
                    ptB = aVert.getPtB();
                }
                for (var j = bVerts.length; j--;) {
                    var bVert = bVerts[j];
                    // cA cB
                    var inter = geo.Vertex.getIntersection(aVert, bVert);
                    if (inter) {
                        inters.push([inter[0], j, bVert, inter[1], undefined]);
                        aNeeded = bNeeded = false;
                    }
                    a: if (aNeeded) {
                        var inter_1 = geo.Vertex.getPtIntersection(bVert, ptA);
                        if (inter_1 === null)
                            break a;
                        inter_1 = Math.abs(inter_1);
                        if (closestInterToA === null || inter_1 < closestInterToA) {
                            closestInterToA = inter_1;
                            closestToA = bVert;
                        }
                    }
                    b: if (bNeeded) {
                        var inter_2 = geo.Vertex.getPtIntersection(bVert, ptB);
                        if (inter_2 === null)
                            break b;
                        inter_2 = Math.abs(inter_2);
                        if (closestInterToB === null || inter_2 < closestInterToB) {
                            closestInterToB = inter_2;
                            closestToB = bVert;
                        }
                    }
                }
                split(i, aVert, aVerts, inters);
                // Fate is either determined by it's intersections
                if (inters.length)
                    inters.forEach(function (inter) {
                        var arr = bInters[inter[1]];
                        if (!arr)
                            bInters[inter[1]] = arr = [];
                        arr.push([inter[3], i, aVert, inter[0], inter[4]]);
                    });
                else {
                    if (aNeeded)
                        ptsFates[aVert.ptAIndex] =
                            (closestToA === null || !closestToA.isInside(ptA)) ?
                                Fate.ALIVE : Fate.DEAD;
                    if (bNeeded)
                        ptsFates[aVert.ptBIndex] =
                            (closestToB === null || !closestToB.isInside(ptB)) ?
                                Fate.ALIVE : Fate.DEAD;
                    handlePtFate(i, aVert, bVerts);
                }
            };
            for (var i = aVerts.length; i--;) {
                _loop_1(i);
            }
            bVerts.forEach(function (bVert, i) {
                var inters = bInters[i];
                if (inters && inters.length)
                    split(i, bVert, bVerts, inters);
                else
                    handlePtFate(i, bVert, aVerts);
            });
            s.vertices = aVerts.concat(bVerts);
            for (var i = s.points.length; i--;) {
                var fate = ptsFates[i];
                if (fate !== Fate.DEAD)
                    continue;
                for (var j = s.vertices.length; j--;) {
                    var vert = s.vertices[j];
                    if (vert.ptAIndex === i || vert.ptBIndex === i) {
                        s.vertices.splice(j, 1);
                    }
                    else {
                        if (vert.ptAIndex > i)
                            vert.ptAIndex--;
                        if (vert.ptBIndex > i)
                            vert.ptBIndex--;
                    }
                }
                s.points.splice(i, 1);
            }
            s.computeSize();
            return s;
        };
        Shape.prototype.computeSize = function () {
            if (!this.points.length)
                return this.size = new THREE.Vector2();
            var min = this.points[0].clone();
            var max = this.points[0].clone();
            this.points.forEach(function (point) {
                min.min(point);
                max.max(point);
            });
            return this.size = max;
        };
        Shape.prototype.recenter = function () {
            function medianOf(arr, func) {
                var sorted = arr.slice().sort(function (lhs, rhs) { return func(lhs) - func(rhs); });
                if (sorted.length % 2 === 0) {
                    var lower = sorted[sorted.length / 2 - 1];
                    var upper = sorted[sorted.length / 2];
                    return (func(lower) + func(upper)) / 2;
                }
                else {
                    var pt = sorted[(sorted.length - 1) / 2];
                    return func(pt);
                }
            }
            var shift = new THREE.Vector2(medianOf(this.points, function (pt) { return pt.x; }), medianOf(this.points, function (pt) { return pt.y; }));
            this.points.forEach(function (pt) { return pt.sub(shift); });
            return shift;
        };
        return Shape;
    }());
    geo.Shape = Shape;
})(geo || (geo = {}));
/// <reference path="../extensions.ts" />
/// <reference path="../lib/three.d.ts" />
/// <reference path="shape.ts" />
var geo;
(function (geo) {
    var CanvasRenderer = (function () {
        function CanvasRenderer() {
            this.canvas = document.createElement('canvas');
            this.context = this.canvas.getContext("2d");
        }
        CanvasRenderer.prototype.updateSize = function () {
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
        };
        CanvasRenderer.prototype.render = function (shape) {
            var _this = this;
            var pad = 16;
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.context.lineWidth = 8 * Math.sqrt(((this.canvas.width - pad) * (this.canvas.height - pad)) /
                (1024 * 768));
            this.context.lineCap = 'round';
            var ratio = new THREE.Vector2(this.canvas.width - pad * 2, this.canvas.height - pad * 2).divide(shape.size);
            shape.vertices.forEach(function (vertex) {
                var start = vertex.getPtA();
                var end = vertex.getPtB();
                _this.context.strokeStyle = 'rgb(0, 0, 255)';
                _this.context.beginPath();
                _this.context.moveTo(pad + (start.x + end.x) / 2 * ratio.x, pad + (start.y + end.y) / 2 * ratio.y);
                _this.context.lineTo(pad + ((start.x + end.x) / 2 + vertex.norm.x) * ratio.x, pad + ((start.y + end.y) / 2 + vertex.norm.y) * ratio.y);
                _this.context.stroke();
                _this.context.strokeStyle = 'rgb(255, 0, 0)';
                _this.context.beginPath();
                _this.context.moveTo(pad + start.x * ratio.x, pad + start.y * ratio.y);
                _this.context.lineTo(pad + end.x * ratio.x, pad + end.y * ratio.y);
                _this.context.stroke();
            });
            shape.points.forEach(function (pt) {
                _this.context.strokeStyle = 'rgb(0, 255, 0)';
                _this.context.beginPath();
                _this.context.arc(pad + (pt.x) * ratio.x, pad + (pt.y) * ratio.y, 1, 0, Math.TAU);
                _this.context.closePath();
                _this.context.stroke();
            });
        };
        return CanvasRenderer;
    }());
    geo.CanvasRenderer = CanvasRenderer;
})(geo || (geo = {}));
/// <reference path="extensions.ts" />
var input;
(function (input) {
    input.keys = {
        left: [37, 65],
        up: [38, 87],
        right: [39, 68],
        down: [40, 83]
    };
    input.reverseKeys = {};
    Object.keys(input.keys).forEach(function (key) {
        return input.keys[key].forEach(function (keyCode) {
            return input.reverseKeys[keyCode] = key;
        });
    });
    input.buttons = {
        main: [0],
        off: [2]
    };
    input.reverseButtons = {};
    Object.keys(input.buttons).forEach(function (btn) {
        return input.buttons[btn].forEach(function (btnCode) {
            return input.reverseButtons[btnCode] = btn;
        });
    });
    var SubState = (function () {
        function SubState() {
            this.pressed = [];
            this.released = [];
            this.down = [];
        }
        SubState.prototype.isPressed = function (key) { return this.pressed.contains(key); };
        SubState.prototype.isReleased = function (key) { return this.released.contains(key); };
        SubState.prototype.isDown = function (key) { return this.down.contains(key); };
        SubState.prototype.finishStep = function () {
            this.pressed.length = 0;
            this.released.length = 0;
        };
        return SubState;
    }());
    input.SubState = SubState;
    var State = (function () {
        function State() {
            this.keys = new SubState();
            this.buttons = new SubState();
            this.moveX = 0;
            this.moveY = 0;
            this.pointerLocked = false;
        }
        State.prototype.finishStep = function () {
            this.keys.finishStep();
            this.buttons.finishStep();
            this.moveX = 0;
            this.moveY = 0;
        };
        return State;
    }());
    input.State = State;
    var Controls = (function () {
        function Controls(tag) {
            var _this = this;
            this.state = new State();
            this.onmousemove = function (event) {
                _this.state.moveX += event.movementX | 0;
                _this.state.moveY += event.movementY | 0;
            };
            this.onmousedown = function (event) {
                var btn = _this.buttonFor(event.button);
                _this.state.buttons.pressed.add(btn);
                _this.state.buttons.down.add(btn);
                _this.tag.requestPointerLock();
            };
            this.onmouseup = function (event) {
                var btn = _this.buttonFor(event.button);
                _this.state.buttons.released.add(btn);
                _this.state.buttons.down.remove(btn);
            };
            this.onkeydown = function (event) {
                var key = _this.keyFor(event.keyCode);
                _this.state.keys.pressed.add(key);
                _this.state.keys.down.add(key);
            };
            this.onkeyup = function (event) {
                var key = _this.keyFor(event.keyCode);
                _this.state.keys.released.add(key);
                _this.state.keys.down.remove(key);
            };
            this.onpointerlock = function (event) {
                _this.state.pointerLocked = document.pointerLockElement === _this.tag;
            };
            if (tag)
                this.tag = tag;
        }
        Object.defineProperty(Controls.prototype, "tag", {
            get: function () {
                return this._tag;
            },
            set: function (tag) {
                var _this = this;
                this.dispose();
                this._tag = tag;
                if (!tag)
                    return;
                [
                    ['mousemove', this.onmousemove],
                    ['mousedown', this.onmousedown],
                    ['mouseup', this.onmouseup],
                    ['keydown', this.onkeydown],
                    ['keyup', this.onkeyup]
                ].forEach(function (e) {
                    return _this.tag.addEventListener(e[0], e[1]);
                });
                exts.prefixCall(document, 'addEventListener', 'pointerlockchange', ['webkit', 'moz'], this.onpointerlock);
            },
            enumerable: true,
            configurable: true
        });
        Controls.prototype.dispose = function () {
            var _this = this;
            if (!this._tag)
                return;
            [
                ['mousemove', this.onmousemove],
                ['mousedown', this.onmousedown],
                ['mouseup', this.onmouseup],
                ['keydown', this.onkeydown],
                ['keyup', this.onkeyup]
            ].forEach(function (e) {
                return _this.tag.removeEventListener(e[0], e[1]);
            });
            exts.prefixCall(document, 'removeEventListener', 'pointerlockchange', ['webkit', 'moz'], this.onpointerlock);
        };
        Controls.prototype.keyFor = function (keyCode) {
            return input.reverseKeys[keyCode];
        };
        Controls.prototype.buttonFor = function (buttonCode) {
            return input.reverseButtons[buttonCode];
        };
        Controls.prototype.step = function (func) {
            func(this.state);
            this.state.finishStep();
        };
        return Controls;
    }());
    input.Controls = Controls;
    ;
    var MouseCamera = (function () {
        function MouseCamera(transform) {
            this.movVec = new THREE.Vector2();
            this.euler = new THREE.Euler(0, 0, 0, "YXZ");
            this.quaternion = new THREE.Quaternion();
            this.pitch = new THREE.Vector3(0, 0, 1);
            this.yaw = new THREE.Vector3(1, 0, 0);
            this.tempPitch = new THREE.Vector3();
            this.tempYaw = new THREE.Vector3();
            this.temp = new THREE.Vector3();
            this.transform = transform ||
                (function (m) { return m.multiplyScalar(0.01); });
        }
        MouseCamera.prototype.step = function (state) {
            this.movVec = this.transform(this.movVec.set(state.moveX, state.moveY));
            this.euler.y -= this.movVec.x;
            this.euler.x = Math.bound(this.euler.x - this.movVec.y, -Math.HALF_PI, Math.HALF_PI);
            this.quaternion.setFromEuler(this.euler, false);
        };
        MouseCamera.prototype.directionFor = function (pitch, yaw, length) {
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
        };
        return MouseCamera;
    }());
    input.MouseCamera = MouseCamera;
})(input || (input = {}));
/// <reference path="extensions.ts" />
/// <reference path="graph.ts" />
/// <reference path="rnd.ts" />
/// <reference path="lib/three.d.ts" />
/// <reference path="geo/shape.ts" />
/// <reference path="geo/primitive.ts" />
var dungeon;
(function (dungeon) {
    var Room = (function () {
        function Room() {
        }
        return Room;
    }());
    function render(shape) {
        var geometry = new THREE.Geometry();
        geometry.vertices = shape.points.map(function (pt) { return new THREE.Vector3(pt.x, 0, pt.y); })
            .concat(shape.points.map(function (pt) { return new THREE.Vector3(pt.x, 1, pt.y); }));
        var shift = shape.points.length;
        shape.vertices.forEach(function (vertex) {
            var ptA = vertex.getPtA();
            var ptB = vertex.getPtB();
            var computedNorm = ptB.clone().sub(ptA);
            computedNorm.set(-computedNorm.y, computedNorm.x);
            computedNorm.setLength(1);
            var inverseOrder = vertex.norm.x / computedNorm.x < 0 ||
                vertex.norm.y / computedNorm.y < 0;
            var normalShift = inverseOrder ? 0 : shift;
            var inverseShift = inverseOrder ? shift : 0;
            geometry.faces.push(new THREE.Face3(vertex.ptBIndex + normalShift, vertex.ptAIndex + normalShift, vertex.ptAIndex + inverseShift, new THREE.Vector3(vertex.norm.x, 0, vertex.norm.y)), new THREE.Face3(vertex.ptBIndex + normalShift, vertex.ptAIndex + inverseShift, vertex.ptBIndex + inverseShift, new THREE.Vector3(vertex.norm.x, 0, vertex.norm.y)));
            var width = vertex.getDir().length();
            var xScalar = 2 * width;
            var height = 1;
            var yScalar = 2;
            geometry.faceVertexUvs[0].push([
                new THREE.Vector2(xScalar, yScalar),
                new THREE.Vector2(0.0, yScalar),
                new THREE.Vector2(0.0, 0.0)
            ], [
                new THREE.Vector2(xScalar, yScalar),
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(xScalar, 0.0)
            ]);
        });
        return geometry;
    }
    dungeon.render = render;
    function populate(scene, material) {
        var node1 = new graph.Node(new THREE.Vector3(0, 0, 0));
        var node2 = new graph.Node(new THREE.Vector3(0, 0, 2));
        var node3 = new graph.Node(new THREE.Vector3(1, 0.5, 4));
        node1.connect(node2);
        node2.connect(node3);
        node1.traverse(new rnd.Seeded(), function (n) {
            var geometry = new THREE.Geometry();
            geometry.vertices.push(
            // Lower half
            new THREE.Vector3(-0.5, -0.5, -0.5), new THREE.Vector3(0.5, -0.5, -0.5), new THREE.Vector3(-0.5, -0.5, 0.5), new THREE.Vector3(0.5, -0.5, 0.5), 
            // Upper half
            new THREE.Vector3(-0.5, 0.5, -0.5), new THREE.Vector3(0.5, 0.5, -0.5), new THREE.Vector3(-0.5, 0.5, 0.5), new THREE.Vector3(0.5, 0.5, 0.5));
            // Bottom
            geometry.faces.push(new THREE.Face3(0, 3, 1, new THREE.Vector3(0, 1, 0), new THREE.Color(1, 0.5, 0), 1), new THREE.Face3(0, 2, 3, new THREE.Vector3(0, 1, 0), null, 1));
            geometry.faceVertexUvs[0].push([
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(2.0, 2.0),
                new THREE.Vector2(0.0, 2.0)
            ], [
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(2.0, 0.0),
                new THREE.Vector2(2.0, 2.0)
            ]);
            // Top
            geometry.faces.push(new THREE.Face3(4, 5, 7, new THREE.Vector3(0, -1, 0), null, 1), new THREE.Face3(4, 7, 6, new THREE.Vector3(0, -1, 0), null, 1));
            geometry.faceVertexUvs[0].push([
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(2.0, 0.0),
                new THREE.Vector2(2.0, 2.0)
            ], [
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(2.0, 2.0),
                new THREE.Vector2(0.0, 2.0)
            ]);
            // Sides
            geometry.faces.push(new THREE.Face3(0, 5, 4, new THREE.Vector3(0, 0, 1)), new THREE.Face3(0, 1, 5, new THREE.Vector3(0, 0, 1)));
            geometry.faceVertexUvs[0].push([
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(2.0, 2.0),
                new THREE.Vector2(0.0, 2.0)
            ], [
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(2.0, 0.0),
                new THREE.Vector2(2.0, 2.0)
            ]);
            geometry.faces.push(new THREE.Face3(3, 2, 6, new THREE.Vector3(0, 0, -1)), new THREE.Face3(3, 6, 7, new THREE.Vector3(0, 0, -1)));
            geometry.faceVertexUvs[0].push([
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(2.0, 0.0),
                new THREE.Vector2(2.0, 2.0)
            ], [
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(2.0, 2.0),
                new THREE.Vector2(0.0, 2.0)
            ]);
            geometry.faces.push(new THREE.Face3(2, 4, 6, new THREE.Vector3(1, 0, 0)), new THREE.Face3(2, 0, 4, new THREE.Vector3(1, 0, 0)));
            geometry.faceVertexUvs[0].push([
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(2.0, 2.0),
                new THREE.Vector2(0.0, 2.0)
            ], [
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(2.0, 0.0),
                new THREE.Vector2(2.0, 2.0)
            ]);
            geometry.faces.push(new THREE.Face3(1, 7, 5, new THREE.Vector3(-1, 0, 0)), new THREE.Face3(1, 3, 7, new THREE.Vector3(-1, 0, 0)));
            geometry.faceVertexUvs[0].push([
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(2.0, 2.0),
                new THREE.Vector2(0.0, 2.0)
            ], [
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(2.0, 0.0),
                new THREE.Vector2(2.0, 2.0)
            ]);
            var mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);
            mesh.position.copy(n.data);
        }, function (v) {
        });
    }
    dungeon.populate = populate;
})(dungeon || (dungeon = {}));
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
var camera = new THREE.PerspectiveCamera(75, //FOV
4 / 3, // aspect ratio (it will be updated in onresize)
0.1, // near
1000 // far
);
camera.position.set(0, 0.5, 0);
var camLight = new THREE.PointLight(0xffffff, 1, 3, 3);
/* textures */
var loader = new THREE.TextureLoader();
var onLoaded = function (texture) {
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
var nullT = null;
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
/* Geo render */
//var geoRender = new geo.CanvasRenderer();
//document.body.appendChild(geoRender.canvas);
var shape = geo.Shape.union(geo.Shape.fromDefinitions([
    new THREE.Vector2(0, 1),
    new THREE.Vector2(10, 1),
    new THREE.Vector2(0, 10),
    new THREE.Vector2(5, 5),
    new THREE.Vector2(2.5, 5)
], [
    [0, 1, false],
    [0, 2, true],
    [1, 3, false],
    [3, 4, false],
    [4, 2, false]
]), geo.Shape.fromDefinitions([
    new THREE.Vector2(2.5, 2.5),
    new THREE.Vector2(5, 0),
    new THREE.Vector2(4, 8),
    new THREE.Vector2(3, 9),
    new THREE.Vector2(8, 9),
    new THREE.Vector2(3.5, 4),
    new THREE.Vector2(3, 3)
], [
    [5, 6, true],
    [6, 0, true],
    [3, 4, true],
    [0, 3, true],
    [4, 1, true],
    [1, 2, true],
    [2, 5, true],
]));
shape.recenter();
scene.add(new THREE.Mesh(dungeon.render(shape), new THREE.MultiMaterial([brickMaterial, mortarMaterial])));
/* Size */
window.onresize = function (event) {
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
    controls.step(function (state) {
        if (state.pointerLocked)
            camControl.step(state);
        moveAlongPitch = moveAlongYaw = 0;
        if (state.keys.isDown('left'))
            moveAlongYaw--;
        if (state.keys.isDown('right'))
            moveAlongYaw++;
        if (state.keys.isDown('up'))
            moveAlongPitch--;
        if (state.keys.isDown('down'))
            moveAlongPitch++;
        var dir = camControl.directionFor(moveAlongPitch, moveAlongYaw, 0.01);
        camera.position.add(dir);
        camera.setRotationFromEuler(camControl.euler);
        camLight.position.copy(camera.position);
    });
    composer.render();
    requestAnimationFrame(render);
}
render();
