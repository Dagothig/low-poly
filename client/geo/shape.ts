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

            function split(
                index: number, vert: Vertex, verts: Vertex[],
                // c, otherIndex, otherVertex, otherC, newPtIndex
                inters: [number, number, Vertex, number, number][]
            ) {
                let replace = true;

                let ptA = vert.getPtA();
                let lastIndex = vert.ptAIndex;
                let alive: boolean = undefined;
                inters
                .sort((lhs, rhs) => lhs[0] - rhs[0])
                .forEach(inter => {
                    let oVert = inter[2];
                    if (alive === undefined) {
                        alive = !oVert.isInside(ptA);
                        // If the first one is inside, then it's first pt is inside
                        // as well and must be killed (with fire)
                        if (!alive) ptsFates[vert.ptAIndex] = Fate.DEAD;
                    }

                    let newPtIndex = inter[4];
                    let newPt: THREE.Vector2;
                    if (!newPtIndex) {
                        newPtIndex = inter[4] = s.points.length;
                        s.points.push(newPt = vert.getInterpolated(inter[0]));
                    }

                    if (alive) {
                        pushorep(replace, verts, index, new Vertex(s,
                            lastIndex, newPtIndex,
                            vert.norm,     vert.normC
                        ));
                        ptsFates[lastIndex] = Fate.ALIVE;
                        ptsFates[newPtIndex] = Fate.ALIVE;
                        replace = false;
                    }

                    lastIndex = newPtIndex;
                    alive = !alive;
                });
                if (alive) {
                    pushorep(replace, verts, index, new Vertex(s,
                        lastIndex, vert.ptBIndex,
                        vert.norm, vert.normC
                    ));
                    ptsFates[lastIndex] = Fate.ALIVE;
                    ptsFates[vert.ptBIndex] = Fate.ALIVE;
                }
                else if (alive === false) ptsFates[vert.ptBIndex] = Fate.DEAD;
            };

            function findFate(ptIndex: number, verts: Vertex[]): Fate {
                let pt = s.points[ptIndex];
                let closest: Vertex = null;
                let closestInter: number = null;
                verts.forEach(vert => {
                    let inter = Vertex.getPtIntersection(vert, pt);
                    if (!inter) return;
                    inter = Math.abs(inter);
                    if (closestInter === null || inter < closestInter) {
                        closest = vert;
                        closestInter = closestInter;
                    }
                });
                return (closest === null || !closest.isInside(pt)) ?
                    Fate.ALIVE : Fate.DEAD;
            }
            function handlePtFate(index: number, vert: Vertex, verts: Vertex[]) {
                let fateA = ptsFates[vert.ptAIndex];
                let fateB = ptsFates[vert.ptBIndex];
                if (fateA === Fate.ALIVE && fateB === Fate.ALIVE) {
                    // live
                    return;
                }
                if (fateA === Fate.DEAD || fateB === Fate.DEAD) {
                    if (fateA === undefined) ptsFates[vert.ptAIndex] = Fate.DEAD;
                    if (fateB === undefined) ptsFates[vert.ptBIndex] = Fate.DEAD;
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

            let aNeeded: boolean, bNeeded: boolean;
            let ptA: THREE.Vector2, ptB: THREE.Vector2;
            let closestToA: Vertex, closestToB: Vertex;
            let closestInterToA: number, closestInterToB: number;

            // bC aIndex aVert aC, newPtIndex, indexed by bVert index
            let bInters: [number, number, Vertex, number, number][][] = [];
            for (let i = aVerts.length; i--;) {
                let aVert = aVerts[i];
                // aC bIndex bVert bC newPtIndex
                let inters: [number, number, Vertex, number, number][] = [];

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

                for (let j = bVerts.length; j--;) {
                    let bVert = bVerts[j];
                    // cA cB
                    let inter = Vertex.getIntersection(aVert, bVert);
                    if (inter) {
                        inters.push([inter[0], j, bVert, inter[1], undefined]);
                        aNeeded = bNeeded = false;
                    }

                    a: if (aNeeded) {
                        let inter = Vertex.getPtIntersection(bVert, ptA);
                        if (inter === null) break a;
                        inter = Math.abs(inter);
                        if (closestInterToA === null || inter < closestInterToA) {
                            closestInterToA = inter;
                            closestToA = bVert;
                        }
                    }

                    b: if (bNeeded) {
                        let inter = Vertex.getPtIntersection(bVert, ptB);
                        if (inter === null) break b;
                        inter = Math.abs(inter);
                        if (closestInterToB === null || inter < closestInterToB) {
                            closestInterToB = inter;
                            closestToB = bVert;
                        }
                    }
                }
                split(i, aVert, aVerts, inters);
                // Fate is either determined by it's intersections
                if (inters.length) inters.forEach(inter => {
                    let arr = bInters[inter[1]];
                    if (!arr) bInters[inter[1]] = arr = [];
                    arr.push([inter[3], i, aVert, inter[0], inter[4]]);
                });
                else {
                    if (aNeeded) ptsFates[aVert.ptAIndex] =
                        (closestToA === null || !closestToA.isInside(ptA)) ?
                        Fate.ALIVE : Fate.DEAD;

                    if (bNeeded) ptsFates[aVert.ptBIndex] =
                        (closestToB === null || !closestToB.isInside(ptB)) ?
                        Fate.ALIVE : Fate.DEAD;

                    handlePtFate(i, aVert, bVerts);
                }
            }
            bVerts.forEach((bVert, i) => {
                let inters = bInters[i];

                if (inters && inters.length) split(i, bVert, bVerts, inters);
                else handlePtFate(i, bVert, aVerts);
            });

            s.vertices = aVerts.concat(bVerts);
            s.points.forEach((pt, i) => {
                if (ptsFates[i] === Fate.DEAD) pt.set(i * 2, 0);
                if (ptsFates[i] === undefined) throw 'Algorithmic deficiency';
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
}