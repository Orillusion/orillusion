/**
 * String processing tool class
 * @group Util
 */
export class StringUtil {
    private static _filterChar: string[] = [' ', '  ', ';', '\n', '\r', '\t', '\n', '\r', '\t'];

    /**
     *
     * Does the string exist
     * @param fields List of detected string
     * @param str source string
     * @returns Return the index position where it is located. If it does not exist, return -1
     */
    public static hasString(fields: Array<string>, str: string): number {
        for (var i: number = 0; i < fields.length; ++i) {
            if (fields[i] == str) {
                return i;
            }
        }

        return -1;
    }

    /**
     * Gets an ellipsis terminated string representation that exceeds the range
     * @param str source string
     * @param len range of string
     * @returns result string
     */
    public static getEllipsis(str, len: number = 4): string {
        let name = str;
        if (name.length > len) name = name.slice(0, len) + '...';

        return name;
    }

    /**
     * get name based on URL
     * @param url source url
     * @returns name
     */
    public static getURLName(url: string): string {
        var urlArray: string[];
        urlArray = url.split('/');
        let name = urlArray[urlArray.length - 1];
        name = name.split('.')[0];
        return name;
    }


    /**
     * get suffix of file name from url
     * @param url source url
     * @returns suffix
     */
    public static getFileFormat(url: string): string {
        var startPos: number = url.lastIndexOf('.');
        startPos++;
        var endPos = url.length;
        if (url.indexOf('?', startPos) !== -1) {
            endPos = url.indexOf('?', startPos);
        }
        var fileFormat: string = url.substr(startPos, endPos - startPos);
        fileFormat = fileFormat.toLowerCase();
        return fileFormat;
    }

    /**
     * get information stored in a string
     * @param line source string
     * @param data result data reference
     */
    public static readLineProperty(line: string, data: any) {
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

    public static getPath(url: string): string {
        var s_pos: number = url.lastIndexOf('/');
        s_pos++;
        return url.substring(0, s_pos);
    }

    public static normalizePath(url: string): string {
        var tmp: string = url.replaceAll(`//`, `\/`);
        tmp = tmp.replaceAll(`\\`, `\/`);
        return tmp;
    }

    // public static ab2str(byte: ByteArray, block:number = 65535):string {
    //   //  return String.fromCharCode.apply(null, new Uint8Array(buf));
    //     var str: string = "";
    //     var oldPos: number = byte.position;
    //     var length: number = block;
    //     while (byte.position < byte.length) {
    //         length = block;
    //         if (byte.length - byte.position < length) {
    //             length = byte.length - byte.position;
    //         }
    //         str += byte.readUTFBytes(length);
    //     }
    //     byte.position = oldPos;

    //     return str;
    // }

    // public static str2ab(str: string):ByteArray {
    //     var byte: ByteArray = new ByteArray();

    //     byte.writeUTFBytes(str);
    //     return byte;
    // }

    /**
     * Used to cut specified characters
     * @param str source string
     * @param char cut string
     * @returns result string array
     */
    public static getStringList(str: string, char: string = ';'): string[] {
        return str.split(char);
    }

    /**
     * Format timestamp data
     * @param time timestamp
     * @returns
     */
    public static formatTime(time: number): string[] {
        let t = time / 1000;
        let temp = t / 60;
        let m = Math.floor(temp);
        let s = Math.floor(temp - m);

        return [m.toString(), s.toString()];
    }

    /**
     * trim
     * @param str source string
     * @returns result string
     */
    static trim(str) {
        return str.replace(/^\s+/g, '').replace(/\s+$/g, '');
    }

    /**
     * Determine if the string is empty, null, '' or 'null'
     * @param value source string
     * @returns boolean
     */
    static isEmpty(value) {
        return !value || typeof value == 'undefined' || value == null || (typeof value === 'string' && this.trim(value) === '') || value === 'null';
    }

    /**
     * Handle strings that exceed the length range, such as adding strings that exceed the range
     * @param str source string
     * @param len length
     * @returns result string
     */
    static strCut(str, len): string {
        if (str.length * 2 <= len) {
            return str;
        }
        var strlen = 0;
        var s = '';
        for (var i = 0; i < str.length; i++) {
            s = s + str.charAt(i);
            if (str.charCodeAt(i) > 128) {
                strlen = strlen + 2;
                if (strlen >= len) {
                    return s.substring(0, s.length - 1) + '...';
                }
            } else {
                strlen = strlen + 1;
                if (strlen >= len) {
                    return s.substring(0, s.length - 2) + '...';
                }
            }
        }
        return s;
    }

    /**
     * According to the splicing request parameters
     * @param key key string
     * @param value value string
     * @param isEncodeURI isEncodeURI
     * @returns result string
     */
    static toQueryPair(key, value, isEncodeURI = false): string {
        return key + '=' + (isEncodeURI ? encodeURIComponent(value) : value);
    }

    /**
     * format a string
     * @param str source string
     * @param params Pass in a regular processing parameter array
     * @returns result string
     */
    static stringFormat(str: string, ...params): string {
        if (arguments.length === 0) throw new Error('please give arg at least one !');

        if (arguments.length === 2 && typeof arguments[1] === 'object') {
            for (let key in arguments[1]) {
                let reg = new RegExp('({' + key + '})', 'g');
                str = str.replace(reg, arguments[1][key]);
            }
        } else {
            for (let i = 0; i < params.length; i++) {
                if (params[i] == undefined) {
                    return str;
                } else {
                    let reg = new RegExp('({[' + i + ']})', 'g');
                    str = str.replace(reg, params[i]);
                }
            }
        }
        return str;
    }

    /**
     * Convert JSON objects to strings
     * @param json object of json
     * @param options
     * @returns result string
     */
    static parseJson2String(json, options?): string {
        let reg = null,
            formatted = '',
            pad = 0,
            PADDING = '    ';
        options = options || {};
        options.newlineAfterColonIfBeforeBraceOrBracket = options.newlineAfterColonIfBeforeBraceOrBracket === true ? true : false;
        options.spaceAfterColon = options.spaceAfterColon === false ? false : true;
        if (typeof json !== 'string') {
            json = JSON.stringify(json);
        } else {
            json = JSON.parse(json);
            json = JSON.stringify(json);
        }
        reg = /([\{\}])/g;
        json = json.replace(reg, '\r\n$1\r\n');
        reg = /([\[\]])/g;
        json = json.replace(reg, '\r\n$1\r\n');
        reg = /(\,)/g;
        json = json.replace(reg, '$1\r\n');
        reg = /(\r\n\r\n)/g;
        json = json.replace(reg, '\r\n');
        reg = /\r\n\,/g;
        json = json.replace(reg, ',');

        if (!options.newlineAfterColonIfBeforeBraceOrBracket) {
            reg = /\:\r\n\{/g;
            json = json.replace(reg, ':{');
            reg = /\:\r\n\[/g;
            json = json.replace(reg, ':[');
        }
        if (options.spaceAfterColon) {
            reg = /\:/g;
            json = json.replace(reg, ':');
        }
        json.split('\r\n').forEach(function (node, index) {
            let i = 0,
                indent = 0,
                padding = '';

            if (node.match(/\{$/) || node.match(/\[$/)) {
                indent = 1;
            } else if (node.match(/\}/) || node.match(/\]/)) {
                if (pad !== 0) {
                    pad -= 1;
                }
            } else {
                indent = 0;
            }

            for (i = 0; i < pad; i++) {
                padding += PADDING;
            }

            formatted += padding + node + '\r\n';
            pad += indent;
        });
        return formatted;
    }

    /**
     * Compatibility mode - version comparison
     * @param v1 Version 1
     * @param v2 Version 2
     * @returns Returns 1, -1, or 0, indicating that the version number is greater, less, or equal, respectively
     */
    static compareVersion(v1, v2) {
        v1 = v1.split('.');
        v2 = v2.split('.');
        let len = Math.max(v1.length, v2.length);

        while (v1.length < len) {
            v1.push('0');
        }
        while (v2.length < len) {
            v2.push('0');
        }

        for (let i = 0; i < len; i++) {
            let num1 = parseInt(v1[i]);
            let num2 = parseInt(v2[i]);

            if (num1 > num2) {
                return 1;
            } else if (num1 < num2) {
                return -1;
            }
        }

        return 0;
    }

    /**
     * Generate non repeating random string codes
     * @returns result
     */
    static buildRandomCode() {
        let words = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let len = words.length;
        let str = '';
        for (let i = 0; i < 26; i++) {
            let rand = Math.floor(Math.random() * len);
            str += words.charAt(rand);
        }
        let millisecond = new Date().getTime();
        return `${millisecond}-${str}`;
    }

    /**
     * UUID
     * @returns UUID
     */
    static UUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (Math.random() * 16) | 0,
                v = c == 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    /**
     * make hash code
     * @param str source value
     * @returns hash code
     */
    public static stringToHash(str) {
        let hash = 0;
        if (str.length == 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }

    /**
     * Convert GLTF URL Address
     * @param base baseURL
     * @param url source url
     * @returns result url
     */
    public static parseUrl(base: string, url: string) {
        return url.match(/^(blob|http|https):/) ? url : base + url
    }
    // public static readLineProperty(line:string){
    //     fnt.trim().split('\r\n').forEach((v,i)=>{
    //         if(i<2){
    //             FntParser.readLineProperty(v,fontData);
    //         }else{
    //             if(i<fontData.pages+2){
    //                 let page = new FontPage();
    //                 FntParser.readLineProperty(v,page);
    //                 fontData.fontPage.push(page);
    //             }else if(i<fontData.pages+3){
    //                 FntParser.readLineProperty(v,fontData);
    //             }else{
    //                 if(fontData.count>0){
    //                     let char = new FontChar();
    //                     FntParser.readLineProperty(v,char);
    //                     fontData.fontChar[char.id] = char ;
    //                     fontData.count--;
    //                 }
    //             }
    //         }
    //     })
    // }
}

//export class XMLParser {
//    private _parser: any;
//    private _isSupportDOMParser: boolean = false;
//    constructor() {
//        if (window["DOMParser"]) {
//            this._isSupportDOMParser = true;
//            this._parser = new DOMParser();
//        } else {
//            this._isSupportDOMParser = false;
//        }
//    }

//    public parse(textxml:string) {
//        // get a reference to the requested corresponding xml file
//        var xmlDoc;
//        if (this._isSupportDOMParser) {
//            xmlDoc = this._parser.parseFromString(textxml, "text/xml");
//        } else {
//            // Internet Explorer (untested!)
//            xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
//            xmlDoc.async = "false";
//            xmlDoc.loadXML(textxml);
//        }
//        return xmlDoc;
//    }

//    public eachXmlAttr(item: Node, fun: Function): void {
//        if (item == null || fun == null)
//            return;
//        var attr: Attr;
//        for (var i: number = 0, count = item.attributes.length; i < count; i++) {
//            attr = item.attributes[i];
//            fun(attr.name, attr.value);
//        }
//    }
//}

//export let xmlPaser = new XMLParser();
