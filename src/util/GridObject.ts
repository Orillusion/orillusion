import { UnLitMaterial, Color, MeshRenderer, BlendMode, GeometryBase, Vector3, VertexAttributeName } from "..";
import { Object3D } from "../core/entities/Object3D";
import { BoundingBox } from "../core/bound/BoundingBox";

/**
 * An object contains grids - two dimensional arrrys of lines
 * @group Util
 */
export class GridObject extends Object3D {
    public size: number = 100;

    public divisions: number = 10;

    constructor(size: number = 100, divisions: number = 10) {
        super();
        this.size = size;
        this.divisions = divisions;
        this.buildGeometry();
        this.addAxis();
    }

    private buildGeometry() {
        const vertices = []
        const indices = []
		const step = this.size / this.divisions;
		const halfSize = this.size / 2;
        const center = this.divisions / 2;

        for ( let i = 0, k = - halfSize; i <= this.divisions; i ++, k += step ) {
            if(i === center )
                continue;
			vertices.push( - halfSize, 0, k, halfSize, 0, k );
			vertices.push( k, 0, - halfSize, k, 0, halfSize );
		}
        for( let i = 0; i < vertices.length/3; i +=2 )
            indices.push(i, i + 1);

        let grid = new GeometryBase()
        grid.setIndices(indices.length > Uint16Array.length ? new Uint32Array(indices) : new Uint16Array(indices));
        grid.setAttribute(VertexAttributeName.position, new Float32Array(vertices));
        grid.addSubGeometry({
            indexStart: 0,
            indexCount: indices.length,
            vertexStart: 0,
            vertexCount: 0,
            firstStart: 0,
            index: 0,
            topology: 0
        })

        let mat = new UnLitMaterial();
        mat.topology = "line-list";
        mat.baseColor = new Color(1, 1, 1, 0.15);
        mat.blendMode = BlendMode.ADD;
        mat.castReflection = false;
        let mr = this.addComponent(MeshRenderer);
        mr.geometry = grid;
        mr.material = mat;
    }

    private addAxis() {
        const halfSize = this.size / 2;
        let vertices = new Float32Array([-halfSize,0,0, halfSize,0,0])
        let indexes = new Uint16Array([0, 1, 2, 3])

        let line = new GeometryBase()
        line.setIndices(indexes);
        line.setAttribute(VertexAttributeName.position, vertices);
        line.addSubGeometry({
            indexStart: 0,
            indexCount: indexes.length,
            vertexStart: 0,
            vertexCount: 0,
            firstStart: 0,
            index: 0,
            topology: 0
        })
        {
            let x = new Object3D();
            let mr = x.addComponent(MeshRenderer);
            mr.geometry = line;
            let mat = mr.material = new UnLitMaterial();
            mat.baseColor = new Color(1, 0, 0, 0.5);
            mat.blendMode = BlendMode.ADD;
            mat.castReflection = false;
            mat.topology = 'line-list';
            this.addChild(x)
        }
        {
            let z = new Object3D();
            z.rotationY = 90;
            let mr = z.addComponent(MeshRenderer);
            mr.geometry = line;
            let mat = mr.material = new UnLitMaterial();
            console.log(mat)
            mat.baseColor = new Color(0, 1, 0, 0.5);
            mat.blendMode = BlendMode.ADD;
            mat.castReflection = false;
            mat.topology = 'line-list';
            this.addChild(z)
        }
    }
}

/**
 * Geometry to define grids - two dimensional arrrys of lines
 * @group Util
 */
class GridGeometry extends GeometryBase {
    /**
     * Width of the grid
     */
    public width: number;
    /**
     * Height of the grid
     */
    public height: number;
    /**
     * Number of width segments of a grid
     */
    public segmentW: number;
    /**
     * Number of height segments of a grid
     */
    public segmentH: number;
    /**
     * Define the normal vector of a grid
     */
    public up: Vector3;

    /**
     *
     * @constructor
     * @param width Width of the grid
     * @param height Height of the grid
     * @param segmentW Number of width segments of a grid
     * @param segmentH Number of height segments of a grid
     * @param up Define the normal vector of a grid
     */
    constructor(width: number, height: number, segmentW: number = 1, segmentH: number = 1, up: Vector3 = Vector3.Y_AXIS) {
        super();
        this.width = width;
        this.height = height;
        this.segmentW = segmentW;
        this.segmentH = segmentH;
        this.up = up;
        this.buildGeometry(this.up);
    }

    private buildGeometry(axis: Vector3): void {
        this.bounds = new BoundingBox(Vector3.ZERO.clone(), new Vector3(this.width, 1.0, this.height));
        
        const vertices = []
        const center = this.divisions / 2;
		const step = this.size / this.divisions;
		const halfSize = size / 2;

        for ( let i = 0, j = 0, k = - halfSize; i <= divisions; i ++, k += step ) {

			vertices.push( - halfSize, 0, k, halfSize, 0, k );
			vertices.push( k, 0, - halfSize, k, 0, halfSize );

			const color = i === center ? color1 : color2;

			color.toArray( colors, j ); j += 3;
			color.toArray( colors, j ); j += 3;
			color.toArray( colors, j ); j += 3;
			color.toArray( colors, j ); j += 3;

		}

        this.setIndices(indices_arr);
        this.setAttribute(VertexAttributeName.position, position_arr);
        this.setAttribute(VertexAttributeName.normal, normal_arr);
        this.setAttribute(VertexAttributeName.uv, uv_arr);
        this.setAttribute(VertexAttributeName.TEXCOORD_1, uv_arr);

        this.addSubGeometry({
            indexStart: 0,
            indexCount: indices_arr.length,
            vertexStart: 0,
            vertexCount: 0,
            firstStart: 0,
            index: 0,
            topology: 0
        });
    }

}
