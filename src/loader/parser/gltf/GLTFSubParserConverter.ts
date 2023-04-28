import { Engine3D } from "../../../Engine3D";
import { SkeletonAnimationComponent } from "../../../components/SkeletonAnimationComponent";
import { DirectLight } from "../../../components/lights/DirectLight";
import { PointLight } from "../../../components/lights/PointLight";
import { SpotLight } from "../../../components/lights/SpotLight";
import { MeshRenderer } from "../../../components/renderer/MeshRenderer";
import { SkinnedMeshRenderer } from "../../../components/renderer/SkinnedMeshRenderer";
import { Object3D } from "../../../core/entities/Object3D";
import { GeometryBase } from "../../../core/geometry/GeometryBase";
import { VertexAttributeName } from "../../../core/geometry/VertexAttributeName";
import { BlendMode } from "../../../materials/BlendMode";
import { LitMaterial } from "../../../materials/LitMaterial";
import { MaterialBase } from "../../../materials/MaterialBase";
import { PhysicMaterial } from "../../../materials/PhysicMaterial";
import { Color } from "../../../math/Color";
import { RADIANS_TO_DEGREES } from "../../../math/MathUtil";
import { Quaternion } from "../../../math/Quaternion";
import { UUID } from "../../../util/Global";
import { GLTF_Info, GLTF_Node } from "./GLTFInfo";
import { GLTFParser } from "./GLTFParser";
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
        const node = new Object3D();
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
            let skeletonAnimation = node.addComponent(SkeletonAnimationComponent);
            if (skeletonAnimation) {
                skeletonAnimation.skeleton = this.subParser.parseSkeleton(nodeInfo['skeleton'].skeleton);
                for (let i = 0; i < this.gltf.animations.length; i++) {
                    let animation = this.gltf.animations[i];
                    if (!animation.name) animation.name = i.toString();
                    let animationClip = this.subParser.parseSkeletonAnimation(skeletonAnimation.skeleton, animation);
                    skeletonAnimation.addAnimationClip(animationClip);
                }
            }
        }

        return node;
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
            let mat: MaterialBase;

            let materialKey = `matkey_${md.name}`;

            if (md && this.gltf.resources[materialKey]) {
                mat = this.gltf.resources[materialKey];
            } else {
                let newMat: MaterialBase = (mat = new LitMaterial());
                // let newMat: MaterialBase = (mat = new UnLitMaterial());
                this.gltf.resources[materialKey] = newMat;
                // newMat.doubleSided
                newMat.name = md.name;
                if (primitive.material) {
                    const { baseColorTexture, baseColorFactor, metallicFactor, roughnessFactor, doubleSided, metallicRoughnessTexture, normalTexture, occlusionTexture, emissiveTexture, emissiveFactor, enableBlend, alphaCutoff } = primitive.material;

                    let physicMaterial = (newMat = this.applyMaterialExtensions(primitive.material, newMat) as PhysicMaterial);
                    if (`enableBlend` in primitive.material) {
                        if (primitive.material[`enableBlend`]) {
                            physicMaterial.blendMode = BlendMode.NORMAL;
                        } else {
                            physicMaterial.blendMode = BlendMode.NONE;
                        }

                        if (primitive.material.defines) {
                            if (primitive.material.defines.indexOf(`ALPHA_BLEND`) != -1) {
                                physicMaterial.blendMode = BlendMode.ALPHA;
                                physicMaterial.transparent = true;
                            }
                        }
                    }

                    if (`alphaCutoff` in primitive.material && alphaCutoff > 0) {
                        physicMaterial.alphaCutoff = alphaCutoff;
                        physicMaterial.blendMode = BlendMode.NORMAL;
                        physicMaterial.transparent = true;
                    }

                    if (primitive.material.transformUV1) physicMaterial.uvTransform_1 = primitive.material.transformUV1;
                    if (primitive.material.transformUV2) physicMaterial.uvTransform_2 = primitive.material.transformUV2;

                    physicMaterial.baseColor = new Color(baseColorFactor[0], baseColorFactor[1], baseColorFactor[2], baseColorFactor[3]);

                    physicMaterial.roughness = roughnessFactor;

                    physicMaterial.metallic = metallicFactor;

                    physicMaterial.doubleSide = doubleSided;

                    if (baseColorTexture) {
                        physicMaterial.baseMap = baseColorTexture;
                    }

                    if (normalTexture) {
                        physicMaterial.normalMap = normalTexture;
                    }

                    if (metallicRoughnessTexture) {
                        physicMaterial.maskMap = metallicRoughnessTexture;
                    }

                    if (occlusionTexture && (metallicRoughnessTexture != occlusionTexture)) {
                        physicMaterial.aoMap = occlusionTexture;
                    }

                    if (emissiveTexture) {
                        physicMaterial.emissiveMap = emissiveTexture;
                    }

                    if (emissiveFactor && (emissiveFactor[0] > 0 || emissiveFactor[1] > 0 || emissiveFactor[2] > 0)) {
                        if (physicMaterial.emissiveMap) {
                            if (physicMaterial.emissiveMap == Engine3D.res.blackTexture) {
                                physicMaterial.emissiveMap = Engine3D.res.whiteTexture;
                            }
                        }
                        let emissiveFactorA = emissiveFactor[3] ? emissiveFactor[3] : 1.0;
                        physicMaterial.emissiveColor = new Color(emissiveFactor[0], emissiveFactor[1], emissiveFactor[2], emissiveFactorA);
                        physicMaterial.emissiveIntensity = 1;
                    }

                    //todo add material debug
                    if (Engine3D.setting.material.materialDebug) {
                        physicMaterial.debug();
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
                } else {
                    geometry ||= this.createGeometryBase(meshName, attribArrays, primitive);
                    this.gltf.resources[meshName] = geometry;
                }

                const model: Object3D = new Object3D(); //new Model( primitive.attribArrays.mesh );
                model.name = modelName + i;

                if (this.gltf.animations && attribArrays[VertexAttributeName.joints0] != undefined) {
                    geometry ||= this.createGeometryBase(modelName, attribArrays, primitive);
                    this.gltf.resources[meshName] = geometry;

                    let skeletonNode = this.gltf.nodes[nodeInfo.skin.skeleton];
                    if (skeletonNode.dnode && skeletonNode.dnode['nodeObj']) {
                        let node = skeletonNode.dnode['nodeObj'];
                        let skeletonAnimation = node.addComponent(SkeletonAnimationComponent);
                        if (skeletonAnimation) {
                            skeletonAnimation.skeleton = this.subParser.parseSkeleton(nodeInfo.skin.skeleton);
                            for (let i = 0; i < this.gltf.animations.length; i++) {
                                let animation = this.gltf.animations[i];
                                if (!animation.name) animation.name = i.toString();
                                let animationClip = this.subParser.parseSkeletonAnimation(skeletonAnimation.skeleton, animation);
                                skeletonAnimation.addAnimationClip(animationClip);
                            }
                        }
                    } else {
                        skeletonNode.dnode['skeleton'] = nodeInfo.skin;
                    }

                    let smr = model.addComponent(SkinnedMeshRenderer);
                    smr.castShadow = true;
                    smr.castGI = true;
                    smr.geometry = geometry;
                    smr.material = mat;
                    smr.skinJointsName = this.parseSkinJoints(nodeInfo.skin);
                    smr.skinInverseBindMatrices = nodeInfo.skin.inverseBindMatrices;
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

    private createGeometryBase(name: string, attribArrays: any, primitive: any): GeometryBase {
        let geometry = new GeometryBase();
        geometry.name = name;

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

        let indicesAttribute = geometry.getAttribute(VertexAttributeName.indices);
        geometry.addSubGeometry(
            {
                indexStart: 0,
                indexCount: indicesAttribute.data.length,
                vertexStart: 0,
                index: 0,
            }
        )
        return geometry;
    }

    private applyMaterialExtensions(dmaterial: any, mat: MaterialBase): MaterialBase {
        KHR_materials_clearcoat.apply(this.gltf, dmaterial, mat);
        KHR_materials_unlit.apply(this.gltf, dmaterial, mat);
        KHR_materials_emissive_strength.apply(this.gltf, dmaterial, mat);
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
