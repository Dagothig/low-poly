/// <reference path="rnd.ts" />

interface ObjectConstructor { merge(to: any, ...exts: any[]): any; }
Object.merge = function merge(to, ...exts) {
    var initial: PropertyDescriptorMap = {};
    exts.forEach(src => {
        Object.defineProperties(to, Object.keys(src).reduce(
            (descrs: PropertyDescriptorMap, key: string) => {
                descrs[key] = Object.getOwnPropertyDescriptor(src, key);
                return descrs;
            },
            initial
        ));
    });
    return to;
};

interface Array<T> { swap(i1: number, i2: number): Array<T>; }
Array.prototype.swap = function(i1, i2) {
    var obj = this[i1];
    this[i1] = this[i2];
    this[i2] = obj;
    return this;
};

interface Array<T> { shuffle(): Array<T>; }
Array.prototype.shuffle = function() {
    for (var i = 0; i < this.length; i++) {
        var ri = (Math.random() * this.length) | 0;
        this.swap(this, i, ri);
    }
    return this;
};

interface Array<T> { spliceRnd(rnd: rnd.Seeded): T }
Array.prototype.spliceRnd = function(rnd) {
    return this.splice(rnd.next(this.length) | 0, 1)[0];
};

interface Array<T> { rnd(rnd: rnd.Seeded): T }
Array.prototype.rnd = function(rnd) {
    return this[rnd.next(this.length) | 0];
};

interface Array<T> { add(obj: T): boolean }
Array.prototype.add = function(obj) {
    if (this.indexOf(obj) === -1) return !!(this.push(obj) || true);
    else return false;
};

interface Array<T> { with(...objs: T[]): Array<T> }
Array.prototype.with = function(...objs) {
    this.push.apply(this, objs);
    return this;
}

interface Array<T> { remove(obj: T): boolean }
Array.prototype.remove = function(obj) {
    return !!this.splice(this.indexOf(obj), 1).length;
};

interface Array<T> { contains(obj: T): boolean }
Array.prototype.contains = function(obj) {
    return this.indexOf(obj) !== -1;
}

interface Array<T> { find(predicate: (search: T) => boolean): T; }
if (!Array.prototype.find) {
    Array.prototype.find = function<T>(predicate: (search: T) => boolean) {
        if (this == null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value: T;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}

interface ArrayConstructor {
    gen<T>(f: (i: number) => T, c: number): Array<T>;
}
Array.gen = function<T>(f: (i: number) => T, c: number) {
    var arr: T[] = [];
    for (var i = 0; i < c; i++) arr.push(f(i));
    return arr;
};

interface Math {
    bound(num: number, min: number, max: number): number;
    HALF_PI: number;
    TAU: number;
}
Math.bound = function(n, mn, mx) {
    return Math.min(mx, Math.max(mn, n));
}
Math.HALF_PI = Math.PI / 2;
Math.TAU = Math.PI * 2;

// Note that unprefixing elements that aren't initially defined will break them
// (which is why it conditionnally unprefixes pointerLockElement)
// ps: this assumes that if requestPointerLock is defined, then so is
// pointerLockElement (c'mon people, I am only a man!)
function unprefix(element:any, prop:string, prefixes:string[]) {
    let capitalized = prop[0].toUpperCase() + prop.substring(1);
    let props = prefixes.map(prefix => prefix + capitalized);
    if (!element[prop]) return Object.defineProperty(element, prop, {
        get: function() {
            for (let prop of props) {
                var val = this[prop];
                if (val) return val;
            }
        },
        set: function(val) {
            console.log(val);
            props.forEach(prop => this[prop] = val);
        }
    });
    return false;
}
if (unprefix(Element.prototype, 'requestPointerLock', ['moz', 'webkit']))
    unprefix(document, 'pointerLockElement', ['moz', 'webkit']);

module exts {
    export function prefixCall<T>(
        obj: any, func: string, name: string, prefxs: string[], ...args: any[]
    ) {
        prefxs.with('').forEach(p => obj[func].apply(obj, [p + name].concat(args)));
    }
}