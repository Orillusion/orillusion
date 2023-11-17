import { Texture } from "../../../gfx/graphics/webGpu/core/texture/Texture";
import { UITransform } from "../uiComponents/UITransform";
import { UIRenderAble } from "../uiComponents/UIRenderAble";
import { GUIQuad } from "./GUIQuad";
import { GUITexture } from "./GUITexture";
import { UIPanel } from "../uiComponents/UIPanel";
import { GUIQuadAttrEnum } from "./GUIDefine";
import { Object3D } from "../../../core/entities/Object3D";
import { GUIMaterial } from "./GUIMaterial";

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
    let geometry = panel['_geometry'];
    geometry.resetSubGeometries();

    let quadIndex = -1;
    let texIndex = 0;

    let indexStart = 0;
    let indexCount = 0;
    let geometryIndex = 0;

    let textureList = this._textureList;
    let textureMap = this._textureMap;

    function flushPanel() {
      if (indexCount > 0) {
        panel.updateDrawCallSegment(geometryIndex, indexStart, indexCount);
        let material: GUIMaterial = panel['_uiRenderer']['materials'][geometryIndex] as any;
        material.setTextures(textureList);
        textureMap.clear();
        textureList.length = 0;
        geometryIndex++;
        indexStart += indexCount;
        indexCount = 0;
        texIndex = 0;
      }
    }

    textureMap.clear();
    textureList.length = 0;

    let collectQuads: GUIQuad[] = [];
    let zMax: number = panel.quadMaxCount - 1;

    for (let transform of transforms) {
      let needUpdateQuads = transform.needUpdateQuads;
      collectQuads.length = 0;
      const quads = this.collectQuads(transform.object3D, collectQuads);
      for (let quad of quads) {
        let textureSource = quad.sprite.guiTexture;

        if (!textureMap.has(textureSource.staticId)) {
          if (texIndex == 7) flushPanel();

          textureMap.set(textureSource.staticId, textureSource);
          textureSource.dynamicId = texIndex;
          textureList[texIndex] = textureSource.texture;
          texIndex += 1;
        }

        quad.z = ++quadIndex;
        indexCount += 6;
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
          quad.writeToGeometry(geometry, transform);
        }
        if (quadIndex == zMax) {
          flushPanel();
          return true;
        }
      }
    }
    flushPanel();
    return false;
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
