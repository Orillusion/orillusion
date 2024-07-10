import { AnimationCurveT, KeyframeT, Matrix4, Object3D, PrefabAvatarData, PrefabBoneData, PropertyAnimationClip, Quaternion, ValueEnumType, Vector3 } from "../../..";
import { Joint } from "../../../components/anim/skeletonAnim/Joint";
import { Skeleton } from "../../../components/anim/skeletonAnim/Skeleton";
import { SkeletonAnimationClip } from "../../../components/anim/skeletonAnim/SkeletonAnimationClip";
import { GLTF_Info } from "./GLTFInfo";
import { GLTFSubParser } from "./GLTFSubParser";

export class GLTFSubParserSkeleton {
    protected gltf: GLTF_Info;
    protected subParser: GLTFSubParser;

    constructor(subParser: GLTFSubParser) {
        this.gltf = subParser.gltf;
        this.subParser = subParser;
    }

    public parse(skeletonID: number): PrefabAvatarData {
        let avatarData: PrefabAvatarData = new PrefabAvatarData();
        avatarData.name = 'Id:' + skeletonID;
        avatarData.count = 0;
        avatarData.boneData = [];
        avatarData.boneMap = new Map<string, PrefabBoneData>();
        this.buildSkeleton(avatarData, undefined, skeletonID);
        return avatarData;
    }

    public parseSkeletonAnimation(avatarData: PrefabAvatarData, animation): PropertyAnimationClip {
        let result: PropertyAnimationClip = new PropertyAnimationClip();
        result.clipName = animation.name;
        result.useSkeletonPos = false;
        result.useSkeletonScale = false;

        for (let channel of animation.channels) {
            let sampler = animation.samplers[channel.sampler];
            const inputAccessor = this.subParser.parseAccessor(sampler.input);
            const outputAccessor = this.subParser.parseAccessor(sampler.output);
            let nodeId = channel.target.node;
            let property = channel.target.path;
            let node = this.gltf.nodes[nodeId];
            if (!node) {
                continue;
            }
            if (!avatarData.boneMap.has(node.name)) {
                continue;
            }
            let bone = avatarData.boneMap.get(node.name);

            switch (property) {
                case 'scale':
                    {
                        let animationCurveT = new AnimationCurveT(outputAccessor.numComponents);
                        animationCurveT.path = "";
                        animationCurveT.attribute = "";
                        animationCurveT.propertys = animationCurveT.attribute.split(".");
                        animationCurveT.preInfinity = 0;
                        animationCurveT.postInfinity = 0;
                        animationCurveT.rotationOrder = 0;
                        result.useSkeletonScale = true;
                        result.scaleCurves.set(bone.bonePath, animationCurveT);

                        for (let i = 0; i < inputAccessor.data.length; i++) {
                            const t = inputAccessor.data[i];
                            const offset = i * outputAccessor.numComponents;

                            let keyframe = new KeyframeT(0);
                            keyframe.time = t;

                            const v = new Vector3().set(
                                outputAccessor.data[offset + 0], 
                                outputAccessor.data[offset + 1], 
                                outputAccessor.data[offset + 2]
                            );

                            keyframe.split(ValueEnumType.vector3, v, "value");

                            // keyframe.split(ValueEnumType.single, 0, "inSlope");
                            // keyframe.split(ValueEnumType.single, 0, "outSlope");
                            // keyframe.tangentMode = 0;
                            // keyframe.weightedMode = 0;
                            // keyframe.split(ValueEnumType.single, 1, "inWeight");
                            // keyframe.split(ValueEnumType.single, 1, "outWeight");

                            animationCurveT.addKeyFrame(keyframe);
                        }
                    }
                    break;
                case 'rotation':
                    {
                        let animationCurveT = new AnimationCurveT(outputAccessor.numComponents);
                        animationCurveT.path = "";
                        animationCurveT.attribute = "";
                        animationCurveT.propertys = animationCurveT.attribute.split(".");
                        animationCurveT.preInfinity = 0;
                        animationCurveT.postInfinity = 0;
                        animationCurveT.rotationOrder = 0;
                        result.rotationCurves.set(bone.bonePath, animationCurveT);

                        for (let i = 0; i < inputAccessor.data.length; i++) {
                            const t = inputAccessor.data[i];
                            const offset = i * outputAccessor.numComponents;

                            let keyframe = new KeyframeT(0);
                            keyframe.time = t;

                            const v = new Quaternion().set(
                                outputAccessor.data[offset + 0], 
                                outputAccessor.data[offset + 1], 
                                outputAccessor.data[offset + 2],
                                outputAccessor.data[offset + 3],
                            );

                            keyframe.split(ValueEnumType.quaternion, v, "value");

                            // keyframe.split(ValueEnumType.single, 0, "inSlope");
                            // keyframe.split(ValueEnumType.single, 0, "outSlope");
                            // keyframe.tangentMode = 0;
                            // keyframe.weightedMode = 0;
                            // keyframe.split(ValueEnumType.single, 1, "inWeight");
                            // keyframe.split(ValueEnumType.single, 1, "outWeight");

                            animationCurveT.addKeyFrame(keyframe);
                        }
                    }
                    break;
                case 'translation':
                    {
                        let animationCurveT = new AnimationCurveT(outputAccessor.numComponents);
                        animationCurveT.path = "";
                        animationCurveT.attribute = "";
                        animationCurveT.propertys = animationCurveT.attribute.split(".");
                        animationCurveT.preInfinity = 0;
                        animationCurveT.postInfinity = 0;
                        animationCurveT.rotationOrder = 0;
                        result.useSkeletonPos = true;
                        result.positionCurves.set(bone.bonePath, animationCurveT);

                        for (let i = 0; i < inputAccessor.data.length; i++) {
                            const t = inputAccessor.data[i];
                            const offset = i * outputAccessor.numComponents;

                            let keyframe = new KeyframeT(0);
                            keyframe.time = t;

                            const v = new Vector3().set(
                                outputAccessor.data[offset + 0], 
                                outputAccessor.data[offset + 1], 
                                outputAccessor.data[offset + 2]
                            );

                            keyframe.split(ValueEnumType.vector3, v, "value");

                            // keyframe.split(ValueEnumType.single, 0, "inSlope");
                            // keyframe.split(ValueEnumType.single, 0, "outSlope");
                            // keyframe.tangentMode = 0;
                            // keyframe.weightedMode = 0;
                            // keyframe.split(ValueEnumType.single, 1, "inWeight");
                            // keyframe.split(ValueEnumType.single, 1, "outWeight");

                            animationCurveT.addKeyFrame(keyframe);
                        }
                    }
                    break;
            }
        }
        return result;
    }

    public parseSkeletonAnimationOld(skeleton: Skeleton, animation) {
        let count = 0;
        let inputAccessor = this.subParser.parseAccessor(animation.samplers[0].input);
        let numFrame: number = inputAccessor.data.length;
        let frameRate: number = inputAccessor.data[1] - inputAccessor.data[0];
        let totalTime: number = inputAccessor.data[inputAccessor.data.length - 1];
        let skeletonPoseLength: number = 12 * skeleton.numJoint;
        let bufferData = new Float32Array(skeletonPoseLength * numFrame);
        for (var index = 0; index < skeleton.numJoint; index++) {
            for (var nFrame: number = 0; nFrame < numFrame; nFrame++) {
                var dstOffset = skeletonPoseLength * nFrame + 12 * index;
                bufferData[dstOffset + 0] = 1;
                bufferData[dstOffset + 1] = 1;
                bufferData[dstOffset + 2] = 1;
                bufferData[dstOffset + 3] = 1;
            }
        }

        for (let channel of animation.channels) {
            let sampler = animation.samplers[channel.sampler];
            const inputAccessor = this.subParser.parseAccessor(sampler.input);
            const outputAccessor = this.subParser.parseAccessor(sampler.output);
            let nodeId = channel.target.node;
            let property = channel.target.path;
            let node = this.gltf.nodes[nodeId];
            if (!node) {
                continue;
            }
            count++;
            let joint = skeleton.getJointByName(node.name);
            if (!joint) {
                switch (property) {
                    case 'scale':
                        break;
                    case 'rotation':
                        break;
                    case 'translation':
                        break;
                }
            } else {
                switch (property) {
                    case 'scale':
                        if (numFrame * outputAccessor.numComponents == outputAccessor.data.length) {
                            for (var nFrame: number = 0; nFrame < numFrame; nFrame++) {
                                var srcOffset = nFrame * outputAccessor.numComponents;
                                var dstOffset = skeletonPoseLength * nFrame + 12 * joint.index;
                                bufferData[dstOffset + 0] = outputAccessor.data[srcOffset + 0]; // x
                                bufferData[dstOffset + 1] = outputAccessor.data[srcOffset + 1]; // y
                                bufferData[dstOffset + 2] = outputAccessor.data[srcOffset + 2]; // z
                                bufferData[dstOffset + 3] = 1;
                            }
                        } else if (inputAccessor.data.length == 2) {
                            let time = 0;
                            let t0 = inputAccessor.data[0];
                            let t1 = inputAccessor.data[1];

                            var srcOffsetA = 0 * outputAccessor.numComponents;
                            Vector3.HELP_0.set(
                                outputAccessor.data[srcOffsetA + 0],
                                outputAccessor.data[srcOffsetA + 1],
                                outputAccessor.data[srcOffsetA + 2]
                            );

                            var srcOffsetB = 1 * outputAccessor.numComponents;
                            Vector3.HELP_1.set(
                                outputAccessor.data[srcOffsetB + 0],
                                outputAccessor.data[srcOffsetB + 1],
                                outputAccessor.data[srcOffsetB + 2]
                            );
                            for (var nFrame: number = 0; nFrame < numFrame; nFrame++) {
                                let t = time / t1;
                                Vector3.HELP_2.lerp(Vector3.HELP_0, Vector3.HELP_1, t);
                                
                                var dstOffset = skeletonPoseLength * nFrame + 12 * joint.index;
                                bufferData[dstOffset + 0] = Vector3.HELP_2.x;
                                bufferData[dstOffset + 1] = Vector3.HELP_2.y;
                                bufferData[dstOffset + 2] = Vector3.HELP_2.z;
                                bufferData[dstOffset + 3] = 1;

                                time += frameRate;
                            }
                        } else throw new Error("Unsupported animation sampler interpolation.");
                        break;
                    case 'rotation':
                        if (numFrame * outputAccessor.numComponents == outputAccessor.data.length) {
                            for (var nFrame: number = 0; nFrame < numFrame; nFrame++) {
                                var srcOffset = nFrame * outputAccessor.numComponents;
                                var dstOffset = skeletonPoseLength * nFrame + 12 * joint.index + 4;
                                bufferData[dstOffset + 0] = outputAccessor.data[srcOffset + 0]; // x
                                bufferData[dstOffset + 1] = outputAccessor.data[srcOffset + 1]; // y
                                bufferData[dstOffset + 2] = outputAccessor.data[srcOffset + 2]; // z
                                bufferData[dstOffset + 3] = outputAccessor.data[srcOffset + 3]; // w
                            }
                        } else if (inputAccessor.data.length == 2) {
                            let time = 0;
                            let t0 = inputAccessor.data[0];
                            let t1 = inputAccessor.data[1];

                            var srcOffsetA = 0 * outputAccessor.numComponents;
                            Vector3.HELP_0.set(
                                outputAccessor.data[srcOffsetA + 0],
                                outputAccessor.data[srcOffsetA + 1],
                                outputAccessor.data[srcOffsetA + 2],
                                outputAccessor.data[srcOffsetA + 3],
                            );

                            var srcOffsetB = 1 * outputAccessor.numComponents;
                            Vector3.HELP_1.set(
                                outputAccessor.data[srcOffsetB + 0],
                                outputAccessor.data[srcOffsetB + 1],
                                outputAccessor.data[srcOffsetB + 2],
                                outputAccessor.data[srcOffsetB + 3],
                            );
                            for (var nFrame: number = 0; nFrame < numFrame; nFrame++) {
                                let t = time / t1;
                                Vector3.HELP_2.lerp(Vector3.HELP_0, Vector3.HELP_1, t);
                                
                                var dstOffset = skeletonPoseLength * nFrame + 12 * joint.index + 4;
                                bufferData[dstOffset + 0] = Vector3.HELP_2.x;
                                bufferData[dstOffset + 1] = Vector3.HELP_2.y;
                                bufferData[dstOffset + 2] = Vector3.HELP_2.z;
                                bufferData[dstOffset + 3] = Vector3.HELP_2.w;

                                time += frameRate;
                            }
                        } else throw new Error("Unsupported animation sampler interpolation.");
                        break;
                    case 'translation':
                        if (numFrame * outputAccessor.numComponents == outputAccessor.data.length) {
                            for (var nFrame: number = 0; nFrame < numFrame; nFrame++) {
                                var srcOffset = nFrame * outputAccessor.numComponents;
                                var dstOffset = skeletonPoseLength * nFrame + 12 * joint.index + 8;
                                bufferData[dstOffset + 0] = outputAccessor.data[srcOffset + 0]; // x
                                bufferData[dstOffset + 1] = outputAccessor.data[srcOffset + 1]; // y
                                bufferData[dstOffset + 2] = outputAccessor.data[srcOffset + 2]; // z
                                bufferData[dstOffset + 3] = inputAccessor.data[nFrame * inputAccessor.numComponents];
                            }
                        } else if (inputAccessor.data.length == 2) {
                            let time = 0;
                            let t0 = inputAccessor.data[0];
                            let t1 = inputAccessor.data[1];

                            var srcOffsetA = 0 * outputAccessor.numComponents;
                            Vector3.HELP_0.set(
                                outputAccessor.data[srcOffsetA + 0],
                                outputAccessor.data[srcOffsetA + 1],
                                outputAccessor.data[srcOffsetA + 2]
                            );

                            var srcOffsetB = 1 * outputAccessor.numComponents;
                            Vector3.HELP_1.set(
                                outputAccessor.data[srcOffsetB + 0],
                                outputAccessor.data[srcOffsetB + 1],
                                outputAccessor.data[srcOffsetB + 2]
                            );
                            for (var nFrame: number = 0; nFrame < numFrame; nFrame++) {
                                let t = time / t1;
                                Vector3.HELP_2.lerp(Vector3.HELP_0, Vector3.HELP_1, t);
                                
                                var dstOffset = skeletonPoseLength * nFrame + 12 * joint.index + 8;
                                bufferData[dstOffset + 0] = Vector3.HELP_2.x;
                                bufferData[dstOffset + 1] = Vector3.HELP_2.y;
                                bufferData[dstOffset + 2] = Vector3.HELP_2.z;
                                bufferData[dstOffset + 3] = time;

                                time += frameRate;
                            }
                        } else throw new Error("Unsupported animation sampler interpolation.");
                        break;
                }
            }
        }

        let animationClip = new SkeletonAnimationClip(animation.name, skeleton, numFrame, bufferData);
        return animationClip;
    }

    private buildSkeleton(avatarData: PrefabAvatarData, parent: PrefabBoneData, nodeId: number) {
        let node = this.gltf.nodes[nodeId];
        if (!node.name) {
            node.name = 'Bone' + avatarData.count;
        }

        let boneData = new PrefabBoneData();
        boneData.boneName = node.name;
        boneData.bonePath = parent ? parent.bonePath + '/' + node.name : node.name;
        boneData.parentBoneName = parent ? parent.boneName : "";

        boneData.boneID = avatarData.count++;
        boneData.parentBoneID = parent ? parent.boneID : -1;

        boneData.instanceID = "";
        boneData.parentInstanceID = "";

        boneData.s = new Vector3(1, 1, 1);
        if (node.scale) {
            boneData.s.set(node.scale[0], node.scale[1], node.scale[2]);
        }

        boneData.q = new Quaternion();
        if (node.rotation) {
            boneData.q.set(node.rotation[0], node.rotation[1], node.rotation[2], node.rotation[3]);
        }

        boneData.t = new Vector3();
        if (node.translation) {
            boneData.t.set(node.translation[0], node.translation[1], node.translation[2]);
        }

        avatarData.boneData.push(boneData);
        avatarData.boneMap.set(boneData.boneName, boneData);

        if (node.children) {
            for (let children of node.children) {
                this.buildSkeleton(avatarData, boneData, children);
            }
        }
    }

    private buildSkeletonOld(skeleton: Skeleton, parent: Joint, nodeId: number, depth: number = 0) {
        let node = this.gltf.nodes[nodeId];
        if (!node.name) {
            node.name = 'Node_' + nodeId;
        }

        let joint = new Joint(node.name);
        joint.parent = parent;
        if (node.scale) {
            joint.scale.set(node.scale[0], node.scale[1], node.scale[2]);
        }
        if (node.rotation) {
            joint.rotation.set(node.rotation[0], node.rotation[1], node.rotation[2], node.rotation[3]);
        }
        if (node.translation) {
            joint.translation.set(node.translation[0], node.translation[1], node.translation[2]);
        }
        skeleton.addJoint(joint);

        if (node.children) {
            for (let children of node.children) {
                this.buildSkeletonOld(skeleton, joint, children, depth + 1);
            }
        }
    }
}
