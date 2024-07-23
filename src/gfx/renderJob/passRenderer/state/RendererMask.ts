/**
 * RenderMask 
 * @group GFX
 */
export enum RendererMask {
    Default = 1 << 0,
    IgnoreDepthPass = 1 << 1,
    Sky = IgnoreDepthPass | 1 << 2,
    Particle = IgnoreDepthPass | 1 << 3,
    SkinnedMesh = 1 << 4,
    MorphTarget = 1 << 5,
    Terrain = 1 << 6,
    UI = 1 << 7,
    Reflection = 1 << 8,
    ReflectionDebug = 1 << 9,
    Graphic3D = 1 << 10
}

/**
 * @internal
 * @group GFX
 */
export class RendererMaskUtil {
    public static addMask(src: RendererMask, tag: RendererMask): RendererMask {
        let value = src | tag;
        return value;
    }

    public static removeMask(src: RendererMask, tag: RendererMask): RendererMask {
        let value = src & (~tag);
        return value;
    }

    public static hasMask(m1: RendererMask, m2: RendererMask): boolean {
        return (m1 & m2) == m2;
    }
}
