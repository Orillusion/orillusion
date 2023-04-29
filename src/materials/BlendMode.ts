/**
 * Blend mode
 * |name|description|
 * @group Material
 */
export enum BlendMode {
    /**
     * Working only in WebGPU may improve the performance of large background images without alpha.
     * The source pixel is not mixed with the target pixel, so the GPU will not read colors from the target pixel.
     */
    NONE,
    /**
     * Display objects above the background. When the background is transparent, 
     * the pixel values of the displayed object are not visible.
     */
    ABOVE,

    /**
     * Transparent mode
     */
    ALPHA,

    /**
     * Normal blend mode
     */
    NORMAL,

    /**
     * Add the values of the component colors of the displayed object to its background color
     */
    ADD,

    /**
     * Add the values of the component colors of the displayed object to its background color
     */
    BELOW,
    /**
     * Erase the background based on the alpha value of the displayed object.
     */
    ERASE,
    /**
     * Multiply the values of the displayed object's constituent colors by the background color, 
     * and then divide by 0xFF for normalization to obtain a darker color.
     */
    MUL,
    /**
     * Multiply the inverse of the components of the source and target images, and then calculate the inverse result.
     */
    SCREEN,
    DIVD,
    SOFT_ADD,
}
/**
 * @internal
 * @group Material
 */
export enum Blend {
    src_a,
    dest_a,
}
/**
 * @internal
 * @group Material
 */
export class BlendFactor {
    static getBlend(blendMode: BlendMode): any {
        let blend: GPUBlendState = {
            color: {
                srcFactor: 'src-alpha',
                dstFactor: 'one',
            },
            alpha: {
                srcFactor: 'one',
                dstFactor: 'one',
            },
        };

        // | "add"
        // | "subtract"
        // | "reverse-subtract"
        // | "min"
        // | "max";
        switch (blendMode) {
            case BlendMode.NONE:
                blend.color.srcFactor = `one`;
                blend.color.dstFactor = `zero`;
                blend.color.operation = 'add';
                break;
            case BlendMode.ABOVE:
                blend.color.srcFactor = `one-minus-src-alpha`;
                blend.color.dstFactor = `dst-alpha`;
                blend.color.operation = 'add';
                break;
            case BlendMode.ADD:
                blend.color.srcFactor = `one`;
                blend.color.dstFactor = 'one';
                blend.color.operation = `add`;

                blend.alpha.srcFactor = `one`;
                blend.alpha.dstFactor = `one`;
                blend.alpha.operation = `add`;
                break;
            case BlendMode.ALPHA:
                blend.color.srcFactor = `src-alpha`;
                blend.color.dstFactor = `one-minus-src-alpha`;

                // blend.alpha.srcFactor = `one`;
                // blend.alpha.dstFactor = `one`;
                // blend.color.operation = `add`;
                break;
            case BlendMode.BELOW:
                blend.color.srcFactor = `one-minus-src-alpha`;
                blend.color.dstFactor = 'one';
                blend.color.operation = 'add';
                break;
            case BlendMode.ERASE:
                blend.color.srcFactor = `zero`;
                blend.color.dstFactor = 'one-minus-src-alpha';
                blend.color.operation = 'add';
                break;
            case BlendMode.MUL:
                blend.color.srcFactor = `dst`;
                blend.color.dstFactor = `one-minus-src-alpha`;
                blend.color.operation = 'add';
                break;
            case BlendMode.NORMAL:
                blend.color.srcFactor = 'one';
                blend.color.dstFactor = 'one-minus-src-alpha';
                blend.color.operation = 'add';
                break;
            case BlendMode.SOFT_ADD:
                blend.color.srcFactor = `one`;
                blend.color.dstFactor = 'one';
                blend.color.operation = `max`;

                blend.alpha.srcFactor = `one`;
                blend.alpha.dstFactor = `one`;
                blend.alpha.operation = `add`;
                break;
            case BlendMode.SCREEN:
                blend.color.srcFactor = 'one';
                blend.color.dstFactor = `one-minus-src`;
                blend.color.operation = 'add';
                break;
            default:
                break;
        }
        return blend;
    }
}
