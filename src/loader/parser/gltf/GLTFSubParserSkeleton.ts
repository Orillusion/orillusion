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

    public parse(skeletonID): Skeleton {
        let skeleton: Skeleton = new Skeleton();
        this.buildSkeleton(skeleton, undefined, skeletonID);
        return skeleton;
    }

    public parseSkeletonAnimation(skeleton: Skeleton, animation) {
        let count = 0;
        let numFrame: number = this.subParser.parseAccessor(animation.samplers[0].input).data.length;
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
            switch (property) {
                case 'scale':
                    for (var nFrame: number = 0; nFrame < numFrame; nFrame++) {
                        var srcOffset = nFrame * outputAccessor.numComponents;
                        var dstOffset = skeletonPoseLength * nFrame + 12 * joint.index;
                        bufferData[dstOffset + 0] = outputAccessor.data[srcOffset + 0]; // x
                        bufferData[dstOffset + 1] = outputAccessor.data[srcOffset + 1]; // y
                        bufferData[dstOffset + 2] = outputAccessor.data[srcOffset + 2]; // z
                        bufferData[dstOffset + 3] = 1;
                    }
                    break;
                case 'rotation':
                    for (var nFrame: number = 0; nFrame < numFrame; nFrame++) {
                        var srcOffset = nFrame * outputAccessor.numComponents;
                        var dstOffset = skeletonPoseLength * nFrame + 12 * joint.index + 4;
                        bufferData[dstOffset + 0] = outputAccessor.data[srcOffset + 0]; // x
                        bufferData[dstOffset + 1] = outputAccessor.data[srcOffset + 1]; // y
                        bufferData[dstOffset + 2] = outputAccessor.data[srcOffset + 2]; // z
                        bufferData[dstOffset + 3] = outputAccessor.data[srcOffset + 3]; // w
                    }
                    break;
                case 'translation':
                    for (var nFrame: number = 0; nFrame < numFrame; nFrame++) {
                        var srcOffset = nFrame * outputAccessor.numComponents;
                        var dstOffset = skeletonPoseLength * nFrame + 12 * joint.index + 8;
                        bufferData[dstOffset + 0] = outputAccessor.data[srcOffset + 0]; // x
                        bufferData[dstOffset + 1] = outputAccessor.data[srcOffset + 1]; // y
                        bufferData[dstOffset + 2] = outputAccessor.data[srcOffset + 2]; // z
                        bufferData[dstOffset + 3] = inputAccessor.data[nFrame * inputAccessor.numComponents];
                    }
                    break;
            }
        }

        let animationClip = new SkeletonAnimationClip(animation.name, skeleton, numFrame, bufferData);
        return animationClip;
    }

    private buildSkeleton(skeleton: Skeleton, parent: Joint, nodeId: number, depth: number = 0) {
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
                this.buildSkeleton(skeleton, joint, children, depth + 1);
            }
        }
    }
}
