import { AnimatorComponent, BlendShapeData, BlendShapePropertyData, GLTFMaterial, LitMaterial, Material, Matrix4, PropertyAnimationClip, SkinnedMeshRenderer2 } from "../../..";
import { Engine3D } from "../../../Engine3D";
import { DirectLight } from "../../../components/lights/DirectLight";
import { PointLight } from "../../../components/lights/PointLight";
import { SpotLight } from "../../../components/lights/SpotLight";
import { MeshRenderer } from "../../../components/renderer/MeshRenderer";
import { Object3D } from "../../../core/entities/Object3D";
import { GeometryBase } from "../../../core/geometry/GeometryBase";
import { VertexAttributeName } from "../../../core/geometry/VertexAttributeName";
import { BlendMode } from "../../../materials/BlendMode";
import { Color } from "../../../math/Color";
import { RADIANS_TO_DEGREES } from "../../../math/MathUtil";
import { Quaternion } from "../../../math/Quaternion";
import { UUID } from "../../../util/Global";
import { GLTF_Info, GLTF_Node } from "./GLTFInfo";
import { GLTFSubParser } from "./GLTFSubParser";
import { GLTFType } from "./GLTFType";
import { KHR_materials_clearcoat } from "./extends/KHR_materials_clearcoat";
import { KHR_materials_emissive_strength } from "./extends/KHR_materials_emissive_strength";
import { KHR_materials_unlit } from "./extends/KHR_materials_unlit";

export class GLTFSubParserConverter {
    protected gltf: GLTF_Info;
    protected subParser: GLTFSubParser;
    private _testCount = 8;
    private _hasCastShadow = false;

    constructor(subParser: GLTFSubParser) {
        this.gltf = subParser.gltf;
        this.subParser = subParser;
    }

    public async convertNodeToObject3D(nodeInfo: GLTF_Node, parentNode): Promise<Object3D> {
        const node: Object3D = new Object3D();
        node.name = nodeInfo.name;
        node[GLTFType.GLTF_NODE_INDEX_PROPERTY] = nodeInfo.nodeId;
        nodeInfo['nodeObj'] = node;

        if (nodeInfo.matrix) {
            nodeInfo.translation = [0, 0, 0]; // eslint-disable-line
            nodeInfo.rotation = [0, 0, 0, 1]; // eslint-disable-line
            nodeInfo.scale = [1, 1, 1]; // eslint-disable-line
            ///Matrix4.decompose( nodeInfo.matrix, nodeInfo.translation, nodeInfo.rotation, nodeInfo.scale );
        }

        if (nodeInfo.translation) {
            node.transform.x = nodeInfo.translation[0];
            node.transform.y = nodeInfo.translation[1];
            node.transform.z = nodeInfo.translation[2];
        }
        if (nodeInfo.rotation) {
            let qat = new Quaternion();
            qat.setFromArray(nodeInfo.rotation);
            node.transform.localRotQuat = qat;
        }
        if (nodeInfo.scale) {
            node.transform.scaleX = nodeInfo.scale[0];
            node.transform.scaleY = nodeInfo.scale[1];
            node.transform.scaleZ = nodeInfo.scale[2];
        }

        parentNode.addChild(node);

        if (nodeInfo.light) {
            this.convertLight(nodeInfo, node);
        }

        if (nodeInfo.primitives) {
            this.convertprimitives(nodeInfo, node);
        }

        if (nodeInfo['skeleton']) {
            // let skeletonAnimation = node.addComponent(SkeletonAnimationComponent);
            // if (skeletonAnimation) {
            //     skeletonAnimation.skeleton = this.subParser.parseSkeleton(nodeInfo['skeleton'].skeleton);
            //     for (let i = 0; i < this.gltf.animations.length; i++) {
            //         let animation = this.gltf.animations[i];
            //         if (!animation.name) animation.name = i.toString();
            //         let animationClip = this.subParser.parseSkeletonAnimation(skeletonAnimation.skeleton, animation);
            //         skeletonAnimation.addAnimationClip(animationClip);
            //     }
            // }
            this.convertSkeletonAnim(node, nodeInfo['skeleton']);
        }

        return node;
    }

    private convertSkeletonAnim(node: Object3D, skeletonInfo: any) {
        let avatarData = this.subParser.parseSkeleton(skeletonInfo.skeleton);
        Engine3D.res.addObj(avatarData.name, avatarData);

        let clips: PropertyAnimationClip[] = [];
        for (let i = 0; i < this.gltf.animations.length; i++) {
            let animation = this.gltf.animations[i];
            if (!animation.name) animation.name = i.toString();
            let clip = this.subParser.parseSkeletonAnimation(avatarData, animation);
            clips.push(clip);
        }

        let animator = node.addComponent(AnimatorComponent);
        animator.avatar = avatarData.name;
        animator.clips = clips;
    }

    private convertLight(nodeInfo: GLTF_Node, node: Object3D) {
        // nodeInfo.light.name
        // nodeInfo.light.intensity
        // nodeInfo.light.type
        switch (nodeInfo.light.type) {
            case `directional`:
                let directLight = node.addComponent(DirectLight);
                node.name = nodeInfo.light.name;
                directLight.intensity = nodeInfo.light.intensity * 0.1;
                directLight.radius = Number.MAX_SAFE_INTEGER;
                directLight.dirFix = -1;
                if (!this._hasCastShadow) {
                    this._hasCastShadow = true;
                    directLight.castShadow = this._hasCastShadow;
                }
                directLight.lightColor = nodeInfo.light.color ? new Color(nodeInfo.light.color[0], nodeInfo.light.color[1], nodeInfo.light.color[2]) : new Color(1, 1, 1, 1);
                directLight.debug();
                break;
            case `point`:
                if (this._testCount > 0) {
                    let point = node.addComponent(PointLight);
                    point.name = nodeInfo.light.name;
                    point.intensity = nodeInfo.light.intensity ? nodeInfo.light.intensity * 8.0 * 2 : 1.0;
                    point.radius = 8.0;
                    // point.castShadow = true ;
                    point.at = 2;
                    point.range = nodeInfo.light.range ? nodeInfo.light.range : 8;
                    point.lightColor = nodeInfo.light.color ? new Color(nodeInfo.light.color[0], nodeInfo.light.color[1], nodeInfo.light.color[2]) : new Color(1, 1, 1, 1);
                    // point.debug();
                    // point.debugDraw(true);
                }

                this._testCount--;
                break;
            case `spot`:
                let spot = node.addComponent(SpotLight);
                spot.name = nodeInfo.light.name;
                spot.intensity = nodeInfo.light.intensity * 5.0;
                spot.radius = 1.0;
                spot.dirFix = -1;
                spot.at = 2;
                // spot.castShadow = true ;
                spot.range = nodeInfo.light.range ? nodeInfo.light.range : 8;
                spot.outerAngle = nodeInfo.light.spot.outerConeAngle * RADIANS_TO_DEGREES;
                spot.lightColor = nodeInfo.light.color ? new Color(nodeInfo.light.color[0], nodeInfo.light.color[1], nodeInfo.light.color[2]) : new Color(1, 1, 1, 1);
                // spot.debug();
                break;
            default:
                break;
        }
        // console.log(nodeInfo);
    }

    private convertprimitives(nodeInfo: GLTF_Node, node: Object3D) {
        // const models = [];
        for (let i = 0; i < nodeInfo.primitives.length; i++) {
            const primitive = nodeInfo.primitives[i];

            let meshName = primitive.modelName;
            // if (meshName.indexOf(`LOD`) != -1) {
            //   //LOD0 LOD1 LOD2
            //   let start = meshName.indexOf('LOD') + 3;
            //   let end = Math.min(start, meshName.length - start);
            //   let num = meshName.substring(start, end);
            //   let value = Number.parseInt(num);
            //   if (value > 0) {
            //     continue;
            //   }
            // }

            let md = primitive.material;
            if (md.name == undefined) {
                md.name = UUID();
            }
            let mat: Material;

            let materialKey = `matkey_${md.name}`;

            if (md && this.gltf.resources[materialKey]) {
                mat = this.gltf.resources[materialKey];
            } else {
                let newMat: Material = (mat = new LitMaterial());
                // let newMat: MaterialBase = (mat = new UnLitMaterial());
                this.gltf.resources[materialKey] = newMat;
                // newMat.doubleSided
                newMat.name = md.name;

                let gltfMat = md as GLTFMaterial;
                if (gltfMat) {
                    const { baseColorTexture, baseColorFactor, metallicFactor, roughnessFactor, doubleSided, metallicRoughnessTexture, normalTexture, occlusionTexture, emissiveTexture, emissiveFactor, enableBlend, alphaCutoff } = gltfMat;

                    let physicMaterial = (newMat = this.applyMaterialExtensions(gltfMat, newMat));
                    if (`enableBlend` in gltfMat) {
                        if (gltfMat[`enableBlend`]) {
                            let defines = gltfMat.defines;
                            if (defines?.includes('ALPHA_BLEND')) {
                                physicMaterial.blendMode = BlendMode.ALPHA;
                            } else {
                                physicMaterial.blendMode = BlendMode.NORMAL;
                            }
                            physicMaterial.castShadow = false;
                        } else {
                            physicMaterial.blendMode = BlendMode.NONE;
                        }
                    }

                    if (`alphaCutoff` in gltfMat && alphaCutoff > 0 && alphaCutoff < 1) {
                        physicMaterial.setUniformFloat("alphaCutoff", alphaCutoff);
                        physicMaterial.blendMode = BlendMode.NORMAL;
                        physicMaterial.transparent = true;
                        // physicMaterial.castShadow = false;
                        // physicMaterial.depthWriteEnabled = false;
                    }

                    if (gltfMat.baseMapOffsetSize) {
                        physicMaterial.setUniformVector4("baseMapOffsetSize", gltfMat.baseMapOffsetSize);
                    }
                    if (gltfMat.normalMapOffsetSize) {
                        physicMaterial.setUniformVector4("normalMapOffsetSize", gltfMat.normalMapOffsetSize);
                    }
                    if (gltfMat.emissiveMapOffsetSize) {
                        physicMaterial.setUniformVector4("emissiveMapOffsetSize", gltfMat.emissiveMapOffsetSize);
                    }
                    if (gltfMat.roughnessMapOffsetSize) {
                        physicMaterial.setUniformVector4("roughnessMapOffsetSize", gltfMat.roughnessMapOffsetSize);
                    }
                    if (gltfMat.metallicMapOffsetSize) {
                        physicMaterial.setUniformVector4("metallicMapOffsetSize", gltfMat.metallicMapOffsetSize);
                    }
                    if (gltfMat.aoMapOffsetSize) {
                        physicMaterial.setUniformVector4("aoMapOffsetSize", gltfMat.aoMapOffsetSize);
                    }


                    physicMaterial.setUniformColor("baseColor", new Color(baseColorFactor[0], baseColorFactor[1], baseColorFactor[2], baseColorFactor[3]));
                    physicMaterial.setUniformFloat("roughness", roughnessFactor);
                    physicMaterial.setUniformFloat("metallic", metallicFactor);
                    physicMaterial.setUniformFloat("ao", 1);
                    physicMaterial.doubleSide = doubleSided;

                    if (baseColorTexture) {
                        physicMaterial.setTexture("baseMap", baseColorTexture);
                    }

                    if (normalTexture) {
                        physicMaterial.setTexture("normalMap", normalTexture);
                    }

                    if (metallicRoughnessTexture) {
                        physicMaterial.setTexture("maskMap", metallicRoughnessTexture);
                    }

                    if (occlusionTexture && (metallicRoughnessTexture != occlusionTexture)) {
                        // physicMaterial.setTexture("aoMap", occlusionTexture);
                        // physicMaterial.shader.getDefaultColorShader().setDefine(`USE_AOTEX`, true);
                    }

                    if (emissiveTexture) {
                        physicMaterial.setTexture("emissiveMap", emissiveTexture);
                    }

                    if (emissiveFactor && (emissiveFactor[0] > 0 || emissiveFactor[1] > 0 || emissiveFactor[2] > 0)) {
                        if (!physicMaterial.shader.getTexture("emissiveMap")) {
                            physicMaterial.shader.setTexture("emissiveMap", Engine3D.res.whiteTexture);
                        }
                        physicMaterial.shader.setDefine('USE_EMISSIVEMAP', true);
                        physicMaterial.setUniformColor("emissiveColor", new Color(emissiveFactor[0], emissiveFactor[1], emissiveFactor[2], emissiveFactor[3]));
                        if (physicMaterial.blendMode != BlendMode.NONE) {
                            physicMaterial.blendMode = BlendMode.ADD;
                        }
                        let emissiveIntensity = mat.getUniformFloat('emissiveIntensity')
                        if (!emissiveIntensity || emissiveIntensity <= 0) {
                            mat.setUniformFloat('emissiveIntensity', 1.0);
                        }
                    }
                }
            }

            const { attribArrays, modelName, drawMode } = primitive;
            let geometry: GeometryBase;

            //todo need add position draw mode support
            if (!attribArrays[`indices`].data) {
                let indices = [];
                let count = attribArrays['position'].data.length / 3 / 3;
                for (let i = 0; i < count; i++) {
                    let a = i * 3;
                    indices.push(a + 2);
                    indices.push(a + 0);
                    indices.push(a + 1);
                }
                attribArrays[`indices`] = {
                    data: new Uint8Array(indices),
                    normalize: false,
                    numComponents: 1,
                };
            }
            if (!attribArrays[`normal`]) {
                let normal = [];
                let count = attribArrays['position'].data.length / 3;
                for (let i = 0; i < count; i++) {
                    normal.push(0);
                    normal.push(0);
                    normal.push(0);
                }
                attribArrays[`normal`] = {
                    data: new Float32Array(normal),
                    normalize: false,
                    numComponents: 3,
                };
            }
            if (attribArrays[`indices`].data && attribArrays[`indices`].data.length > 3) {
                let meshName = primitive.meshName();
                if (this.gltf.resources[meshName]) {
                    geometry = this.gltf.resources[meshName];
                }

                const model: Object3D = new Object3D(); //new Model( primitive.attribArrays.mesh );
                model.name = modelName + i;

                if (this.gltf.animations && attribArrays[VertexAttributeName.joints0] != undefined) {
                    geometry ||= this.createGeometryBase(modelName, attribArrays, primitive, nodeInfo.skin);
                    this.gltf.resources[meshName] = geometry;

                    let skeletonNode = this.gltf.nodes[nodeInfo.skin.skeleton];
                    if (skeletonNode.dnode && skeletonNode.dnode['nodeObj']) {
                        // let node = skeletonNode.dnode['nodeObj'];
                        // let skeletonAnimation = node.addComponent(SkeletonAnimationComponent);
                        // if (skeletonAnimation) {
                        //     skeletonAnimation.skeleton = this.subParser.parseSkeleton(nodeInfo.skin.skeleton);
                        //     for (let i = 0; i < this.gltf.animations.length; i++) {
                        //         let animation = this.gltf.animations[i];
                        //         if (!animation.name) animation.name = i.toString();
                        //         let animationClip = this.subParser.parseSkeletonAnimation(skeletonAnimation.skeleton, animation);
                        //         skeletonAnimation.addAnimationClip(animationClip);
                        //     }
                        // }
                        this.convertSkeletonAnim(node, nodeInfo.skin);
                    } else {
                        skeletonNode.dnode['skeleton'] = nodeInfo.skin;
                    }

                    let smr = model.addComponent(SkinnedMeshRenderer2);
                    // smr.castShadow = true;
                    // smr.castGI = true;
                    smr.geometry = geometry;
                    smr.material = mat;
                    // smr.skinJointsName = this.parseSkinJoints(nodeInfo.skin);
                    // smr.skinInverseBindMatrices = nodeInfo.skin.inverseBindMatrices;
                } else {
                    geometry ||= this.createGeometryBase(modelName, attribArrays, primitive);
                    this.gltf.resources[meshName] = geometry;

                    if (geometry.hasAttribute(VertexAttributeName.joints0)) {
                        geometry.vertexAttributeMap.delete(VertexAttributeName.joints0)
                    }

                    let mc = model.addComponent(MeshRenderer);
                    mc.castShadow = true;
                    mc.castGI = true;
                    mc.geometry = geometry;
                    mc.material = mat;
                }

                const uniformobj = {};
                const skinDefines = (nodeInfo.skin && nodeInfo.skin.defines) || [];
                // model.defines = primitive.defines.concat( skinDefines );
                // parse material

                // morph targets
                // if (primitive.weights)
                //   uniformobj[GLTFParser.MORPH_WEIGHT_UNIFORM] = primitive.weights;

                // model.setUniformObj( uniformobj );

                // if ( nodeInfo.primitives.length < 2 )
                //     node.addChild( model );
                // else
                node.addChild(model);
            }

            // models.push( model );
        }

        // if ( node.transform.childrenCount > 0 )
        //     node.gltfPrimitives = node.children;

        // if ( nodeInfo.skin )

        //     if ( skins.indexOf( nodeInfo.skin ) > - 1 )
        //         nodeInfo.skin.models.push( ...models );
        //     else {

        //         node.skin = Object.assign( nodeInfo.skin, { models } );
        //         skins.push( node.skin );

        //     }
        //  }
    }

    private createGeometryBase(name: string, attribArrays: any, primitive: any, skin?:any): GeometryBase {
        if ('indices' in attribArrays) {
            let bigIndices = attribArrays[`indices`].data.length > 65534;
            if (bigIndices) {
                attribArrays[`indices`].data = new Uint32Array(attribArrays[`indices`].data);
            } else {
                attribArrays[`indices`].data = new Uint16Array(attribArrays[`indices`].data);
            }
        }

        let geometry = new GeometryBase();
        geometry.name = name;

        // Only Uint16Array and Uint32Array are supported
        if ('indices' in attribArrays) {
            let bigIndices = attribArrays[`indices`].data.length > 65535;
            if (bigIndices) {
                attribArrays[`indices`].data = new Uint32Array(attribArrays[`indices`].data);
            } else {
                attribArrays[`indices`].data = new Uint16Array(attribArrays[`indices`].data);
            }
        }

        // BlendShapeData
        if (primitive.morphTargetsRelative) {
            let blendShapeData = new BlendShapeData();
            let targetNames = primitive.targetNames;
            if (targetNames && targetNames.length > 0) {
                blendShapeData.shapeNames = [];
                blendShapeData.shapeIndexs = [];
                for (let i = 0; i < targetNames.length; i++) {
                    blendShapeData.shapeNames.push(targetNames[i])
                    blendShapeData.shapeIndexs.push(i);
                }
            }
            blendShapeData.vertexCount = attribArrays['position'].data.length / 3;
            blendShapeData.blendCount = blendShapeData.shapeNames.length;
            blendShapeData.blendShapePropertyDatas = [];
            blendShapeData.blendShapeMap = new Map<string, BlendShapePropertyData>();
            for (let i = 0; i < blendShapeData.blendCount; i++) {
                let propertyData = new BlendShapePropertyData();
                propertyData.shapeName = blendShapeData.shapeNames[i];
                propertyData.shapeIndex = blendShapeData.shapeIndexs[i];
                propertyData.frameCount = 1;
                propertyData.blendPositionList = attribArrays[GLTFType.MORPH_POSITION_PREFIX + i].data;
                propertyData.blendNormalList = attribArrays[GLTFType.MORPH_NORMAL_PREFIX + i].data;
    
                blendShapeData.blendShapePropertyDatas.push(propertyData);
                blendShapeData.blendShapeMap.set(propertyData.shapeName, propertyData);
            }
            
            geometry.blendShapeData = blendShapeData;
        }

        // geometry.geometrySource = new SerializeGeometrySource().setGLTFGeometry(this.initUrl, name);
        //morphTarget
        geometry.morphTargetsRelative = primitive.morphTargetsRelative;
        let targetNames = primitive.targetNames;
        if (targetNames && targetNames.length > 0) {
            let morphTargetDictionary = geometry.morphTargetDictionary = {} as any;
            for (let i = 0; i < targetNames.length; i++) {
                morphTargetDictionary[targetNames[i]] = i;
            }
        }
        //vIndex
        if (geometry.morphTargetDictionary) {
            let vertexCount = attribArrays['position'].data.length / 3;
            let vIndexArray = new Float32Array(vertexCount);
            for (let i = 0; i < vertexCount; i++) {
                vIndexArray[i] = i;
            }
            attribArrays[`vIndex`] = {
                data: vIndexArray,
                normalize: false,
                numComponents: 1,
            };
        }

        for (const attributeName in attribArrays) {
            let attributeData = attribArrays[attributeName];
            geometry.setAttribute(attributeName, attributeData.data);
        }

        if (skin) {
            geometry.skinNames = new Array<string>(skin.joints.length);
            for (let i = 0; i < skin.joints.length; i++) {
                const id = skin.joints[i];
                const node = this.gltf.nodes[id];
                geometry.skinNames[i] = node.name;
            }

            geometry.bindPose = new Array<Matrix4>(skin.inverseBindMatrices.length);
            for (let i = 0; i < skin.inverseBindMatrices.length; i++) {
                const m = skin.inverseBindMatrices[i];
                let mat = new Matrix4();
                mat.rawData.set(m);
                geometry.bindPose[i] = mat;
            }
        }

        let indicesAttribute = geometry.getAttribute(VertexAttributeName.indices);
        geometry.addSubGeometry(
            {
                indexStart: 0,
                indexCount: indicesAttribute.data.length,
                vertexStart: 0,
                index: 0,
                vertexCount: 0,
                firstStart: 0,
                topology: 0
            }
        )
        return geometry;
    }

    private applyMaterialExtensions(dmaterial: any, mat: Material): Material {
        if (dmaterial.extensions) {
            KHR_materials_clearcoat.apply(this.gltf, dmaterial, mat);
            KHR_materials_unlit.apply(this.gltf, dmaterial, mat);
            KHR_materials_emissive_strength.apply(this.gltf, dmaterial, mat);
        }
        return mat;
    }

    private parseSkinJoints(skin) {
        let skinJointsName: Array<string> = [];
        for (let nodeId of skin.joints) {
            let node = this.gltf.nodes[nodeId];
            skinJointsName.push(node.name);
        }
        return skinJointsName;
    }
}
