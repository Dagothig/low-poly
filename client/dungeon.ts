/// <reference path="extensions.ts" />
/// <reference path="graph.ts" />
/// <reference path="rnd.ts" />
/// <reference path="lib/three.d.ts" />
/// <reference path="geo/shape.ts" />
/// <reference path="geo/primitive.ts" />

module dungeon {


    export interface Renderer<N, V, R> {
        render(node: graph.Node<N, V>): R;
    }

    class Room {
        position: THREE.Vector3;
        mesh: THREE.Mesh[];
    }

    export function render(
        shape: geo.Shape, trigs: geo.Triangle[]
    ): THREE.Geometry {
        let geometry = new THREE.Geometry();

        geometry.vertices = shape.points.map(pt => new THREE.Vector3(pt.x, 0, pt.y))
            .concat(shape.points.map(pt => new THREE.Vector3(pt.x, 1, pt.y)));
        let shift = shape.points.length;

        shape.edges.forEach(edge => {
            let ptA = edge.getPtA();
            let ptB = edge.getPtB();
            let computedNorm = ptB.clone().sub(ptA);
            computedNorm.set(-computedNorm.y, computedNorm.x);
            computedNorm.setLength(1);
            let inverseOrder =
                edge.norm.x / computedNorm.x < 0 ||
                edge.norm.y / computedNorm.y < 0;

            let normalShift = inverseOrder ? 0 : shift;
            let inverseShift = inverseOrder ? shift : 0;
            geometry.faces.push(
                new THREE.Face3(
                    edge.ptBIndex + normalShift,
                    edge.ptAIndex + normalShift,
                    edge.ptAIndex + inverseShift,
                    new THREE.Vector3(edge.norm.x, 0, edge.norm.y)
                ),
                new THREE.Face3(
                    edge.ptBIndex + normalShift,
                    edge.ptAIndex + inverseShift,
                    edge.ptBIndex + inverseShift,
                    new THREE.Vector3(edge.norm.x, 0, edge.norm.y)
                )
            );

            let width = edge.getDir().length();
            let xScalar = 2 * width;
            xScalar = (inverseOrder ? -1 : 1) * Math.max(xScalar - xScalar%0.5, 1);
            let xShift = 0.25;
            let height = 1;
            let yShift = inverseOrder ? 2 : 0;
            let yScalar = inverseOrder ? -2 : 2;
            geometry.faceVertexUvs[0].push([
                new THREE.Vector2(xShift + xScalar, yShift + yScalar),
                new THREE.Vector2(xShift, yShift + yScalar),
                new THREE.Vector2(xShift, yShift)
            ], [
                new THREE.Vector2(xShift + xScalar, yShift + yScalar),
                new THREE.Vector2(xShift, yShift),
                new THREE.Vector2(xShift + xScalar, yShift)
            ]);
        });

        trigs.forEach(trig => {
            geometry.faces.push(
                new THREE.Face3(
                    trig.ptCIndex,
                    trig.ptBIndex,
                    trig.ptAIndex,
                    new THREE.Vector3(0, 1, 0),
                    null, 0
                ),
                new THREE.Face3(
                    trig.ptAIndex + shift,
                    trig.ptBIndex + shift,
                    trig.ptCIndex + shift,
                    new THREE.Vector3(0, -1, 0),
                    null, 0
                )
            )
            let ptA = trig.getPtA();
            let ptB = trig.getPtB();
            let ptC = trig.getPtC();
            geometry.faceVertexUvs[0].push([
                new THREE.Vector2(-2 * ptC.x, 2 * ptC.y),
                new THREE.Vector2(-2 * ptB.x, 2 * ptB.y),
                new THREE.Vector2(-2 * ptA.x, 2 * ptA.y)
            ], [
                new THREE.Vector2(2 * ptA.x, 2 * ptA.y),
                new THREE.Vector2(2 * ptB.x, 2 * ptB.y),
                new THREE.Vector2(2 * ptC.x, 2 * ptC.y)
            ]);
        });

        return geometry;
    }

    export function populate(scene: THREE.Scene, material: THREE.Material) {

        var node1 = new graph.Node(new THREE.Vector3(0, 0, 0));
        var node2 = new graph.Node(new THREE.Vector3(0, 0, 2));
        var node3 = new graph.Node(new THREE.Vector3(1, 0.5, 4));

        node1.connect(node2);
        node2.connect(node3);

        node1.traverse(new rnd.Seeded(), n => {
            var geometry = new THREE.Geometry();
            geometry.vertices.push(
                // Lower half
                new THREE.Vector3(-0.5, -0.5, -0.5),
                new THREE.Vector3(0.5, -0.5, -0.5),
                new THREE.Vector3(-0.5, -0.5, 0.5),
                new THREE.Vector3(0.5, -0.5, 0.5),

                // Upper half
                new THREE.Vector3(-0.5, 0.5, -0.5),
                new THREE.Vector3(0.5, 0.5, -0.5),
                new THREE.Vector3(-0.5, 0.5, 0.5),
                new THREE.Vector3(0.5, 0.5, 0.5)
            );

            // Bottom
            geometry.faces.push(
                new THREE.Face3(0, 3, 1, new THREE.Vector3(0, 1, 0), new THREE.Color(1, 0.5, 0), 1),
                new THREE.Face3(0, 2, 3, new THREE.Vector3(0, 1, 0), null, 1)
            );
            geometry.faceVertexUvs[0].push([
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(2.0, 2.0),
                new THREE.Vector2(0.0, 2.0)
            ], [
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(2.0, 0.0),
                new THREE.Vector2(2.0, 2.0)
            ]);

            // Top
            geometry.faces.push(
                new THREE.Face3(4, 5, 7, new THREE.Vector3(0, -1, 0), null, 1),
                new THREE.Face3(4, 7, 6, new THREE.Vector3(0, -1, 0), null, 1)
            );
            geometry.faceVertexUvs[0].push([
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(2.0, 0.0),
                new THREE.Vector2(2.0, 2.0)
            ], [
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(2.0, 2.0),
                new THREE.Vector2(0.0, 2.0)
                ]);

            // Sides
            geometry.faces.push(
                new THREE.Face3(0, 5, 4, new THREE.Vector3(0, 0, 1)),
                new THREE.Face3(0, 1, 5, new THREE.Vector3(0, 0, 1))
            );
            geometry.faceVertexUvs[0].push([
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(2.0, 2.0),
                new THREE.Vector2(0.0, 2.0)
            ], [
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(2.0, 0.0),
                new THREE.Vector2(2.0, 2.0)
            ]);

            geometry.faces.push(
                new THREE.Face3(3, 2, 6, new THREE.Vector3(0, 0, -1)),
                new THREE.Face3(3, 6, 7, new THREE.Vector3(0, 0, -1))
            );
            geometry.faceVertexUvs[0].push([
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(2.0, 0.0),
                new THREE.Vector2(2.0, 2.0)
            ], [
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(2.0, 2.0),
                new THREE.Vector2(0.0, 2.0)
            ]);

            geometry.faces.push(
                new THREE.Face3(2, 4, 6, new THREE.Vector3(1, 0, 0)),
                new THREE.Face3(2, 0, 4, new THREE.Vector3(1, 0, 0))
            );
            geometry.faceVertexUvs[0].push([
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(2.0, 2.0),
                new THREE.Vector2(0.0, 2.0)
            ], [
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(2.0, 0.0),
                new THREE.Vector2(2.0, 2.0)
            ]);


            geometry.faces.push(
                new THREE.Face3(1, 7, 5, new THREE.Vector3(-1, 0, 0)),
                new THREE.Face3(1, 3, 7, new THREE.Vector3(-1, 0, 0))
            );
            geometry.faceVertexUvs[0].push([
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(2.0, 2.0),
                new THREE.Vector2(0.0, 2.0)
            ], [
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(2.0, 0.0),
                new THREE.Vector2(2.0, 2.0)
            ]);

            var mesh = new THREE.Mesh(
                geometry,
                material
            );
            scene.add(mesh);
            mesh.position.copy(n.data);
        }, v => {

        });
    }
}