/// <reference path="extensions.ts" />
/// <reference path="graph.ts" />
/// <reference path="rnd.ts" />
/// <reference path="lib/three.d.ts" />

module dungeon {

    export interface Renderer<N, V, R> {
        render(node: graph.Node<N, V>): R;
    }

    class Room {
        position: THREE.Vector3;
        mesh: THREE.Mesh[];
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

            var point = new THREE.PointLight(0xffffff, 1, 3, 3);
            scene.add(point);
            point.position.copy(n.data).add(new THREE.Vector3(0.2, 0.2, 0.2));
        }, v => {

        });
    }
}