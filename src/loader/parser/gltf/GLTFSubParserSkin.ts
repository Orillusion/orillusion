import { GLTF_Info } from "./GLTFInfo";
import { GLTFParser } from "./GLTFParser";
import { GLTFSubParser } from "./GLTFSubParser";
import { GLTFType } from "./GLTFType";

export class GLTFSubParserSkin {
    protected gltf: GLTF_Info;
    protected subParser: GLTFSubParser;

    constructor(subParser: GLTFSubParser) {
        this.gltf = subParser.gltf;
        this.subParser = subParser;
    }

    public parse(skinId) {
        const skin = this.gltf.skins[skinId];

        if (!skin)
            return this.errorMiss('skin', skinId);

        if (skin.isParsed)
            return skin.dskin;

        const { name, joints, inverseBindMatrices, skeleton } = skin;

        if (!joints)
            return this.errorMiss('skin.joints', skinId);

        skin.isParsed = true;
        skin.dskin = false;
        let dskin = {
            name,
            skeleton: null,
            inverseBindMatrices: null,
            joints,
            defines: [GLTFParser.getJointsNumDefine(joints.length)],
        };

        if (skeleton) {
            dskin.skeleton = skeleton;
        } else {
            var rootNodeId = -1;
            for (let i = 0; i < this.gltf.nodes.length; i++) {
                const n = this.gltf.nodes[i];
                if (n.name == 'root') {
                    rootNodeId = i;
                    break;
                }
            }
            if (rootNodeId == -1) {
                let scene = this.gltf.scenes[this.gltf.scene];
                rootNodeId = scene.nodes[scene.nodes.length - 1];
            }
            dskin.skeleton = rootNodeId;
        }
        // dskin.skeleton = skeleton === undefined ? GLTFParser.SCENE_ROOT_SKELETON : skeleton;
        dskin.inverseBindMatrices = GLTFType.IDENTITY_INVERSE_BIND_MATRICES;

        if (inverseBindMatrices !== undefined) {
            const accessor = this.parseAccessor(inverseBindMatrices);
            if (accessor) {
                const array = accessor.data;
                const matrices = [];
                for (let i = 0; i < array.length; i += 16) matrices.push(array.slice(i, i + 16));

                dskin.inverseBindMatrices = matrices;
            } else dskin = null;
        }

        skin.dskin = dskin;
        return skin.dskin;
    }

    private parseAccessor(accessorId) {
        return this.subParser.parseAccessor(accessorId);
    }

    private errorMiss(e, info?) {
        throw new Error(e + info);
    }
}
