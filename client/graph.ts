/// <reference path="extensions.ts" />
/// <reference path="lib/three.d.ts" />
/// <reference path="rnd.ts" />

module graph {

    abstract class Visiteable<D> {
        constructor(data?: D) {
            this.data = data;
            this.visited = 0;
        }

        data: D;
        visited: number;

        wasVisited(visitno: number): boolean {
            return this.visited === visitno;
        }
    }

    class Vertex<N, V> extends Visiteable<V> {
        constructor(node1: Node<N, V>, node2: Node<N, V>, data?: V) {
            super(data);
            this.connected = [node1, node2];
        }

        connected: [Node<N, V>, Node<N, V>];

        _traverse(
            visitno: number,
            nodeFunc: (node: Node<N, V>) => any,
            vertexFunc: (vertex: Vertex<N, V>) => any
        ) {
            vertexFunc(this);

            var toTraverse = this.connected.filter(v =>
                !v.wasVisited(visitno) ? !!(v.visited = visitno) : false);

            toTraverse.forEach(v => v._traverse(visitno, nodeFunc, vertexFunc));
        }
    }

    export class Node<N, V> extends Visiteable<N> {
        constructor(data?: N) {
            super(data);
            this.connected = [];
        }

        connected: Vertex<N, V>[];

        connect(node: Node<N, V>, data?: V) {
            var vertex = new Vertex(this, node, data);
            this.connected.push(vertex);
            node.connected.push(vertex);
        }

        _traverse(
            visitno: number,
            nodeFunc: (node: Node<N, V>) => any,
            vertexFunc: (vertex: Vertex<N, V>) => any
        ) {
            nodeFunc(this);

            var toTraverse = this.connected.filter(v =>
                !v.wasVisited(visitno) ? !!(v.visited = visitno) : false);

            toTraverse.forEach(v => v._traverse(visitno, nodeFunc, vertexFunc));
        }
        traverse(
            seeded: rnd.Seeded,
            nodeFunc: (node: Node<N, V>) => any,
            vertexFunc: (vertex: Vertex<N, V>) => any
        ) {
            var visitno = (seeded.next(Math.pow(2, 32), 0) | 0);
            this.visited = visitno;
            this._traverse(visitno, nodeFunc, vertexFunc);
        }
    }
}