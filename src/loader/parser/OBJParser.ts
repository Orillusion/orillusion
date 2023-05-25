import { Engine3D } from '../../Engine3D';
import { MeshRenderer } from '../../components/renderer/MeshRenderer';
import { Object3D } from '../../core/entities/Object3D';
import { GeometryBase } from '../../core/geometry/GeometryBase';
import { VertexAttributeName } from '../../core/geometry/VertexAttributeName';
import { LitMaterial } from '../../materials/LitMaterial';
import { StringUtil } from '../../util/StringUtil';
import { FileLoader } from '../FileLoader';
import { ParserBase } from './ParserBase';


type MatData = {
  name?: string,
  Kd?: string[],
  Ks?: string[],
  Tr?: string,
  d?: string[],
  Tf?: string[],
  Pr?: string,
  Pm?: string,
  Pc?: string,
  Pcr?: string,
  Ni?: string,
  Kr?: string[],
  illum?: string,
  map_Kd?: string,
  textures?: string[]
}

type GeometryData = {
  name: string,
  type: string,

  vertex_arr?: number[],
  normal_arr?: number[],
  uv_arr?: number[],
  indeice_arr?: number[],
  index?: number,


  source_mat: string,
  source_faces: Face[],
}

type Face = {
  indices: string[],
  texture: string[],
  normal: string[]
}

/**
 * OBJ file parser
 * @internal
 * @group Loader
 */
export class OBJParser extends ParserBase {
  static format: string = 'text';
  private textData: string = '';

  private source_vertices: number[][];
  private source_normals: number[][];
  private source_tangents: number[][];
  private source_textureCoords: number[][];
  // private source_faces:Face[];

  // public faces: {
  //   indices: string[],
  //   texture: string[],
  //   normal: string[]
  // }[];

  public matLibs: { [name: string]: MatData };

  public geometrys: { [name: string]: GeometryData };
  private activeGeo: GeometryData;

  public facesMaterialsIndex: {
    materialName: string,
    materialStartIndex: number
  }[];

  public mtl: string;
  mtlUrl: string;
  // public geometryDatas:GeometryData[];

  async parseString(obj: string) {
    this.source_vertices = [];
    this.source_normals = [];
    this.source_tangents = [];
    this.source_textureCoords = [];

    this.matLibs = {};
    this.geometrys = {};

    this.textData = obj;
    // load bin & texture together
    await Promise.all([this.parserOBJ(), this.loadMTL()]);
    this.parser_mesh();
    return `null`;
  }

  private applyVector2(fi: number, sourceData: number[][], destData: number[]) {
    if (sourceData[fi] && sourceData[fi].length > 0) {
      destData.push(sourceData[fi][0]);
      destData.push(sourceData[fi][1]);
    } else {
      destData.push(0);
      destData.push(0);
    }
  }

  private applyVector3(fi: number, sourceData: number[][], destData: number[]) {
    destData.push(sourceData[fi][0]);
    destData.push(sourceData[fi][1]);
    destData.push(sourceData[fi][2]);
  }

  private applyVector4(fi: number, sourceData: number[][], destData: number[]) {
    destData.push(sourceData[fi][0]);
    destData.push(sourceData[fi][1]);
    destData.push(sourceData[fi][2]);
    destData.push(sourceData[fi][3]);
  }

  private async loadMTL() {
    let fileLoad = new FileLoader();
    let sourceData = await fileLoad.loadTxt(this.baseUrl + this.mtlUrl);
    let sourceStr: string = sourceData[`data`];

    let mat: MatData;

    let str = sourceStr.split("\r\n");
    for (let i = 0; i < str.length; i++) {
      let line = str[i];
      var commentStart = line.indexOf("#");
      if (commentStart != -1) {
        line = line.substring(0, commentStart);
      }
      line = line.trim();
      var splitedLine = line.split(/\s+/);
      if (splitedLine[0] === 'newmtl') {
        mat = { name: splitedLine[1] };
        this.matLibs[splitedLine[1]] = mat;
      } else {
        if (splitedLine[0].indexOf(`map_`) != -1) {
          mat[splitedLine[0]] = splitedLine[1];
          if (!mat.textures) {
            mat.textures = [splitedLine[splitedLine.length - 1]];
          }
          mat.textures.push(splitedLine[splitedLine.length - 1]);
        } else if (splitedLine.length == 2) {
          mat[splitedLine[0]] = Number(splitedLine[1]);
        } else if (splitedLine.length == 3) {
          mat[splitedLine[0]] = [Number(splitedLine[1]), Number(splitedLine[2])];
        } else if (splitedLine.length == 4) {
          mat[splitedLine[0]] = [Number(splitedLine[1]), Number(splitedLine[2]), Number(splitedLine[3])];
        }
      }
    }

    for (const key in this.matLibs) {
      const mat = this.matLibs[key];
      if (mat.textures && mat.textures.length > 0) {
        for (let i = 0; i < mat.textures.length; i++) {
          const texUrl = StringUtil.normalizePath(this.baseUrl + mat.textures[i]);
          await Engine3D.res.loadTexture(texUrl);
        }
      }
    }

    sourceData = null;
    return true;
  }

  private async load_textures() {

  }

  private parserLine(line: string) {
    /*Not include comment*/
    var commentStart = line.indexOf("#");
    if (commentStart != -1) {
      if (line.indexOf(`# object`) != -1) {
        var splitedLine = line.split(/\s+/);
        let type = splitedLine[1];
        let geoName = splitedLine[2];
        this.activeGeo = {
          type: type,
          name: geoName[1],
          source_mat: ``,
          source_faces: []
        }
        this.geometrys[geoName] = this.activeGeo;
      }
      line = line.substring(0, commentStart);
    }
    line = line.trim();
    var splitedLine = line.split(/\s+/);

    if (splitedLine[0] === 'v') {
      var vertex = [Number(splitedLine[1]), Number(splitedLine[2]), Number(splitedLine[3]), splitedLine[4] ? 1 : Number(splitedLine[4])];
      this.source_vertices.push(vertex);
    }
    else if (splitedLine[0] === 'vt') {
      var textureCoord = [Number(splitedLine[1]), Number(splitedLine[2]), splitedLine[3] ? 1 : Number(splitedLine[3])]
      this.source_textureCoords.push(textureCoord);
    }
    else if (splitedLine[0] === 'vn') {
      var normal = [Number(splitedLine[1]), Number(splitedLine[2]), Number(splitedLine[3])];
      this.source_normals.push(normal);
    }
    else if (splitedLine[0] === 'f') {
      var face: Face = {
        indices: [],
        texture: [],
        normal: []
      };

      for (var i = 1; i < splitedLine.length; ++i) {
        var dIndex = splitedLine[i].indexOf('//');
        var splitedFaceIndices = splitedLine[i].split(/\W+/);

        if (dIndex > 0) {
          /*Vertex Normal Indices Without Texture Coordinate Indices*/
          face.indices.push(splitedFaceIndices[0]);
          face.normal.push(splitedFaceIndices[1]);
        }
        else {
          if (splitedFaceIndices.length === 1) {
            /*Vertex Indices*/
            face.indices.push(splitedFaceIndices[0]);
          }
          else if (splitedFaceIndices.length === 2) {
            /*Vertex Texture Coordinate Indices*/
            face.indices.push(splitedFaceIndices[0]);
            face.texture.push(splitedFaceIndices[1]);
          }
          else if (splitedFaceIndices.length === 3) {
            /*Vertex Normal Indices*/
            face.indices.push(splitedFaceIndices[0]);
            face.texture.push(splitedFaceIndices[1]);
            face.normal.push(splitedFaceIndices[2]);
          }
        }
      }

      this.activeGeo.source_faces.push(face);
    } else if (splitedLine[0] === "usemtl") {
      this.activeGeo.source_mat = splitedLine[1];
    } else if (splitedLine[0] === `mtllib`) {
      this.mtlUrl = splitedLine[1];
    }
  }

  private async parserOBJ() {
    let str = this.textData.split("\r\n");
    for (let i = 0; i < str.length; i++) {
      const element = str[i];
      this.parserLine(element);
    }
    this.textData = ``;
    return true;
  }

  private async parser_mesh() {
    for (const key in this.geometrys) {
      const geoData = this.geometrys[key];

      geoData.vertex_arr = [];
      geoData.normal_arr = [];
      geoData.uv_arr = [];
      geoData.indeice_arr = [];

      let index = 0;
      for (let i = 0; i < geoData.source_faces.length; i++) {
        const face = geoData.source_faces[i];

        let f0 = parseInt(face.indices[0]) - 1;
        let f1 = parseInt(face.indices[1]) - 1;
        let f2 = parseInt(face.indices[2]) - 1;

        let n0 = parseInt(face.normal[0]) - 1;
        let n1 = parseInt(face.normal[1]) - 1;
        let n2 = parseInt(face.normal[2]) - 1;

        let u0 = parseInt(face.texture[0]) - 1;
        let u1 = parseInt(face.texture[1]) - 1;
        let u2 = parseInt(face.texture[2]) - 1;

        this.applyVector3(f0, this.source_vertices, geoData.vertex_arr);
        this.applyVector3(n0, this.source_normals, geoData.normal_arr);
        this.applyVector2(u0, this.source_textureCoords, geoData.uv_arr);
        geoData.indeice_arr[index] = index++;

        this.applyVector3(f1, this.source_vertices, geoData.vertex_arr);
        this.applyVector3(n1, this.source_normals, geoData.normal_arr);
        this.applyVector2(u1, this.source_textureCoords, geoData.uv_arr);
        geoData.indeice_arr[index] = index++;

        this.applyVector3(f2, this.source_vertices, geoData.vertex_arr);
        this.applyVector3(n2, this.source_normals, geoData.normal_arr);
        this.applyVector2(u2, this.source_textureCoords, geoData.uv_arr);
        geoData.indeice_arr[index] = index++;

        if (face.indices.length > 3) {
          let f3 = parseInt(face.indices[3]) - 1;
          let n3 = parseInt(face.normal[3]) - 1;
          let u3 = parseInt(face.texture[3]) - 1;
          this.applyVector3(f0, this.source_vertices, geoData.vertex_arr);
          this.applyVector3(n0, this.source_normals, geoData.normal_arr);
          this.applyVector2(u0, this.source_textureCoords, geoData.uv_arr);
          geoData.indeice_arr[index] = index++;

          this.applyVector3(f2, this.source_vertices, geoData.vertex_arr);
          this.applyVector3(n2, this.source_normals, geoData.normal_arr);
          this.applyVector2(u2, this.source_textureCoords, geoData.uv_arr);
          geoData.indeice_arr[index] = index++;

          this.applyVector3(f3, this.source_vertices, geoData.vertex_arr);
          this.applyVector3(n3, this.source_normals, geoData.normal_arr);
          this.applyVector2(u3, this.source_textureCoords, geoData.uv_arr);
          geoData.indeice_arr[index] = index++;
        }
      }

      let root = new Object3D();
      for (const key in this.geometrys) {
        const geoData = this.geometrys[key];
        let geo: GeometryBase = new GeometryBase();
        // let att_info: GeometryAttribute = {};
        // att_info[VertexAttributeName.position] = { name: VertexAttributeName.position, data: new Float32Array(geoData.vertex_arr) };
        // att_info[VertexAttributeName.normal] = { name: VertexAttributeName.normal, data: new Float32Array(geoData.normal_arr) };
        // att_info[VertexAttributeName.uv] = { name: VertexAttributeName.uv, data: new Float32Array(geoData.uv_arr) };
        // att_info[VertexAttributeName.TEXCOORD_1] = { name: VertexAttributeName.TEXCOORD_1, data: new Float32Array(geoData.uv_arr) };
        // att_info[VertexAttributeName.indices] = { name: VertexAttributeName.indices, data: new Uint32Array(geoData.indeice_arr) };
        // geo.setAttributes(geo.name + UUID(), att_info);
        // geo.geometrySource = new SerializeGeometrySource().setObjGeometry(this.initUrl, key);

        geo.setIndices(new Uint32Array(geoData.indeice_arr));
        geo.setAttribute(VertexAttributeName.position, new Float32Array(geoData.vertex_arr));
        geo.setAttribute(VertexAttributeName.normal, new Float32Array(geoData.normal_arr));
        geo.setAttribute(VertexAttributeName.uv, new Float32Array(geoData.uv_arr));
        geo.setAttribute(VertexAttributeName.TEXCOORD_1, new Float32Array(geoData.uv_arr));

        geo.addSubGeometry({
          indexStart: 0,
          indexCount: geoData.indeice_arr.length,
          vertexStart: 0,
          index: 0,
        });

        let mat = new LitMaterial();
        let matData = this.matLibs[geoData.source_mat];
        mat.baseMap = Engine3D.res.getTexture(StringUtil.normalizePath(this.baseUrl + matData.map_Kd));

        let obj = new Object3D();
        let mr = obj.addComponent(MeshRenderer);
        mr.geometry = geo;
        mr.material = mat;
        root.addChild(obj);
      }

      // root.renderLayer = RenderLayer.StaticBatch;
      this.data = root;
    }
  }

  /**
   * Verify parsing validity
   * @param ret
   * @returns
   */
  public verification(): boolean {
    if (this.data) {
      return true;
    }
    throw new Error('Method not implemented.');
  }
}
