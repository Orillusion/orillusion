/**
 * RGBA Color Object
 * @group Math
 */
export class Color {

    /**
     * red color
     */
    public static COLOR_RED: Color = new Color(1, 0, 0, 1);

    /**
     * green color
     */
    public static COLOR_GREEN: Color = new Color(0, 1, 0, 1);

    /**
     * blue color
     */
    public static COLOR_BLUE: Color = new Color(0, 0, 1, 1);

    /**
     * white color
     */
    public static COLOR_WHITE: Color = new Color(1, 1, 1, 1);

    /**
     * cache 
     * @internal
     */
    public static COLOR_0: Color = new Color();
    /**
     * cache 
     * @internal
     */
    public static COLOR_1: Color = new Color();
    /**
     * cache 
     * @internal
     */
    public static COLOR_2: Color = new Color();

    /**
     * @internal
     */
    private static HEX_CHARACTERS = 'a-f\\d';

    /**
     * @internal
     */
    private static MATCH_3OR4_HEX = `#?[${Color.HEX_CHARACTERS}]{3}[${Color.HEX_CHARACTERS}]?`;
    /**
     * @internal
     */
    private static MATCH_6OR8_HEX = `#?[${Color.HEX_CHARACTERS}]{6}([${Color.HEX_CHARACTERS}]{2})?`;
    /**
     * @internal
     */
    private static NON_HEX_CHARS = new RegExp(`[^#${Color.HEX_CHARACTERS}]`, 'gi');
    /**
     * @internal
     */
    private static VALID_HEX_SIZE = new RegExp(`^${Color.MATCH_3OR4_HEX}$|^${Color.MATCH_6OR8_HEX}$`, 'i');

    /**
     * red channel
     */
    public r: number = 0;

    /**
     * green channel
     */
    public g: number = 0;

    /**
     * blue channel
     */
    public b: number = 0;

    /**
     * alpha channel
     */
    public a: number = 0;

    /**
     * create new color instance
     * @param r red channel
     * @param g green channel
     * @param b blue channel
     * @param a alpha channel
     */
    constructor(r: number = 1.0, g: number = 1.0, b: number = 1.0, a: number = 1.0) {
        this.setTo(r, g, b, a);
    }

    /***
     * convert to hdr color , channel a is intensity 
     */
    convertToHDRRGB(): Color {
        this.r = this.r * Math.pow(2.4, this.a);
        this.g = this.g * Math.pow(2.4, this.a);
        this.b = this.b * Math.pow(2.4, this.a);
        return this;
    }

    /**
     * unSerialized color by data
     * @param data 
     * @returns 
     */
    public unSerialized(data: any): this {
        this.r = data['r'];
        this.g = data['g'];
        this.b = data['b'];
        this.a = data['a'];
        return this;
    }

    /**
     * update this color rgb from hexadecimal no alpha
     * @param value 
     */
    public hexToRGB(value: number) {
        //this.a = ((value >> 24) & 0xff ) / 255;
        this.r = ((value >> 16) & 0xff) / 255;
        this.g = ((value >> 8) & 0xff) / 255;
        this.b = (value & 0xff) / 255;
    }

    /**
     * update this color rgb from hexadecimal has alpha
     * @param value 
     */
    public hexToRGBA(value: number) {
        this.a = ((value >> 24) & 0xff) / 255;
        this.r = ((value >> 16) & 0xff) / 255;
        this.g = ((value >> 8) & 0xff) / 255;
        this.b = (value & 0xff) / 255;
    }

    /**
     * random on color 
     * @returns 
     */
    public static random(base: number = 1.0): Color {
        let color = new Color();
        color.a = base;
        color.r = base * Math.random();
        color.g = base * Math.random();
        color.b = base * Math.random();
        return color;
    }

    /**
     * set rgba to this color
     * @param r red channel
     * @param g green channel
     * @param b blue channel
     * @param a alpha channel
     */
    public setTo(r: number, g: number, b: number, a: number) {
        this.r = Math.max(r, 0.0);
        this.g = Math.max(g, 0.0);
        this.b = Math.max(b, 0.0);
        this.a = Math.max(a, 0.0);
    }

    /**
     * update this color rgba from hexadecimal 
     * @param hex hex string.
     */
    public setHex(hex: string) {
        if (typeof hex !== 'string' || Color.NON_HEX_CHARS.test(hex) || !Color.VALID_HEX_SIZE.test(hex)) {
            throw new TypeError('Expected a valid hex string');
        }
        hex = hex.replace(/^#/, '');
        let alphaFromHex = 1;

        if (hex.length === 8) {
            alphaFromHex = Number.parseInt(hex.slice(6, 8), 16) / 255;
            hex = hex.slice(0, 6);
        }

        if (hex.length === 4) {
            alphaFromHex = Number.parseInt(hex.slice(3, 4).repeat(2), 16) / 255;
            hex = hex.slice(0, 3);
        }

        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }

        const number = Number.parseInt(hex, 16);
        const red = number >> 16;
        const green = (number >> 8) & 255;
        const blue = number & 255;
        const alpha = alphaFromHex;
        this.a = alpha;
        this.r = red / 255;
        this.g = green / 255;
        this.b = blue / 255;
    }

    /**
     * convert this color to hex string code 
     * @returns 
     */
    public getHex(): string {
        let getHexStr = (n: number) => {
            n *= 255.0;
            let str = n.toString(16);
            if (str.length === 1) {
                str = '0' + str;
            }
            return str;
        };
        let hex = getHexStr(this.r) + getHexStr(this.g) + getHexStr(this.b) + getHexStr(this.a);
        return hex;
    }

    /**
     * get rgb to array
     */
    public get rgb(): number[] {
        return [(this.r * 255) >>> 0, (this.g * 255) >>> 0, (this.b * 255) >>> 0];
    }

    /**
     * set rgb by array
     */
    public set rgb(c: number[]) {
        this.setTo(c[0] / 255, c[1] / 255, c[2] / 255, this.a);
    }

    /**
     * get rgba to array
     */
    public get rgba(): number[] {
        return [(this.r * 255) >>> 0, (this.g * 255) >>> 0, (this.b * 255) >>> 0, (this.a * 255) >>> 0];
    }

    /**
     * set rgb by array
     */
    public set rgba(c: number[]) {
        this.setTo(c[0] / 255, c[1] / 255, c[2] / 255, c[3] / 255);
    }

    /**
     * clone this color
     * @returns 
     */
    public clone(): Color {
        return new Color().copyFrom(this);
    }

    /**
     * copy color from source color
     * @returns
     */
    public copyFrom(src: Color): this {
        this.r = src.r;
        this.g = src.g;
        this.b = src.b;
        this.a = src.a;
        return this;
    }

    /**
     * copy color from array
     * @param arr [ 255 , 255 , 255 , 255 ]
     * @param scalar 
     * @returns 
     */
    public copyFromArray(arr: number[], scalar: number = 255) {
        this.r = arr[0] / scalar;
        this.g = arr[1] / scalar;
        this.b = arr[2] / scalar;
        this.a = arr[3] / scalar;
        return this;
    }

    /**
     * update this color rgb from hexadecimal no alpha
     * @param hexColor rgb color
     * @param dst ref out color
     */
    public static hexRGBColor(hexColor: number, dst: Color = null): Color {
        dst = dst || new Color();
        dst.hexToRGB(hexColor);
        return dst;
    }



    public static PRIMARY = 0x3f51b5; //
    public static PRIMARYDARK = 0x303f9f; //
    public static ACCENT = 0xff4081; //

    public static WHITE = 0xffffff;
    public static IVORY = 0xfffff0;
    public static LIGHTYELLOW = 0xffffe0;
    public static YELLOW = 0xffff00;
    public static SNOW = 0xfffafa;
    public static FLORALWHITE = 0xfffaf0;
    public static LEMONCHIFFON = 0xfffacd;
    public static CORNSILK = 0xfff8dc;
    public static SEASHELL = 0xfff5ee;
    public static LAVENDERBLUSH = 0xfff0f5;
    public static PAPAYAWHIP = 0xffefd5;
    public static BLANCHEDALMOND = 0xffebcd;
    public static MISTYROSE = 0xffe4e1;
    public static BISQUE = 0xffe4c4;
    public static MOCCASIN = 0xffe4b5;
    public static NAVAJOWHITE = 0xffdead;
    public static PEACHPUFF = 0xffdab9;
    public static GOLD = 0xffd700;
    public static PINK = 0xffc0cb;
    public static LIGHTPINK = 0xffb6c1;
    public static ORANGE = 0xffa500;
    public static LIGHTSALMON = 0xffa07a;
    public static DARKORANGE = 0xff8c00;
    public static CORAL = 0xff7f50;
    public static HOTPINK = 0xff69b4;
    public static TOMATO = 0xff6347;
    public static ORANGERED = 0xff4500;
    public static DEEPPINK = 0xff1493;
    public static FUCHSIA = 0xff00ff;
    public static MAGENTA = 0xff00ff;
    public static RED = 0xff0000;
    public static OLDLACE = 0xfdf5e6;
    public static LIGHTGOLDENRODYELLOW = 0xfafad2;
    public static LINEN = 0xfaf0e6;
    public static ANTIQUEWHITE = 0xfaebd7;
    public static SALMON = 0xfa8072;
    public static GHOSTWHITE = 0xf8f8ff;
    public static MINTCREAM = 0xf5fffa;
    public static WHITESMOKE = 0xf5f5f5;
    public static BEIGE = 0xf5f5dc;
    public static WHEAT = 0xf5deb3;
    public static SANDYBROWN = 0xf4a460;
    public static AZURE = 0xf0ffff;
    public static HONEYDEW = 0xf0fff0;
    public static ALICEBLUE = 0xf0f8ff;
    public static KHAKI = 0xf0e68c;
    public static LIGHTCORAL = 0xf08080;
    public static PALEGOLDENROD = 0xeee8aa;
    public static VIOLET = 0xee82ee;
    public static DARKSALMON = 0xe9967a;
    public static LAVENDER = 0xe6e6fa;
    public static LIGHTCYAN = 0xe0ffff;
    public static BURLYWOOD = 0xdeb887;
    public static PLUM = 0xdda0dd;
    public static GAINSBORO = 0xdcdcdc;
    public static CRIMSON = 0xdc143c;
    public static PALEVIOLETRED = 0xdb7093;

    public static GOLDENROD = 0xdaa520;
    public static ORCHID = 0xda70d6;
    public static THISTLE = 0xd8bfd8;
    public static LIGHTGREY = 0xd3d3d3;
    public static TAN = 0xd2b48c;
    public static CHOCOLATE = 0xd2691e;
    public static PERU = 0xcd853f;
    public static INDIANRED = 0xcd5c5c;
    public static MEDIUMVIOLETRED = 0xc71585;
    public static SILVER = 0xc0c0c0;
    public static DARKKHAKI = 0xbdb76b;
    public static ROSYBROWN = 0xbc8f8f;
    public static MEDIUMORCHID = 0xba55d3;
    public static DARKGOLDENROD = 0xb8860b;
    public static FIREBRICK = 0xb22222;
    public static POWDERBLUE = 0xb0e0e6;
    public static LIGHTSTEELBLUE = 0xb0c4de;
    public static PALETURQUOISE = 0xafeeee;
    public static GREENYELLOW = 0xadff2f;
    public static LIGHTBLUE = 0xadd8e6;
    public static DARKGRAY = 0xa9a9a9;
    public static BROWN = 0xa52a2a;
    public static SIENNA = 0xa0522d;
    public static DARKORCHID = 0x9932cc;
    public static PALEGREEN = 0x98fb98;
    public static DARKVIOLET = 0x9400d3;
    public static MEDIUMPURPLE = 0x9370db;
    public static LIGHTGREEN = 0x90ee90;
    public static DARKSEAGREEN = 0x8fbc8f;
    public static SADDLEBROWN = 0x8b4513;
    public static DARKMAGENTA = 0x8b008b;
    public static DARKRED = 0x8b0000;
    public static BLUEVIOLET = 0x8a2be2;
    public static LIGHTSKYBLUE = 0x87cefa;
    public static SKYBLUE = 0x87ceeb;
    public static GRAY = 0x808080;
    public static OLIVE = 0x808000;
    public static PURPLE = 0x800080;
    public static MAROON = 0x800000;
    public static AQUAMARINE = 0x7fffd4;
    public static CHARTREUSE = 0x7fff00;
    public static LAWNGREEN = 0x7cfc00;
    public static MEDIUMSLATEBLUE = 0x7b68ee;
    public static LIGHTSLATEGRAY = 0x778899;
    public static SLATEGRAY = 0x708090;
    public static OLIVEDRAB = 0x6b8e23;
    public static SLATEBLUE = 0x6a5acd;
    public static DIMGRAY = 0x696969;
    public static MEDIUMAQUAMARINE = 0x66cdaa;
    public static CORNFLOWERBLUE = 0x6495ed;
    public static CADETBLUE = 0x5f9ea0;
    public static DARKOLIVEGREEN = 0x556b2f;
    public static INDIGO = 0x4b0082;
    public static MEDIUMTURQUOISE = 0x48d1cc;
    public static DARKSLATEBLUE = 0x483d8b;
    public static STEELBLUE = 0x4682b4;
    public static ROYALBLUE = 0x4169e1;
    public static TURQUOISE = 0x40e0d0;
    public static MEDIUMSEAGREEN = 0x3cb371;
    public static LIMEGREEN = 0x32cd32;
    public static DARKSLATEGRAY = 0x2f4f4f;
    public static SEAGREEN = 0x2e8b57;
    public static FORESTGREEN = 0x228b22;
    public static LIGHTSEAGREEN = 0x20b2aa;
    public static DODGERBLUE = 0x1e90ff;
    public static MIDNIGHTBLUE = 0x191970;
    public static AQUA = 0x00ffff;
    public static CYAN = 0x00ffff;
    public static SPRINGGREEN = 0x00ff7f;
    public static LIME = 0x00ff00;
    public static MEDIUMSPRINGGREEN = 0x00fa9a;
    public static DARKTURQUOISE = 0x00ced1;
    public static DEEPSKYBLUE = 0x00bfff;
    public static DARKCYAN = 0x008b8b;
    public static TEAL = 0x008080;
    public static GREEN = 0x008000;
    public static DARKGREEN = 0x006400;
    public static BLUE = 0x0000ff;
    public static MEDIUMBLUE = 0x0000cd;
    public static DARKBLUE = 0x00008b;
    public static NAVY = 0x000080;
    public static BLACK = 0x000000;
}