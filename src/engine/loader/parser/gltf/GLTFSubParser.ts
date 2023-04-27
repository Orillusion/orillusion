import { Skeleton } from '../../../components/anim/skeletonAnim/Skeleton';
import { SkeletonAnimationComponent } from '../../../components/SkeletonAnimationComponent';
import { SkeletonAnimationClip } from '../../../components/anim/skeletonAnim/SkeletonAnimationClip';
import { DirectLight } from '../../../components/lights/DirectLight';
import { PointLight } from '../../../components/lights/PointLight';
import { SpotLight } from '../../../components/lights/SpotLight';
import { MeshRenderer } from '../../../components/renderer/MeshRenderer';
import { SkinnedMeshRenderer } from '../../../components/renderer/SkinnedMeshRenderer';
import { Object3D } from '../../../core/entities/Object3D';
import { GeometryBase } from '../../../core/geometry/GeometryBase';
import { VertexAttributeName } from '../../../core/geometry/VertexAttributeName';
import { Engine3D } from '../../../Engine3D';
import { BlendMode } from '../../../materials/BlendMode';
import { MaterialBase } from '../../../materials/MaterialBase';
import { PhysicMaterial } from '../../../materials/PhysicMaterial';
import { Color } from '../../../math/Color';
import { RADIANS_TO_DEGREES } from '../../../math/MathUtil';
import { Quaternion } from '../../../math/Quaternion';
import { defaultRes } from '../../../textures/DefaultRes';
import { UUID } from '../../../util/Global';
import { StringUtil } from '../../../util/StringUtil';
import { KHR_materials_clearcoat } from './extends/KHR_materials_clearcoat';
import { KHR_materials_unlit } from './extends/KHR_materials_unlit';
import { GLTF_Info, GLTF_Node } from './GLTFInfo';
import { GLTFParser } from './GLTFParser';
import { getTypedArrayTypeFromGLType } from './TypeArray';
import { KHR_draco_mesh_compression } from './extends/KHR_draco_mesh_compression';
import { KHR_materials_emissive_strength } from './extends/KHR_materials_emissive_strength';
import { BitmapTexture2D } from '../../../textures/BitmapTexture2D';
import { LitMaterial } from '../../../materials/LitMaterial';
import { GLTFSubParserCamera } from './GLTFSubParserCamera';
import { GLTFSubParserMesh } from './GLTFSubParserMesh';
import { GLTFSubParserMaterial } from './GLTFSubParserMaterial';
import { GLTFSubParserSkin } from './GLTFSubParserSkin';
import { GLTFSubParserSkeleton } from './GLTFSubParserSkeleton';
import { GLTFSubParserConverter } from './GLTFSubParserConverter';

/**
 * @internal
 */
export class GLTFSubParser {
    public currentSceneName: any;
    public gltf: GLTF_Info;
    public initUrl: string;
    private _generator: string;
    private _version: string;
    private _BASE64_MARKER = ';base64,';
    private _cameraParser: GLTFSubParserCamera = null;
    private _meshParser: GLTFSubParserMesh = null;
    private _materialParser: GLTFSubParserMaterial = null;
    private _skinParser: GLTFSubParserSkin = null;
    private _skeletonParser: GLTFSubParserSkeleton = null;
    private _converter: GLTFSubParserConverter = null;

    constructor() {
    }

    public get version() {
        if (this.version)
            return this.version;
        else if (this.gltf) {
            if (!this.gltf.asset)
                return this.errorMiss('asset');

            this._version = this.gltf.asset.version;

            if (this.gltf.asset.minVersion)
                this._version += `\r minVersion${this.gltf.asset.minVersion}`;

            return this.version;
        }

        console.warn('glTF not loaded.');
        return null;
    }

    public async parse(initUrl: string, gltf: GLTF_Info, sceneId: number) {
        this.gltf = gltf;
        this.initUrl = initUrl;
        const { version, generator } = this.gltf.asset;
        this._generator = generator;
        if (version !== '2.0') {
            console.error(`GLTFParser only support glTF 2.0 for now! Received glTF version: ${this.version}`);
            return false;
        }

        const result = {
            nodes: await this.parseScene(sceneId),
            animations: this.parseAnimations(),
            name: this.currentSceneName,
        };

        return await this.convertToNode(result);
    }

    public destroy() {
        KHR_draco_mesh_compression.unload(this.gltf)
        this.gltf = null
    }

    private async parseScene(sceneId: number) {
        const loadScene = sceneId || this.gltf.scene || 0;
        const scene = this.gltf.scenes[loadScene];

        if (typeof scene === 'undefined')
            return this.errorMiss('scene', loadScene);

        this.currentSceneName = scene.name || 'GLTF_NO_NAME_SCENE';

        const result = [];
        const nodes = scene.nodes;
        for (let i = 0; i < nodes.length; i++) {
            const node = await this.parseNode(nodes[i]);
            if (node) result.push(node);
        }

        return result;
    }

    private async parseNode(nodeId: number) {
        const node = this.gltf.nodes[nodeId];
        if (!node)
            return this.errorMiss('node', nodeId);

        if (node.isParsed)
            return node.dnode;

        const { name, matrix, translation, rotation, scale } = node;

        const dnode = {
            name,
            matrix,
            translation,
            rotation,
            scale,
            nodeId,
            camera: null,
            primitives: null,
            skin: null,
            children: null,
            light: null,
        };

        if (node.camera !== undefined)
            dnode.camera = this.parseCamera(node.camera);

        if (node.mesh !== undefined)
            dnode.primitives = await this.parseMesh(node.mesh);

        if (node.extensions !== undefined)
            this.applyNodeExtensions(node, dnode);

        if (node.skin !== undefined) {
            const skin = this.parseSkin(node.skin);
            if (skin) dnode.skin = skin;
        }

        dnode.children = [];
        if (node.children) for (let i = 0; i < node.children.length; i++) {
            dnode.children.push(await this.parseNode(node.children[i]));
        }

        node.dnode = dnode;
        node.isParsed = true;

        return node.dnode;
    }

    private errorMiss(e, info?) {
        throw new Error(e + info);
    }

    private parseCamera(cameraId: number) {
        if (!this._cameraParser) {
            this._cameraParser = new GLTFSubParserCamera(this.gltf);
        }
        return this._cameraParser.parse(cameraId);
    }

    private async parseMesh(meshId: number) {
        if (!this._meshParser) {
            this._meshParser = new GLTFSubParserMesh(this);
        }
        return this._meshParser.parse(meshId);
    }

    public async parseTexture(index: number) {
        let textureInfo = this.gltf.textures[index];
        if (textureInfo && !textureInfo.dTexture) {
            if (textureInfo && textureInfo.source != null) {
                let image = this.gltf.images[textureInfo.source];
                if (image.uri) {
                    let name = image.uri;
                    name = StringUtil.getURLName(name);
                    textureInfo.dTexture = this.gltf.resources[name];
                } else if (image.bufferView) {
                    let buffer = this.parseBufferView(image.bufferView);
                    let bitmapTexture = new BitmapTexture2D();
                    let img = new Blob([buffer], { type: image.mimeType });
                    await bitmapTexture.loadFromBlob(img);
                    textureInfo.dTexture = bitmapTexture;
                } else {
                    textureInfo.dTexture = this.gltf.resources[image.name];
                }
            } else if (textureInfo.name) {
                let name = StringUtil.getURLName(textureInfo.name);
                textureInfo.dTexture = this.gltf.resources[name];
            }
        }
        if (!textureInfo.dTexture) {
            console.log("miss texture , please check texture!", index, textureInfo);
        }
        return textureInfo.dTexture;
    }

    public async parseMaterial(materialId) {
        if (!this._materialParser) {
            this._materialParser = new GLTFSubParserMaterial(this);
        }
        return this._materialParser.parse(materialId);
    }

    private parseAnimations() {
        const result = [];
        return result;
    }

    private async parseObject3D(nodeInfo: GLTF_Node, parentNode) {
        if (!this._converter) {
            this._converter = new GLTFSubParserConverter(this);
        }
        return this._converter.convertNodeToObject3D(nodeInfo, parentNode);
    }

    public parseSkeleton(skeletonID: number) {
        if (!this._skeletonParser) {
            this._skeletonParser = new GLTFSubParserSkeleton(this);
        }
        return this._skeletonParser.parse(skeletonID);
    }

    public parseSkeletonAnimation(skeleton: Skeleton, animation) {
        if (!this._skeletonParser) {
            this._skeletonParser = new GLTFSubParserSkeleton(this);
        }
        return this._skeletonParser.parseSkeletonAnimation(skeleton, animation);
    }

    private async traverse(parentNode, nodeInfos) {
        for (let i = 0; i < nodeInfos.length; i++) {
            const node = await this.parseObject3D(nodeInfos[i], parentNode);
            await this.traverse(node, nodeInfos[i].children);
        }
    }

    private async convertToNode(infos) {
        const rootNode = new Object3D();
        rootNode.name = infos.name;
        const nodes = infos.nodes;
        const animations = infos.animations;
        const textures = [];
        const skins = [];
        const cameras = [];
        await this.traverse(rootNode, nodes);

        let animas;
        return {
            rootNode,
            textures,
            animations: animas,
            cameras,
        };
    }

    private parseSkin(skinId: number) {
        if (!this._skinParser) {
            this._skinParser = new GLTFSubParserSkin(this);
        }
        return this._skinParser.parse(skinId);
    }

    public parseAccessor(accessorId: number) {
        const accessor = this.gltf.accessors[accessorId];
        if (!accessor) return this.errorMiss('accessor', accessorId);

        if (accessor.isParsed) return accessor.daccessor;

        accessor.isParsed = true;
        accessor.daccessor = false;

        const normalize = !!accessor.normalized;
        // accessor.bufferView = accessor.bufferView ? accessor.bufferView : accessorId;
        const bufferView = this.gltf.bufferViews[accessor.bufferView];
        const byteStride = bufferView && bufferView.byteStride;
        const arrayType = getTypedArrayTypeFromGLType(accessor.componentType);
        let numComponents = 1;
        switch (accessor.type) {
            case 'SCALAR':
                numComponents = 1;
                break;
            case 'VEC2':
                numComponents = 2;
                break;
            case 'VEC3':
                numComponents = 3;
                break;
            case 'VEC4':
            case 'MAT2':
                numComponents = 4;
                break;
            case 'MAT3':
                numComponents = 9;
                break;
            case 'MAT4':
                numComponents = 16;
                break;
            default:
                numComponents = 0;
                break;
        }
        if (numComponents === 0) {
            console.error(`glTF has unknown data type in accessor: ${accessor.type}`);
            return false;
        }
        const componentsBytes = numComponents * arrayType.BYTES_PER_ELEMENT;

        let buffer;
        if (bufferView !== undefined) {
            buffer = this.parseBufferView(accessor.bufferView);
            if (!buffer) return accessor.daccessor;
        } else buffer = new Uint8Array(componentsBytes * accessor.count).buffer;

        let typedArray = this.getTypedArrayFromArrayBuffer(buffer, byteStride, accessor.byteOffset || 0, arrayType, numComponents, accessor.count);

        if (accessor.sparse) {
            const { count, indices, values } = accessor.sparse;
            typedArray = new arrayType(typedArray); // eslint-disable-line

            const indicesByteOffset = indices.byteOffset || 0;
            const indicesBufferView = this.gltf.bufferViews[indices.bufferView];
            const indicesArrayType = getTypedArrayTypeFromGLType(indices.componentType);
            const indicesBuffer = this.parseBufferView(indices.bufferView);
            const indicesArray = this.getTypedArrayFromArrayBuffer(indicesBuffer, indicesBufferView.byteStride, indicesByteOffset, indicesArrayType, 1, count);

            const valuesByteOffset = values.byteOffset || 0;
            const valuesBufferView = this.gltf.bufferViews[values.bufferView];
            const valuesBuffer = this.parseBufferView(values.bufferView);
            const valuesArray = this.getTypedArrayFromArrayBuffer(valuesBuffer, valuesBufferView.byteStride, valuesByteOffset, arrayType, numComponents, count);

            for (let i = 0; i < indicesArray.length; i++) typedArray.set(valuesArray.slice(i * numComponents, i * numComponents + numComponents), indicesArray[i] * numComponents);
        }

        accessor.computeResult = {
            typedArray,
            arrayType,
            numComponents,
        };
        accessor.daccessor = {
            data: typedArray,
            numComponents,
            normalize,
        };

        return accessor.daccessor;
    }

    private getTypedArrayFromArrayBuffer(buffer, byteStride, byteOffset, arrayType, numComponents, count) {
        let typedArray;
        const componentsBytes = numComponents * arrayType.BYTES_PER_ELEMENT;
        if (byteStride && componentsBytes !== byteStride) {
            const arrayLength = numComponents * count;
            typedArray = new arrayType(arrayLength); // eslint-disable-line
            for (let i = 0; i < count; i++) {
                const componentVals = new arrayType(buffer, byteOffset + i * byteStride, numComponents); // eslint-disable-line
                for (let j = 0; j < numComponents; j++) typedArray[i * numComponents + j] = componentVals[j];
            }
        } else typedArray = new arrayType(buffer, byteOffset, count * numComponents); // eslint-disable-line

        return typedArray;
    }

    public parseBufferView(bufferViewId: number) {
        const bufferView = this.gltf.bufferViews[bufferViewId];
        if (!bufferView) return this.errorMiss('bufferView', bufferViewId);

        if (bufferView.isParsed) return bufferView.dbufferView;

        bufferView.isParsed = true;
        bufferView.dbufferView = false;

        const buffer = this.parseBuffer(bufferView.buffer);
        if (buffer) {
            const { byteOffset, byteLength } = bufferView;
            const bufferArray = new Uint8Array(buffer, byteOffset || 0, byteLength);
            bufferView.dbufferView = new Uint8Array(bufferArray).buffer;
        }

        return bufferView.dbufferView;
    }

    private parseBuffer(bufferId: number) {
        const buffer = this.gltf.buffers[bufferId];
        if (!buffer) return this.errorMiss('buffer', bufferId);

        if (buffer.isParsed) return buffer.dbuffer;

        buffer.isParsed = true;
        buffer.dbuffer = false;

        if (buffer.uri.substring(0, 5) !== 'data:') {
            const uri = buffer.uri;
            const arrayBuffer = this.gltf.resources[uri];
            if (arrayBuffer)
                if (arrayBuffer.byteLength === buffer.byteLength) {
                    buffer.dbuffer = this.gltf.resources[uri];
                } else console.error(`load gltf resource "${uri}" at buffers[${bufferId} failed, ArrayBuffer.byteLength not equals buffer's byteLength]`);
            else console.error(`load gltf resource "${uri}" at buffers[${bufferId}] failed`);
        } else {
            const base64Idx = buffer.uri.indexOf(this._BASE64_MARKER) + this._BASE64_MARKER.length;
            const blob = window.atob(buffer.uri.substring(base64Idx));
            const bytes = new Uint8Array(blob.length);
            for (let i = 0; i < blob.length; i++) bytes[i] = blob.charCodeAt(i);
            buffer.dbuffer = bytes.buffer;
        }

        return buffer.dbuffer;
    }

    private getLight(lightID: number) {
        let info = this.gltf.extensions.KHR_lights_punctual.lights[lightID];
        return info;
    }

    private applyNodeExtensions(node: any, dNode: any) {
        let extensions = node.extensions;
        if (extensions[`KHR_lights_punctual`] && this.gltf.extensions.KHR_lights_punctual) {
            dNode.light = this.getLight(extensions[`KHR_lights_punctual`].light);
        }
    }
}
