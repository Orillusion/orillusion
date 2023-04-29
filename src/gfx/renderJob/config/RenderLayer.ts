/**
 * render layer enum
 * @internal
 * @group Post
 */
export enum RenderLayer {
    None = 1 << 1,
    StaticBatch = 1 << 2,
    DynamicBatch = 1 << 3,
}

/**
 * @internal
 * @group GFX
 */
export class RenderLayerUtil {
    public static addMask(src: RenderLayer, tag: RenderLayer): RenderLayer {
        let value = src | tag;
        return value;
    }

    public static removeMask(src: RenderLayer, tag: RenderLayer): RenderLayer {
        let value = src & (~tag);
        return value;
    }

    public static hasMask(m1: RenderLayer, m2: RenderLayer): boolean {
        return (m1 & m2) != 0;
    }
}
