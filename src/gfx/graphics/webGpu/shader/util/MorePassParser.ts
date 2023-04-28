import { Preprocessor } from "./Preprocessor";

export class MorePassShader {
    public name: string = '';
    public passMap: Map<string, PassShader[]> = new Map<string, PassShader[]>();
}

export class PassShader {
    public passType: string = '';
    public shaderState: Map<string, any> = new Map<string, any>();
    public vertexShader: string = '';
    public fragmentShader: string = '';
}

export class MorePassParser {
    protected static passKeyword = 'pass';
    protected static shaderKeyword = 'Shader';
    protected static vertexKeyword = 'vertex';
    protected static fragmentKeyword = 'fragment';
    protected static passTypeKeyword = 'PassType';

    public static parser(code: string, defineValue: { [name: string]: any }): MorePassShader {
        code = Preprocessor.filterComment(code);
        let result = new MorePassShader();
        let index1 = code.indexOf(this.shaderKeyword);
        let index2 = code.indexOf("{", index1);
        let block = code.substring(index1 + this.shaderKeyword.length, index2).trim();
        result.name = block.substring(1, block.length - 1);
        block = code.substring(code.indexOf("{") + 1, code.lastIndexOf("}"));
        let passBlocks = this.splitPassBlock(block);
        for (let passCode of passBlocks) {
            let passShader = this.parserPassBlock(passCode);
            let passshaderList: PassShader[];
            if (result.passMap.has(passShader.passType)) {
                passshaderList = result.passMap.get(passShader.passType);
            } else {
                passshaderList = [];
                result.passMap.set(passShader.passType, passshaderList);
            }
            passshaderList.push(passShader);

            if (passShader.vertexShader.length > 0) {
                passShader.vertexShader = Preprocessor.parse(passShader.vertexShader, defineValue);
            }
            if (passShader.fragmentShader.length > 0) {
                passShader.fragmentShader = Preprocessor.parse(passShader.fragmentShader, defineValue);
            }
        }
        return result;
    }

    protected static splitPassBlock(code: string): string[] {
        let offset = 0;
        let result: string[] = [];
        while (offset < code.length) {
            let index = code.indexOf(this.passKeyword, offset);
            if (index == -1) {
                result.push(code.substring(offset));
                break;
            }
            if (offset != 0) {
                result.push(code.substring(offset, index));
            }
            offset = index + this.passKeyword.length;
        }
        return result;
    }

    protected static parserPassBlock(code: string): PassShader {
        let passShader: PassShader = new PassShader();
        let index1 = code.indexOf(this.passTypeKeyword);
        let index2 = code.indexOf('"', index1);
        index1 = code.indexOf('"', index2 + 1);
        passShader.passType = code.substring(index1 + 1, index2).trim();

        this.parserShaderState(passShader, code);

        index1 = code.indexOf(this.vertexKeyword);
        if (index1 != -1) {
            passShader.vertexShader = this.extractBlock(code.substring(index1 + this.vertexKeyword.length), '{', '}');
        }

        index1 = code.indexOf(this.fragmentKeyword);
        if (index1 != -1) {
            passShader.fragmentShader = this.extractBlock(code.substring(index1 + this.fragmentKeyword.length), '{', '}');
        }
        return passShader;
    }

    protected static parserShaderState(passShader: PassShader, code: string): boolean {
        let indexL = code.indexOf("ShaderState");
        if (indexL == -1)
            return false;
        indexL = code.indexOf("{", indexL);
        let indexR = code.indexOf("}", indexL);
        let codeBlock = code.substring(indexL + 1, indexR);
        let fields = codeBlock.split(',');
        for (let item of fields) {
            let keyValue = item.split(':');
            let key = keyValue[0].trim();
            let value = this.convertValue(keyValue[1].trim());
            passShader.shaderState.set(key, value);
        }
        return true;
    }

    protected static convertValue(str: string): number | boolean | string {
        if (str.length == 4 && str.toLowerCase() == "true")
            return true;
        else if (str.length == 5 && str.toLowerCase() == "false")
            return false;
        else if (str[0] == '"')
            return str.substring(1, str.length - 1);
        return Number.parseInt(str);
    }

    private static extractBlock(str: string, leftStr: string, rightStr: string): string {
        let indexL = str.indexOf(leftStr);
        if (indexL == -1) {
            return "";
        }
        let depth = 0;
        let indexR = 0;
        str = str.substring(indexL);
        for (let char of str) {
            if (char == leftStr) {
                depth++;
            } else if (char == rightStr) {
                depth--;
            }
            if (depth <= 0) {
                break;
            }
            indexR++;
        }
        let block = str.substring(1, indexR).trim();
        return block;
    }
}
