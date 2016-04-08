/// <reference path="../extensions.ts" />
/// <reference path="../lib/three.d.ts" />
/// <reference path="primitive.ts" />

module geo {
    enum Fate {
        DEAD,
        ALIVE
    }
    const RAY = new THREE.Vector2(Math.random() - 0.5, Math.random() - 0.5);
    export class Shape implements PtSource {

        static fromDefinitions(
            points: THREE.Vector2[],
            edges: [number, number, boolean][]
        ): Shape {
            var shape = new Shape();
            shape.points = points;
            shape.edges = edges.map(def => {
                let ptA = shape.points[def[0]];
                let ptB = shape.points[def[1]];
                var norm = ptB.clone().sub(ptA);
                norm.set(-norm.y, norm.x);
                norm.setLength(1);
                if (def[2]) norm.multiplyScalar(-1);
                var normC = norm.x ? (ptA.x * norm.x) : (ptB.y * norm.y);
                return new Edge(shape, def[0], def[1], norm, normC);
            });
            shape.computeSize();
            return shape;
        }

        static isInside(pt: THREE.Vector2, edges: Edge[]): boolean {
            let smaller = 0;
            let bigger = 0;
            for (let i = edges.length; i--;) {
                let edge = edges[i];
                let inter = Edge.getPtIntersection(edge, pt, RAY);
                if (inter === null) continue;
                if (inter < 0) smaller++;
                if (inter > 0) bigger++;
            }
            return (smaller % 2 !== 0) && (bigger % 2 !== 0);
        }

        static union(a: Shape, b: Shape): Shape {
            let s = new Shape();
            s.points = a.points.concat(b.points);
            let ptsFates: Fate[] = [];
            let shift = a.points.length;
            let aEdges = a.edges.map(v => v.newSource(s));
            let bEdges = b.edges.map(v => v.newSource(s, shift));

            function pushorep<T>(rep: boolean, arr: T[], i: number, v: T) {
                if (rep) arr[i] = v;
                else arr.push(v);
            }

            function split(
                index: number, edge: Edge, edges: Edge[],
                // c, otherIndex, otherEdge, otherC, newPtIndex
                inters: [number, number, Edge, number, number][]
            ) {
                let replace = true;

                let ptA = edge.getPtA();
                let lastIndex = edge.ptAIndex;
                let alive: boolean = undefined;
                inters
                .sort((lhs, rhs) => lhs[0] - rhs[0])
                .forEach(inter => {
                    let oEdge = inter[2];
                    if (alive === undefined) {
                        alive = !oEdge.isInside(ptA);
                        // If the first one is inside, then it's first pt is inside
                        // as well and must be killed (with fire)
                        if (!alive) ptsFates[edge.ptAIndex] = Fate.DEAD;
                    }

                    let newPtIndex = inter[4];
                    let newPt: THREE.Vector2;
                    if (!newPtIndex) {
                        newPtIndex = inter[4] = s.points.length;
                        s.points.push(newPt = edge.getInterpolated(inter[0]));
                    }

                    if (alive) {
                        pushorep(replace, edges, index, new Edge(s,
                            lastIndex, newPtIndex,
                            edge.norm,     edge.normC
                        ));
                        ptsFates[lastIndex] = Fate.ALIVE;
                        ptsFates[newPtIndex] = Fate.ALIVE;
                        replace = false;
                    }

                    lastIndex = newPtIndex;
                    alive = !alive;
                });
                if (alive) {
                    pushorep(replace, edges, index, new Edge(s,
                        lastIndex, edge.ptBIndex,
                        edge.norm, edge.normC
                    ));
                    ptsFates[lastIndex] = Fate.ALIVE;
                    ptsFates[edge.ptBIndex] = Fate.ALIVE;
                }
                else if (alive === false) ptsFates[edge.ptBIndex] = Fate.DEAD;
            };

            function handlePtFate(index: number, edge: Edge, edges: Edge[]) {
                let fateA = ptsFates[edge.ptAIndex];
                let fateB = ptsFates[edge.ptBIndex];
                if (fateA === Fate.ALIVE && fateB === Fate.ALIVE) {
                    // live
                    return;
                }
                if (fateA === Fate.DEAD || fateB === Fate.DEAD) {
                    if (fateA === undefined) ptsFates[edge.ptAIndex] = Fate.DEAD;
                    if (fateB === undefined) ptsFates[edge.ptBIndex] = Fate.DEAD;
                    // die
                    return;
                }
                if (fateA === undefined)
                    ptsFates[edge.ptAIndex] = Shape.isInside(edge.getPtA(), edges) ?
                        Fate.DEAD : Fate.ALIVE;
                if (fateB === undefined)
                    ptsFates[edge.ptBIndex] = Shape.isInside(edge.getPtB(), edges) ?
                        Fate.DEAD : Fate.ALIVE;

                handlePtFate(index, edge, edges);
            }

            // We can do the aEdge splits sooner than the bSplits because we can
            // fully know after having gone through the bEdges. For the bInters,
            // we must wait until we've gone through every pair

            let aNeeded: boolean, bNeeded: boolean;
            let ptA: THREE.Vector2, ptB: THREE.Vector2;

            // bC aIndex aEdge aC, newPtIndex, indexed by bEdge index
            let bInters: [number, number, Edge, number, number][][] = [];
            for (let i = aEdges.length; i--;) {
                let aEdge = aEdges[i];
                // aC bIndex bEdge bC newPtIndex
                let inters: [number, number, Edge, number, number][] = [];

                aNeeded = ptsFates[aEdge.ptAIndex] === undefined;
                bNeeded = ptsFates[aEdge.ptBIndex] === undefined;
                let smallerA = 0, smallerB = 0;
                if (aNeeded) ptA = aEdge.getPtA();
                if (bNeeded) ptB = aEdge.getPtB();

                for (let j = bEdges.length; j--;) {
                    let bEdge = bEdges[j];
                    // cA cB
                    let inter = Edge.getIntersection(aEdge, bEdge);
                    if (inter) {
                        inters.push([inter[0], j, bEdge, inter[1], undefined]);
                        aNeeded = bNeeded = false;
                    }

                    a: if (aNeeded) {
                        let inter = Edge.getPtIntersection(bEdge, ptA, RAY);
                        if (inter === null) break a;
                        if (inter < 0) smallerA++;
                    }

                    b: if (bNeeded) {
                        let inter = Edge.getPtIntersection(bEdge, ptB, RAY);
                        if (inter === null) break b;
                        if (inter < 0) smallerB++;
                    }
                }
                split(i, aEdge, aEdges, inters);
                // Fate is either determined by it's intersections
                if (inters.length) inters.forEach(inter => {
                    let arr = bInters[inter[1]];
                    if (!arr) bInters[inter[1]] = arr = [];
                    arr.push([inter[3], i, aEdge, inter[0], inter[4]]);
                });
                else {
                    if (aNeeded) ptsFates[aEdge.ptAIndex] =
                        (smallerA % 2 === 0) ?
                        Fate.ALIVE : Fate.DEAD;

                    if (bNeeded) ptsFates[aEdge.ptBIndex] =
                        (smallerB % 2 === 0) ?
                        Fate.ALIVE : Fate.DEAD;

                    handlePtFate(i, aEdge, bEdges);
                }
            }
            bEdges.forEach((bEdge, i) => {
                let inters = bInters[i];

                if (inters && inters.length) split(i, bEdge, bEdges, inters);
                else handlePtFate(i, bEdge, aEdges);
            });

            s.edges = aEdges.concat(bEdges);
            for (let i = s.points.length; i--;) {
                let fate = ptsFates[i];
                if (fate !== Fate.DEAD) continue;
                for (let j = s.edges.length; j--;) {
                    let edge = s.edges[j];
                    if (edge.ptAIndex === i || edge.ptBIndex === i) {
                        s.edges.splice(j, 1);
                    } else {
                        if (edge.ptAIndex > i) edge.ptAIndex--;
                        if (edge.ptBIndex > i) edge.ptBIndex--;
                    }
                }
                s.points.splice(i, 1);
            }
            s.computeSize();
            return s;
        }

        points: THREE.Vector2[];
        edges: Edge[];
        size: THREE.Vector2;

        computeSize(): THREE.Vector2 {
            if (!this.points.length) return this.size = new THREE.Vector2();
            var min = this.points[0].clone();
            var max = this.points[0].clone();
            this.points.forEach(point => {
                min.min(point);
                max.max(point);
            });
            return this.size = max;
        }

        recenter(): THREE.Vector2 {
            function medianOf(
                arr: THREE.Vector2[],
                func: (pt: THREE.Vector2) => number
            ): number {
                let sorted = arr.slice().sort((lhs, rhs) => func(lhs) - func(rhs));
                if (sorted.length % 2 === 0) {
                    let lower = sorted[sorted.length / 2 - 1];
                    let upper = sorted[sorted.length / 2];
                    return (func(lower) + func(upper)) / 2;
                }
                else {
                    let pt = sorted[(sorted.length - 1) / 2];
                    return func(pt);
                }
            }

            let shift = new THREE.Vector2(
                medianOf(this.points, pt => pt.x),
                medianOf(this.points, pt => pt.y)
            );
            this.points.forEach(pt => pt.sub(shift));

            return shift;
        }

        triangulate(): Triangle[] {
            let pts = this.points;
            let edges = this.edges.slice();
            let trigs: Triangle[] = [];

            let ptsEdgeRefs: number[][] = [];
            let ptsTrigRefs: number[][] = Array.gen(ptI => [], pts.length);

            for (let i = edges.length; i--;) {
                let edge = edges[i];

                let aEdgeRefs = ptsEdgeRefs[edge.ptAIndex];
                if (!aEdgeRefs) aEdgeRefs = ptsEdgeRefs[edge.ptAIndex] = [];
                aEdgeRefs[edge.ptBIndex] = i;

                let bEdgeRefs = ptsEdgeRefs[edge.ptBIndex];
                if (!bEdgeRefs) bEdgeRefs = ptsEdgeRefs[edge.ptBIndex] = [];
                bEdgeRefs[edge.ptAIndex] = i;
            }

            let tmpEdge = new Edge(this,
                null, null,
                null, null,
                new THREE.Vector2()
            );
            let tmpPt = new THREE.Vector2();
            for (let ptI = pts.length; ptI--;) {
                let pt = pts[ptI];
                let edgeRefs = ptsEdgeRefs[ptI];
                let trigRefs = ptsTrigRefs[ptI];

                // Construct all the legal edges
                tmpEdge.ptAIndex = ptI;
                ptO: for (let ptOI = pts.length; ptOI--;) {
                    // Ignore points already connected
                    if (ptI === ptOI || edgeRefs[ptOI] !== undefined) continue ptO;
                    let ptO = pts[ptOI];
                    let oRefs = ptsEdgeRefs[ptOI];
                    tmpEdge.ptBIndex = ptOI;
                    tmpEdge.dir.copy(ptO).sub(pt);

                    // Before anything determine if the connection is within the
                    // shape
                    tmpPt.set((pt.x + ptO.x) / 2, (pt.y + ptO.y) / 2);
                    if (!Shape.isInside(tmpPt, this.edges)) continue ptO;

                    // Determine if the edge is valid
                    edge: for (let edgeI = edges.length; edgeI--;) {
                        let edge = edges[edgeI];
                        if (edge.ptAIndex === ptI ||
                            edge.ptAIndex === ptOI ||
                            edge.ptBIndex === ptI ||
                            edge.ptBIndex === ptOI
                        ) continue edge;
                        let inter = Edge.getIntersection(tmpEdge, edge);
                        if (inter !== null) continue ptO;
                    }

                    // The edge was valid; update edgeRefs and add it to edges
                    edgeRefs[ptOI] = oRefs[ptI] = edges.length;
                    edges.push(new Edge(this, ptI, ptOI, null, null));
                }

                let orderedPtsRefs: number[] = [];
                let ptsAngles: number[] = [];
                for (let ptOIKey in edgeRefs) {
                    let ptOI = parseInt(ptOIKey);
                    if (isNaN(ptOI)) continue;
                    let edge = edges[edgeRefs[ptOI]];
                    let ptO = edge.ptAIndex === ptI ? edge.getPtB() : edge.getPtA();
                    let angle = Math.atan2(ptO.y - pt.y, ptO.x - pt.x);
                    orderedPtsRefs.push(ptOI);
                    ptsAngles[ptOI] = angle;
                }
                orderedPtsRefs = orderedPtsRefs.sort((lhsI, rhsI) =>
                    ptsAngles[lhsI] - ptsAngles[rhsI]);

                trig: for (let refI = 0; refI < orderedPtsRefs.length; refI++) {
                    let ptAI = orderedPtsRefs[refI];
                    let ptBI = orderedPtsRefs[(refI + 1) % orderedPtsRefs.length];
                    let edgeAB = edges[ptsEdgeRefs[ptAI][ptBI]];
                    if (!edgeAB) continue trig;

                    for (let trigRefI = trigRefs.length; trigRefI--;) {
                        let trig = trigs[trigRefs[trigRefI]];
                        if ((
                            trig.ptAIndex === ptI ||
                            trig.ptBIndex === ptI ||
                            trig.ptCIndex === ptI
                        ) && (
                            trig.ptAIndex === ptAI ||
                            trig.ptBIndex === ptAI ||
                            trig.ptCIndex === ptAI
                        ) && (
                            trig.ptAIndex === ptBI ||
                            trig.ptBIndex === ptBI ||
                            trig.ptCIndex === ptBI
                        )) continue trig;
                    }
                    let trig = new Triangle(this, ptI, ptAI, ptBI);
                    trigRefs.push(trigs.length);
                    ptsTrigRefs[ptAI].push(trigs.length);
                    ptsTrigRefs[ptBI].push(trigs.length);
                    trigs.push(trig);
                }
            }

            return trigs;
        }
    }
}