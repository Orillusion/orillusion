import { VertexAttributeName } from "../../../core/geometry/VertexAttributeName";
import { GLTF_Info } from "./GLTFInfo";
import { GLTFParser } from "./GLTFParser";
import { GLTFSubParser } from "./GLTFSubParser";
import { GLTFType } from "./GLTFType";
import { KHR_draco_mesh_compression } from "./extends/KHR_draco_mesh_compression";

/**
 * @internal
 */
export class GLTFSubParserMesh {
    protected gltf: GLTF_Info;
    protected subParser: GLTFSubParser;

    constructor(subParser: GLTFSubParser) {
        this.gltf = subParser.gltf;
        this.subParser = subParser;
    }

    public async parse(meshId) {
        const mesh = this.gltf.meshes[meshId];

        if (!mesh)
            return this.errorMiss('mesh', meshId);

        if (mesh.isParsed)
            return mesh.dprimitives;

        const primitives = mesh.primitives;
        const extras = mesh.extras;
        const dprimitives = [];
        for (let i = 0; i < primitives.length; i++) {
            const primitive = primitives[i];
            const { attributes, indices, material, mode, name, targets, morphTargetsRelative, extensions } = primitive;

            let tmpName = mesh.name;
            for (let tn in attributes) {
                tmpName += tn;
            }
            tmpName += `indices:${indices}`;
            tmpName += `material:${material}`;

            const dprimitive = {
                attribArrays: { indices: [] },
                weights: [],
                defines: [],
                material: null,
                drawMode: null,
                meshName: null,
                modelName: null,
                morphTargetsRelative: false,
                targetNames: extras ? extras.targetNames : null,
            };

            let hasNormal = false;
            let hasTangent = false;
            let texCoordNum = 0;
            let jointVec8 = false;
            let vertexColor = 0;

            let overlayAccessors;
            if (extensions && extensions.KHR_draco_mesh_compression) {
                overlayAccessors = await KHR_draco_mesh_compression.apply(this.subParser, primitive);
            }

            for (const attribute in attributes) {
                const accessor = overlayAccessors ? overlayAccessors[attribute] : this.parseAccessor(attributes[attribute]);

                if (accessor) {
                    let attribName;
                    switch (attribute) {
                        case 'POSITION':
                            attribName = VertexAttributeName.position;
                            break;

                        case 'NORMAL':
                            attribName = VertexAttributeName.normal;
                            hasNormal = true;
                            break;

                        // case 'TANGENT':
                        //   attribName = VertexAttributeName.tangent;
                        //   hasTangent = true;
                        //   break;

                        case 'TEXCOORD_0':
                            attribName = VertexAttributeName.uv;
                            texCoordNum++;
                            break;

                        // case 'TEXCOORD_1':
                        //   attribName = VertexAttributeName.uv1;
                        //   texCoordNum++;
                        //   break;

                        case 'JOINTS_0':
                            attribName = VertexAttributeName.joints0;
                            break;

                        case 'JOINTS_1':
                            attribName = VertexAttributeName.joints1;
                            jointVec8 = true;
                            break;

                        case 'WEIGHTS_0':
                            attribName = VertexAttributeName.weights0;
                            break;

                        case 'WEIGHTS_1':
                            attribName = VertexAttributeName.weights1;
                            break;

                        // case 'COLOR_0':
                        //   attribName = VertexAttributeName.color;
                        //   vertexColor = accessor.numComponents;
                        //   break;

                        default:
                            attribName = attribute;
                    }

                    dprimitive.attribArrays[attribName] = accessor;
                }
            }

            if (hasNormal) dprimitive.defines.push(GLTFParser.getHasNormalDefine());
            if (hasTangent) dprimitive.defines.push(GLTFParser.getHasTangentDefine());
            if (texCoordNum) dprimitive.defines.push(GLTFParser.getTexCoordDefine(texCoordNum));
            if (jointVec8) dprimitive.defines.push(GLTFParser.getJointVec8Define());
            if (vertexColor) dprimitive.defines.push(GLTFParser.getVertexColorDefine(vertexColor));

            if (indices !== undefined) {
                const accessor = overlayAccessors ? overlayAccessors['indices'] : this.parseAccessor(indices);
                if (accessor) dprimitive.attribArrays.indices = accessor;
            }

            const dmaterial = await this.parseMaterial(material);
            if (dmaterial) {
                dprimitive.material = dmaterial;
                dprimitive.defines = dprimitive.defines.concat(dmaterial.defines);
            }

            dprimitive.drawMode = mode === undefined ? 4 : mode;
            dprimitive.meshName = () => {
                return tmpName;
            }; //|| GLTFParser.getMeshNameCounter();
            dprimitive.modelName = mesh.name || GLTFParser.getModelNameCounter();

            if (targets) {
                dprimitive.defines.push(GLTFParser.getMorphTargetsDefine(targets.length));
                dprimitive.morphTargetsRelative = true;
                let hasPositions = false;
                let hasNormals = false;
                let hasTangents = false;
                for (let j = 0; j < targets.length; j++) {
                    const target = targets[j];
                    Object.keys(target).forEach((attribute) => {
                        const accessor = this.parseAccessor(target[attribute]);
                        if (accessor) {
                            let attribName;
                            switch (attribute) {
                                case 'POSITION':
                                    attribName = GLTFType.MORPH_POSITION_PREFIX + j;
                                    hasPositions = true;
                                    break;
                                case 'NORMAL':
                                    attribName = GLTFType.MORPH_NORMAL_PREFIX + j;
                                    hasNormals = true;
                                    break;
                                case 'TANGENT':
                                    attribName = GLTFType.MORPH_TANGENT_PREFIX + j;
                                    hasTangents = true;
                                    break;
                                default:
                                    attribName = false;
                            }

                            if (!attribName) console.error(`glTF has unsupported morph target attribute ${attribute}`);
                            else dprimitive.attribArrays[attribName] = accessor;
                        }
                    });
                }

                if (hasPositions) dprimitive.defines.push(GLTFParser.getMorphtargetPositionDefine());
                if (hasNormals) dprimitive.defines.push(GLTFParser.getMorphtargetNormalDefine());
                if (hasTangents) dprimitive.defines.push(GLTFParser.getMorphtargetTangentDefine());
                dprimitive.weights = mesh.weights || new Array(targets.length).fill(0);
            }

            dprimitives.push(dprimitive);
        }

        mesh.dprimitives = dprimitives;
        mesh.isParsed = true;
        return mesh.dprimitives;
    }

    private parseAccessor(accessorId) {
        return this.subParser.parseAccessor(accessorId);
    }

    private parseMaterial(material) {
        return this.subParser.parseMaterial(material);
    }

    private errorMiss(e, info?) {
        throw new Error(e + info);
    }
}
