import { GUISprite } from "../components/gui/core/GUISprite";
import { FontInfo } from "../loader/parser/FontParser";

class Fonts {
    protected fntCache: { [key: number]: { [key: string]: GUISprite } } = {};
    protected fntData: { [key: number]: { [key: string]: FontInfo } } = {};

    addFontData(face: string, size: number, fontData: FontInfo) {
        this.fntData[`${face}${size}`] = fontData;
    }

    getFontData(face: string, size: number): FontInfo {
        return this.fntData[`${face}${size}`];
    }

    addFnt(font: string, size: number, id: string, sprite: GUISprite) {
        let key = `${font}${size}`;
        if (!this.fntCache[key]) this.fntCache[key] = {};
        this.fntCache[key][id] = sprite;
    }

    getFnt(font: string, size: number, id: string): GUISprite {
        let key = `${font}${size}`;
        let list = this.fntCache[key];
        return list ? list[id] : this.fntCache[` `];
    }
}

export let fonts: Fonts = new Fonts();