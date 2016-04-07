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

    export function render(shape: geo.Shape): THREE.Geometry {
        let geometry = new THREE.Geometry();

        geometry.vertices = shape.points.map(pt => new THREE.Vector3(pt.x, 0, pt.y))
            .concat(shape.points.map(pt => new THREE.Vector3(pt.x, 1, pt.y)));
        let shift = shape.points.length;

        shape.vertices.forEach(vertex => {
            let ptA = vertex.getPtA();
            let ptB = vertex.getPtB();
            let computedNorm = ptB.clone().sub(ptA);
            computedNorm.set(-computedNorm.y, computedNorm.x);
            computedNorm.setLength(1);
            let inverseOrder =
                vertex.norm.x / computedNorm.x < 0 ||
                vertex.norm.y / computedNorm.y < 0;
            let normalShift = inverseOrder ? 0 : shift;
            let inverseShift = inverseOrder ? shift : 0;
            geometry.faces.push(
                new THREE.Face3(
                    vertex.ptBIndex + normalShift,
                    vertex.ptAIndex + normalShift,
                    vertex.ptAIndex + inverseShift,
                    new THREE.Vector3(vertex.norm.x, 0, vertex.norm.y)
                ),
                new THREE.Face3(
                    vertex.ptBIndex + normalShift,
                    vertex.ptAIndex + inverseShift,
                    vertex.ptBIndex + inverseShift,
                    new THREE.Vector3(vertex.norm.x, 0, vertex.norm.y)
                )
            );

            let width = vertex.getDir().length();
            let xScalar = 2 * width;
            let height = 1;
            let yScalar = 2;
            geometry.faceVertexUvs[0].push([
                new THREE.Vector2(xScalar, yScalar),
                new THREE.Vector2(0.0, yScalar),
                new THREE.Vector2(0.0, 0.0)
            ], [
                new THREE.Vector2(xScalar, yScalar),
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(xScalar, 0.0)
            ]);
        })

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