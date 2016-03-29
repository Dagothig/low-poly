/// <reference path="rnd/seeded.ts" />

interface ObjectConstructor { merge(to: any, ...exts: any[]): any; }
Object.merge = function merge(to, ...exts) {
    exts.forEach(src => {
        Object.defineProperties(to, Object.keys(src).reduce(
            (descrs, key: string) => {
                descrs[key] = Object.getOwnPropertyDescriptor(src, key);
                return descrs;
            }, {}
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

interface Array<T> { remove(obj: T): boolean }
Array.prototype.remove = function(obj) {
    return !!this.splice(this.indexOf(obj), 1).length;
};

interface ArrayConstructor {
    gen<T>(f: (i: number) => T, c: number): Array<T>;
}
Array.gen = function(f, c) {
    var arr = [];
    for (var i = 0; i < c; i++) arr.push(f(i));
    return arr;
};