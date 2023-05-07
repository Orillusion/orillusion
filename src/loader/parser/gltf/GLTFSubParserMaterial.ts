import { Engine3D } from "../../../Engine3D";
import { Vector4 } from "../../../math/Vector4";
import { GLTF_Info } from "./GLTFInfo";
import { GLTFParser } from "./GLTFParser";
import { GLTFSubParser } from "./GLTFSubParser";

/**
 * @internal
 */
export class GLTFSubParserMaterial {
    protected gltf: GLTF_Info;
    protected subParser: GLTFSubParser;

    constructor(subParser: GLTFSubParser) {
        this.gltf = subParser.gltf;
        this.subParser = subParser;
    }

    public async parse(materialId) {
        let material;
        if (materialId == undefined) {
            material = GLTFParser.defaultMaterial;
        } else {
            material = this.gltf.materials[materialId];
        }

        if (!material)
            return this.errorMiss('material', materialId);

        if (material.isParsed)
            return material.dmaterial;

        let { name, pbrMetallicRoughness, normalTexture, occlusionTexture, emissiveTexture, emissiveFactor, alphaMode, alphaCutoff, doubleSided, extensions } = material;
        const dmaterial = {
            name,
            defines: [],
            doubleSided: !!doubleSided,
            baseColorFactor: [1, 1, 1, 1],
            emissiveFactor: null,
            alphaCutoff: 0,
            enableBlend: false,
            baseColorTexture: null,
            metallicRoughnessTexture: null,
            normalTexture: null,
            occlusionTexture: null,
            emissiveTexture: null,
            transformUV1: null,
            transformUV2: null,
            extensions: null,
        };

        if (pbrMetallicRoughness) {
            const { baseColorFactor, metallicFactor, roughnessFactor, baseColorTexture, metallicRoughnessTexture } = pbrMetallicRoughness;

            Object.assign(dmaterial, {
                baseColorFactor: baseColorFactor || [1, 1, 1, 1],
                metallicFactor: metallicFactor === undefined ? 1.0 : metallicFactor,
                roughnessFactor: roughnessFactor === undefined ? 0.15 : roughnessFactor,
            });

            if (baseColorTexture) {
                //extensions:{KHR_texture_transform: {…}}
                let ext = baseColorTexture.extensions;
                if (ext) {
                    let KHR_texture_transform = ext.KHR_texture_transform;
                    if (KHR_texture_transform) {
                        dmaterial.transformUV1 = new Vector4(
                            KHR_texture_transform.offset ? KHR_texture_transform.offset[0] : 0.0,
                            KHR_texture_transform.offset ? KHR_texture_transform.offset[1] : 0.0,
                            KHR_texture_transform.scale ? KHR_texture_transform.scale[0] : 1.0,
                            KHR_texture_transform.scale ? KHR_texture_transform.scale[1] : 1.0,
                        );
                    }
                }
                const texture = await this.parseTexture(baseColorTexture.index);
                if (texture) {
                    dmaterial.baseColorTexture = texture;
                } else {
                    dmaterial.baseColorTexture = Engine3D.res.redTexture;
                }
            }

            if (metallicRoughnessTexture) {
                const texture = await this.parseTexture(metallicRoughnessTexture.index);
                if (texture) {
                    dmaterial.metallicRoughnessTexture = texture;
                } else {
                    dmaterial.metallicRoughnessTexture = Engine3D.res.blackTexture;
                }
            }
        } else {
            Object.assign(dmaterial, {
                baseColorFactor: [1, 1, 1, 1],
                metallicFactor: 0,
                roughnessFactor: 0.5,
            });
        }

        if (dmaterial.baseColorFactor && dmaterial.baseColorFactor[3] < 1.0) {
            alphaMode = alphaMode === 'MASK' ? 'MASK' : 'BLEND';
        }

        if (alphaMode && alphaMode !== 'OPAQUE') {
            if (alphaMode === 'MASK') {
                dmaterial.defines.push(GLTFParser.getAlphaMaskDefine());
                dmaterial.alphaCutoff = alphaCutoff === undefined ? 0.5 : alphaCutoff;
            }

            if (alphaMode === 'BLEND') {
                dmaterial.defines.push(GLTFParser.getAlphaBlendDefine());
                dmaterial.enableBlend = true;
            }
        }

        if (normalTexture) {
            const texture = await this.parseTexture(normalTexture.index);
            if (texture) {
                dmaterial.normalTexture = texture;
            } else {
                dmaterial.normalTexture = Engine3D.res.normalTexture;
            }
        }

        if (occlusionTexture) {
            const texture = await this.parseTexture(occlusionTexture.index);
            if (texture) {
                dmaterial.occlusionTexture = texture;
            }
        }

        if (emissiveFactor) {
            dmaterial.emissiveFactor = emissiveFactor;
        }

        if (emissiveTexture) {
            const texture = await this.parseTexture(emissiveTexture.index);
            if (texture) {
                dmaterial.emissiveTexture = texture;
            } else {
                dmaterial.emissiveTexture = Engine3D.res.blackTexture;
            }
        }

        if (extensions) {
            dmaterial.extensions = extensions;
        }

        material.isParsed = true;
        material.dmaterial = dmaterial;
        return dmaterial;
    }

    private async parseTexture(index: number) {
        return this.subParser.parseTexture(index);
    }

    private errorMiss(e, info?) {
        throw new Error(e + info);
    }
}
