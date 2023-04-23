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
     * update this color rgb form hexadecimal no alpha
     * @param value 
     */
    public hexToRGB(value: number) {
        //this.a = ((value >> 24) & 0xff ) / 255;
        this.r = ((value >> 16) & 0xff) / 255;
        this.g = ((value >> 8) & 0xff) / 255;
        this.b = (value & 0xff) / 255;
    }

    /**
     * update this color rgb form hexadecimal has alpha
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
     * update this color rgba form hexadecimal 
     * @param hex hex string。
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
        return new Color().copyForm(this);
    }

    /**
     * copy color form source color
     * @returns
     */
    public copyForm(src: Color): this {
        this.r = src.r;
        this.g = src.g;
        this.b = src.b;
        this.a = src.a;
        return this;
    }

    /**
     * copy color form array
     * @param arr [ 255 , 255 , 255 , 255 ]
     * @param scalar 
     * @returns 
     */
    public copyFormArray(arr: number[], scalar: number = 255) {
        this.r = arr[0] / scalar;
        this.g = arr[1] / scalar;
        this.b = arr[2] / scalar;
        this.a = arr[3] / scalar;
        return this;
    }

    /**
     * update this color rgb form hexadecimal no alpha
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
    /**
    * 白色十六进制值
    */
    public static WHITE = 0xffffff; // <!--白色 -->
    /**
    * 象牙色十六进制值
    */
    public static IVORY = 0xfffff0; // <!--象牙色 -->
    /**
    * 亮黄色十六进制值
    */
    public static LIGHTYELLOW = 0xffffe0; // <!--亮黄色 -->
    /**
    * 黄色十六进制值
    */
    public static YELLOW = 0xffff00; // <!--黄色 -->
    /**
    * 雪白色十六进制值
    */
    public static SNOW = 0xfffafa; // <!--雪白色 -->
    /**
    * 花白色十六进制值
    */
    public static FLORALWHITE = 0xfffaf0; // <!--花白色 -->
    /**
    * 柠檬绸十六进制值
    */
    public static LEMONCHIFFON = 0xfffacd; // <!--柠檬绸色 -->
    /**
    * 米绸色十六进制值
    */
    public static CORNSILK = 0xfff8dc; // <!--米绸色 -->
    /**
    * 海贝色十六进制值
    */
    public static SEASHELL = 0xfff5ee; // <!--海贝色 -->
    /**
    * 淡紫红十六进制值
    */
    public static LAVENDERBLUSH = 0xfff0f5; // <!--淡紫红 -->
    /**
    * 番木色十六进制值
    */
    public static PAPAYAWHIP = 0xffefd5; // <!--番木色 -->
    /**
    * 白杏色十六进制值
    */
    public static BLANCHEDALMOND = 0xffebcd; // <!--白杏色 -->
    /**
    * 浅玫瑰色十六进制值
    */
    public static MISTYROSE = 0xffe4e1; // <!--浅玫瑰色 -->
    /**
    * 桔黄色十六进制值
    */
    public static BISQUE = 0xffe4c4; // <!--桔黄色 -->
    /**
    * 鹿皮色十六进制值
    */
    public static MOCCASIN = 0xffe4b5; // <!--鹿皮色 -->
    /**
    * 纳瓦白十六进制值
    */
    public static NAVAJOWHITE = 0xffdead; // <!--纳瓦白 -->
    /**
    * 桃色十六进制值
    */
    public static PEACHPUFF = 0xffdab9; // <!--桃色 -->
    /**
    * 金色十六进制值
    */
    public static GOLD = 0xffd700; // <!--金色 -->
    /**
    * 粉红色十六进制值
    */
    public static PINK = 0xffc0cb; // <!--粉红色 -->
    /**
    * 亮粉红色十六进制值
    */
    public static LIGHTPINK = 0xffb6c1; // <!--亮粉红色 -->
    /**
    * 橙色十六进制值
    */
    public static ORANGE = 0xffa500; // <!--橙色 -->
    /**
    * 亮肉色十六进制值
    */
    public static LIGHTSALMON = 0xffa07a; // <!--亮肉色 -->
    /**
    * 暗桔黄色十六进制值
    */
    public static DARKORANGE = 0xff8c00; // <!--暗桔黄色 -->
    /**
    * 珊瑚色十六进制值
    */
    public static CORAL = 0xff7f50; // <!--珊瑚色 -->
    /**
    * 热粉红色十六进制值
    */
    public static HOTPINK = 0xff69b4; // <!--热粉红色 -->
    /**
    * 西红柿色十六进制值
    */
    public static TOMATO = 0xff6347; // <!--西红柿色 -->
    /**
    * 红橙色十六进制值
    */
    public static ORANGERED = 0xff4500; // <!--红橙色 -->
    /**
    * 深粉红色十六进制值
    */
    public static DEEPPINK = 0xff1493; // <!--深粉红色 -->
    /**
    * 紫红色十六进制值
    */
    public static FUCHSIA = 0xff00ff; // <!--紫红色 -->
    /**
    * 红紫色十六进制值
    */
    public static MAGENTA = 0xff00ff; // <!--红紫色 -->
    /**
    * 红色十六进制值
    */
    public static RED = 0xff0000; // <!--红色 -->
    /**
    * 老花色十六进制值
    */
    public static OLDLACE = 0xfdf5e6; // <!--老花色 -->
    /**
    * 亮金黄色十六进制值
    */
    public static LIGHTGOLDENRODYELLOW = 0xfafad2; // <!--亮金黄色 -->
    /**
    * 亚麻色十六进制值
    */
    public static LINEN = 0xfaf0e6; // <!--亚麻色 -->
    /**
    * 古董白十六进制值
    */
    public static ANTIQUEWHITE = 0xfaebd7; // <!--古董白 -->
    /**
    * 鲜肉色十六进制值
    */
    public static SALMON = 0xfa8072; // <!--鲜肉色 -->
    /**
    * 幽灵白十六进制值
    */
    public static GHOSTWHITE = 0xf8f8ff; // <!--幽灵白 -->
    /**
    * 薄荷色十六进制值
    */
    public static MINTCREAM = 0xf5fffa; // <!--薄荷色 -->
    /**
    * 烟白色十六进制值
    */
    public static WHITESMOKE = 0xf5f5f5; // <!--烟白色 -->
    /**
    * 米色十六进制值
    */
    public static BEIGE = 0xf5f5dc; // <!--米色 -->
    /**
    * 浅黄色十六进制值
    */
    public static WHEAT = 0xf5deb3; // <!--浅黄色 -->
    /**
    * 沙褐色十六进制值
    */
    public static SANDYBROWN = 0xf4a460; // <!--沙褐色 -->
    /**
    * 天蓝色十六进制值
    */
    public static AZURE = 0xf0ffff; // <!--天蓝色 -->
    /**
    * 蜜色十六进制值
    */
    public static HONEYDEW = 0xf0fff0; // <!--蜜色 -->
    /**
    * 艾利斯兰色十六进制值
    */
    public static ALICEBLUE = 0xf0f8ff; // <!--艾利斯兰 -->
    /**
    * 黄褐色十六进制值
    */
    public static KHAKI = 0xf0e68c; // <!--黄褐色 -->
    /**
    * 亮珊瑚色十六进制值
    */
    public static LIGHTCORAL = 0xf08080; // <!--亮珊瑚色 -->
    /**
    * 苍麒麟色十六进制值
    */
    public static PALEGOLDENROD = 0xeee8aa; // <!--苍麒麟色 -->
    /**
    * 紫罗兰色十六进制值
    */
    public static VIOLET = 0xee82ee; // <!--紫罗兰色 -->
    /**
    * 暗肉色十六进制值
    */
    public static DARKSALMON = 0xe9967a; // <!--暗肉色 -->
    /**
    * 淡紫色十六进制值
    */
    public static LAVENDER = 0xe6e6fa; // <!--淡紫色 -->
    /**
    * 亮青色十六进制值
    */
    public static LIGHTCYAN = 0xe0ffff; // <!--亮青色 -->
    /**
    * 实木色十六进制值
    */
    public static BURLYWOOD = 0xdeb887; // <!--实木色 -->
    /**
    * 洋李色十六进制值
    */
    public static PLUM = 0xdda0dd; // <!--洋李色 -->
    /**
    * 淡灰色十六进制值
    */
    public static GAINSBORO = 0xdcdcdc; // <!--淡灰色 -->
    /**
    * 暗深红色十六进制值
    */
    public static CRIMSON = 0xdc143c; // <!--暗深红色 -->
    /**
    * 苍紫罗兰色十六进制值
    */
    public static PALEVIOLETRED = 0xdb7093; // <!--苍紫罗兰色 -->
    /**
    * 金麒麟色十六进制值
    */
    public static GOLDENROD = 0xdaa520; // <!--金麒麟色 -->
    /**
    * 淡紫色十六进制值
    */
    public static ORCHID = 0xda70d6; // <!--淡紫色 -->
    /**
    * 蓟色十六进制值
    */
    public static THISTLE = 0xd8bfd8; // <!--蓟色 -->
    /**
    * 亮灰色十六进制值
    */
    public static LIGHTGREY = 0xd3d3d3; // <!--亮灰色 -->
    /**
    * 茶色十六进制值
    */
    public static TAN = 0xd2b48c; // <!--茶色 -->
    /**
    * 巧可力色十六进制值
    */
    public static CHOCOLATE = 0xd2691e; // <!--巧可力色 -->
    /**
    * 秘鲁色十六进制值
    */
    public static PERU = 0xcd853f; // <!--秘鲁色 -->
    /**
    * 印第安红十六进制值
    */
    public static INDIANRED = 0xcd5c5c; // <!--印第安红 -->
    /**
    * 中紫罗兰色十六进制值
    */
    public static MEDIUMVIOLETRED = 0xc71585; // <!--中紫罗兰色 -->
    /**
    * 银色十六进制值
    */
    public static SILVER = 0xc0c0c0; // <!--银色 -->
    /**
    * 暗黄褐色十六进制值
    */
    public static DARKKHAKI = 0xbdb76b; // <!--暗黄褐色-->
    /**
    * 褐玫瑰红十六进制值
    */
    public static ROSYBROWN = 0xbc8f8f; // <!--褐玫瑰红 -->
    /**
    * 中粉紫色十六进制值
    */
    public static MEDIUMORCHID = 0xba55d3; // <!--中粉紫色 -->
    /**
    * 暗金黄色十六进制值
    */
    public static DARKGOLDENROD = 0xb8860b; // <!--暗金黄色 -->
    /**
    * 火砖色十六进制值
    */
    public static FIREBRICK = 0xb22222; // <!--火砖色 -->
    /**
    * 粉蓝色十六进制值
    */
    public static POWDERBLUE = 0xb0e0e6; // <!--粉蓝色 -->
    /**
    * 亮钢兰色十六进制值
    */
    public static LIGHTSTEELBLUE = 0xb0c4de; // <!--亮钢兰色-->
    /**
    * 苍宝石绿十六进制值
    */
    public static PALETURQUOISE = 0xafeeee; // <!--苍宝石绿 -->
    /**
    * 黄绿色十六进制值
    */
    public static GREENYELLOW = 0xadff2f; // <!--黄绿色 -->
    /**
    * 亮蓝色十六进制值
    */
    public static LIGHTBLUE = 0xadd8e6; // <!--亮蓝色 -->
    /**
    * 暗灰色十六进制值
    */
    public static DARKGRAY = 0xa9a9a9; // <!--暗灰色 -->
    /**
    * 褐色十六进制值
    */
    public static BROWN = 0xa52a2a; // <!--褐色 -->
    /**
    * 赭色十六进制值
    */
    public static SIENNA = 0xa0522d; // <!--赭色 -->
    /**
    * 暗紫色十六进制值
    */
    public static DARKORCHID = 0x9932cc; // <!--暗紫色 -->
    /**
    * 苍绿色十六进制值
    */
    public static PALEGREEN = 0x98fb98; // <!--苍绿色 -->
    /**
    * 暗紫罗兰色十六进制值
    */
    public static DARKVIOLET = 0x9400d3; // <!--暗紫罗兰色 -->
    /**
    * 中紫色十六进制值
    */
    public static MEDIUMPURPLE = 0x9370db; // <!--中紫色 -->
    /**
    * 亮绿色十六进制值
    */
    public static LIGHTGREEN = 0x90ee90; // <!--亮绿色 -->
    /**
    * 暗海兰色十六进制值
    */
    public static DARKSEAGREEN = 0x8fbc8f; // <!--暗海兰色 -->
    /**
    * 重褐色十六进制值
    */
    public static SADDLEBROWN = 0x8b4513; // <!--重褐色 -->
    /**
    * 暗洋红十六进制值
    */
    public static DARKMAGENTA = 0x8b008b; // <!--暗洋红 -->
    /**
    * 暗红色十六进制值
    */
    public static DARKRED = 0x8b0000; // <!--暗红色 -->
    /**
    * 紫罗兰蓝色十六进制值
    */
    public static BLUEVIOLET = 0x8a2be2; // <!--紫罗兰蓝色 -->
    /**
    * 亮天蓝色十六进制值
    */
    public static LIGHTSKYBLUE = 0x87cefa; // <!--亮天蓝色 -->
    /**
    * 天蓝色十六进制值
    */
    public static SKYBLUE = 0x87ceeb; // <!--天蓝色 -->
    /**
    * 灰色十六进制值
    */
    public static GRAY = 0x808080; // <!--灰色 -->
    /**
    * 橄榄色十六进制值
    */
    public static OLIVE = 0x808000; // <!--橄榄色 -->
    /**
    * 紫色十六进制值
    */
    public static PURPLE = 0x800080; // <!--紫色 -->
    /**
    * 粟色十六进制值
    */
    public static MAROON = 0x800000; // <!--粟色 -->
    /**
    * 碧绿色十六进制值
    */
    public static AQUAMARINE = 0x7fffd4; // <!--碧绿色 -->
    /**
    * 黄绿色十六进制值
    */
    public static CHARTREUSE = 0x7fff00; // <!--黄绿色 -->
    /**
    * 草绿色十六进制值
    */
    public static LAWNGREEN = 0x7cfc00; // <!--草绿色 -->
    /**
    * 中暗蓝色十六进制值
    */
    public static MEDIUMSLATEBLUE = 0x7b68ee; // <!--中暗蓝色 -->
    /**
    * 亮蓝灰十六进制值
    */
    public static LIGHTSLATEGRAY = 0x778899; // <!--亮蓝灰 -->
    /**
    * 灰石色十六进制值
    */
    public static SLATEGRAY = 0x708090; // <!--灰石色 -->
    /**
    * 深绿褐色十六进制值
    */
    public static OLIVEDRAB = 0x6b8e23; // <!--深绿褐色 -->
    /**
    * 石蓝色十六进制值
    */
    public static SLATEBLUE = 0x6a5acd; // <!--石蓝色 -->
    /**
    * 暗灰色十六进制值
    */
    public static DIMGRAY = 0x696969; // <!--暗灰色 -->
    /**
    * 中绿色十六进制值
    */
    public static MEDIUMAQUAMARINE = 0x66cdaa; // <!--中绿色 -->
    /**
    * 菊兰色十六进制值
    */
    public static CORNFLOWERBLUE = 0x6495ed; // <!--菊兰色 -->
    /**
    * 军兰色十六进制值
    */
    public static CADETBLUE = 0x5f9ea0; // <!--军兰色 -->
    /**
    * 暗橄榄绿色十六进制值
    */
    public static DARKOLIVEGREEN = 0x556b2f; // <!--暗橄榄绿-->
    /**
    * 靛青色十六进制值
    */
    public static INDIGO = 0x4b0082; // <!--靛青色 -->
    /**
    * 中绿宝石色十六进制值
    */
    public static MEDIUMTURQUOISE = 0x48d1cc; // <!--中绿宝石 -->
    /**
    * 暗灰蓝色十六进制值
    */
    public static DARKSLATEBLUE = 0x483d8b; // <!--暗灰蓝色 -->
    /**
    * 钢兰色十六进制值
    */
    public static STEELBLUE = 0x4682b4; // <!--钢兰色 -->
    /**
    * 皇家蓝色十六进制值
    */
    public static ROYALBLUE = 0x4169e1; // <!--皇家蓝 -->
    /**
    * 青绿色十六进制值
    */
    public static TURQUOISE = 0x40e0d0; // <!--青绿色 -->
    /**
    * 中海蓝色十六进制值
    */
    public static MEDIUMSEAGREEN = 0x3cb371; // <!--中海蓝 -->
    /**
    * 橙绿色十六进制值
    */
    public static LIMEGREEN = 0x32cd32; // <!--橙绿色 -->
    /**
    * 暗瓦灰色十六进制值
    */
    public static DARKSLATEGRAY = 0x2f4f4f; // <!--暗瓦灰色 -->
    /**
    * 海绿色十六进制值
    */
    public static SEAGREEN = 0x2e8b57; // <!--海绿色 -->
    /**
    * 森林绿十六进制值
    */
    public static FORESTGREEN = 0x228b22; // <!--森林绿 -->
    /**
    * 亮海蓝色十六进制值
    */
    public static LIGHTSEAGREEN = 0x20b2aa; // <!--亮海蓝色 -->
    /**
    * 闪兰色十六进制值
    */
    public static DODGERBLUE = 0x1e90ff; // <!--闪兰色 -->
    /**
    * 中灰兰色十六进制值
    */
    public static MIDNIGHTBLUE = 0x191970; // <!--中灰兰色 -->
    /**
    * 浅绿色十六进制值
    */
    public static AQUA = 0x00ffff; // <!--浅绿色 -->
    /**
    * 青色十六进制值
    */
    public static CYAN = 0x00ffff; // <!--青色 -->
    /**
    * 春绿色十六进制值
    */
    public static SPRINGGREEN = 0x00ff7f; // <!--春绿色 -->
    /**
    * 酸橙色十六进制值
    */
    public static LIME = 0x00ff00; // <!--酸橙色 -->
    /**
    * 中春绿色十六进制值
    */
    public static MEDIUMSPRINGGREEN = 0x00fa9a; // <!--中春绿色 -->
    /**
    * 暗宝石绿色十六进制值
    */
    public static DARKTURQUOISE = 0x00ced1; // <!--暗宝石绿 -->
    /**
    * 深天蓝色十六进制值
    */
    public static DEEPSKYBLUE = 0x00bfff; // <!--深天蓝色 -->
    /**
    * 暗青色十六进制值
    */
    public static DARKCYAN = 0x008b8b; // <!--暗青色 -->
    /**
    * 水鸭色十六进制值
    */
    public static TEAL = 0x008080; // <!--水鸭色 -->
    /**
    * 绿色十六进制值
    */
    public static GREEN = 0x008000; // <!--绿色 -->
    /**
    * 暗绿色十六进制值
    */
    public static DARKGREEN = 0x006400; // <!--暗绿色 -->
    /**
    * 蓝色十六进制值
    */
    public static BLUE = 0x0000ff; // <!--蓝色 -->
    /**
    * 中兰色十六进制值
    */
    public static MEDIUMBLUE = 0x0000cd; // <!--中兰色 -->
    /**
    * 暗蓝色十六进制值
    */
    public static DARKBLUE = 0x00008b; // <!--暗蓝色 -->
    /**
    * 海军色十六进制值
    */
    public static NAVY = 0x000080; // <!--海军色 -->
    /**
    * 黑色十六进制值
    */
    public static BLACK = 0x000000; // <!--黑色 -->

}
