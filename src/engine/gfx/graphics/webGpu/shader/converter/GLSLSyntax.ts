import { GLSLLexer } from './GLSLLexer';
import { GLSLLexerToken, TokenType } from './GLSLLexerToken';
import { SN_BinaryOperation, SN_Declaration, SN_Expression, SN_Function, SN_Identifier, SN_Layout, SN_Precision, SN_Struct, StatementNode } from './StatementNode';

/**
 * @internal
 * GLSL code parser
 * @group GFX
 */
export class GLSLSyntax {
    private _lexer: GLSLLexer;
    private _rootNode: StatementNode;

    constructor(input: GLSLLexer) {
        this._lexer = input;
        this._rootNode = new StatementNode();
        this.parse();
    }

    public get lexer(): GLSLLexer {
        return this._lexer;
    }

    private parse() {
        while (this.peekToken(0).Type !== TokenType.EOF) {
            if (this.peekToken(0).Type == TokenType.SEMICOLON) {
                this.skipToken(1);
                continue;
            }

            let node = this.parseStatement();
            if (node !== null) {
                this._rootNode.addNode(node);
            }
        }
    }

    private parseStatement(): StatementNode {
        let first = this.peekToken();

        /**
         * layout(location = 0) in vec2 v_Uv;
         * layout(location = 0) out vec4 o_Target;
         * layout(set = 1, binding = 1) uniform texture2D ColorMaterial_texture;
         */
        if (first.Type == TokenType.LAYOUT && this.peekToken(1).Type == TokenType.LEFTSAMLL) {
            let layoutNode = SN_Layout.parse(this._lexer);
            return layoutNode;
        } else if (first.Type == TokenType.STRUCT) {
            /**
             * Declaration of structure
             */
            this.skipToken(1);
            let structNode = SN_Struct.parse(this._lexer);
            return structNode;
        } else if (
            /**
             * function declaration
             */
            (first.isBuiltinType() || first.Type == TokenType.VOID) &&
            this.peekToken(1).Type == TokenType.IDENT &&
            this.peekToken(2).Type == TokenType.LEFTSAMLL
        ) {
            let functionDec = SN_Function.parse(this._lexer);
            return functionDec;
        } else if (
            /**
             * Constant declaration
             * const int a = ...;
             */
            first.Type == TokenType.CONST &&
            this.peekToken(1).isDataType()
        ) {
            let declarationNode = SN_Declaration.parse(this._lexer);
            return declarationNode;
        } else if (
            /**
             * Declaration of variables
             * int a = ...;
             */
            first.isDataType() &&
            this.peekToken(1).Type == TokenType.IDENT
        ) {
            let declarationNode = SN_Declaration.parse(this._lexer);
            return declarationNode;
        } else if (
            /**
             * Declaration of variables
             * out float a = ...;
             */
            first.Type == TokenType.OUT &&
            this.peekToken(1).isDataType() &&
            this.peekToken(2).Type == TokenType.IDENT
        ) {
            let declarationNode = SN_Declaration.parse(this._lexer);
            return declarationNode;
        } else if (first.Type == TokenType.PRECISION) {
            /**
             * precision mediump float;
             */
            let precisionNode = SN_Precision.parse(this._lexer);
            return precisionNode;
        }

        throw 'Error parsing statement: Unexpected character';
    }

    private skipToken(offset: number) {
        this._lexer.skipToken(offset);
    }

    private peekToken(offset: number = 0): GLSLLexerToken {
        return this._lexer.peekToken(offset);
    }

    private getNextToken(): GLSLLexerToken {
        return this._lexer.GetNextToken();
    }

    public get ASTRoot(): StatementNode {
        return this._rootNode;
    }
}
