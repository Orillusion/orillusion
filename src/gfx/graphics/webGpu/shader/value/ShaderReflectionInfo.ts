import { VertexAttributeSize } from '../../../../../core/geometry/VertexAttributeSize';
import { VertexFormat } from '../../../../../core/geometry/VertexFormat';
import { ComputeShader } from '../ComputeShader';
import { RenderShader } from '../RenderShader';
import { ShaderBase } from '../ShaderBase';
import { Preprocessor } from '../util/Preprocessor';
import { ShaderValue } from './ShaderValue';

/**
 * @internal
 */
export type ShaderReflectionAttribute = {
    name: string;
    group: number;
    location: number;
    type: string;
    valueType: string;
    value: number;
    size: number;
    format: GPUVertexFormat;
};

/**
 * @internal
 */
export type ShaderReflectionVarInfo = {
    group: number;
    binding: number;
    varType: string;
    varName: string;
    dataType: string;
    dataIsBuiltinType: boolean;
    dataFields: ShaderReflectionStructInfo[];
};

/**
 * @internal
 */
export type ShaderReflectionStructInfo = {
    name: string;
    type: string;
};

/**
 * @internal
 */
export class ShaderReflection {
    private static _shaderReflectionMap: Map<string, ShaderReflection> = new Map<string, ShaderReflection>();

    public attributes: ShaderReflectionAttribute[] = [];

    public vs_variables: ShaderReflectionVarInfo[] = [];

    public fs_variables: ShaderReflectionVarInfo[] = [];

    public cs_variables: ShaderReflectionVarInfo[] = [];

    public groups: ShaderReflectionVarInfo[][] = [];

    public variables: { [name: string]: ShaderReflectionVarInfo } = {};

    public useSplit: boolean = false;

    /**
     *
     * @param wgsl
     * @param shaderReflection
     */
    public static parser(wgsl: string, shaderValue: ShaderValue) {
        if (!shaderValue.shaderReflection) shaderValue.shaderReflection = new ShaderReflection();
        if (wgsl.indexOf(`@vertex`) != -1) {
            shaderValue.shaderReflection.attributes = this.parserVertexOld(wgsl);
            shaderValue.shaderReflection.vs_variables = this.parserVariables(wgsl);
        } else if (wgsl.indexOf(`@fragment`) != -1) {
            shaderValue.shaderReflection.fs_variables = this.parserVariables(wgsl);
        } else if (wgsl.indexOf(`@compute`) != -1) {
            shaderValue.shaderReflection.cs_variables = this.parserVariables(wgsl);
        }
    }

    public static parser2(wgsl: string, shaderBase: ShaderBase) {
        if (!shaderBase.shaderReflection) shaderBase.shaderReflection = new ShaderReflection();
        let shaderReflection = shaderBase.shaderReflection;
        if (wgsl.indexOf(`@vertex`) != -1) {
            shaderReflection.attributes = this.parserVertex(shaderBase.vsEntryPoint, wgsl);
            shaderReflection.vs_variables = this.parserVariables(wgsl);
        } else if (wgsl.indexOf(`@fragment`) != -1) {
            shaderReflection.fs_variables = this.parserVariables(wgsl);
        } else if (wgsl.indexOf(`@compute`) != -1) {
            shaderReflection.cs_variables = this.parserVariables(wgsl);
        }

        if (wgsl.indexOf("splitTexture") != -1) {
            shaderReflection.useSplit = true;
        }
    }

    public static combineShaderReflectionVarInfo(shaderReflection: ShaderReflection, shader_variables: ShaderReflectionVarInfo[]) {
        for (const iterator of shader_variables) {
            if (!shaderReflection.groups[iterator.group]) {
                shaderReflection.groups[iterator.group] = [];
            }

            let combineInfo = iterator;
            if (shaderReflection.groups[iterator.group][iterator.binding]) {
                let aInfo = shaderReflection.groups[iterator.group][iterator.binding];
                let bInfo = iterator;
                if (aInfo.varName != bInfo.varName)
                    console.warn(`shader reflection var not match! var name vs : ${aInfo.varName} , fs : ${bInfo.varName}`);
                if (aInfo.varType != bInfo.varType)
                    console.error(`shader reflection varType not match! var varType vs : ${aInfo.varType} , fs : ${bInfo.varType}`);
                if (aInfo.dataType != bInfo.dataType)
                    console.warn(`shader reflection dataType not match! var dataType vs : ${aInfo.dataType} , fs : ${bInfo.dataType}`);
                if (aInfo.dataIsBuiltinType != bInfo.dataIsBuiltinType)
                    console.error(`shader reflection dataIsBuiltinType not match! var dataIsBuiltinType vs : ${aInfo.dataIsBuiltinType} , fs : ${bInfo.dataType}`);
                if (!aInfo.dataFields || !bInfo.dataFields) {
                    console.warn(`shader reflection dataFields is empty! var dataFields vs : ${aInfo.dataFields} , fs : ${bInfo.dataFields}`);
                }
                // if (aInfo.dataFields.length != bInfo.dataFields.length)
                //     console.warn(`shader reflection dataFields lenth not match! var dataFields vs : ${aInfo.dataFields} , fs : ${bInfo.dataFields}`);

                let fileds = [];
                if (aInfo.dataFields) {
                    for (let i = 0; i < aInfo.dataFields.length; i++) {
                        const element = aInfo.dataFields[i];
                        fileds[i] = element;
                    }
                }
                if (bInfo.dataFields) {
                    for (let i = 0; i < bInfo.dataFields.length; i++) {
                        const element = bInfo.dataFields[i];
                        fileds[i] = element;
                    }
                }
            }
            shaderReflection.groups[iterator.group][iterator.binding] = combineInfo;
            shaderReflection.variables[iterator.varName] = combineInfo;
        }
    }

    public static final(shaderBase: ShaderBase) {
        let shaderReflection = shaderBase.shaderReflection;
        this._shaderReflectionMap.set(shaderBase.shaderVariant, shaderReflection);
        this.combineShaderReflectionVarInfo(shaderReflection, shaderReflection.vs_variables);
        this.combineShaderReflectionVarInfo(shaderReflection, shaderReflection.fs_variables);
    }

    public static getShaderReflection2(code: string, shaderBase: ShaderBase) {
        if (shaderBase.shaderVariant != undefined) {
            let preShader = Preprocessor.parse(code, shaderBase.defineValue);
            ShaderReflection.parser2(preShader, shaderBase);
        }
    }

    /**
     * 
     * @param shaderVariant shader variant name 
     * @returns 
     */
    public static poolGetReflection(shaderVariant: string): ShaderReflection {
        let ref = this._shaderReflectionMap.get(shaderVariant);
        return ref;
    }

    public static genShaderVar(shaderValue: ShaderValue) {
        let shaderVariant = `${shaderValue.vs}${shaderValue.fs}${shaderValue.compute}`;
        shaderVariant += '|';
        for (const key in shaderValue.uniforms) {
            shaderVariant += key + ':';
        }
        shaderVariant += '|';
        for (const key in shaderValue.constValues) {
            shaderVariant += key + ':';
            shaderVariant += shaderValue.constValues[key];
        }
        shaderVariant += '|';
        for (const key in shaderValue.defines) {
            shaderVariant += key + ':';
            shaderVariant += shaderValue.defines[key];
        }
        shaderVariant += '|';
        for (const key in shaderValue.shaderState) {
            shaderVariant += key + ':';
            shaderVariant += shaderValue.shaderState[key] + ';';
        }
        return shaderVariant;
    }

    public static genShaderVariant(shader: ShaderBase) {
        let shaderVariant = '';
        for (const key in shader.uniforms) {
            shaderVariant += key + ':';
        }

        shaderVariant += '|';
        for (const key in shader.constValues) {
            shaderVariant += key + ':';
            shaderVariant += shader.constValues[key];
        }

        shaderVariant += '|';
        for (const key in shader.defineValue) {
            shaderVariant += key + ':';
            shaderVariant += shader.defineValue[key];
        }

        return shaderVariant;
    }

    public static genRenderShaderVariant(renderShader: RenderShader) {
        let shaderVariant = `RenderShader(${renderShader.vsName},${renderShader.fsName})`;

        shaderVariant += '|';
        shaderVariant += this.genShaderVariant(renderShader);

        shaderVariant += '|';
        for (const key in renderShader.shaderState) {
            shaderVariant += key + ':';
            shaderVariant += renderShader.shaderState[key] + ';';
        }
        return shaderVariant;
    }

    public static genComputeShaderVariant(computeShader: ComputeShader) {
        let shaderVariant = `ComputeShader(${computeShader.instanceID})`;

        shaderVariant += '|';
        shaderVariant += this.genShaderVariant(computeShader);

        return shaderVariant;
    }

    public combine(shaderValue: ShaderValue) {
        let shaderReflection = shaderValue.shaderReflection;
        let defines = shaderValue.defines;

        let tmp: { [name: string]: ShaderReflectionAttribute } = {};
        for (let i = 0; i < this.attributes.length; i++) {
            let att = this.attributes[i];
            if (defines[att.name]) tmp[att.name] = att;
        }

        let len = shaderReflection.attributes.length;
        for (let j = 0; j < len; j++) {
            const newAtt = shaderReflection.attributes[j];
            if (!tmp[newAtt.name]) {
                this.attributes.push(newAtt);
            } else {
                let oldAtt = tmp[newAtt.name];
                if (oldAtt.location == newAtt.location && oldAtt.name != newAtt.name) {
                    console.log('location must same!');
                }
            }
        }

        // if(!defines["USE_TANGENT"]){
        //   for (let i = 0; i < this.attributes.length; i++) {
        //     const element = this.attributes[i];
        //     if(element.name == VertexAttributeName.TANGENT)
        //     this.attributes.splice(i,);
        //   }
        // }
    }

    private static parserVariables(wgsl: string) {
        let position = 0;
        let variables: any[] = [];

        while (position < wgsl.length) {
            let nLeftIndex = wgsl.indexOf('@group(', position);
            if (nLeftIndex < 0) break;
            let nRightIndex = wgsl.indexOf(';', nLeftIndex);
            position = nRightIndex;

            let item = wgsl.substring(nLeftIndex, nRightIndex);
            let group = this.extract(item, '@group(', ')');
            let binding = this.extract(item, '@binding(', ')');

            let varName = '';
            let varType = 'var';
            if (item.indexOf('var<') != -1) {
                varName = this.extract(item, '>', ':');
                varType = this.extract(item, 'var<', '>').replace(',', '-').replaceAll(' ', '');
            } else {
                varName = this.extract(item, 'var', ':');
            }

            let dataType = item.substring(item.lastIndexOf(':') + 1).trim();

            let info: ShaderReflectionVarInfo = {
                group: 0,
                binding: 0,
                varType: '',
                varName: '',
                dataType: '',
                dataIsBuiltinType: true,
                dataFields: null,
            };

            info.group = Number.parseInt(group);
            info.binding = Number.parseInt(binding);
            info.varType = varType;
            info.varName = varName;
            info.dataType = dataType;
            info.dataIsBuiltinType = this.isBuiltinTypes(info.dataType);

            if (!info.dataIsBuiltinType) {
                info.dataFields = this.parserStructFields(wgsl, info.dataType);
            }

            variables.push(info);
        }

        return variables;
    }

    private static extract(str: string, leftStr: string, rightStr: string): string {
        let indexL = str.indexOf(leftStr) + leftStr.length;
        let indexR = str.indexOf(rightStr, indexL);
        return str.substring(indexL, indexR).trim();
    }

    private static isBuiltinTypes(dataType: string): boolean {
        switch (dataType) {
            case 'i32':
                return true;
            case 'u32':
                return true;
            case 'f32':
                return true;
            default:
                let index = dataType.indexOf('<');
                if (index != -1) {
                    let type = dataType.substring(0, index);
                    switch (type) {
                        case 'vec2':
                            return true;
                        case 'vec3':
                            return true;
                        case 'vec4':
                            return true;
                        case 'mat3':
                            return true;
                        case 'mat4':
                            return true;
                        case 'array':
                            return this.isBuiltinTypes(dataType.substring(index + 1, dataType.lastIndexOf('>')));
                    }
                }
                break;
        }
        return false;
    }

    private static parserStructFields(wgsl: string, structName: string) {
        let result: any[] = [];

        let position = 0;
        let variables: any[] = [];

        while (position < wgsl.length) {
            let nLeftIndex = wgsl.indexOf('struct ', position);
            if (nLeftIndex < 0) break;
            let nRightIndex = wgsl.indexOf('{', nLeftIndex);
            position = nRightIndex;

            let name = wgsl.substring(nLeftIndex + 6, nRightIndex).trim();
            if (name === structName) {
                nLeftIndex = wgsl.indexOf('{', nLeftIndex);
                nRightIndex = wgsl.indexOf('}', nLeftIndex);
                let items = wgsl.substring(nLeftIndex + 1, nRightIndex);
                let fields = items.split(',');
                for (let field of fields) {
                    let index = field.indexOf(':');
                    if (index != -1) {
                        let obj: ShaderReflectionStructInfo = {
                            name: field.substring(0, index).trim(),
                            type: field.substring(index + 1).trim(),
                        };
                        result.push(obj);
                    }
                }
                break;
            }
        }
        return result;
    }

    private static parserVertexOld(wgsl: string) {
        let attributes: any[] = [];
        let list = wgsl.split(`fn main(`);
        let block = list[1].split('->')[0];
        let blockList = block.split('@');
        if (blockList && blockList.length > 1) {
            for (let i = 1; i < blockList.length; i++) {
                const element = blockList[i];
                let code = element.replace(/\s*$/g, '');
                code = code.replaceAll(',', '');
                code = code.replaceAll('\n', '');
                code = code.replaceAll('  ', ' ');
                this.parserAttribute(code, attributes);
            }
        } else {
            let code1 = block.split(':');
            var code = code1[1];
            code = code.replaceAll('  ', '');
            code = code.replaceAll(' ', '');
            code = code.replaceAll(')', '');

            code = wgsl.split(`struct ${code}`)[1];
            let start = code.indexOf('{');
            let end = code.indexOf('}');
            code = code.slice(start, end);

            blockList = code.split('@');
            for (let i = 1; i < blockList.length; i++) {
                const element = blockList[i];
                let code = element.replace(/\s*$/g, '');
                code = code.replaceAll('\n', '');
                code = code.split(',')[0];
                code = code.replaceAll('  ', ' ');
                this.parserAttribute(code, attributes);
            }
        }
        return attributes;
    }

    private static parserVertex(entryPoint: string, wgsl: string) {
        let attributes: any[] = [];
        let list = wgsl.split(`fn ${entryPoint}(`);
        let block = list[1].split('->')[0];
        let blockList = block.split('@');
        if (blockList && blockList.length > 1) {
            for (let i = 1; i < blockList.length; i++) {
                const element = blockList[i];
                let code = element.replace(/\s*$/g, '');
                code = code.replaceAll(',', '');
                code = code.replaceAll('\n', '');
                code = code.replaceAll('  ', ' ');
                this.parserAttribute(code, attributes);
            }
        } else {
            let code1 = block.split(':');
            var code = code1[1];
            code = code.replaceAll('  ', '');
            code = code.replaceAll(' ', '');
            code = code.replaceAll(')', '');

            code = wgsl.split(`struct ${code}`)[1];
            let start = code.indexOf('{');
            let end = code.indexOf('}');
            code = code.slice(start, end);

            blockList = code.split('@');
            for (let i = 1; i < blockList.length; i++) {
                const element = blockList[i];
                let code = element.replace(/\s*$/g, '');
                code = code.replaceAll('\n', '');
                code = code.split(',')[0];
                code = code.replaceAll('  ', ' ');
                this.parserAttribute(code, attributes);
            }
        }
        return attributes;
    }

    /**
     * builtin(instance_index) index : u32
     * location(0) Vertex_Position : vec3<f32>
     * @param line
     * @param attributes
     */
    private static parserAttribute(line: string, attributes: any[]) {
        let obj: ShaderReflectionAttribute = {
            name: '',
            group: 0,
            location: 0,
            type: '',
            valueType: '',
            value: 0,
            size: 0,
            format: `float32`
        };

        if (line.indexOf('builtin') != -1) {
            obj.type = 'builtin';
            var tmp = line.match(/\((.+?)\)/g)[0];
            tmp = line.match(/\((.+?)\)/g)[0];
            tmp = tmp.replace('(', '');
            tmp = tmp.replaceAll(')', '');
            obj.location = parseInt(tmp);

            let cc = line.split(':');
            obj.name = cc[0].split(' ')[1];
            obj.name = obj.name.replaceAll('  ', ' ');
            obj.name = obj.name.replaceAll(' ', '');
            // obj.valueType = cc[1].split(' ')[1];
            obj.valueType = cc[1];
            obj.valueType = obj.valueType.replaceAll('  ', ' ');
            obj.valueType = obj.valueType.replaceAll(' ', '');
            obj.valueType = obj.valueType.replaceAll('\r', '');
            obj.valueType = obj.valueType.replaceAll(')', '');
            obj.valueType = obj.valueType.replaceAll(')', '');
            obj.size = VertexAttributeSize[obj.valueType];
            attributes.push(obj);
        } else if (line.indexOf('location') != -1) {
            obj.type = 'location';
            var tmp = line.match(/\((.+?)\)/g)[0];
            tmp = line.match(/\((.+?)\)/g)[0];
            tmp = tmp.replace('(', '');
            tmp = tmp.replaceAll(')', '');
            obj.location = parseInt(tmp);

            let cc = line.split(':');
            obj.name = cc[0].split(' ')[1];
            obj.name = obj.name.replaceAll('  ', ' ');
            obj.name = obj.name.replaceAll(' ', '');
            // obj.valueType = cc[1].split(' ')[1];
            obj.valueType = cc[1];
            obj.valueType = obj.valueType.replaceAll('  ', ' ');
            obj.valueType = obj.valueType.replaceAll(' ', '');
            obj.valueType = obj.valueType.replaceAll('\r', '');
            obj.valueType = obj.valueType.replaceAll(')', '');
            obj.valueType = obj.valueType.replaceAll(')', '');
            obj.size = VertexAttributeSize[obj.valueType];
            attributes.push(obj);
        }
        obj.format = VertexFormat[VertexAttributeSize[obj.valueType]]
    }

}
