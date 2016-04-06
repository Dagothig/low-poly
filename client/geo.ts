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
            // Nicely, because we do (end - start) for finding the directions
            // then if c_1 or c_2 lie outside of [0, 1]
            // TODO: Before we actually start computing things left and right, we can do a simple AABB check to limit the calculations
            var startA = a.getPtA();
            var startB = b.getPtA();
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
            var start = v.getPtA();
            var dir = v.getDir();

            // Naturally, if it's parallel to our line of doom, then it's doomed
            if (dir.y === 0) return null;

            var diffX = p.x - start.x, diffY = p.y - start.y;

            var cV = diffY / dir.y;
            if (cV < 0 || cV > 1) return null;

            var c = (- dir.y * diffX + dir.x * diffY) / dir.y;
            return c;
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
            return this.norm.dot(pt) < 0;
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

        static buildIntersections(vert: Vertex,
            verts: Vertex[], vertsFate: Fate[],
            ptAFate: boolean, ptBFate: boolean
        ): [
            [number, number, Vertex, number][],
            number[], number[]
        ] {
            let inters: [number, number, Vertex, number][] = [];
            let ptA = vert.getPtA(), ptB = vert.getPtB();
            let ptAInters: number[] = ptAFate && [];
            let ptBInters: number[] = ptBFate && [];

            for (let i = verts.length; i--;) {
                if (vertsFate[i] === Fate.DEAD) continue;
                let other = verts[i];

                let inter = Vertex.getIntersection(vert, other);
                if (inter) inters.push([inter[0], inter[1], other, i]);

                if (ptAInters) {
                    let aInter = Vertex.getPtIntersection(other, ptA);
                    if (aInter) ptAInters.push(aInter);
                }

                if (ptBInters) {
                    let bInter = Vertex.getPtIntersection(other, ptB);
                    if (bInter) ptBInters.push(bInter);
                }
            }
            return [inters, ptAInters, ptBInters];
        }
        static isInside(ptInters: number[]): boolean {
            let under0 = 0;
            let over0 = 0;
            ptInters.forEach(inter =>
                (inter > 0 ? over0++ :
                (inter < 0 ? under0++ :
                0)));
            if (under0 % 2 !== over0 % 2) throw 'Your fate is borked';
            return (under0 % 2) === 1;
        }
        static split(s: Shape, ptsFate: Fate[],
            aVert: Vertex,
            aVerts: Vertex[], aVertsFate: Fate[],
            bVerts: Vertex[], bVertsFate: Fate[],
            inters: [number, number, Vertex, number][]
        ) {
            let ptA = aVert.getPtA();
            let lastIndex = aVert.ptAIndex;
            let alive: boolean = undefined;
            inters.sort((lhs, rhs) => lhs[0] - rhs[0]).forEach(inter => {
                let bVert = inter[2];
                alive = !(alive === undefined ?
                    bVert.isInside(ptA) :
                    alive);

                let newPt = aVert.getInterpolated(inter[0]);
                let newPtIndex = s.points.length;

                s.points.push(newPt);
                ptsFate[newPtIndex] = Fate.ALIVE;

                // Note that we cannot conclude on the fate of these
                // vertices yet
                let j = inter[3];
                bVerts[j] = new Vertex(s,
                    bVert.ptAIndex, newPtIndex,
                    bVert.norm
                );
                bVerts.push(new Vertex(s,
                    newPtIndex, bVert.ptBIndex,
                    bVert.norm
                ));

                if (alive) {
                    aVertsFate[aVertsFate.length] = Fate.ALIVE;
                    aVerts.push(new Vertex(s,
                        lastIndex, newPtIndex,
                        aVert.norm
                    ));
                }
                lastIndex = newPtIndex;
            });
            if (alive) {
                aVertsFate[aVertsFate.length] = Fate.ALIVE;
                aVerts.push(new Vertex(s,
                    lastIndex, aVert.ptBIndex,
                    aVert.norm
                ));
            }
        }
        static resolveFate(vert: Vertex, i: number,
            ptAInters: number[], ptBInters: number[],
            vertsFate: Fate[], ptsFate: Fate[]
        ): any {
            let aFate = ptsFate[vert.ptAIndex];
            let bFate = ptsFate[vert.ptBIndex];
            if (aFate === Fate.DEAD || bFate === Fate.DEAD)
                // YOU'VE MET WITH A TERRIBLE FATE, HAVEN'T YOU?
                return Shape.kill(i, vert, vertsFate, ptsFate);

            if (aFate === undefined) {
                // The fate of pt-kind hangs in the balance of this point!
                if (Shape.isInside(ptAInters)) // That point is a spy!
                    return Shape.kill(i, vert, vertsFate, ptsFate);
                else ptsFate[vert.ptAIndex] = Fate.ALIVE;
            }
            if (bFate === undefined) {
                // Or maybe this one?...
                if (Shape.isInside(ptBInters)) // The lies...!
                    return Shape.kill(i, vert, vertsFate, ptsFate);
                else ptsFate[vert.ptBIndex] = Fate.ALIVE;
            }

            // Well, I didn't know you were this edgy...
            return vertsFate[i] = Fate.ALIVE;
        }
        static kill(i: number, vert: Vertex, vertsFate: Fate[], ptsFate: Fate[]) {
            vertsFate[i] =
            ptsFate[vert.ptAIndex] =
            ptsFate[vert.ptBIndex] = Fate.DEAD;
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
                // The dead can rot for all I care
                if (aVertsFate[i] === Fate.DEAD) continue;
                let aVert = aVerts[i];
                let intersResults = Shape.buildIntersections(aVert,
                    bVerts, bVertsFate,
                    ptsFate[aVert.ptAIndex] === undefined,
                    ptsFate[aVert.ptBIndex] === undefined
                );
                let inters = intersResults[0];
                if (inters.length) {
                    // Because splicing the vertex, would be a butt-load of ass,
                    // we just flag it as dead
                    // It's dead jim
                    aVertsFate[i] = Fate.DEAD;
                    Shape.split(s, ptsFate,
                        aVert,
                        aVerts, aVertsFate,
                        bVerts, bVertsFate,
                        inters
                    );
                } else {
                    Shape.resolveFate(aVert, i,
                        intersResults[1], intersResults[2],
                        aVertsFate, ptsFate
                    );
                }
            }

            // Once we are through with the whole aVerts shenanigans, then normally
            // every possible split has been done; all that remains is identifying
            // what goes and what stays in the land of bVerts
            for (let i = bVerts.length; i--;) {
                if (bVertsFate[i] === Fate.DEAD) continue;

                let bVert = bVerts[i];
                let ptA = bVert.getPtA();
                let ptB = bVert.getPtB();
                let ptAInters: number[] = [];
                let ptBInters: number[] = [];
                for (let j = aVerts.length; j--;) {
                    let aVert = aVerts[j];
                    let aInter = Vertex.getPtIntersection(aVert, ptA);
                    if (aInter) ptAInters.push(aInter);
                    let bInter = Vertex.getPtIntersection(bVert, ptB);
                    if (bInter) ptBInters.push(bInter);
                }

                Shape.resolveFate(bVert, i,
                    ptAInters, ptBInters,
                    bVertsFate, ptsFate
                );
            }

            let vertexFilter = (fates: Fate[]) => (vert: Vertex, i: number) => {
                switch (fates[i]) {
                    case Fate.ALIVE:
                        return true;
                    case Fate.DEAD:
                        return false;
                    default:
                        throw 'There appears to be an algorithmic error';
                }
            };
            s.vertices = aVerts.filter(vertexFilter(aVertsFate))
                .concat(bVerts.filter(vertexFilter(bVertsFate)));
            s.pruneDeadPoints(ptsFate);
            s.computeSize();

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
        pruneDeadPoints(ptFates: Fate[]) {
            console.warn('Pruning not implemented');
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