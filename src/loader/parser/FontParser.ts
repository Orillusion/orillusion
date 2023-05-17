import { Engine3D } from "../..";
import { fonts } from "../../assets/Fonts";
import { GUISprite } from "../../components/gui/core/GUISprite";
import { GUITexture } from "../../components/gui/core/GUITexture";
import { ParserBase } from "./ParserBase";

export class FontInfo {
    public face: string = '';
    public size: number = 0;
    public bold: boolean = false;
    public italic: boolean = false;
    public stretchH: number = 0;
    public spacing: string = '';
    public outline: number = 0;
    public lineHeight: number = 0;
    public base: number = 0;
    public scaleW: number = 0;
    public scaleH: number = 0;
    public pages: number = 0;
    public packed: number = 0;
    public alphaChnl: number = 0;
    public redChnl: number = 0;
    public greenChnl: number = 0;
    public blueChnl: number = 0;
    public count: number = 0;

    public fontPage: FontPage[] = [];
    public fontChar: { [key: string]: FontChar } = {};

    constructor() { }
}

export class FontPage {
    public id: number = 0;
    public file: string = '';
}

export class FontChar {
    public id: number = -1;
    public x: number = 0;
    public y: number = 0;
    public width: number = 0;
    public height: number = 0;
    public xoffset: number = 0;
    public yoffset: number = 0;
    public xadvance: number = 0;
    public page: number = 0;
    public chnl: number = 0;
}

export class FontParser extends ParserBase {
    static format: string = 'text';

    public static parseSprite(guiTexture: GUITexture[], fontData: FontInfo) {
        for (const key in fontData.fontChar) {
            if (Object.prototype.hasOwnProperty.call(fontData.fontChar, key)) {
                const charInfo = fontData.fontChar[key];
                let sprite = new GUISprite();
                sprite.id = charInfo.id.toString();
                sprite.offsetSize.set(0, 0, charInfo.width, charInfo.height);
                sprite.trimSize.set(charInfo.width, charInfo.height);
                sprite.width = charInfo.width;
                sprite.height = charInfo.height;
                sprite.xadvance = charInfo.xadvance;
                sprite.xoffset = charInfo.xoffset;
                sprite.yoffset = charInfo.yoffset;
                sprite.guiTexture = guiTexture[charInfo.page];
                sprite.uvRec.set(charInfo.x / fontData.scaleW, (fontData.scaleH - (charInfo.y + charInfo.height)) / fontData.scaleH, charInfo.width / fontData.scaleW, charInfo.height / fontData.scaleH);
                fonts.addFnt(fontData.face, fontData.size, sprite.id, sprite);
            }
        }
    }

    /**
     * Verify parsing validity
     * @param ret
     * @returns
     */
    public verification(): boolean {
        if (this.data) {
            return true;
        }
        throw new Error('Method not implemented.');
    }

    public async parseString(data: string) {
        let newLine = this.getNewLine(data);
        let fnt: string = data;
        let fontData: FontInfo = new FontInfo();
        fnt.trim()
            .split(newLine)
            .forEach((v, i) => {
                if (i < 2) {
                    FontParser.readLineProperty(v, fontData);
                } else {
                    if (i < fontData.pages + 2) {
                        let page = new FontPage();
                        FontParser.readLineProperty(v, page);
                        fontData.fontPage.push(page);
                    } else if (i < fontData.pages + 3) {
                        FontParser.readLineProperty(v, fontData);
                    } else {
                        if (fontData.count > 0) {
                            let char = new FontChar();
                            FontParser.readLineProperty(v, char);
                            fontData.fontChar[char.id] = char;
                            fontData.count--;
                        }
                    }
                }
            });
        fnt = '';
        this.data = fontData;

        await this.loadFontTextures();
    }

    private getNewLine(value: string): string {
        if (value.indexOf('\r\n') != -1) return '\r\n';
        else if (value.indexOf('\r') != -1) return '\r';
        else return '\n';
    }

    private async loadFontTextures() {
        let images: GUITexture[] = [];
        let fontData: FontInfo = this.data;
        for (const fontPage of fontData.fontPage) {
            let texturePath = this.baseUrl + fontPage.file;
            await Engine3D.res.loadTexture(texturePath, null, true);
            let texture = Engine3D.res.getTexture(texturePath);
            let source: GUITexture = new GUITexture(texture);
            images.push(source);
        }
        FontParser.parseSprite(images, fontData);
        //check empty
        if (!fontData.fontChar[' ']) {
            FontParser.insertSpaceChar(fontData, images[0]);
        }
    }

    private static insertSpaceChar(fontData: FontInfo, texture: GUITexture): void {
        let sprite = new GUISprite();
        let width = fontData.size * 0.5;
        let height = fontData.lineHeight * 0.5;
        sprite.id = ' ';
        sprite.offsetSize.set(0, 0, fontData.size, fontData.size);
        sprite.trimSize.set(width, height);
        sprite.width = width;
        sprite.height = height;
        sprite.xadvance = 0;
        sprite.xoffset = 0;
        sprite.yoffset = 0;
        sprite.guiTexture = texture;
        sprite.uvRec.set(0, 0, 0.000001, 0.000001);
        fonts.addFnt(fontData.face, fontData.size, sprite.id, sprite);
    }

    private static readLineProperty(line: string, data: any) {
        line.trim()
            .split(' ')
            .forEach((v, i) => {
                let strArr = v.split('=');
                if (strArr.length > 1) {
                    let key = strArr[0];
                    let value = strArr[1];
                    if (Object.prototype.hasOwnProperty.call(data, key)) {
                        if (value.indexOf('"') == -1) {
                            data[key] = parseFloat(strArr[1]);
                        } else {
                            data[key] = value.replace('"', '').replace('"', '');
                        }
                    }
                }
            });
    }
}
