
import { Texture } from "../../gfx/graphics/webGpu/core/texture/Texture";
import { GUISprite } from "./core/GUISprite";
import { GUITexture } from "./core/GUITexture";

export function makeAloneSprite(id: string, texture: Texture) {
    let sprite = new GUISprite();
    sprite.id = id;
    sprite.offsetSize.set(0, 0, texture.width, texture.height);
    sprite.trimSize.set(texture.width, texture.height);
    sprite.width = texture.width;
    sprite.height = texture.height;
    sprite.xadvance = 0;
    sprite.xoffset = 0;
    sprite.yoffset = 0;
    sprite.guiTexture = new GUITexture(texture);
    sprite.uvRec.set(0, 0, 1, 1);
    if (!texture.isVideoTexture) {
        texture.flipY = true;
    }
    return sprite;
}

//
export function makeGUISprite(source: GUITexture, id: string, data: any) {
    let sprite = new GUISprite();
    sprite.guiTexture = source;
    sprite.id = id;
    // size: Vector2; //origin size
    // textureRect: Vector4; //In the area of the atlas
    // textureRectOffset: Vector2; //The offset value of the rectangular box relative to the original position after deducting transparent pixels
    // border: left bottom right top 
    sprite.uvRec.copyFrom(data.textureRect);
    sprite.trimSize.x = data.textureRect.z;
    sprite.trimSize.y = data.textureRect.w;
    sprite.offsetSize.x = data.textureRectOffset.x;
    sprite.offsetSize.y = data.textureRectOffset.y;
    sprite.offsetSize.z = data.size.x;
    sprite.offsetSize.w = data.size.y;

    sprite.width = data.size.x;
    sprite.height = data.size.y;

    let wScale = 1 / source.width;
    let hScale = 1 / source.height;

    sprite.uvRec.set(sprite.uvRec.x * wScale, sprite.uvRec.y * hScale, sprite.uvRec.z * wScale, sprite.uvRec.w * hScale);
    //parse border
    let tiny = 0.1;
    if (data.border.x <= tiny && data.border.y <= tiny && data.border.z <= tiny && data.border.x <= tiny) {
        sprite.isSliced = false;
    } else {
        // border: left bottom right top
        sprite.borderSize.copyFrom(data.border);
        sprite.uvBorder.copyFrom(data.border);
        sprite.uvBorder.x -= data.textureRectOffset.x;
        sprite.uvBorder.y -= data.textureRectOffset.y;
        sprite.uvBorder.z = data.border.z - (data.size.x - data.textureRect.z - data.textureRectOffset.x);
        sprite.uvBorder.w = data.border.w - (data.size.y - data.textureRect.w - data.textureRectOffset.y);
        sprite.uvBorder.x /= data.textureRect.z;
        sprite.uvBorder.z /= data.textureRect.z;
        sprite.uvBorder.y /= data.textureRect.w;
        sprite.uvBorder.w /= data.textureRect.w;
        sprite.isSliced = true;
    }
    return sprite;
}

// export function CreateViewPanel(name: string, uiCanvas: GUICanvas) {
//     let obj = new Object3D();
//     obj.name = name;
//     let panel = obj.addComponent(ViewPanel);
//     uiCanvas.object3D.addChild(obj);
//     return panel;
// }
//
// export function CreateWorldPanel(name: string, uiCanvas: GUICanvas) {
//     let obj = new Object3D();
//     obj.name = name;
//     let panel = obj.addComponent(WorldPanel);
//     uiCanvas.object3D.addChild(obj);
//     return panel;
// }
