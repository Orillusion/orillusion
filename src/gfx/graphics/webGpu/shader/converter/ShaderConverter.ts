import { GLSLLexer } from './GLSLLexer';
import { GLSLPreprocessor } from './GLSLPreprocessor';
import { GLSLSyntax } from './GLSLSyntax';
import { WGSLTranslator } from './WGSLTranslator';

/**
 * @internal
 * Shader converter
 * @group GFX
 */
export class ShaderConverter {
    /**
     * Shader type: Vertex stage
     */
    static VertexShader: string = 'VertexShader';

    /**
     * Shader type: Fragment stage
     */
    static FragmentShader: string = 'FragmentShader';

    /**
     * Convert GLSL code to WGSL
     * @param source GLSL
     * @returns WGSL
     */
    static convertGLSL(source: string): ShaderConverterResult {
        // source -> Preprocessor -> NewSource
        var preprocessor = new GLSLPreprocessor(source);

        // NewSource -> Lexer -> Tokens
        var lexer = new GLSLLexer(preprocessor);

        // Tokens -> Syntax -> AST
        var syntax = new GLSLSyntax(lexer);

        // AST -> WGSLTranslator -> Result
        var translator = new WGSLTranslator(syntax);

        return translator.generateWGSL();
    }
}

/**
 * @internal
 * @group GFX
 */
export class ShaderUniformInfo {
    public setID: number = 0;
    public bindingID: number = 0;
    public name: string = '';
    public type: string = '';
}

/**
 * @internal
 * @group GFX
 */
export class ShaderAttributeInfo {
    public name: string = '';
    public type: string = '';
    public locationID: number = 0;
    public builtinName: string = '';
    public isBuiltinAttribute(): boolean {
        return this.builtinName != '';
    }
}

/**
 * @internal
 * @group GFX
 */
export class ShaderConverterResult {
    public uniformInfo: Array<ShaderUniformInfo> = [];
    public inputAttribute: Array<ShaderAttributeInfo> = [];
    public outputAttribute: Array<ShaderAttributeInfo> = [];
    public sourceCode: string = '';
}
