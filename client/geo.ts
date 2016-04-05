/// <reference path="lib/three.d.ts" />

module geo {

    export interface PtSource {
        points: THREE.Vector2[];
    }

    export class Vertex {

        static getIntersection(a: Vertex, b: Vertex): [number, number] {
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
            // Nicely, because we do end - start for finding the dirs
            // then if c_1 or c_2 lie outside of [0, 1]
            // TODO: Before we actually start computing things left and right, we can do a simple AABB check to limit the calculations
            var startA = a.getPtA(), endA = a.getPtB();
            var startB = b.getPtA(), endB = b.getPtB();
            var dirA = a.getDir(), dirB = b.getDir();

            var det = - (dirA.x * dirB.y) + (dirB.x * dirA.y);
            if (det === 0) return null;

            var invDet = 1 / det;
            var diffX = startB.x - startA.x, diffY = startB.y - startA.y;

            var cA = invDet * (- dirB.y * diffX + dirB.x * diffY);
            if (cA < 0 || cA > 1) return null;

            var cB = invDet * (- dirA.y * diffX + dirA.x * diffY);
            if (cB < 0 || cB > 1) return null;

            return [cA, cB];
        }
        static getPtIntersection(v: Vertex, p: THREE.Vector2): number {
            // If you declare p as a vertex with start = p and dir = (1, 0),
            // then the algo simplifies to this
            var start = v.getPtA();
            var dir = v.getDir();

            if (dir.y === 0) return null;

            var diffX = p.x - start.x, diffY = p.y - start.y;
            let vertexC = diffY / dir.y;
            return (- dir.y * diffX + dir.x * diffY) / dir.y;
        }

        constructor(
            ptSource?: PtSource,
            ptAIndex?: number,
            ptBIndex?: number,
            norm?: THREE.Vector2,
            dir?: THREE.Vector2
        ) {
            this.ptSource = ptSource;
            this.ptAIndex = ptAIndex;
            this.ptBIndex = ptBIndex;
            this.norm = norm;
            this.dir = dir;
        }

        ptSource: PtSource;
        ptAIndex: number;
        ptBIndex: number;
        norm: THREE.Vector2;
        dir: THREE.Vector2;

        getPtA(): THREE.Vector2 {
            return this.ptSource.points[this.ptAIndex];
        }
        getPtB(): THREE.Vector2 {
            return this.ptSource.points[this.ptBIndex];
        }
        getInterpolated(c: number): THREE.Vector2 {
            return this.getPtA().clone().addScaledVector(this.getDir(), c);
        }
        getDir(): THREE.Vector2 {
            return this.dir ||
                (this.dir = this.getPtB().clone().sub(this.getPtA()));
        }
        isInside(pt: THREE.Vector2) {
            return this.norm.dot(pt) > 0;
        }
        newSource(ptSource: PtSource, shift?: number): Vertex {
            shift = shift || 0;
            return new Vertex(
                ptSource,
                this.ptAIndex + shift,
                this.ptBIndex + shift,
                this.norm,
                this.dir
            );
        }
    }

    enum Fate {
        DEAD,
        ALIVE
    }
    export class Shape implements PtSource {

        static fromDefinitions(
            points: THREE.Vector2[],
            vertices: [number, number, boolean][]
        ): Shape {
            var shape = new Shape();
            shape.points = points;
            shape.vertices = vertices.map(def => {
                var norm = shape.points[def[1]].clone()
                    .sub(shape.points[def[0]]);
                norm.set(-norm.y, norm.x);
                norm.setLength(1);
                if (def[2]) norm.multiplyScalar(-1);
                return new Vertex(shape, def[0], def[1], norm)
            });
            shape.computeSize();
            return shape;
        }

        static newUnion(a: Shape, b: Shape): Shape {

            let s = new Shape();
            s.points = a.points.concat(b.points);
            let ptsFate: Fate[] = [];

            let aVerts = a.vertices.map(v => v.newSource(s));
            let aVertsFate: Fate[] = [];

            let shift = a.points.length;
            let bVerts = b.vertices.map(v => v.newSource(s, shift));
            let bVertsFate: Fate[] = [];

            for (let i = aVerts.length; i--;) {
                let aVert = aVerts[i];

                // Since vertices are not ordered, we are handling intersections in
                // two steps so that we can handle them properly; liveliness depends
                // on it
                let inters: [number, number, Vertex, number][] = [];
                for (let j = bVerts.length; j--;) {
                    let bVert = bVerts[j];
                    let inter = Vertex.getIntersection(aVert, bVert);
                    if (inter) inters.push([inter[0], inter[1], bVert, j]);
                }
                if (inters.length) {
                    aVertsFate[i] = Fate.DEAD;
                    // Since we have found intersections, then we can split and
                    // determine our fate
                    let lastIndex = aVert.ptAIndex;
                    let alive: boolean = undefined;
                    inters
                        .sort((lhs, rhs) => lhs[0] - rhs[0])
                        .forEach(inter => {
                            let bVert = inter[2];
                            let j = inter[3];
                            alive = !(alive === undefined ?
                                bVert.isInside(aVert.getPtA()) :
                                alive);

                            bVertsFate[]

                            if (bVert.isInside(aVert.getPtA())) {
                                // Because the starting pt of a is inside b, then it
                                // must die
                                ptsFate[];
                            }
                        });
                } else {
                    // Because there were no intersections, then we need to check
                    // the points to attempt to find our fate; if either of the
                    // connecting points is dead, then this is dead as well and we
                    // can propagate the fate
                    if (ptsFate[aVert.ptAIndex] === Fate.DEAD ||
                        ptsFate[aVert.ptBIndex] === Fate.DEAD
                    ) {
                        aVertsFate[i] =
                        ptsFate[aVert.ptAIndex] =
                        ptsFate[aVert.ptBIndex] = Fate.DEAD;
                    }
                }
            }

            return s;
        }
        static union(a: Shape, b: Shape): Shape {

            let s = new Shape();
            s.points = a.points.concat(b.points);
            s.vertices = [];

            // Because we don't want to have to do each a for each b in addition
            // to each b for each a, then we can keep an array of the vertices of b
            // that were not split;
            // those that were split will be added as they are found
            let bverts = Array.gen(i => true, b.vertices.length);
            let bis = a.points.length;
            a.vertices.forEach((av, i) => {
                let lastPtIndex = av.ptAIndex;
                let inters = b.vertices
                    .reduce<[number, number, Vertex][]>((t, bv, j) => {
                        let inter = Vertex.getIntersection(av, bv);
                        if (inter) {
                            t.push([inter[0], inter[1], bv]);
                            bverts[j] = false;
                        }
                        return t;
                    }, [])
                    .sort((lhs, rhs) => lhs[0] - rhs[0])
                    .forEach(inter => {
                        let bv = inter[2];
                        let newPt = av.getInterpolated(inter[0]);
                        let newPtIndex = s.points.length;
                        s.points.push(newPt);
                        s.vertices.push(
                            // first part of av split
                            new Vertex(s, lastPtIndex, newPtIndex, av.norm),
                            // bv split
                            new Vertex(s, bv.ptAIndex + bis, newPtIndex, bv.norm),
                            new Vertex(s, newPtIndex, bv.ptBIndex + bis, bv.norm)
                        )
                        lastPtIndex = newPtIndex;
                    });
                s.vertices.push(new Vertex(s, lastPtIndex, av.ptBIndex, av.norm));
            });
            bverts.forEach((toAdd, i) => {
                if (!toAdd) return;
                let bv = b.vertices[i];
                s.vertices.push(new Vertex(s, bv.ptAIndex + bis, bv.ptBIndex + bis, bv.norm, bv.dir));
            });

            s.computeSize();

            return s;
        }

        points: THREE.Vector2[];
        vertices: Vertex[];
        size: THREE.Vector2;

        computeSize() {
            if (!this.points.length) return this.size = new THREE.Vector2();
            var min = this.points[0].clone();
            var max = this.points[0].clone();
            this.points.forEach(point => {
                min.min(point);
                max.max(point);
            });
            this.size = max;
        }
    }

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