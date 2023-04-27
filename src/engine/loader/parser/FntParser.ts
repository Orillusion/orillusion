import { GUISubTexture, GUITextureSource } from '../../components/gui/core/GUISubTexture';
import { fonts } from '../../../engine/assets/Fonts';
import { ParserBase } from '../../../engine/loader/parser/ParserBase';
import { Engine3D } from '../../Engine3D';

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

export class FntParser extends ParserBase {
    static format: string = 'text';

    public static parserSubTexture(sources: GUITextureSource[], fontData: FontInfo) {
        for (const key in fontData.fontChar) {
            if (Object.prototype.hasOwnProperty.call(fontData.fontChar, key)) {
                const charInfo = fontData.fontChar[key];
                let subTexture = new GUISubTexture();
                subTexture.id = charInfo.id.toString();
                subTexture.offsetSize.set(0, 0, charInfo.width, charInfo.height);
                subTexture.trimSize.set(charInfo.width, charInfo.height);
                subTexture.width = charInfo.width;
                subTexture.height = charInfo.height;
                subTexture.xadvance = charInfo.xadvance;
                subTexture.xoffset = charInfo.xoffset;
                subTexture.yoffset = charInfo.yoffset;
                subTexture.sourceTexture = sources[charInfo.page];
                subTexture.uvRec.set(charInfo.x / fontData.scaleW, (fontData.scaleH - (charInfo.y + charInfo.height)) / fontData.scaleH, charInfo.width / fontData.scaleW, charInfo.height / fontData.scaleH);
                fonts.addFnt(fontData.face, fontData.size, subTexture.id, subTexture);
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

    public async parserString(data: string) {
        let newLine = this.getNewLine(data);
        let fnt: string = data;
        let fontData: FontInfo = new FontInfo();
        fnt.trim()
            .split(newLine)
            .forEach((v, i) => {
                if (i < 2) {
                    FntParser.readLineProperty(v, fontData);
                } else {
                    if (i < fontData.pages + 2) {
                        let page = new FontPage();
                        FntParser.readLineProperty(v, page);
                        fontData.fontPage.push(page);
                    } else if (i < fontData.pages + 3) {
                        FntParser.readLineProperty(v, fontData);
                    } else {
                        if (fontData.count > 0) {
                            let char = new FontChar();
                            FntParser.readLineProperty(v, char);
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
        let images: GUITextureSource[] = [];
        let fontData: FontInfo = this.data;
        for (const fontPage of fontData.fontPage) {
            let texturePath = this.baseUrl + fontPage.file;
            await Engine3D.res.loadTexture(texturePath, null, true);
            let texture = Engine3D.res.getTexture(texturePath);
            let source: GUITextureSource = new GUITextureSource(texture);
            images.push(source);
        }
        FntParser.parserSubTexture(images, fontData);
        //check empty
        if (!fontData.fontChar[' ']) {
            FntParser.insertSpaceChar(fontData, images[0]);
        }
    }

    private static insertSpaceChar(fontData: FontInfo, texture: GUITextureSource): void {
        let subTexture = new GUISubTexture();
        let width = fontData.size * 0.5;
        let height = fontData.lineHeight * 0.5;
        subTexture.id = ' ';
        subTexture.offsetSize.set(0, 0, fontData.size, fontData.size);
        subTexture.trimSize.set(width, height);
        subTexture.width = width;
        subTexture.height = height;
        subTexture.xadvance = 0;
        subTexture.xoffset = 0;
        subTexture.yoffset = 0;
        subTexture.sourceTexture = texture;
        subTexture.uvRec.set(0, 0, 0.000001, 0.000001);
        fonts.addFnt(fontData.face, fontData.size, subTexture.id, subTexture);
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
