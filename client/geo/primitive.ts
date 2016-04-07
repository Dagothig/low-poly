/// <reference path="../extensions.ts" />
/// <reference path="../lib/three.d.ts" />

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
            ptSource: PtSource,
            ptAIndex: number,
            ptBIndex: number,
            norm: THREE.Vector2,
            normC: number,
            dir?: THREE.Vector2
        ) {
            this.ptSource = ptSource;
            this.ptAIndex = ptAIndex;
            this.ptBIndex = ptBIndex;
            this.norm = norm;
            this.normC = normC;
            this.dir = dir;
        }

        ptSource: PtSource;
        ptAIndex: number;
        ptBIndex: number;
        norm: THREE.Vector2;
        normC: number;
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
            return this.norm.dot(pt) > this.normC;
        }
        newSource(ptSource: PtSource, shift?: number): Vertex {
            shift = shift || 0;
            return new Vertex(
                ptSource,
                this.ptAIndex + shift,
                this.ptBIndex + shift,
                this.norm,
                this.normC,
                this.dir
            );
        }
    }

    export class Triangle {

        construtor(
            ptSource: PtSource,
            ptAIndex: number,
            ptBIndex: number,
            ptCIndex: number
        ) {
            this.ptAIndex = ptAIndex;
            this.ptBIndex = ptBIndex;
            this.ptCIndex = ptCIndex;
        }

        ptSource: PtSource;
        ptAIndex: number;
        ptBIndex: number;
        ptCIndex: number;
    }
}