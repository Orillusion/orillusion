import { Texture } from "../../../gfx/graphics/webGpu/core/texture/Texture";
import { UITransform } from "../uiComponents/UITransform";
import { GUIQuadAttrEnum } from "./GUIGeometry";
import { GUIMesh } from "./GUIMesh";
import { GUITexture } from "./GUITexture";

/**
 * This class is responsible for performing the Geometry reconstruction work of the GUI
 * @group GUI
 */
export class GUIGeometryRebuild {
  private _textureMap: Map<number, GUITexture> = new Map<number, GUITexture>();
  private _textureList: Texture[] = [];

  /**
   * Rebuild a specified GUIMesh
   * Check and rebuild a GUIMesh, including geometry and materials
   * @param transforms Fill in the UITransform list for the specified GUIMesh
   * @param guiMesh Specify the GUIMesh object for reconstructing Geometry
   * @param forceUpdate whether need to force refactoring
   * @returns Return the build result (the maximum number of textures supported by GUIMaterials for a single UIPanel is limited and cannot exceed the limit)
   */
  public build(transforms: UITransform[], guiMesh: GUIMesh, forceUpdate: boolean): boolean {
    let quadIndex = -1;
    let texIndex = -1;

    this._textureMap.clear();
    this._textureList.length = 0;

    let zMax: number = guiMesh.quadMaxCount - 1;
    let needBreak: boolean;
    for (let transform of transforms) {
      transform.guiMesh = guiMesh;
      let needUpdateQuads = transform.needUpdateQuads;

      const quads = transform.quads;
      for (let quad of quads) {
        quad.z = ++quadIndex;
        if (quad.sprite && quad.sprite.guiTexture) {
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
        }

        let updateAllAttr = needUpdateQuads || forceUpdate;
        if (updateAllAttr) {
          quad.dirtyAttributes = GUIQuadAttrEnum.MAX;
        }
        if (quad.dirtyAttributes & GUIQuadAttrEnum.POSITION) {
          quad.applyTransform(transform);
        }
        if (quad.dirtyAttributes) {
          quad.writeToGeometry(guiMesh.geometry, transform);
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

    guiMesh['_setTextures'](this._textureList);
    guiMesh.limitVertexCount = (quadIndex + 1) * 4;
    // if (isGeometryDirty) {
    //   guiMesh.geometry.cutOff(quadIndex + 1);
    // }
    return !needBreak;
  }
}
