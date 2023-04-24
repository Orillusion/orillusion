import { GLSLSyntax } from './GLSLSyntax';
import { Reader } from './Reader';
import { ShaderAttributeInfo, ShaderConverterResult, ShaderUniformInfo } from './ShaderConverter';
import { SN_Declaration, SN_Layout, SN_Struct, StatementNode } from './StatementNode';

/**
 * @internal
 * WGSLCode Translator
 * @group GFX
 */
export class WGSLTranslator {
    public result: string;
    public ASTRoot: StatementNode;
    protected _syntax: GLSLSyntax;

    constructor(syntax: GLSLSyntax) {
        this.result = '';
        this._syntax = syntax;
        this.ASTRoot = syntax.ASTRoot;
    }

    /**
     * Generate WGSL code
     * @returns WGSL code
     */
    public generateWGSL(): ShaderConverterResult {
        let context = new TranslatorContext();
        var result = new ShaderConverterResult();
        let layoutsBuffer: Array<SN_Layout> = [];
        let layoutsUniform: Array<SN_Layout> = [];
        let statements: Array<StatementNode> = [];

        // Extract layout description
        for (let item of this.ASTRoot.nodes) {
            if (item instanceof SN_Layout) {
                if (item.scope == 'in') {
                    if (item.nodes[0] instanceof SN_Declaration) {
                        context.layoutsIn.push(item);
                        let info = new ShaderAttributeInfo();
                        info.name = item.nodes[0].name;
                        info.type = item.nodes[0].type;
                        info.locationID = Number.parseInt(item.qualifier.get('location'));
                        result.inputAttribute.push(info);
                    } else if (item.qualifier.has('local_size_x')) {
                        context.workGroupSize = item;
                    } else throw 'not impl';
                } else if (item.scope == 'out') {
                    context.layoutsOut.push(item);
                    if (item.nodes[0] instanceof SN_Declaration) {
                        let info = new ShaderAttributeInfo();
                        info.name = item.nodes[0].name;
                        info.type = item.nodes[0].type;
                        info.locationID = Number.parseInt(item.qualifier.get('location'));
                        result.outputAttribute.push(info);
                    } else throw 'not impl';
                } else if (item.scope == 'uniform') {
                    layoutsUniform.push(item);
                    if (item.nodes[0] instanceof SN_Declaration) {
                        let info = new ShaderUniformInfo();
                        info.name = item.nodes[0].name;
                        info.type = item.nodes[0].type;
                        info.setID = Number.parseInt(item.qualifier.get('set'));
                        info.bindingID = Number.parseInt(item.qualifier.get('binding'));
                        result.uniformInfo.push(info);
                    } else if (item.nodes[0] instanceof SN_Struct) {
                        let info = new ShaderUniformInfo();
                        info.name = 'unif' + result.uniformInfo.length.toString();
                        info.type = item.nodes[0].name;
                        info.setID = Number.parseInt(item.qualifier.get('set'));
                        info.bindingID = Number.parseInt(item.qualifier.get('binding'));
                        result.uniformInfo.push(info);
                    } else throw 'not impl';
                } else if (item.scope == 'buffer') {
                    layoutsBuffer.push(item);
                }
            } else {
                statements.push(item);
            }
        }

        // Extracting built-in variables
        context.stage = 'fragment';
        let position: number = 0;
        let reader: Reader = new Reader('');
        let source: string = this._syntax.lexer.source;
        let unique: Map<string, string> = new Map<string, string>();
        while ((position = source.indexOf('gl_', position)) != -1) {
            reader.reset(source.substring(position, position + 32));
            reader.readChar();
            let name = reader.readIdentifier();
            position += name.length;
            if (unique.has(name)) {
                continue;
            }
            unique.set(name, name);
            switch (name) {
                case 'gl_InstanceID':
                    context.stage = 'vertex';
                    context.builtinIn.push('@builtin(instance_index) gl_InstanceID: u32');
                    break;
                case 'gl_Position':
                    context.stage = 'vertex';
                    context.builtinOut.push('@builtin(position) gl_Position: vec4<f32>');
                    context.addIdentifier('gl_Position', 'stout.gl_Position');
                    break;
                case 'gl_VertexIndex':
                    context.stage = 'vertex';
                    context.builtinIn.push('@builtin(vertex_index) gl_VertexIndex: u32');
                    break;

                case 'gl_FrontFacing':
                    context.stage = 'fragment';
                    context.builtinIn.push('@builtin(front_facing) gl_FrontFacing: bool');
                    break;
                case 'gl_FragDepth':
                    context.stage = 'fragment';
                    context.builtinOut.push('@builtin(frag_depth) gl_FragDepth: f32');
                    context.addIdentifier('gl_FragDepth', 'stout.gl_FragDepth');
                    break;

                case 'gl_WorkGroupID':
                    context.stage = 'compute';
                    context.builtinIn.push('@builtin(workgroup_id) gl_WorkGroupID: vec3<u32>');
                    break;
                case 'gl_NumWorkGroups':
                    context.stage = 'compute';
                    context.builtinIn.push('@builtin(num_workgroups) gl_NumWorkGroups: vec3<u32>');
                    break;
                case 'gl_LocalInvocationID':
                    context.stage = 'compute';
                    context.builtinIn.push('@builtin(local_invocation_id) gl_LocalInvocationID: vec3<u32>');
                    break;
                case 'gl_LocalInvocationIndex':
                    context.stage = 'compute';
                    context.builtinIn.push('@builtin(local_invocation_index) gl_LocalInvocationIndex: u32');
                    break;
                case 'gl_GlobalInvocationID':
                    context.stage = 'compute';
                    context.builtinIn.push('@builtin(global_invocation_id) gl_GlobalInvocationID: vec3<u32>');
                    break;
                default:
                    throw 'Unprocessed built-in variables: ' + name;
            }
        }

        // Translate to WGSL
        for (let item of layoutsUniform) {
            if (item.nodes[0] instanceof SN_Struct) {
                result.sourceCode += item.nodes[0].formatToWGSL(context, 0);
                result.sourceCode += '\r\n';
            }
        }
        for (let item of layoutsUniform) {
            result.sourceCode += item.formatToWGSL(context, 0);
        }
        result.sourceCode += '\r\n';

        for (let item of layoutsBuffer) {
            if (item.nodes[0] instanceof SN_Struct) {
                result.sourceCode += item.nodes[0].formatToWGSL(context, 0);
                result.sourceCode += '\r\n';
            }
        }
        for (let item of layoutsBuffer) {
            result.sourceCode += item.formatToWGSL(context, 0);
        }
        result.sourceCode += '\r\n';

        for (let item of statements) {
            result.sourceCode += item.formatToWGSL(context, 0);
            if (item instanceof SN_Declaration) {
                result.sourceCode += ';\r\n';
            }
        }
        return result;
    }
}

/**
 * The translator context
 * @internal
 * @group GFX
 */
export class TranslatorContext {
    protected _stage: string = 'fragment';
    protected _builtinIn: Array<string> = [];
    protected _builtinOut: Array<string> = [];
    protected _layoutsIn: Array<SN_Layout> = [];
    protected _layoutsOut: Array<SN_Layout> = [];
    protected _layoutUniformCount: number = 0;
    protected _workGroupSize: SN_Layout = undefined;

    protected _parentContext?: TranslatorContext;
    protected _identifierEnv: Map<string, string> = new Map<string, string>();

    constructor(context?: TranslatorContext) {
        this._parentContext = context;
    }

    public get stage(): string {
        if (this.parentContext != undefined) {
            return this.parentContext.stage;
        }
        return this._stage;
    }

    public set stage(value: string) {
        if (this.parentContext != undefined) {
            this.parentContext.stage = value;
        }
        this._stage = value;
    }

    public get builtinIn(): Array<string> {
        if (this.parentContext != undefined) {
            return this.parentContext.builtinIn;
        }
        return this._builtinIn;
    }

    public get builtinOut(): Array<string> {
        if (this.parentContext != undefined) {
            return this.parentContext.builtinOut;
        }
        return this._builtinOut;
    }

    public get layoutsIn(): Array<SN_Layout> {
        if (this.parentContext != undefined) {
            return this.parentContext.layoutsIn;
        }
        return this._layoutsIn;
    }

    public get layoutsOut(): Array<SN_Layout> {
        if (this.parentContext != undefined) {
            return this.parentContext.layoutsOut;
        }
        return this._layoutsOut;
    }

    public get layoutUniformCount(): number {
        if (this.parentContext != undefined) {
            return this.parentContext.layoutUniformCount;
        }
        return this._layoutUniformCount;
    }

    public set layoutUniformCount(value: number) {
        if (this.parentContext != undefined) {
            this.parentContext.layoutUniformCount = value;
            return;
        }
        this._layoutUniformCount = value;
    }

    public get workGroupSize(): SN_Layout {
        if (this.parentContext != undefined) {
            return this.parentContext.workGroupSize;
        }
        return this._workGroupSize;
    }

    public set workGroupSize(value: SN_Layout) {
        if (this.parentContext != undefined) {
            this.parentContext.workGroupSize = value;
        }
        this._workGroupSize = value;
    }

    public get parentContext(): TranslatorContext | undefined {
        return this._parentContext;
    }

    public findIdentifier(name: string): string {
        if (this._identifierEnv.has(name)) {
            return this._identifierEnv.get(name) as string;
        }
        if (this._parentContext != undefined) {
            return this._parentContext.findIdentifier(name);
        }

        return name;
    }

    public addIdentifier(name: string, value: string) {
        this._identifierEnv.set(name, value);
    }

    public hasIdentifier(name: string): boolean {
        return this._identifierEnv.has(name);
    }
}
