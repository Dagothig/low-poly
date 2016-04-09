/// <reference path="../extensions.ts" />
/// <reference path="../lib/three.d.ts" />

module geo {
    export interface PtSource {
        points: THREE.Vector2[];
    }

    function getIntersection(
        ptA: THREE.Vector2, dirA: THREE.Vector2,
        ptB: THREE.Vector2, dirB: THREE.Vector2
    ): [number, number] {
        // Let a_1, a_2, b_1, b_2 e |R^2 and c_1, c_2 e |R
        // If we have the lines c_1 * a_1 + b_1 and c_2 * a_2 + b_2
        // Such that they define the edges a and b
        // with a_1 = [a_11, a_12], a_2 = [a_21, a_22]
        // Then we are wondering about the linear equation
        // c_1 * a_1 + b_1 = c_2 * a_2 + b_2 with the 'a's and 'b's known
        // then, let
        // A = [a_1 a_2]
        // c = [c_1, c_2], b = [b_1 b_2]
        // and we can write
        // Ac = b <=> c = A^-1 * b
        // with A^-1 = 1/|A| * adj(A)

        let det = - (dirA.x * dirB.y) + (dirB.x * dirA.y);

        if (Math.abs(det) < DELTA) return undefined;

        let invDet = 1 / det;
        let diffX = ptB.x - ptA.x, diffY = ptB.y - ptA.y;

        let cA = invDet * (- dirB.y * diffX + dirB.x * diffY);
        let cB = invDet * (- dirA.y * diffX + dirA.x * diffY);

        return [cA, cB];
    }

    export function getEdgeIntersection(a: Edge, b: Edge): [number, number] {
        let startA = a.getPtA(), endA = a.getPtB();
        let startB = b.getPtA(), endB = b.getPtB();

        if (Math.min(startA.x, endA.x) - Math.max(startB.x, endB.x) > DELTA ||
            Math.min(startB.x, endB.x) - Math.max(startA.x, endA.x) > DELTA ||
            Math.min(startA.y, endA.y) - Math.max(startB.y, endB.y) > DELTA ||
            Math.min(startB.y, endB.y) - Math.max(startA.y, endA.y) > DELTA
        ) return null;

        let inter = getIntersection(startA, a.getDir(), startB, b.getDir());
        if (!inter) return inter;
        if (inter[0] < -DELTA || inter[0] > 1 + DELTA) return null;
        if (inter[1] < -DELTA || inter[1] > 1 + DELTA) return null;
        return inter;
    }
    export function getPtIntersection(
        v: Edge, p: THREE.Vector2, ray: THREE.Vector2
    ): number {
        let start = v.getPtA();
        let dir = v.getDir();

        let inter = getIntersection(start, dir, p, ray);
        if (!inter) return undefined;
        if (inter[0] < -DELTA || inter[0] > 1 + DELTA) return null;
        return inter[1];
    }

    export const DELTA = 0.0001;
    const INTERNAL_TMP = new THREE.Vector2();
    export class Edge {

        static fromDefinition(
            ptSource: PtSource,
            // ptAIndex, ptBIndex, inverseNorm
            def: [number, number, boolean]
        ): Edge {
            let ptA = ptSource.points[def[0]];
            let ptB = ptSource.points[def[1]];
            var norm = ptB.clone().sub(ptA);
            norm.set(-norm.y, norm.x);
            norm.setLength(1);
            if (def[2]) norm.multiplyScalar(-1);
            return new Edge(ptSource, def[0], def[1], norm);
        }

        constructor(
            ptSource: PtSource,
            ptAIndex: number,
            ptBIndex: number,
            norm: THREE.Vector2,
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
        isInside(pt: THREE.Vector2): boolean {
            return this.norm.dot(INTERNAL_TMP.copy(pt).sub(this.getPtA())) > 0;
        }
        distance(pt: THREE.Vector2): number {
            let inter = getIntersection(
                pt, this.norm,
                this.getPtA(), this.getDir()
            );
            if (inter[1] < 0) return this.getPtA().clone().distanceToSquared(pt);
            if (inter[1] > 1) return this.getPtB().clone().distanceToSquared(pt);
            return inter[0] * inter[0];
        }
        newSource(ptSource: PtSource, shift?: number): Edge {
            shift = shift || 0;
            return new Edge(
                ptSource,
                this.ptAIndex + shift,
                this.ptBIndex + shift,
                this.norm,
                this.dir
            );
        }
    }

    export class Triangle {

        constructor(
            ptSource: PtSource,
            ptAIndex: number,
            ptBIndex: number,
            ptCIndex: number
        ) {
            this.ptSource = ptSource;
            this.ptAIndex = ptAIndex;
            this.ptBIndex = ptBIndex;
            this.ptCIndex = ptCIndex;
        }

        ptSource: PtSource;
        ptAIndex: number;
        ptBIndex: number;
        ptCIndex: number;

        getPtA(): THREE.Vector2 {
            return this.ptSource.points[this.ptAIndex];
        }
        getPtB(): THREE.Vector2 {
            return this.ptSource.points[this.ptBIndex];
        }
        getPtC(): THREE.Vector2 {
            return this.ptSource.points[this.ptCIndex];
        }
    }
}