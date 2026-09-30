import { Engine3D } from "../../../Engine3D";
import { Vector4 } from "../../../math/Vector4";
import { GLTF_Info } from "./GLTFInfo";
import { GLTFMaterial } from "./GLTFMaterial";
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
        const dmaterial: GLTFMaterial = {
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
            extensions: null,
            baseMapOffsetSize: null,
            normalMapOffsetSize: null,
            emissiveMapOffsetSize: null,
            roughnessMapOffsetSize: null,
            metallicMapOffsetSize: null,
            aoMapOffsetSize: null,
            metallicFactor: 0,
            roughnessFactor: 1
        };

        if (pbrMetallicRoughness) {
            const { baseColorFactor, metallicFactor, roughnessFactor, baseColorTexture, metallicRoughnessTexture } = pbrMetallicRoughness;

            Object.assign(dmaterial, {
                baseColorFactor: baseColorFactor || [1, 1, 1, 1],
                metallicFactor: metallicFactor === undefined ? 1.0 : metallicFactor,
                roughnessFactor: roughnessFactor === undefined ? 0.5 : roughnessFactor,
            });

            if (baseColorTexture) {
                //extensions:{KHR_texture_transform: {…}}
                let ext = baseColorTexture.extensions;
                if (ext) {
                    let KHR_texture_transform = ext.KHR_texture_transform;
                    if (KHR_texture_transform) {
                        let offsetSize = new Vector4(
                            KHR_texture_transform.offset ? KHR_texture_transform.offset[0] : 0.0,
                            KHR_texture_transform.offset ? KHR_texture_transform.offset[1] : 0.0,
                            KHR_texture_transform.scale ? KHR_texture_transform.scale[0] : 1.0,
                            KHR_texture_transform.scale ? KHR_texture_transform.scale[1] : 1.0,
                        );
                        dmaterial.baseMapOffsetSize = offsetSize;
                    }
                }
                // glTF baseColorTexture is the only color channel that
                // stores sRGB-encoded bytes; the rest (normal, mr, ao,
                // transmission scalar, thickness) are linear data.
                const texture = await this.parseTexture(baseColorTexture.index, 'srgb');
                if (texture) {
                    dmaterial.baseColorTexture = texture;
                } else {
                    dmaterial.baseColorTexture = Engine3D.resFor(this.subParser.ctx).redTexture;
                }
            }

            if (normalTexture) {
                //extensions:{KHR_texture_transform: {…}}
                let ext = normalTexture.extensions;
                if (ext) {
                    let KHR_texture_transform = ext.KHR_texture_transform;
                    if (KHR_texture_transform) {
                        let offsetSize = new Vector4(
                            KHR_texture_transform.offset ? KHR_texture_transform.offset[0] : 0.0,
                            KHR_texture_transform.offset ? KHR_texture_transform.offset[1] : 0.0,
                            KHR_texture_transform.scale ? KHR_texture_transform.scale[0] : 1.0,
                            KHR_texture_transform.scale ? KHR_texture_transform.scale[1] : 1.0,
                        );
                        dmaterial.normalMapOffsetSize = offsetSize;
                    }
                }
                const texture = await this.parseTexture(normalTexture.index);
                if (texture) {
                    dmaterial.normalTexture = texture;
                } else {
                    dmaterial.normalTexture = Engine3D.resFor(this.subParser.ctx).normalTexture;
                }
            }

            if (metallicRoughnessTexture) {
                let ext = metallicRoughnessTexture.extensions;
                if (ext) {
                    let KHR_texture_transform = ext.KHR_texture_transform;
                    if (KHR_texture_transform) {
                        let offsetSize = new Vector4(
                            KHR_texture_transform.offset ? KHR_texture_transform.offset[0] : 0.0,
                            KHR_texture_transform.offset ? KHR_texture_transform.offset[1] : 0.0,
                            KHR_texture_transform.scale ? KHR_texture_transform.scale[0] : 1.0,
                            KHR_texture_transform.scale ? KHR_texture_transform.scale[1] : 1.0,
                        );
                        dmaterial.roughnessMapOffsetSize = offsetSize;
                    }
                }

                const texture = await this.parseTexture(metallicRoughnessTexture.index);
                if (texture) {
                    dmaterial.metallicRoughnessTexture = texture;
                } else {
                    dmaterial.metallicRoughnessTexture = Engine3D.resFor(this.subParser.ctx).blackTexture;
                }
            }
        } else {
            Object.assign(dmaterial, {
                baseColorFactor: [1, 1, 1, 1],
                metallicFactor: 0,
                roughnessFactor: 0.5,
            });
        }

        // KHR_materials_transmission textures live on `material.extensions`
        // — resolve them here in the async path so the synchronous
        // extension applier (KHR_materials_transmission.apply, run from
        // GLTFSubParserConverter) can just bind the already-loaded
        // Texture via setter.
        if (extensions && extensions.KHR_materials_transmission && extensions.KHR_materials_transmission.transmissionTexture) {
            const texInfo = extensions.KHR_materials_transmission.transmissionTexture;
            const tex = await this.parseTexture(texInfo.index);
            if (tex) (dmaterial as any).transmissionTextureResolved = tex;
        }
        // Textures of the other KHR material extensions, same pattern: resolved here,
        // bound by the synchronous appliers via the LitMaterial *Map setters.
        const extTextures: [string, string, string, 'srgb' | 'linear'][] = [
            ['KHR_materials_sheen', 'sheenColorTexture', 'sheenColorTextureResolved', 'srgb'],
            ['KHR_materials_sheen', 'sheenRoughnessTexture', 'sheenRoughnessTextureResolved', 'linear'],
            ['KHR_materials_iridescence', 'iridescenceTexture', 'iridescenceTextureResolved', 'linear'],
            ['KHR_materials_iridescence', 'iridescenceThicknessTexture', 'iridescenceThicknessTextureResolved', 'linear'],
            ['KHR_materials_specular', 'specularTexture', 'specularTextureResolved', 'linear'],
            ['KHR_materials_specular', 'specularColorTexture', 'specularColorTextureResolved', 'srgb'],
            ['KHR_materials_anisotropy', 'anisotropyTexture', 'anisotropyTextureResolved', 'linear'],
        ];
        for (const [extName, key, slot, colorSpace] of extTextures) {
            const info = extensions?.[extName]?.[key];
            if (info && typeof info.index === 'number') {
                const tex = await this.parseTexture(info.index, colorSpace);
                if (tex) (dmaterial as any)[slot] = tex;
            }
        }
        if (extensions && extensions.KHR_materials_volume && extensions.KHR_materials_volume.thicknessTexture) {
            const texInfo = extensions.KHR_materials_volume.thicknessTexture;
            const tex = await this.parseTexture(texInfo.index);
            if (tex) (dmaterial as any).thicknessTextureResolved = tex;
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
                dmaterial.normalTexture = Engine3D.resFor(this.subParser.ctx).normalTexture;
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
            // emissiveTexture is sRGB-encoded color (KHR + glTF spec
            // 2.0 §3.9.3) — same hardware decode as baseColor.
            const texture = await this.parseTexture(emissiveTexture.index, 'srgb');
            if (texture) {
                dmaterial.emissiveTexture = texture;
            } else {
                dmaterial.emissiveTexture = Engine3D.resFor(this.subParser.ctx).blackTexture;
            }
        }

        if (extensions) {
            dmaterial.extensions = extensions;
        }

        material.isParsed = true;
        material.dmaterial = dmaterial;
        return dmaterial;
    }

    private async parseTexture(index: number, colorSpace: 'srgb' | 'linear' = 'linear') {
        return this.subParser.parseTexture(index, colorSpace);
    }

    private errorMiss(e, info?) {
        throw new Error(e + info);
    }
}
