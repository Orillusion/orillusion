import { GUIQuadAttrEnum, Object3D, TexturesBindGroup, UIPanel } from "../../..";
import { Texture } from "../../../gfx/graphics/webGpu/core/texture/Texture";
import { UITransform } from "../uiComponents/UITransform";
import { UIRenderAble } from "../uiComponents/UIRenderAble";
import { GUIQuad } from "./GUIQuad";
import { GUITexture } from "./GUITexture";

/**
 * This class is responsible for performing the Geometry reconstruction work of the GUI
 * @group GPU GUI
 */
export class GUIGeometryRebuild {
  private _textureMap: Map<number, GUITexture> = new Map<number, GUITexture>();
  private _textureList: Texture[] = [];

  /**
   * Rebuild a specified GUI Mesh
   * Check and rebuild a GUI Mesh, including geometry and materials
   * @param transforms Fill in the UITransform list for the specified GUI Mesh
   * @param panel Specify the GUI Mesh object for reconstructing Geometry
   * @param forceUpdate whether need to force refactoring
   * @returns Return the build result (the maximum number of textures supported by GUIMaterials for a single UIPanel is limited and cannot exceed the limit)
   */
  public build(transforms: UITransform[], panel: UIPanel, forceUpdate: boolean): boolean {
    let quadIndex = -1;
    let texIndex = -1;

    this._textureMap.clear();
    this._textureList.length = 0;

    let collectQuads = [];
    let zMax: number = panel.quadMaxCount - 1;
    let needBreak: boolean;
    for (let transform of transforms) {
      let needUpdateQuads = transform.needUpdateQuads;
      collectQuads.length = 0;
      const quads = this.collectQuads(transform.object3D, collectQuads);
      for (let quad of quads) {
        quad.z = ++quadIndex;
        let textureSource = quad.sprite.guiTexture;
        if (!this._textureMap.has(textureSource.staticId)) {
          ++texIndex;
          this._textureMap.set(textureSource.staticId, textureSource);
          textureSource.dynamicId = texIndex;
          this._textureList[texIndex] = textureSource.texture;
          if (texIndex > 7) {
            console.warn('texture Count Exceeded the maximum limit of 7');
            break;
          }
        }

        if (quad.cacheTextureId != textureSource.dynamicId) {
          quad.dirtyAttributes = GUIQuadAttrEnum.MAX;
          quad.cacheTextureId = textureSource.dynamicId;
        }

        let updateAllAttr = needUpdateQuads || forceUpdate;
        if (updateAllAttr) {
          quad.dirtyAttributes = GUIQuadAttrEnum.MAX;
        }
        if (quad.dirtyAttributes & GUIQuadAttrEnum.POSITION) {
          quad.applyTransform(transform);
        }
        if (quad.dirtyAttributes) {
          quad.writeToGeometry(panel['_geometry'], transform);
        }
        if (quadIndex == zMax) {
          needBreak = true;
          break;
        }
      }
      if (needBreak) {
        break;
      }
    }

    panel['_uiMaterial'].setTextures(this._textureList);
    panel['_limitVertexCount'] = (quadIndex + 1) * 4;
    return !needBreak;
  }

  private collectQuads(object3D: Object3D, list?: GUIQuad[]): GUIQuad[] {
    list ||= [];
    let components = object3D.components.values();
    for (let i of components) {
      let item = i as any as UIRenderAble;
      if (item.isUIShadow || !item.mainQuads)
        continue;
      // push shadow
      let shadowRender = item.getShadowRender();
      if (shadowRender) {
        this.push(shadowRender.mainQuads, list);
      }
      //push main
      this.push(item.mainQuads, list);
    }
    return list;
  }

  private push(src: GUIQuad[], dst: GUIQuad[]) {
    src && src.length > 0 && dst.push(...src)
  }
}
