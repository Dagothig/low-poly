/// <reference path="../extensions.ts" />
/// <reference path="../lib/three.d.ts" />
/// <reference path="vertex.ts" />

module geo {
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
                let ptA = shape.points[def[0]];
                let ptB = shape.points[def[1]];
                var norm = ptB.clone().sub(ptA);
                norm.set(-norm.y, norm.x);
                norm.setLength(1);
                if (def[2]) norm.multiplyScalar(-1);
                var normC = norm.x ? (ptA.x * norm.x) : (ptB.y * norm.y);
                return new Vertex(shape, def[0], def[1], norm, normC);
            });
            shape.computeSize();
            return shape;
        }

        static union(a: Shape, b: Shape): Shape {
            let s = new Shape();
            s.points = a.points.concat(b.points);
            let ptsFates: Fate[] = [];
            let shift = a.points.length;
            let aVerts = a.vertices.map(v => v.newSource(s));
            let bVerts = b.vertices.map(v => v.newSource(s, shift));

            function pushorep<T>(rep: boolean, arr: T[], i: number, v: T) {
                if (rep) arr[i] = v;
                else arr.push(v);
            }

            let split = (
                index: number, vert: Vertex, verts: Vertex[],
                // c, otherIndex, otherVertex, otherC, newPtIndex
                inters: [number, number, Vertex, number, number][]
            ) => {
                let replace = true;

                let ptA = vert.getPtA();
                let lastIndex = vert.ptAIndex;
                let alive: boolean = undefined;
                inters
                .sort((lhs, rhs) => lhs[0] - rhs[0])
                .forEach(inter => {
                    let oVert = inter[2];
                    if (alive === undefined) alive = !oVert.isInside(ptA);

                    let newPtIndex = inter[4];
                    let newPt: THREE.Vector2;
                    if (!newPtIndex) {
                        newPtIndex = inter[4] = s.points.length;
                        s.points.push(newPt = vert.getInterpolated(inter[0]));
                    }

                    if (alive) {
                        pushorep(replace, verts, index, new Vertex(s,
                            lastIndex, newPtIndex,
                            vert.norm, vert.normC
                        ));
                        replace = false;
                    }

                    lastIndex = newPtIndex;
                    alive = !alive;
                });
                if (alive) pushorep(replace, verts, index, new Vertex(s,
                    lastIndex, vert.ptBIndex,
                    vert.norm, vert.normC
                ));
            };

            // We can do the aVert splits sooner than the bSplits because we can
            // fully know after having gone through the bVerts. For the bInters,
            // we must wait until we've gone through every pair

            // bC aIndex aVert aC, newPtIndex, indexed by bVert index
            let bInters: [number, number, Vertex, number, number][][] = [];
            for (let i = aVerts.length; i--;) {
                let aVert = aVerts[i];
                // aC bIndex bVert bC newPtIndex
                let inters: [number, number, Vertex, number, number][] = [];
                for (let j = bVerts.length; j--;) {
                    let bVert = bVerts[j];
                    // cA cB
                    let inter = Vertex.getIntersection(aVert, bVert);
                    if (inter)
                        inters.push([inter[0], j, bVert, inter[1], undefined]);
                }
                split(i, aVert, aVerts, inters);
                inters.forEach(inter => {
                    let arr = bInters[inter[1]];
                    if (!arr) bInters[inter[1]] = arr = [];
                    arr.push([inter[3], i, aVert, inter[0], inter[4]]);
                });
            }
            bInters.forEach((inters, i) => split(i, bVerts[i], bVerts, inters));

            s.vertices = aVerts.concat(bVerts);
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
}