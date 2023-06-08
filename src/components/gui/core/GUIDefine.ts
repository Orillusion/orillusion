/**
 * GUI Root Container
 * @internal
 * @group GPU GUI
 */
export enum GUIQuadAttrEnum {
    NONE = 0,
    POSITION = 1 << 0,
    SPRITE = 1 << 1,
    COLOR = 1 << 2,
    MAX = POSITION + COLOR + SPRITE
}
