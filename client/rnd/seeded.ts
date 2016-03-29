module rnd {
    export class Seeded {
        constructor(seed: number) {
            this.originalSeed = this.seed = seed;
        }

        originalSeed: number;
        seed: number;

        //TODO: use a sane implementation (y'know know where the constants come from)
        next(max?: number, min?: number): number {
            max = max || 1;
            min = min || 0;
            max = Math.max(max, min);
            if (max === min) return max;
            this.seed = (this.seed * 9301 + 49297) % 233280;
            var rnd = this.seed / 233280;
            return min + rnd * (max - min);
        }
    };
}