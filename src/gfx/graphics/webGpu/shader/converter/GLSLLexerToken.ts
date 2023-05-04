/**
 * @internal
 * @group GFX
 */
export class GLSLLexerToken {
    public Type: TokenType = 0;
    public Line: number = 0;
    public Colume: number = 0;
    public Literal: string = '';
    constructor(type: TokenType = TokenType.EOF, literal: string = '\0') {
        this.Type = type;
        this.Literal = literal;
    }

    /**
     * @returns determin the type is same to token
     */
    public isTypeEqual(type: TokenType): boolean {
        return this.Type == type;
    }

    /**
     * @returns determin the value is same
     */
    public isLiteralEqual(literal: string): boolean {
        return this.Literal == literal;
    }

    /**
     * @returns determin it's builtin type
     */
    public isBuiltinType(): boolean {
        return this.Type > TokenType.BeginBuiltinType && this.Type < TokenType.EndBuiltinType;
    }

    /**
     * @returns determin it's a data type
     */
    public isDataType(): boolean {
        return this.Type == TokenType.IDENT || this.isBuiltinType();
    }

    /**
     * @returns determin it's a operation
     */
    public isOperation(): boolean {
        return this.Type > TokenType.BeginOperation && this.Type < TokenType.EndOperation;
    }

    /**
     * @returns determin it's a assign operation
     */
    public isAssignOperation(): boolean {
        return this.Type > TokenType.BeginAssignOperation && this.Type < TokenType.EndAssignOperation;
    }

    /**
     * The priority of the current operator
     */
    public get nOperationPriorityLevel(): number {
        switch (this.Type) {
            case TokenType.LEFTSAMLL:
                return 1;
            case TokenType.RIGHTSAMLL:
                return 1;

            case TokenType.DOT:
                return 2;

            case TokenType.NOT:
                return 3;
            case TokenType.BITNOT:
                return 3;

            case TokenType.MUL:
                return 4;
            case TokenType.DIV:
                return 4;

            case TokenType.ADD:
                return 5;
            case TokenType.SUB:
                return 5;

            case TokenType.BITSHIFT_L:
                return 6;
            case TokenType.BITSHIFT_R:
                return 6;

            case TokenType.GREATER:
                return 7;
            case TokenType.GREATEREQUAL:
                return 7;
            case TokenType.LESS:
                return 7;
            case TokenType.LESSEQUAL:
                return 7;

            case TokenType.EQUAL:
                return 8;
            case TokenType.NOTEQUAL:
                return 8;

            case TokenType.BITAND:
                return 9;

            case TokenType.BITXOR:
                return 10;

            case TokenType.BITOR:
                return 11;

            case TokenType.AND:
                return 12;

            case TokenType.XOR:
                return 13;

            case TokenType.OR:
                return 14;

            case TokenType.QUEMARK:
                return 15;

            case TokenType.ASSIGN:
                return 16;
            case TokenType.ADDASSIGN:
                return 16;
            case TokenType.SUBASSIGN:
                return 16;
            case TokenType.MULASSIGN:
                return 16;
            case TokenType.DIVASSIGN:
                return 16;
        }

        return 99;
    }
}

/**
 * @internal
 */
export enum TokenType {
    // end-of-file
    EOF,
    // identifier
    IDENT,
    // void
    VOID,
    // const
    CONST,
    // layout
    LAYOUT,
    // precision
    PRECISION,
    // attribute
    ATTRIBUTE,
    // uniform
    UNIFORM,
    // varying
    VARYING,
    // invariant
    INVARIANT,
    // in
    IN,
    // out
    OUT,
    // inout
    INOUT,
    // if
    IF,
    // else
    ELSE,
    // for
    FOR,
    // while
    WHILE,
    // do
    DO,
    // break
    BREAK,
    // return
    RETURN,
    // continue
    CONTINUE,
    // struct
    STRUCT,

    // ,
    COMMA,
    // :
    COLON,
    // ?
    QUEMARK,
    // ;
    SEMICOLON,
    // (
    LEFTSAMLL,
    // )
    RIGHTSAMLL,
    // [
    LEFTMEDI,
    // ]
    RIGHTMEDI,
    // {
    LEFTBIG,
    // }
    RIGHTBIG,

    // Literal value
    LITERAL,

    // built-in type begin
    BeginBuiltinType,
    // built-in type: int
    INT,
    // built-in type: int[]
    INT_ARRAY,
    // built-in type: uint
    UINT,
    // built-in type: uint[]
    UINT_ARRAY,
    // built-in type: bool
    BOOL,
    // built-in type: bool[]
    BOOL_ARRAY,
    // built-in type: float
    FLOAT,
    // built-in type: float[]
    FLOAT_ARRAY,
    // built-in type: double
    DOUBLE,
    // built-in type: double[]
    DOUBLE_ARRAY,
    // built-in type: vec2
    VEC2,
    // built-in type: vec2[]
    VEC2_ARRAY,
    // built-in type: vec3
    VEC3,
    // built-in type: vec3[]
    VEC3_ARRAY,
    // built-in type: vec4
    VEC4,
    // built-in type: vec4[]
    VEC4_ARRAY,
    // built-in type: bvec2
    BVEC2,
    // built-in type: bvec2[]
    BVEC2_ARRAY,
    // built-in type: bvec3
    BVEC3,
    // built-in type: bvec3[]
    BVEC3_ARRAY,
    // built-in type: bvec4
    BVEC4,
    // built-in type: bvec4[]
    BVEC4_ARRAY,
    // built-in type: ivec2
    IVEC2,
    // built-in type: ivec2[]
    IVEC2_ARRAY,
    // built-in type: ivec3
    IVEC3,
    // built-in type: ivec3[]
    IVEC3_ARRAY,
    // built-in type: ivec4
    IVEC4,
    // built-in type: ivec4[]
    IVEC4_ARRAY,
    // built-in type: uvec2
    UVEC2,
    // built-in type: uvec2[]
    UVEC2_ARRAY,
    // built-in type: uvec3
    UVEC3,
    // built-in type: uvec3[]
    UVEC3_ARRAY,
    // built-in type: uvec4
    UVEC4,
    // built-in type: uvec4[]
    UVEC4_ARRAY,
    // built-in type: mat2x2
    MAT2x2,
    // built-in type: mat2x2[]
    MAT2x2_ARRAY,
    // built-in type: mat2x3
    MAT2x3,
    // built-in type: mat2x3[]
    MAT2x3_ARRAY,
    // built-in type: mat2x4
    MAT2x4,
    // built-in type: mat2x4[]
    MAT2x4_ARRAY,
    // built-in type: mat3x2
    MAT3x2,
    // built-in type: mat3x2[]
    MAT3x2_ARRAY,
    // built-in type: mat3x3
    MAT3x3,
    // built-in type: mat3x3[]
    MAT3x3_ARRAY,
    // built-in type: mat3x4
    MAT3x4,
    // built-in type: mat3x4[]
    MAT3x4_ARRAY,
    // built-in type: mat4x2
    MAT4x2,
    // built-in type: mat4x2[]
    MAT4x2_ARRAY,
    // built-in type: mat4x3
    MAT4x3,
    // built-in type: mat4x3[]
    MAT4x3_ARRAY,
    // built-in type: mat4x4
    MAT4x4,
    // built-in type: mat4x4[]
    MAT4x4_ARRAY,
    // built-in type: sampler
    SAMPLER,
    // built-in type: sampler1D
    SAMPLER_1D,
    // built-in type: sampler2D
    SAMPLER_2D,
    // built-in type: sampler3D
    SAMPLER_3D,
    // built-in type: samplerCube
    SAMPLER_CUBE,
    // built-in type: samplerShadow
    SAMPLER_SHADOW,
    // built-in type: sampler1DShadow
    SAMPLER_1D_SHADOW,
    // built-in type: sampler2DShadow
    SAMPLER_2D_SHADOW,
    // built-in type: texture1D
    TEXTURE_1D,
    // built-in type: texture1DArray
    TEXTURE_1D_ARRAY,
    // built-in type: texture2D
    TEXTURE_2D,
    // built-in type: texture2DArray
    TEXTURE_2D_ARRAY,
    // built-in type: texture3D
    TEXTURE_3D,
    // built-in type: textureCube
    TEXTURE_CUBE,
    // built-in type: textureCubeArray
    TEXTURE_CUBE_ARRAY,
    // built-in type end
    EndBuiltinType,

    // operator begin
    BeginOperation,

    // operator +
    ADD,
    // operator -
    SUB,
    // operator *
    MUL,
    // operator /
    DIV,

    // operator &&
    AND,
    // operator ||
    OR,
    // operator ^^
    XOR,
    // operator !
    NOT,

    // operator &
    BITAND,
    // operator |
    BITOR,
    // operator ^
    BITXOR,
    // operator ~
    BITNOT,
    // operator <<
    BITSHIFT_L,
    // operator >>
    BITSHIFT_R,

    // operator ++
    INC,
    // operator --
    DEC,
    // operator >
    GREATER,
    // operator >=
    GREATEREQUAL,
    // operator ==
    EQUAL,
    // operator <
    LESS,
    // operator <=
    LESSEQUAL,
    // operator !=
    NOTEQUAL,

    // operator .
    DOT,

    // operator =
    ASSIGN,

    // operator end
    EndOperation,

    // assigning operator begin
    BeginAssignOperation,
    // operator +=
    ADDASSIGN,
    // operator -=
    SUBASSIGN,
    // operator *=
    MULASSIGN,
    // operator /=
    DIVASSIGN,
    // assigning operator end
    EndAssignOperation,
}
