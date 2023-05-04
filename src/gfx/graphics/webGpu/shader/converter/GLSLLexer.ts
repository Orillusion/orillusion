import { GLSLLexerToken, TokenType } from './GLSLLexerToken';
import { GLSLPreprocessor } from './GLSLPreprocessor';
import { Reader } from './Reader';

/**
 * @internal
 * GLSL Code Lexical Analyzer
 * @group GFX
 */
export class GLSLLexer extends Reader {
    private _tokenPosition: number = 0;
    private _tokens: Array<GLSLLexerToken> = [];

    constructor(input: GLSLPreprocessor) {
        super(input.source);
        this.parse();
    }

    public skipToken(offset: number) {
        this._tokenPosition += offset;
    }

    public peekToken(offset: number): GLSLLexerToken {
        if (this._tokenPosition + offset >= this._tokens.length) {
            return new GLSLLexerToken(TokenType.EOF, '\0');
        }
        return this._tokens[this._tokenPosition + offset];
    }

    public GetNextToken(): GLSLLexerToken {
        if (this._tokenPosition >= this._tokens.length) {
            return new GLSLLexerToken(TokenType.EOF, '\0');
        }
        let result = this._tokens[this._tokenPosition];
        this._tokenPosition++;
        return result;
    }

    public get currTokenPosition(): number {
        return this._tokenPosition;
    }

    // start to parse
    private parse() {
        this.readChar();
        this._tokens = new Array<GLSLLexerToken>();
        var token: GLSLLexerToken;
        do {
            token = this.nextToken();
            this._tokens.push(token);
        } while (token.Type != TokenType.EOF);
    }

    // get next token
    private nextToken(): GLSLLexerToken {
        this.skipWhitespace();

        // ignore code annotation
        if (this._char === '/') {
            // code annotation for single line
            if (this.peekChar() === '/') {
                this.skipComment();
                return this.nextToken();
            }

            // code annotation of multiple line
            if (this.peekChar() === '*') {
                this.skipMultilineComment();
                return this.nextToken();
            }
        }

        var token = new GLSLLexerToken();
        token.Line = this._line;
        token.Colume = this._column;
        switch (this._char) {
            case '\0':
                token.Type = TokenType.EOF;
                token.Literal = 'EOF';
                break;
            case '.':
                token.Type = TokenType.DOT;
                token.Literal = '.';
                break;
            case ',':
                token.Type = TokenType.COMMA;
                token.Literal = ',';
                break;
            case ':':
                token.Type = TokenType.COLON;
                token.Literal = ':';
                break;
            case '?':
                token.Type = TokenType.QUEMARK;
                token.Literal = '?';
                break;
            case ';':
                token.Type = TokenType.SEMICOLON;
                token.Literal = ';';
                break;
            case '(':
                token.Type = TokenType.LEFTSAMLL;
                token.Literal = '(';
                break;
            case ')':
                token.Type = TokenType.RIGHTSAMLL;
                token.Literal = ')';
                break;
            case '[':
                token.Type = TokenType.LEFTMEDI;
                token.Literal = '[';
                break;
            case ']':
                token.Type = TokenType.RIGHTMEDI;
                token.Literal = ']';
                break;
            case '{':
                token.Type = TokenType.LEFTBIG;
                token.Literal = '{';
                break;
            case '}':
                token.Type = TokenType.RIGHTBIG;
                token.Literal = '}';
                break;
            case '+':
                if (this.peekChar() === '+') {
                    this.readChar();
                    token.Type = TokenType.INC;
                    token.Literal = '++';
                    break;
                } else if (this.peekChar() === '=') {
                    this.readChar();
                    token.Type = TokenType.ADDASSIGN;
                    token.Literal = '+=';
                    break;
                }
                token.Type = TokenType.ADD;
                token.Literal = '+';
                break;
            case '-':
                if (this.peekChar() === '-') {
                    this.readChar();
                    token.Type = TokenType.DEC;
                    token.Literal = '--';
                    break;
                } else if (this.peekChar() === '=') {
                    this.readChar();
                    token.Type = TokenType.SUBASSIGN;
                    token.Literal = '-=';
                    break;
                }
                token.Type = TokenType.SUB;
                token.Literal = '-';
                break;
            case '*':
                if (this.peekChar() === '=') {
                    this.readChar();
                    token.Type = TokenType.MULASSIGN;
                    token.Literal = '*=';
                    break;
                }
                token.Type = TokenType.MUL;
                token.Literal = '*';
                break;
            case '/':
                if (this.peekChar() === '=') {
                    this.readChar();
                    token.Type = TokenType.DIVASSIGN;
                    token.Literal = '/=';
                    break;
                }
                token.Type = TokenType.DIV;
                token.Literal = '/';
                break;
            case '&':
                if (this.peekChar() === '&') {
                    this.readChar();
                    token.Type = TokenType.AND;
                    token.Literal = '&&';
                    break;
                }
                token.Type = TokenType.BITAND;
                token.Literal = '&';
                break;
            case '|':
                if (this.peekChar() === '|') {
                    this.readChar();
                    token.Type = TokenType.OR;
                    token.Literal = '||';
                    break;
                }
                token.Type = TokenType.BITOR;
                token.Literal = '&';
                break;
            case '^':
                token.Type = TokenType.BITXOR;
                token.Literal = '^';
                break;
            case '!':
                if (this.peekChar() === '=') {
                    this.readChar();
                    token.Type = TokenType.NOTEQUAL;
                    token.Literal = '!=';
                    break;
                }
                token.Type = TokenType.NOT;
                token.Literal = '!';
                break;
            case '>':
                if (this.peekChar() === '=') {
                    this.readChar();
                    token.Type = TokenType.GREATEREQUAL;
                    token.Literal = '>=';
                    break;
                } else if (this.peekChar() === '>') {
                    this.readChar();
                    token.Type = TokenType.BITSHIFT_R;
                    token.Literal = '>>';
                    break;
                }
                token.Type = TokenType.GREATER;
                token.Literal = '>';
                break;
            case '=':
                if (this.peekChar() === '=') {
                    this.readChar();
                    token.Type = TokenType.EQUAL;
                    token.Literal = '==';
                    break;
                }
                token.Type = TokenType.ASSIGN;
                token.Literal = '=';
                break;
            case '<':
                if (this.peekChar() === '=') {
                    this.readChar();
                    token.Type = TokenType.LESSEQUAL;
                    token.Literal = '<=';
                    break;
                } else if (this.peekChar() === '<') {
                    this.readChar();
                    token.Type = TokenType.BITSHIFT_L;
                    token.Literal = '<<';
                    break;
                }
                token.Type = TokenType.LESS;
                token.Literal = '<';
                break;
            default:
                if (this.isDigit(this._char)) {
                    return this.readDecimal();
                }
                token.Literal = this.readIdentifier();
                token.Type = this.lookupIdentifier(token.Literal);

                if (this.getChar() == '[' && this.peekChar() == ']' && token.isBuiltinType()) {
                    token.Type++;
                    token.Literal += '[]';
                    this.readChar();
                    this.readChar();
                }

                return token;
        }

        this.readChar();
        return token;
    }

    // read dicimal
    private readDecimal(): GLSLLexerToken {
        var token = new GLSLLexerToken();
        token.Line = this._line;
        token.Colume = this._column;
        token.Type = TokenType.LITERAL;
        var integer = this.readNumber();

        if (this._char === 'e') {
            token.Literal = integer + this._char;
            this.readChar();
            token.Literal += this._char;
            this.readChar();
            token.Literal += this.readNumber();
            token.Type = TokenType.LITERAL; // TokenType.FLOAT;
            return token;
        }

        if (this._char === 'u') {
            this.readChar();
            token.Type = TokenType.LITERAL; // TokenType.UINT;
            token.Literal = integer + 'u';
            return token;
        }

        if (this._char === 'f') {
            this.readChar();
            token.Type = TokenType.LITERAL; // TokenType.FLOAT;
            token.Literal = integer + 'f';
            return token;
        }

        token.Type = TokenType.LITERAL; // TokenType.INT;
        token.Literal = integer;
        return token;
    }

    private lookupIdentifier(literal: string): TokenType {
        switch (literal) {
            case 'void':
                return TokenType.VOID;
            case 'int':
                return TokenType.INT;
            case 'uint':
                return TokenType.UINT;
            case 'bool':
                return TokenType.BOOL;
            case 'true':
                return TokenType.BOOL;
            case 'false':
                return TokenType.BOOL;
            case 'float':
                return TokenType.FLOAT;
            case 'vec2':
                return TokenType.VEC2;
            case 'vec3':
                return TokenType.VEC3;
            case 'vec4':
                return TokenType.VEC4;
            case 'bvec2':
                return TokenType.BVEC2;
            case 'bvec3':
                return TokenType.BVEC3;
            case 'bvec4':
                return TokenType.BVEC4;
            case 'ivec2':
                return TokenType.IVEC2;
            case 'ivec3':
                return TokenType.IVEC3;
            case 'ivec4':
                return TokenType.IVEC4;
            case 'uvec2':
                return TokenType.UVEC2;
            case 'uvec3':
                return TokenType.UVEC3;
            case 'uvec4':
                return TokenType.UVEC4;
            case 'mat2':
                return TokenType.MAT2x2;
            case 'mat2x2':
                return TokenType.MAT2x2;
            case 'mat2x3':
                return TokenType.MAT2x3;
            case 'mat2x4':
                return TokenType.MAT2x4;
            case 'mat3':
                return TokenType.MAT3x3;
            case 'mat3x2':
                return TokenType.MAT3x2;
            case 'mat3x3':
                return TokenType.MAT3x3;
            case 'mat3x4':
                return TokenType.MAT3x4;
            case 'mat4':
                return TokenType.MAT4x4;
            case 'mat4x2':
                return TokenType.MAT4x2;
            case 'mat4x3':
                return TokenType.MAT4x3;
            case 'mat4x4':
                return TokenType.MAT4x4;
            case 'sampler':
                return TokenType.SAMPLER;
            case 'sampler1D':
                return TokenType.SAMPLER_1D;
            case 'sampler2D':
                return TokenType.SAMPLER_2D;
            case 'sampler3D':
                return TokenType.SAMPLER_3D;
            case 'samplerCube':
                return TokenType.SAMPLER_CUBE;
            case 'samplerShadow':
                return TokenType.SAMPLER_SHADOW;
            case 'sampler1DShadow':
                return TokenType.SAMPLER_1D_SHADOW;
            case 'sampler2DShadow':
                return TokenType.SAMPLER_2D_SHADOW;
            case 'texture1D':
                return TokenType.TEXTURE_1D;
            case 'texture2D':
                return TokenType.TEXTURE_2D;
            case 'texture3D':
                return TokenType.TEXTURE_3D;
            case 'textureCube':
                return TokenType.TEXTURE_CUBE;
            case 'texture1DArray':
                return TokenType.TEXTURE_1D_ARRAY;
            case 'texture2DArray':
                return TokenType.TEXTURE_2D_ARRAY;
            case 'textureCubeArray':
                return TokenType.TEXTURE_CUBE_ARRAY;

            case 'const':
                return TokenType.CONST;
            case 'layout':
                return TokenType.LAYOUT;
            case 'precision':
                return TokenType.PRECISION;
            case 'attribute':
                return TokenType.ATTRIBUTE;
            case 'uniform':
                return TokenType.UNIFORM;
            case 'varying':
                return TokenType.VARYING;
            case 'invariant':
                return TokenType.INVARIANT;
            case 'in':
                return TokenType.IN;
            case 'out':
                return TokenType.OUT;
            case 'inout':
                return TokenType.INOUT;
            case 'if':
                return TokenType.IF;
            case 'else':
                return TokenType.ELSE;
            case 'for':
                return TokenType.FOR;
            case 'while':
                return TokenType.WHILE;
            case 'do':
                return TokenType.DO;
            case 'break':
                return TokenType.BREAK;
            case 'return':
                return TokenType.RETURN;
            case 'continue':
                return TokenType.CONTINUE;
            case 'struct':
                return TokenType.STRUCT;
        }
        return TokenType.IDENT;
    }
}
