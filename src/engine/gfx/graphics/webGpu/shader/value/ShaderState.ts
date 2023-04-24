import { BlendMode } from '../../../../../materials/BlendMode';
import { GPUCompareFunction, GPUCullMode, GPUPrimitiveTopology } from '../../WebGPUConst';

/**
 * @internal
 * ShaderState
 * @group GFX
 */
export class ShaderState {
    public blendMode?: BlendMode = BlendMode.NONE;
    public depthCompare?: GPUCompareFunction = GPUCompareFunction.less;
    public depthWriteEnabled?: boolean = true;
    public frontFace?: GPUFrontFace = `ccw`;
    public cullMode?: GPUCullMode = GPUCullMode.back;
    public topology?: GPUPrimitiveTopology = GPUPrimitiveTopology.triangle_list;
    public depthBias?: number = 10;

    public useLight: boolean = false;
    public useProbe: boolean = false;
    public acceptGI: boolean = false;
    public acceptShadow: boolean = false;
    public castShadow: boolean = false;
    public castReflection: boolean = false;
    public receiveEnv: boolean = false;
    public renderLayer: number = 1000;
    public renderOrder: number = 0;
    public unclippedDepth: boolean = false;

    public multisample: number = 0;

    public label: string;
    public useZ: boolean = true;

    public splitTexture: boolean = false;

    public setFromMapValues(values: Map<string, any>) {
        if (values.has('blendMode')) {
            this.blendMode = this.convertBlendMode(values.get('blendMode'));
        }
        if (values.has('depthCompare')) {
            this.depthCompare = values.get('depthCompare');
        }
        if (values.has('depthWriteEnabled')) {
            this.depthWriteEnabled = values.get('depthWriteEnabled');
        }
        if (values.has('frontFace')) {
            this.frontFace = values.get('frontFace');
        }
        if (values.has('cullMode')) {
            this.cullMode = values.get('cullMode');
        }
        if (values.has('topology')) {
            this.topology = values.get('topology');
        }
        if (values.has('depthBias')) {
            this.depthBias = values.get('depthBias');
        }

        if (values.has('useLight')) {
            this.useLight = values.get('useLight');
        }
        if (values.has('useProbe')) {
            this.useProbe = values.get('useProbe');
        }
        if (values.has('acceptGI')) {
            this.acceptGI = values.get('acceptGI');
        }
        if (values.has('acceptShadow')) {
            this.acceptShadow = values.get('acceptShadow');
        }
        if (values.has('castShadow')) {
            this.castShadow = values.get('castShadow');
        }
        if (values.has('receiveEnv')) {
            this.receiveEnv = values.get('receiveEnv');
        }
        if (values.has('renderLayer')) {
            this.renderLayer = values.get('renderLayer');
        }
        if (values.has('renderOrder')) {
            this.renderOrder = values.get('renderOrder');
        }
        if (values.has('unclippedDepth')) {
            this.unclippedDepth = values.get('unclippedDepth');
        }

        if (values.has('multisample')) {
            this.multisample = values.get('multisample');
        }

        if (values.has('label')) {
            this.label = values.get('label');
        }
        if (values.has('useZ')) {
            this.useZ = values.get('useZ');
        }
    }

    protected convertBlendMode(value: string): BlendMode {
        switch (value) {
            case 'ABOVE': return BlendMode.ABOVE;
            case 'ALPHA': return BlendMode.ALPHA;
            case 'NORMAL': return BlendMode.NORMAL;
            case 'ADD': return BlendMode.ADD;
            case 'BELOW': return BlendMode.BELOW;
            case 'ERASE': return BlendMode.ERASE;
            case 'MUL': return BlendMode.MUL;
            case 'SCREEN': return BlendMode.SCREEN;
            case 'DIVD': return BlendMode.DIVD;
            case 'SOFT_ADD': return BlendMode.SOFT_ADD;
        }
        return BlendMode.NONE;
    }
}
