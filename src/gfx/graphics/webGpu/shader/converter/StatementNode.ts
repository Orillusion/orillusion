import { GLSLLexer } from './GLSLLexer';
import { GLSLLexerToken, TokenType } from './GLSLLexerToken';
import { TranslatorContext } from './WGSLTranslator';

/**
 * @internal
 * Statement node
 * @group GFX
 */
export class StatementNode {
    public nodes: Array<StatementNode> = [];

    constructor() { }

    public addNode(node: StatementNode) {
        this.nodes.push(node);
    }

    public formatToWGSL(context: TranslatorContext, depth: number): string {
        let prefix: string = depth <= 0 ? '' : '    '.repeat(depth);
        return '';
    }
}

/**
 * @internal
 * Statement node: struct
 * @group GFX
 */
export class SN_Struct extends StatementNode {
    public name: string = '';
    public fields: Array<SN_Declaration> = [];

    constructor(name: string) {
        super();
        this.name = name;
    }

    public static parse(r: GLSLLexer): SN_Struct {
        if (r.peekToken(0).Type == TokenType.IDENT && r.peekToken(1).Type == TokenType.LEFTBIG) {
            let result = new SN_Struct(r.peekToken(0).Literal);
            r.skipToken(2);

            while (r.peekToken(0).Type != TokenType.RIGHTBIG) {
                let field = SN_Declaration.parse(r);
                result.fields.push(field);
            }

            if (r.peekToken(0).Type == TokenType.RIGHTBIG) {
                r.skipToken(1);
            }

            if (r.peekToken(0).Type == TokenType.SEMICOLON) {
                r.skipToken(1);
            }

            return result;
        }

        throw 'Error parsing structure: Unexpected character';
    }

    public formatToWGSL(context: TranslatorContext, depth: number): string {
        let result: string = '';
        let prefix: string = depth <= 0 ? '' : '    '.repeat(depth);
        result += prefix + 'struct ' + this.name + ' {\r\n';
        for (let field of this.fields) {
            if (field.arraySize.nodes.length <= 0) {
                result += prefix + '  ' + field.name + ': ' + toWGSLType(field.type) + ',\r\n';
            } else {
                if (field.arraySize.nodes[0] instanceof SN_Constant) {
                    result += prefix + '  ' + field.name + ': array<' + toWGSLType(field.type) + ', ' + field.arraySize.nodes[0].value + '>' + ',\r\n';
                } else {
                    result += prefix + '  ' + field.name + ': array<' + toWGSLType(field.type) + ', ' + field.arraySize.nodes[0].formatToWGSL(context, 0) + '>' + ',\r\n';
                }
            }
        }
        result += prefix + '};\r\n';
        return result;
    }
}

/**
 * @internal
 * Statement node: function
 * @group GFX
 */
export class SN_Function extends StatementNode {
    public name: string;
    public args: Array<SN_Declaration>;
    public body: SN_CodeBlock;
    public returnType: string;

    constructor(name: string, args: Array<SN_Declaration>, body: SN_CodeBlock, returnType: string) {
        super();
        this.name = name;
        this.args = args;
        this.body = body;
        this.returnType = returnType;
    }

    public static parse(r: GLSLLexer): SN_Function {
        if ((r.peekToken(0).isBuiltinType() || r.peekToken(0).Type == TokenType.VOID) && r.peekToken(1).Type == TokenType.IDENT && r.peekToken(2).Type == TokenType.LEFTSAMLL) {
            // Parsing return types
            let returnType = r.peekToken(0).Literal;

            // Parse function name
            let name = r.peekToken(1).Literal;
            r.skipToken(2);

            // Parse the parameter list
            let args = new Array<SN_Declaration>();
            if (r.peekToken(0).Type != TokenType.LEFTSAMLL) {
                throw 'Error parsing function parameter list: Unexpected character';
            } else {
                r.skipToken(1);
                while (r.peekToken(0).Type != TokenType.EOF) {
                    if (r.peekToken(0).Type == TokenType.RIGHTSAMLL) {
                        r.skipToken(1);
                        break;
                    }

                    if (r.peekToken(0).Type == TokenType.INOUT) {
                        r.skipToken(1);
                    } else if (r.peekToken(0).Type == TokenType.IN) {
                        r.skipToken(1);
                    } else if (r.peekToken(0).Type == TokenType.OUT) {
                        r.skipToken(1);
                    }

                    let arg = SN_Declaration.parse(r);
                    args.push(arg);

                    if (r.peekToken(0).Type == TokenType.COMMA) {
                        r.skipToken(1);
                    }
                }
            }

            // Parse function body
            let body = SN_CodeBlock.parse(r);

            return new SN_Function(name, args, body, returnType);
        }

        throw 'Error parsing function: Unexpected character';
    }

    public formatToWGSL(context: TranslatorContext, depth: number): string {
        let result: string = '';
        let prefix: string = depth <= 0 ? '' : '    '.repeat(depth);
        let outStructName: string;
        let hasOutStruct: boolean = context.layoutsOut.length > 0 || context.builtinOut.length > 0;

        switch (context.stage) {
            case 'compute':
                outStructName = 'ComputeOutput';
                break;
            case 'vertex':
                outStructName = 'VertexOutput';
                break;
            case 'fragment':
                outStructName = 'FragmentOutput';
                break;
            default:
                outStructName = 'StructOutput';
                break;
        }

        // Processing the output structure
        if (this.name == 'main' && hasOutStruct) {
            result += 'struct ' + outStructName + ' {\r\n';
            for (let item of context.layoutsOut) {
                if (item.nodes[0] instanceof SN_Declaration) {
                    let arg = item.nodes[0];
                    if (item.qualifier.size == 1 && item.qualifier.has('location')) {
                        result += '  @location(' + item.qualifier.get('location') + ') ';
                    }
                    result += arg.name + ': ' + toWGSLType(arg.type) + ',\r\n';
                    context.addIdentifier(arg.name, 'stout.' + arg.name);
                }
            }

            let builtinOut = context.builtinOut;
            for (let item of builtinOut) {
                result += '  ' + item + ',\r\n';
            }

            result += '};\r\n\r\n';
        }

        // Generate function header
        let header: string = '';
        if (this.name == 'main') {
            if (context.workGroupSize != undefined) {
                header += '@' + context.stage + ' ' + context.workGroupSize.formatToWGSL(context, 0) + ' \r\n';
            } else {
                header += '@' + context.stage + '\r\n';
            }
        }
        context = new TranslatorContext(context);
        header += prefix + 'fn ' + this.name + '(';
        if (this.name != 'main') {
            for (let i = 0; i < this.args.length; i++) {
                let arg = this.args[i];
                if (i > 0) {
                    header += ', ';
                }
                header += arg.name + ': ' + toWGSLType(arg.type);
                context.addIdentifier(arg.name, arg.name);
            }
            header += ') -> ' + toWGSLType(this.returnType);
        } else {
            let layoutsIn = context.layoutsIn;
            for (let i = 0; i < layoutsIn.length; i++) {
                let item = layoutsIn[i];
                if (i > 0) {
                    header += ',\r\n    ';
                } else {
                    header += '\r\n    ';
                }
                if (item.nodes[0] instanceof SN_Declaration) {
                    let arg = item.nodes[0];
                    if (item.qualifier.size == 1 && item.qualifier.has('location')) {
                        header += '@location(' + item.qualifier.get('location') + ') ';
                    }
                    header += arg.name + ': ' + toWGSLType(arg.type);
                    context.addIdentifier(arg.name, arg.name);
                }
            }
            if (layoutsIn.length > 0) {
                header += ',\r\n    ';
            }

            let builtinIn = context.builtinIn;
            for (let item of builtinIn) {
                header += item + ',\r\n    ';
            }

            if (hasOutStruct) {
                header += ') -> ' + outStructName;
            } else {
                header += ') ';
            }
        }

        // Generating function body
        let bodyResult: string = '';
        if (this.name == 'main' && hasOutStruct) {
            bodyResult += '    var stout: ' + outStructName + ' ;\r\n';
        }
        for (let statement of this.body.nodes) {
            bodyResult += statement.formatToWGSL(context, depth + 1);
            if (!(statement instanceof SN_IFBranch) && !(statement instanceof SN_WhileLoop) && !(statement instanceof SN_ForLoop)) {
                bodyResult += ';\r\n';
            }
        }
        if (this.name == 'main' && hasOutStruct) {
            bodyResult += '    return stout;\r\n';
        }

        // Result of assembly
        result += header + ' {\r\n';
        result += bodyResult;
        result += prefix + '}\r\n';
        result += '\r\n';
        return result;
    }
}

/**
 * @internal
 * Statement node: functionArg
 * @group GFX
 */
export class SN_FunctionArgs extends StatementNode {
    public args: Array<SN_Expression> = [];

    constructor() {
        super();
    }

    public static parse(r: GLSLLexer): SN_FunctionArgs {
        if (r.peekToken(0).Type == TokenType.LEFTSAMLL) {
            r.skipToken(1);

            let result = new SN_FunctionArgs();

            while (r.peekToken(0).Type != TokenType.EOF) {
                if (r.peekToken(0).Type == TokenType.RIGHTSAMLL) {
                    r.skipToken(1);
                    break;
                }

                let arg = SN_Expression.parse(r);
                result.args.push(arg);

                if (r.peekToken(0).Type == TokenType.COMMA) {
                    r.skipToken(1);
                }
            }

            return result;
        }

        throw 'Error parsing function argument table: Unexpected character';
    }
}

/**
 * @internal
 * Statement node: functionCall
 * @group GFX
 */
export class SN_FunctionCall extends StatementNode {
    public name: string;
    public args: SN_FunctionArgs;

    constructor(name: string, args: SN_FunctionArgs) {
        super();
        this.name = name;
        this.args = args;
    }

    public static parse(r: GLSLLexer): SN_FunctionCall {
        // a(...)
        if (r.peekToken(0).isDataType() && r.peekToken(1).Type == TokenType.LEFTSAMLL) {
            // Parse function name
            let name = r.peekToken(0).Literal;
            r.skipToken(1);

            // Parse the argument table
            let args = SN_FunctionArgs.parse(r);

            return new SN_FunctionCall(name, args);
        }

        throw 'Error parsing function argument table: Unexpected character';
    }

    public formatToWGSL(context: TranslatorContext, depth: number): string {
        let result: string = '';
        let prefix: string = depth <= 0 ? '' : '    '.repeat(depth);

        if (this.name == 'texture' && this.args.args[0].nodes[0] instanceof SN_FunctionCall) {
            let callNode = this.args.args[0].nodes[0];
            if (callNode.name == 'sampler2D') {
                result += prefix + 'textureSample(';

                for (let i = 0; i < callNode.args.args.length; i++) {
                    let arg = callNode.args.args[i];
                    if (i > 0) {
                        result += ', ';
                    }
                    result += arg.formatToWGSL(context, 0);
                }

                for (let i = 1; i < this.args.args.length; i++) {
                    let arg = this.args.args[i];
                    if (i > 0) {
                        result += ', ';
                    }
                    result += arg.formatToWGSL(context, 0);
                }

                result += ')';
                return result;
            }
        }

        result += prefix + toWGSLType(this.name) + '(';
        for (let i = 0; i < this.args.args.length; i++) {
            let arg = this.args.args[i];
            if (i > 0) {
                result += ', ';
            }
            result += arg.formatToWGSL(context, 0);
        }
        result += ')';
        return result;
    }
}

/**
 * @internal
 * Statement node: declaration
 * @group GFX
 */
export class SN_Declaration extends StatementNode {
    public type: string;
    public name: string;
    public arraySize: SN_Expression;
    public hasIn: boolean;
    public hasOut: boolean;
    public hasConst: boolean;

    constructor(type: string, name: string, arraySize: SN_Expression = new SN_Expression()) {
        super();
        this.type = type;
        this.name = name;
        this.hasIn = false;
        this.hasOut = false;
        this.hasConst = false;
        this.arraySize = arraySize;
    }

    public static parse(r: GLSLLexer): SN_Declaration {
        let result: SN_Declaration = new SN_Declaration('', '');

        let first = r.peekToken(0);

        // const
        if (first.Type == TokenType.CONST) {
            r.skipToken(1);
            result.hasConst = true;
        }
        // in
        else if (first.Type == TokenType.IN) {
            r.skipToken(1);
            result.hasIn = true;
        }
        // out
        else if (first.Type == TokenType.OUT) {
            r.skipToken(1);
            result.hasOut = true;
        }
        // inout
        else if (first.Type == TokenType.INOUT) {
            r.skipToken(1);
            result.hasIn = true;
            result.hasOut = true;
        } else if (!first.isDataType()) {
            throw 'Error parsing declaration expression: Unexpected character(' + first.Literal + ')';
        }

        first = r.peekToken(0);

        // float[xxx] a
        if (first.isDataType() && r.peekToken(1).Type == TokenType.LEFTMEDI) {
            result.type = first.Literal;

            r.skipToken(2);

            result.arraySize = SN_Expression.parse(r);

            if (r.peekToken(0).Type == TokenType.RIGHTMEDI) {
                r.skipToken(1);
            }

            if (r.peekToken(0).Type != TokenType.IDENT) {
                throw 'Unexpected';
            }

            result.name = r.peekToken(0).Literal;
            r.skipToken(1);
        }
        // float a[xxx]
        else if (first.isDataType() && r.peekToken(1).Type == TokenType.IDENT && r.peekToken(2).Type == TokenType.LEFTMEDI) {
            result.type = r.peekToken(0).Literal;
            result.name = r.peekToken(1).Literal;
            r.skipToken(3);

            if (r.peekToken(0).Type == TokenType.RIGHTMEDI) {
                r.skipToken(1);
            } else {
                result.arraySize = SN_Expression.parse(r);
                if (r.peekToken(0).Type == TokenType.RIGHTMEDI) {
                    r.skipToken(1);
                }
            }
        }
        // float a
        else if (first.isDataType() && r.peekToken(1).Type == TokenType.IDENT) {
            result.type = r.peekToken(0).Literal;
            result.name = r.peekToken(1).Literal;
            r.skipToken(2);
        } else throw 'Error parsing declaration expression: Unexpected character(' + first.Literal + ')';

        first = r.peekToken(0);
        if (first.Type == TokenType.SEMICOLON) {
            r.skipToken(1);
            return result;
        } else if (first.Type == TokenType.RIGHTSAMLL) {
            return result;
        } else if (first.Type == TokenType.ASSIGN) {
            let op = r.peekToken(0);
            r.skipToken(1);
            let lValue = new SN_Identifier(result.name);
            let rValue = SN_Expression.parse(r);
            if (r.peekToken(0).Type == TokenType.SEMICOLON) {
                r.skipToken(1);
            }
            result.addNode(new SN_BinaryOperation(op, lValue, rValue));
            return result;
        } else if (first.Type == TokenType.COMMA) {
            // float a, b = 0, c = 1 + 2
            while (r.peekToken(0).Type == TokenType.COMMA && r.peekToken(1).Type == TokenType.IDENT) {
                let declaration = new SN_Declaration(result.type, r.peekToken(1).Literal);
                result.addNode(declaration);
                r.skipToken(2);
                if (r.peekToken(0).Type == TokenType.ASSIGN) {
                    r.skipToken(-1);
                    declaration.addNode(SN_Expression.parse(r));
                }
            }
            return result;
        }

        throw 'Error parsing declaration expression: Unexpected character(' + r.peekToken(0).Literal + ')';
    }

    public formatToWGSL(context: TranslatorContext, depth: number): string {
        let result: string = '';
        let prefix: string = depth <= 0 ? '' : '    '.repeat(depth);

        if (this.hasConst) {
            result += prefix + 'let ';
        } else {
            result += prefix + 'var ';
        }

        context.addIdentifier(this.name, this.name);
        if (this.arraySize.nodes.length <= 0) {
            result += this.name + ': ' + toWGSLType(this.type);
        } else {
            if (this.arraySize.nodes[0] instanceof SN_Constant) {
                result += this.name + ': array<' + toWGSLType(this.type) + ', ' + this.arraySize.nodes[0].value + '>';
            } else {
                result += this.name + ': array<' + toWGSLType(this.type) + ', ' + this.arraySize.nodes[0].formatToWGSL(context, 0) + '>';
            }
        }

        if (this.nodes.length > 0 && this.nodes[0] instanceof SN_BinaryOperation) {
            result += ' = ' + this.nodes[0].rightValue.formatToWGSL(context, 0);
        } else if (this.nodes.length > 0 && this.nodes[0] instanceof SN_Expression && this.nodes[0].nodes[0] instanceof SN_BinaryOperation) {
            result += ' = ' + this.nodes[0].nodes[0].rightValue.formatToWGSL(context, 0);
        } else if (this.nodes.length > 0 && this.nodes[0] instanceof SN_Declaration) {
            result += ';\r\n';
            for (let item of this.nodes) {
                result += item.formatToWGSL(context, depth) + ';\r\n';
            }
        } else {
            result += ';\r\n';
        }
        return result;
    }
}

/**
 * @internal
 * Statement node: for
 * @group GFX
 */
export class SN_ForLoop extends StatementNode {
    public expression1: StatementNode;
    public condition: SN_Expression;
    public expression2: SN_Expression;
    public loopBody: SN_CodeBlock;

    constructor(expression1: StatementNode, condition: SN_Expression, expression2: SN_Expression, loopBody: SN_CodeBlock) {
        super();
        this.expression1 = expression1;
        this.condition = condition;
        this.expression2 = expression2;
        this.loopBody = loopBody;
    }

    public static parse(r: GLSLLexer): SN_ForLoop {
        if (r.peekToken(0).Type == TokenType.FOR && r.peekToken(1).Type == TokenType.LEFTSAMLL) {
            r.skipToken(2);

            let expression1: StatementNode;
            if (r.peekToken(0).Type == TokenType.SEMICOLON) {
                r.skipToken(1);
                expression1 = new SN_Expression();
            } else if (r.peekToken(0).isDataType() && r.peekToken(1).Type == TokenType.IDENT && r.peekToken(2).Type == TokenType.ASSIGN) {
                expression1 = new SN_Declaration(r.peekToken(0).Literal, r.peekToken(1).Literal);
                r.skipToken(1);
                expression1.addNode(SN_Expression.parse(r));
                if (r.peekToken(0).Type == TokenType.SEMICOLON) {
                    r.skipToken(1);
                }
            } else {
                expression1 = SN_Expression.parse(r);
                if (r.peekToken(0).Type == TokenType.SEMICOLON) {
                    r.skipToken(1);
                }
            }

            let condition: SN_Expression;
            if (r.peekToken(0).Type == TokenType.SEMICOLON) {
                r.skipToken(1);
                condition = new SN_Expression();
            } else {
                condition = SN_Expression.parse(r);
                if (r.peekToken(0).Type == TokenType.SEMICOLON) {
                    r.skipToken(1);
                }
            }

            let expression2: SN_Expression;
            if (r.peekToken(0).Type == TokenType.SEMICOLON) {
                r.skipToken(1);
                expression2 = new SN_Expression();
            } else {
                expression2 = SN_Expression.parse(r);
                if (r.peekToken(0).Type == TokenType.SEMICOLON) {
                    r.skipToken(1);
                }
            }

            if (r.peekToken(0).Type == TokenType.RIGHTSAMLL) {
                r.skipToken(1);
            }

            let loopBody: SN_CodeBlock;
            if (r.peekToken(0).Type == TokenType.LEFTBIG) {
                loopBody = SN_CodeBlock.parse(r);
            } else {
                loopBody = new SN_CodeBlock();
            }

            return new SN_ForLoop(expression1, condition, expression2, loopBody);
        }

        throw 'Error parsing for loop: Unexpected character';
    }

    public formatToWGSL(context: TranslatorContext, depth: number): string {
        let result: string = '';
        let prefix: string = depth <= 0 ? '' : '    '.repeat(depth);

        result += prefix + 'for (';
        result += this.expression1.formatToWGSL(context, 0) + '; ';
        result += this.condition.formatToWGSL(context, 0) + '; ';
        result += this.expression2.formatToWGSL(context, 0) + ')';

        result += ' { \r\n';
        for (let item of this.loopBody.nodes) {
            result += item.formatToWGSL(context, depth + 1);
            if (!(item instanceof SN_IFBranch) && !(item instanceof SN_WhileLoop) && !(item instanceof SN_ForLoop)) {
                result += ';\r\n';
            }
        }
        result += prefix + '} \r\n';
        return result;
    }
}

/**
 * @internal
 * Statement node: while
 * @group GFX
 */
export class SN_WhileLoop extends StatementNode {
    public conditionExpr: SN_Expression;
    public loopBody: SN_CodeBlock;

    constructor(condition: SN_Expression, loopBody: SN_CodeBlock) {
        super();
        this.conditionExpr = condition;
        this.loopBody = loopBody;
    }

    public static parse(r: GLSLLexer): SN_WhileLoop {
        if (r.peekToken(0).Type == TokenType.WHILE) {
            r.skipToken(1);

            if (r.peekToken(0).Type == TokenType.LEFTSAMLL) {
                r.skipToken(1);
            }

            let condition = SN_Expression.parse(r);

            if (r.peekToken(0).Type == TokenType.RIGHTSAMLL) {
                r.skipToken(1);
            }

            let loopBody = SN_CodeBlock.parse(r);

            return new SN_WhileLoop(condition, loopBody);
        }

        throw 'Error parsing while loop: Unexpected character';
    }

    public formatToWGSL(context: TranslatorContext, depth: number): string {
        let result: string = '';
        let prefix: string = depth <= 0 ? '' : '    '.repeat(depth);

        result += prefix + 'loop {\r\n';

        result += prefix + '    if (' + this.conditionExpr.formatToWGSL(context, 0) + ') { break; }\r\n\r\n';

        for (let item of this.loopBody.nodes) {
            result += item.formatToWGSL(context, depth + 1);
            if (!(item instanceof SN_IFBranch) && !(item instanceof SN_WhileLoop) && !(item instanceof SN_ForLoop)) {
                result += ';\r\n';
            }
        }

        result += prefix + '}\r\n';
        return result;
    }
}

/**
 * @internal
 * Statement node: do-while
 * @group GFX
 */
export class SN_DoWhileLoop extends StatementNode {
    constructor() {
        super();
    }
}

/**
 * @internal
 * Statement node: if
 * @group GFX
 */
export class SN_IFBranch extends StatementNode {
    public conditionExpr: SN_Expression;
    public trueBranch: SN_CodeBlock;
    public falseBranch: SN_CodeBlock;

    constructor(condition: SN_Expression, trueBranch: SN_CodeBlock, falseBranch: SN_CodeBlock) {
        super();
        this.conditionExpr = condition;
        this.trueBranch = trueBranch;
        this.falseBranch = falseBranch;
    }

    public static parse(r: GLSLLexer): SN_IFBranch {
        if (r.peekToken(0).Type == TokenType.IF) {
            r.skipToken(1);

            if (r.peekToken(0).Type == TokenType.LEFTSAMLL) {
                r.skipToken(1);
            }

            let condition = SN_Expression.parse(r);
            let trueBranch: SN_CodeBlock;
            let falseBranch: SN_CodeBlock = new SN_CodeBlock();

            if (r.peekToken(0).Type == TokenType.RIGHTSAMLL) {
                r.skipToken(1);
            }

            if (r.peekToken(0).Type == TokenType.LEFTBIG) {
                trueBranch = SN_CodeBlock.parse(r);
            } else {
                trueBranch = new SN_CodeBlock();
                if (r.peekToken(0).Type == TokenType.RETURN) {
                    trueBranch.addNode(SN_Return.parse(r));
                } else {
                    trueBranch.addNode(SN_Expression.parse(r));
                }
            }

            if (r.peekToken(0).Type == TokenType.ELSE) {
                r.skipToken(1);

                if (r.peekToken(0).Type == TokenType.LEFTBIG) {
                    falseBranch = SN_CodeBlock.parse(r);
                } else throw 'not impl';
            }

            return new SN_IFBranch(condition, trueBranch, falseBranch);
        }

        throw 'Error parsing IF branch statement: Unexpected character';
    }

    public formatToWGSL(context: TranslatorContext, depth: number): string {
        let resultl: string = '';
        let prefix: string = depth <= 0 ? '' : '    '.repeat(depth);

        resultl += prefix + 'if (' + this.conditionExpr.formatToWGSL(context, 0) + ') {\r\n';

        for (let item of this.trueBranch.nodes) {
            resultl += item.formatToWGSL(context, depth + 1) + ';\r\n';
        }

        if (this.falseBranch.nodes.length > 0) {
            resultl += prefix + '} else {\r\n';
            for (let item of this.falseBranch.nodes) {
                resultl += item.formatToWGSL(context, depth + 1) + ';\r\n';
            }
        }

        resultl += prefix + '}\r\n';
        return resultl;
    }
}

/**
 * @internal
 * Statement node: expression
 * @group GFX
 */
export class SN_Expression extends StatementNode {
    constructor() {
        super();
    }

    public static parse(r: GLSLLexer): SN_Expression {
        let opStack = new Array<GLSLLexerToken>();
        let valueStack = new Array<any>();
        let nSamllCount = 0;
        while (r.peekToken(0).Type != TokenType.EOF) {
            let currToken = r.peekToken(0);

            if (currToken.Type == TokenType.SEMICOLON || currToken.Type == TokenType.RIGHTMEDI) {
                // r.SkipToken(1);
                break;
            }

            if (currToken.Type == TokenType.COMMA || currToken.Type == TokenType.COLON || currToken.Type == TokenType.RIGHTBIG) {
                break;
            }

            if (!currToken.isOperation()) {
                if (currToken.Type == TokenType.LITERAL) {
                    valueStack.push(new SN_Constant(currToken.Literal));
                    r.skipToken(1);
                    continue;
                } else if (currToken.Type == TokenType.LEFTSAMLL) {
                    nSamllCount++;
                    opStack.push(currToken);
                    r.skipToken(1);
                    continue;
                } else if (currToken.Type == TokenType.RIGHTSAMLL) {
                    if (nSamllCount <= 0) {
                        break;
                    }
                    nSamllCount--;

                    while (SN_Expression.unionOperation(opStack, valueStack));

                    if (opStack[opStack.length - 1].Type == TokenType.LEFTSAMLL) {
                        opStack.pop();
                        let parenExpr = new SN_ParenExpression();
                        parenExpr.addNode(valueStack.pop());
                        valueStack.push(parenExpr);
                    }

                    r.skipToken(1);
                    continue;
                } else if (currToken.Type == TokenType.IDENT) {
                    // a++
                    if (r.peekToken(1).Type == TokenType.INC || r.peekToken(1).Type == TokenType.DEC) {
                        let op = r.peekToken(1);
                        let value = new SN_Identifier(currToken.Literal);
                        valueStack.push(new SN_UnaryOperation(op, value, undefined));
                        r.skipToken(2);
                        continue;
                    }
                    // func(...)
                    else if (r.peekToken(1).Type == TokenType.LEFTSAMLL) {
                        valueStack.push(SN_FunctionCall.parse(r));
                        continue;
                    }
                    // a.b
                    else if (r.peekToken(1).Type == TokenType.DOT) {
                        valueStack.push(SN_SelectOperation.parse(r));
                        continue;
                    }
                    // a[xxx]
                    else if (r.peekToken(1).Type == TokenType.LEFTMEDI) {
                        valueStack.push(SN_IndexOperation.parse(r));
                        continue;
                    }

                    valueStack.push(new SN_Identifier(currToken.Literal));
                    r.skipToken(1);
                    continue;
                } else {
                    // type(...)
                    if (currToken.isBuiltinType() && r.peekToken(1).Type == TokenType.LEFTSAMLL) {
                        valueStack.push(SN_FunctionCall.parse(r));
                        continue;
                    }

                    // a += xxx
                    if (currToken.isAssignOperation()) {
                        let op = currToken;
                        r.skipToken(1);
                        let lValue = valueStack.pop();
                        let rValue = SN_Expression.parse(r);
                        valueStack.push(new SN_BinaryOperation(op, lValue, rValue));
                        continue;
                    }

                    // { 1.0, 2.0, 3.0 }
                    if (currToken.Type == TokenType.LEFTBIG && (r.peekToken(1).Type == TokenType.LITERAL || (r.peekToken(1).Type == TokenType.SUB && r.peekToken(2).Type == TokenType.LITERAL))) {
                        valueStack.push(SN_ArrayConstant.parse(r));
                        continue;
                    }

                    // xx ? xx : xx
                    if (currToken.Type == TokenType.QUEMARK) {
                        if (opStack.length > 0) {
                            let opToken = opStack[opStack.length - 1];
                            if (opToken.nOperationPriorityLevel <= currToken.nOperationPriorityLevel) {
                                SN_Expression.unionOperation(opStack, valueStack);
                            }
                        }

                        r.skipToken(1);

                        let a = valueStack.pop();

                        let b = SN_Expression.parse(r);

                        if (r.peekToken(0).Type == TokenType.COLON) {
                            r.skipToken(1);
                        }

                        let c = SN_Expression.parse(r);

                        valueStack.push(new SN_TernaryOperation(a, b, c));

                        if (r.peekToken(-1).Type == TokenType.SEMICOLON) {
                            break;
                        }

                        continue;
                    }

                    // xxx[xxx]
                    if (currToken.Type == TokenType.LEFTMEDI) {
                        r.skipToken(1);

                        let indexValue = SN_Expression.parse(r);
                        if (r.peekToken(0).Type == TokenType.RIGHTMEDI) {
                            r.skipToken(1);
                        }

                        let lValue = valueStack.pop();
                        valueStack.push(new SN_IndexOperation(lValue, indexValue));
                        continue;
                    }

                    throw 'An unexpected character';
                }
            } else if (currToken.isOperation()) {
                // ++a, --a
                if (currToken.Type == TokenType.INC || currToken.Type == TokenType.DEC) {
                    let op = currToken;
                    r.skipToken(1);
                    let value = SN_Expression.parse(r);
                    valueStack.push(new SN_UnaryOperation(op, undefined, value));
                    continue;
                } else if (opStack.length > 0) {
                    let opToken = opStack[opStack.length - 1];
                    if (opToken.nOperationPriorityLevel <= currToken.nOperationPriorityLevel) {
                        SN_Expression.unionOperation(opStack, valueStack);
                    } else if (opStack.length > 0 && opStack[opStack.length - 1].Literal == '-') {
                        let op = opStack.pop() as GLSLLexerToken;
                        let v1 = valueStack.pop() as StatementNode;
                        valueStack.push(new SN_UnaryOperation(op, undefined, v1));
                    }
                }
                opStack.push(currToken);
                r.skipToken(1);
            }
        }

        while (opStack.length > 0 && SN_Expression.unionOperation(opStack, valueStack));

        if (opStack.length <= 0 && valueStack.length == 1) {
            let expr = new SN_Expression();
            expr.addNode(valueStack.pop());
            return expr;
        }

        throw 'Error parsing expression: Unexpected character(' + r.peekToken(0).Literal + ')';
    }

    public formatToWGSL(context: TranslatorContext, depth: number): string {
        return this.nodes[0].formatToWGSL(context, depth);
    }

    protected static unionOperation(opStack: Array<GLSLLexerToken>, valueStack: Array<any>): boolean {
        if (opStack.length < 0 || valueStack.length < 2) {
            if (opStack.length > 0 && opStack[opStack.length - 1].Literal == '-') {
                let op = opStack.pop() as GLSLLexerToken;
                let v1 = valueStack.pop() as StatementNode;
                valueStack.push(new SN_UnaryOperation(op, undefined, v1));
                return true;
            }
            return false;
        }

        if (opStack[opStack.length - 1].isOperation()) {
            let v2 = valueStack.pop() as StatementNode;
            let op = opStack.pop() as GLSLLexerToken;
            let v1 = valueStack.pop() as StatementNode;
            if (op.Type == TokenType.DOT) {
                valueStack.push(new SN_SelectOperation(v1, v2));
            } else {
                valueStack.push(new SN_BinaryOperation(op, v1, v2));
            }
            return true;
        }

        return false;
    }
}

/**
 * @internal
 * Statement node: Paren expression
 * @group GFX
 */
export class SN_ParenExpression extends StatementNode {
    constructor() {
        super();
    }

    public formatToWGSL(context: TranslatorContext, depth: number): string {
        let prefix: string = depth <= 0 ? '' : '    '.repeat(depth);
        let result: string = prefix + '(' + this.nodes[0].formatToWGSL(context, 0) + ')';
        return result;
    }
}

/**
 * @internal
 * Statement node: identifier
 * @group GFX
 */
export class SN_Identifier extends StatementNode {
    public name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }

    public formatToWGSL(context: TranslatorContext, depth: number): string {
        let prefix: string = depth <= 0 ? '' : '    '.repeat(depth);
        return prefix + context.findIdentifier(this.name);
    }
}

/**
 * @internal
 * Statement node: constant
 * @group GFX
 */
export class SN_Constant extends StatementNode {
    public value: string;

    constructor(value: string) {
        super();
        this.value = value;
    }

    public static parse(r: GLSLLexer): SN_Constant {
        let firstToken = r.peekToken(0);

        // -1
        if (firstToken.Type == TokenType.SUB && r.peekToken(1).Type == TokenType.LITERAL) {
            let result = new SN_Constant('-' + r.peekToken(1).Literal);
            r.skipToken(2);
            return result;
        }
        // 1
        else if (firstToken.Type == TokenType.LITERAL) {
            let result = new SN_Constant(firstToken.Literal);
            r.skipToken(1);
            return result;
        }

        throw 'Error parsing literal constants: Unexpected characters(' + firstToken.Literal + ')';
    }

    public formatToWGSL(context: TranslatorContext, depth: number): string {
        let prefix: string = depth <= 0 ? '' : '    '.repeat(depth);
        return prefix + this.value;
    }
}

/**
 * @internal
 * Statement node: array constant
 * @group GFX
 */
export class SN_ArrayConstant extends SN_Constant {
    public arrayValue: SN_Constant[];

    constructor(value: SN_Constant[]) {
        super('');
        this.arrayValue = value;
    }

    public static parse(r: GLSLLexer): SN_ArrayConstant {
        if (
            // { 1, 2, 3, 4 }
            (r.peekToken(0).Type == TokenType.LEFTBIG && r.peekToken(1).Type == TokenType.LITERAL) ||
            // { -1, 2, 3, 4 }
            (r.peekToken(0).Type == TokenType.LEFTBIG && r.peekToken(1).Type == TokenType.SUB && r.peekToken(2).Type == TokenType.LITERAL)
        ) {
            r.skipToken(1);
            let arrayValue: SN_Constant[] = [];
            while (r.peekToken(0).Type != TokenType.RIGHTBIG) {
                if (r.peekToken(0).Type == TokenType.LEFTSAMLL) {
                    arrayValue.push(SN_ArrayConstant.parse(r));
                    continue;
                }

                arrayValue.push(SN_Constant.parse(r));

                if (r.peekToken(0).Type == TokenType.COMMA) {
                    r.skipToken(1);
                    continue;
                } else if (r.peekToken(0).Type == TokenType.RIGHTBIG) {
                    r.skipToken(1);
                    break;
                } else throw 'Error parsing array constants: Unexpected characters';
            }

            return new SN_ArrayConstant(arrayValue);
        }

        throw 'Error parsing array constants: Unexpected characters';
    }

    public formatToWGSL(context: TranslatorContext, depth: number): string {
        let result: string = '';
        let prefix: string = depth <= 0 ? '' : '    '.repeat(depth);
        if (this.arrayValue[0].value.includes('.')) {
            result += prefix + 'array<f32, ' + this.arrayValue.length.toString() + '>(';
        } else {
            result += prefix + 'array<i32, ' + this.arrayValue.length.toString() + '>(';
        }
        for (let i: number = 0; i < this.arrayValue.length; i++) {
            if (i > 0) {
                result += ', ';
            }
            result += this.arrayValue[i].formatToWGSL(context, 0);
        }
        result += ')';
        return result;
    }
}

/**
 * @internal
 * Statement node: process control(break)
 * @group GFX
 */
export class SN_Break extends StatementNode {
    constructor() {
        super();
    }
}

/**
 * @internal
 * Statement node: process control(discard)
 * @group GFX
 */
export class SN_Discard extends StatementNode {
    constructor() {
        super();
    }
}

/**
 * @internal
 * Statement node: process control(continue)
 * @group GFX
 */
export class SN_Continue extends StatementNode {
    constructor() {
        super();
    }

    public static parse(r: GLSLLexer): SN_Continue {
        if (r.peekToken(0).Type == TokenType.CONTINUE && r.peekToken(1).Type == TokenType.SEMICOLON) {
            r.skipToken(2);
            return new SN_Continue();
        }

        throw 'Error parsing continue: Unexpected character';
    }

    public formatToWGSL(context: TranslatorContext, depth: number): string {
        let result: string = '';
        let prefix: string = depth <= 0 ? '' : '    '.repeat(depth);
        result += prefix + 'continue';
        return result;
    }
}

/**
 * @internal
 * Statement node: process control(return)
 * @group GFX
 */
export class SN_Return extends StatementNode {
    public value: SN_Expression;

    constructor(value: SN_Expression) {
        super();
        this.value = value;
    }

    public static parse(r: GLSLLexer): SN_Return {
        if (r.peekToken(0).Type == TokenType.RETURN) {
            r.skipToken(1);
            let expr = SN_Expression.parse(r);
            if (r.peekToken(0).Type == TokenType.SEMICOLON) {
                r.skipToken(1);
            }
            return new SN_Return(expr);
        }

        throw 'Error parsing return expression: Unexpected character';
    }

    public formatToWGSL(context: TranslatorContext, depth: number): string {
        let result: string = '';
        let prefix: string = depth <= 0 ? '' : '    '.repeat(depth);
        result += prefix + 'return ' + this.value.formatToWGSL(context, 0);
        return result;
    }
}

/**
 * @internal
 * Statement node: unary operation
 * @group GFX
 */
export class SN_UnaryOperation extends StatementNode {
    public op: GLSLLexerToken;
    public leftValue: StatementNode | undefined;
    public rightValue: StatementNode | undefined;

    constructor(op: GLSLLexerToken, lValue: StatementNode | undefined, rValue: StatementNode | undefined) {
        super();
        this.op = op;
        this.leftValue = lValue;
        this.rightValue = rValue;
    }

    public formatToWGSL(context: TranslatorContext, depth: number): string {
        let result: string = '';
        let prefix: string = depth <= 0 ? '' : '    '.repeat(depth);

        if (this.op.Literal == '++' || this.op.Literal == '--') {
            if (this.leftValue != undefined) {
                let lValue = this.leftValue.formatToWGSL(context, 0);
                result += prefix + lValue + ' = ' + lValue + ' ' + this.op.Literal[0] + ' 1';
            } else {
                let rValue = this.rightValue.formatToWGSL(context, 0);
                result += prefix + rValue + ' = ' + rValue + ' ' + this.op.Literal[0] + ' 1';
            }
        } else {
            if (this.leftValue != undefined) {
                result += prefix + this.leftValue.formatToWGSL(context, 0) + this.op.Literal;
            } else {
                result += prefix + this.op.Literal + this.rightValue.formatToWGSL(context, 0);
            }
        }

        return result;
    }
}

/**
 * @internal
 * Statement node: binary operation
 * @group GFX
 */
export class SN_BinaryOperation extends StatementNode {
    public op: GLSLLexerToken;
    public leftValue: StatementNode;
    public rightValue: StatementNode;

    constructor(op: GLSLLexerToken, lValue: StatementNode, rValue: StatementNode) {
        super();
        this.op = op;
        this.leftValue = lValue;
        this.rightValue = rValue;
    }

    public formatToWGSL(context: TranslatorContext, depth: number): string {
        let result: string = '';
        let prefix: string = depth <= 0 ? '' : '    '.repeat(depth);
        result += prefix + this.leftValue.formatToWGSL(context, 0) + ' ' + this.op.Literal + ' ' + this.rightValue.formatToWGSL(context, 0);
        return result;
    }
}

/**
 * @internal
 * Statement node: ternary operation
 * @group GFX
 */
export class SN_TernaryOperation extends StatementNode {
    public condition: SN_Expression;
    public expression1: SN_Expression;
    public expression2: SN_Expression;

    constructor(condition: SN_Expression, expression1: SN_Expression, expression2: SN_Expression) {
        super();
        this.condition = condition;
        this.expression1 = expression1;
        this.expression2 = expression2;
    }

    public static parse(r: GLSLLexer): SN_TernaryOperation {
        throw 'Error parsing ternary operation expression: Unexpected character';
    }

    public formatToWGSL(context: TranslatorContext, depth: number): string {
        return '';
    }
}

/**
 * @internal
 * Statement node: Expression of select(a.b)
 * @group GFX
 */
export class SN_SelectOperation extends StatementNode {
    public leftValue: StatementNode;
    public rightValue: StatementNode;

    constructor(lValue: StatementNode, rValue: StatementNode) {
        super();
        this.leftValue = lValue;
        this.rightValue = rValue;
    }

    public static parse(r: GLSLLexer): SN_SelectOperation {
        if (r.peekToken(0).Type == TokenType.IDENT && r.peekToken(1).Type == TokenType.DOT && r.peekToken(2).Type == TokenType.IDENT) {
            let lValue = new SN_Identifier(r.peekToken(0).Literal);
            let rValue = new SN_Identifier(r.peekToken(2).Literal);
            r.skipToken(3);
            return new SN_SelectOperation(lValue, rValue);
        }

        throw 'Error parsing selection expression: Unexpected character';
    }

    public formatToWGSL(context: TranslatorContext, depth: number): string {
        let prefix: string = depth <= 0 ? '' : '    '.repeat(depth);
        return prefix + this.leftValue.formatToWGSL(context, 0) + '.' + this.rightValue.formatToWGSL(context, 0);
    }
}

/**
 * @internal
 * Statement node: Expression of index(a[b])
 * @group GFX
 */
export class SN_IndexOperation extends StatementNode {
    public leftValue: StatementNode;
    public indexValue: StatementNode;

    constructor(lValue: StatementNode, indexValue: StatementNode) {
        super();
        this.leftValue = lValue;
        this.indexValue = indexValue;
    }

    public static parse(r: GLSLLexer): SN_IndexOperation {
        if (r.peekToken(0).Type == TokenType.IDENT && r.peekToken(1).Type == TokenType.LEFTMEDI) {
            let lValue = new SN_Identifier(r.peekToken(0).Literal);
            r.skipToken(2);
            let indexValue = SN_Expression.parse(r);
            if (r.peekToken(0).Type == TokenType.RIGHTMEDI) {
                r.skipToken(1);
            }
            let result = new SN_IndexOperation(lValue, indexValue);

            while (r.peekToken(0).Type == TokenType.LEFTMEDI) {
                r.skipToken(1);
                indexValue = SN_Expression.parse(r);
                if (r.peekToken(0).Type == TokenType.RIGHTMEDI) {
                    r.skipToken(1);
                }
                result = new SN_IndexOperation(result, indexValue);
            }

            return result;
        }

        throw 'Error parsing index expression: Unexpected character';
    }

    public formatToWGSL(context: TranslatorContext, depth: number): string {
        let prefix: string = depth <= 0 ? '' : '    '.repeat(depth);
        return prefix + this.leftValue.formatToWGSL(context, 0) + '[' + this.indexValue.formatToWGSL(context, 0) + ']';
    }
}

/**
 * @internal
 * Statement node: code block
 * @group GFX
 */
export class SN_CodeBlock extends StatementNode {
    constructor() {
        super();
    }

    public static parse(r: GLSLLexer): SN_CodeBlock {
        if (r.peekToken(0).Type == TokenType.LEFTBIG) {
            r.skipToken(1);
            let result = new SN_CodeBlock();

            for (let count = 1; count > 0 && r.peekToken(0).Type != TokenType.EOF;) {
                let currToken = r.peekToken(0);

                if (currToken.Type == TokenType.LEFTBIG) {
                    count++;
                    r.skipToken(1);
                    continue;
                }

                if (currToken.Type == TokenType.RIGHTBIG) {
                    count--;
                    r.skipToken(1);
                    continue;
                }

                /**
                 * nop
                 */
                if (currToken.Type == TokenType.SEMICOLON) {
                    r.skipToken(1);
                    continue;
                }
                /**
                 * Declaration of variables
                 */
                if (currToken.isDataType() && r.peekToken(1).Type == TokenType.IDENT) {
                    result.addNode(SN_Declaration.parse(r));
                    continue;
                }
                /**
                 * Declaration of variables
                 */
                if (currToken.Type == TokenType.CONST && r.peekToken(1).isDataType() && r.peekToken(2).Type == TokenType.IDENT) {
                    result.addNode(SN_Declaration.parse(r));
                    continue;
                } else if (
                    /**
                     * assignment expression
                     * a = ...;
                     */
                    currToken.Type == TokenType.IDENT &&
                    r.peekToken(1).Type == TokenType.ASSIGN
                ) {
                    result.addNode(SN_Expression.parse(r));
                    if (r.peekToken(0).Type == TokenType.SEMICOLON) {
                        r.skipToken(1);
                    }
                    continue;
                } else if (
                    /**
                     * Expression of index
                     * a[...]
                     */
                    currToken.Type == TokenType.IDENT &&
                    r.peekToken(1).Type == TokenType.LEFTMEDI
                ) {
                    let indexOperation = SN_IndexOperation.parse(r);

                    // a[...] = xxx;
                    if (r.peekToken(0).Type == TokenType.ASSIGN) {
                        let op = r.peekToken(0);
                        r.skipToken(1);
                        let rValue = SN_Expression.parse(r);
                        if (r.peekToken(0).Type == TokenType.RIGHTMEDI) {
                            r.skipToken(1);
                        }
                        result.addNode(new SN_BinaryOperation(op, indexOperation, rValue));
                        continue;
                    }

                    result.addNode(indexOperation);
                    continue;
                } else if (
                    /**
                     * Expression of choice
                     * a.b
                     */
                    currToken.Type == TokenType.IDENT &&
                    r.peekToken(1).Type == TokenType.DOT
                ) {
                    let expr = SN_Expression.parse(r);
                    result.addNode(expr);
                    continue;
                } else if (
                    /**
                     * Assignment operation expression
                     * a += ...;
                     */
                    currToken.Type == TokenType.IDENT &&
                    r.peekToken(1).isAssignOperation()
                ) {
                    let op = r.peekToken(1);
                    let lValue = new SN_Identifier(currToken.Literal);
                    r.skipToken(2);
                    let rValue = SN_Expression.parse(r);
                    if (r.peekToken(0).Type == TokenType.SEMICOLON) {
                        r.skipToken(1);
                    }
                    result.addNode(new SN_BinaryOperation(op, lValue, rValue));
                    continue;
                } else if (
                    /**
                     * After the increase, after the decrease
                     * a++;
                     */
                    currToken.Type == TokenType.IDENT &&
                    (r.peekToken(1).Type == TokenType.INC || r.peekToken(1).Type == TokenType.DEC) &&
                    r.peekToken(2).Type == TokenType.SEMICOLON
                ) {
                    let op = r.peekToken(1);
                    result.addNode(new SN_UnaryOperation(op, new SN_Identifier(currToken.Literal), undefined));
                    r.skipToken(3);
                    continue;
                } else if (currToken.Type == TokenType.RETURN) {
                    /**
                     * return
                     */
                    result.addNode(SN_Return.parse(r));
                    continue;
                } else if (currToken.Type == TokenType.CONTINUE) {
                    /**
                     * continue
                     */
                    result.addNode(SN_Continue.parse(r));
                    continue;
                } else if (currToken.Type == TokenType.WHILE) {
                    /**
                     * while
                     */
                    result.addNode(SN_WhileLoop.parse(r));
                    continue;
                } else if (currToken.Type == TokenType.FOR) {
                    /**
                     * for
                     */
                    result.addNode(SN_ForLoop.parse(r));
                    continue;
                } else if (currToken.Type == TokenType.IF) {
                    /**
                     * if
                     */
                    result.addNode(SN_IFBranch.parse(r));
                    continue;
                } else if (
                    /**
                     * function call
                     */
                    currToken.Type == TokenType.IDENT &&
                    r.peekToken(1).Type == TokenType.LEFTSAMLL
                ) {
                    result.addNode(SN_FunctionCall.parse(r));
                    if (r.peekToken(0).Type == TokenType.SEMICOLON) {
                        r.skipToken(0);
                    }
                    continue;
                }

                throw 'Error parsing block: Unexpected symbol(' + currToken.Literal + ')';
            }

            return result;
        }

        throw 'Error parsing block: Unexpected symbol';
    }
}

/**
 * @internal
 * Statement node: precision
 * @group GFX
 */
export class SN_Precision extends StatementNode {
    public type: string;
    public qualifier: string;

    constructor(qualifier: string, type: string) {
        super();
        this.type = type;
        this.qualifier = qualifier;
    }

    public static parse(r: GLSLLexer): SN_Precision {
        if (r.peekToken(0).Type == TokenType.PRECISION && r.peekToken(1).Type == TokenType.IDENT && r.peekToken(2).isBuiltinType()) {
            let result = new SN_Precision(r.peekToken(1).Literal, r.peekToken(2).Literal);
            r.skipToken(3);
            if (r.peekToken(0).Type == TokenType.SEMICOLON) {
                r.skipToken(1);
            }
            return result;
        }

        throw 'Error parsing precision qualifier: Unexpected character';
    }

    public formatToWGSL(context: TranslatorContext, depth: number): string {
        return '';
    }
}

/**
 * @internal
 * Statement node: layout
 * @group GFX
 */
export class SN_Layout extends StatementNode {
    public scope: string = '';
    public qualifier: Map<string, string> = new Map<string, string>();

    constructor() {
        super();
    }

    public addQualifier(name: string, value: string = '') {
        this.qualifier.set(name, value);
    }

    public static parse(r: GLSLLexer): SN_Layout {
        if (r.peekToken(0).Type == TokenType.LAYOUT && r.peekToken(1).Type == TokenType.LEFTSAMLL) {
            let result = new SN_Layout();
            r.skipToken(2);

            do {
                let currToken = r.peekToken(0);
                if (currToken.Type == TokenType.IDENT) {
                    if (r.peekToken(1).Type == TokenType.ASSIGN && r.peekToken(2).Type == TokenType.LITERAL) {
                        let name = r.peekToken(0).Literal;
                        let value = r.peekToken(2).Literal;
                        result.addQualifier(name, value);

                        r.skipToken(3);
                        if (r.peekToken(0).Type == TokenType.COMMA) {
                            r.skipToken(1);
                            continue;
                        }

                        let token = r.peekToken(0);
                        token.Line = 0;
                    } else if (r.peekToken(1).Type == TokenType.RIGHTSAMLL) {
                        let name = r.peekToken(0).Literal;
                        result.addQualifier(name, '');
                        r.skipToken(1);
                        break;
                    } else if (r.peekToken(1).Type == TokenType.COMMA) {
                        let name = r.peekToken(0).Literal;
                        result.addQualifier(name, '');
                        r.skipToken(2);
                        continue;
                    }
                }
            } while (r.peekToken(0).Type != TokenType.RIGHTSAMLL);

            if (r.peekToken(0).Type == TokenType.RIGHTSAMLL) {
                r.skipToken(1);
            }

            // Scope of resolution
            result.scope = r.peekToken(0).Literal;
            r.skipToken(1);

            // Empty qualifier
            if (r.peekToken(0).Type == TokenType.SEMICOLON) {
                r.skipToken(1);
                return result;
            }
            // Built-in type
            else if (r.peekToken(0).isBuiltinType() && r.peekToken(1).Type == TokenType.IDENT && r.peekToken(2).Type == TokenType.SEMICOLON) {
                let node = new SN_Declaration(r.peekToken(0).Literal, r.peekToken(1).Literal);
                result.addNode(node);
                r.skipToken(3);
                return result;
            }
            // structure type
            else if (r.peekToken(0).Type == TokenType.IDENT && r.peekToken(1).Type == TokenType.LEFTBIG) {
                let structNode = SN_Struct.parse(r);
                result.addNode(structNode);

                if (r.peekToken(0).Type == TokenType.IDENT && r.peekToken(1).Type == TokenType.SEMICOLON) {
                    structNode.addNode(new SN_Declaration(structNode.name, r.peekToken(0).Literal));
                    r.skipToken(2);
                }

                return result;
            } else throw 'Error parsing layout qualifier type: Unexpected symbol(' + r.peekToken(0).Literal + ')';
        }

        throw 'Error parsing layout qualifier: Unexpected symbol';
    }

    public formatToWGSL(context: TranslatorContext, depth: number): string {
        let result: string = '';

        if (this.qualifier.size == 1 && this.qualifier.has('location')) {
            result += '@location(' + this.qualifier.get('location') + ') ';
        } else if (this.qualifier.size == 2 && this.qualifier.has('set') && this.qualifier.has('binding')) {
            result += '@group(' + this.qualifier.get('set') + ') @binding(' + this.qualifier.get('binding') + ') ';
        } else if (this.qualifier.size >= 1 && this.qualifier.has('binding')) {
            result += '@group(0) @binding(' + this.qualifier.get('binding') + ') ';
        } else if (this.qualifier.size == 1 && this.qualifier.has('push_constant')) {
            result += '@push_constant ';
        } else if (this.qualifier.size >= 1 && this.qualifier.has('local_size_x')) {
            result += '@workgroup_size(';
            result += this.qualifier.get('local_size_x') + ', ';
            result += this.qualifier.has('local_size_y') ? this.qualifier.get('local_size_y') + ', ' : '1, ';
            result += this.qualifier.has('local_size_z') ? this.qualifier.get('local_size_z') + '' : '1';
            result += ')';
        } else if (this.nodes.length <= 0) {
            return '';
        }

        let item = this.nodes[0];
        if (item instanceof SN_Declaration) {
            switch (item.type) {
                case 'sampler':
                case 'texture2D':
                    result += 'var ';
                    break;
                default:
                    if (this.scope == 'buffer') {
                        if (context.stage == 'compute') {
                            result += 'var<storage, read_write> ';
                        } else {
                            result += 'var<storage, read> ';
                        }
                    } else {
                        result += 'var<' + this.scope + '> ';
                    }
                    break;
            }

            context.addIdentifier(item.name, item.name);
            result += item.name + ': ' + toWGSLType(item.type) + ';\r\n';
        } else if (item instanceof SN_Struct) {
            if (this.scope == 'buffer') {
                if (context.stage == 'compute') {
                    result += 'var<storage, read_write> ';
                } else {
                    result += 'var<storage, read> ';
                }
            } else {
                result += 'var<' + this.scope + '> ';
            }

            if (item.nodes.length <= 0) {
                let rename = 'unif' + context.layoutUniformCount.toString();
                while (context.hasIdentifier(rename)) {
                    context.layoutUniformCount++;
                    rename = 'unif' + context.layoutUniformCount.toString();
                }
                for (let field of item.fields) {
                    context.addIdentifier(field.name, rename + '.' + field.name);
                }
                result += rename + ': ' + item.name + ';\r\n';
                context.layoutUniformCount++;
            } else {
                let declaration = item.nodes[0] as SN_Declaration;
                result += declaration.name + ': ' + declaration.type + ';\r\n';
            }
            return result;
        }
        return result;
    }
}

/**
 * @internal
 * @param type
 * @returns
 */
function toWGSLType(type: string): string {
    switch (type) {
        case 'int':
            return 'i32';
        case 'int[]':
            return 'array<i32>';

        case 'uint':
            return 'u32';
        case 'uint[]':
            return 'array<u32>';

        case 'float':
            return 'f32';
        case 'float[]':
            return 'array<f32>';

        case 'vec2':
            return 'vec2<f32>';
        case 'vec3':
            return 'vec3<f32>';
        case 'vec4':
            return 'vec4<f32>';
        case 'vec2[]':
            return 'array<vec2<f32>>';
        case 'vec3[]':
            return 'array<vec3<f32>>';
        case 'vec4[]':
            return 'array<vec4<f32>>';

        case 'ivec2':
            return 'vec2<i32>';
        case 'ivec3':
            return 'vec3<i32>';
        case 'ivec4':
            return 'vec4<i32>';
        case 'ivec2[]':
            return 'array<vec2<i32>>';
        case 'ivec3[]':
            return 'array<vec3<i32>>';
        case 'ivec4[]':
            return 'array<vec4<i32>>';

        case 'mat2':
            return 'mat2x2<f32>';
        case 'mat2x2':
            return 'mat2x2<f32>';
        case 'mat2x3':
            return 'mat2x3<f32>';
        case 'mat2x4':
            return 'mat2x4<f32>';
        case 'mat2[]':
            return 'array<mat2x2<f32>>';
        case 'mat2x2[]':
            return 'array<mat2x2<f32>>';
        case 'mat2x3[]':
            return 'array<mat2x3<f32>>';
        case 'mat2x4[]':
            return 'array<mat2x4<f32>>';

        case 'mat3':
            return 'mat3x3<f32>';
        case 'mat3x2':
            return 'mat3x2<f32>';
        case 'mat3x3':
            return 'mat3x3<f32>';
        case 'mat3x4':
            return 'mat3x4<f32>';
        case 'mat3[]':
            return 'array<mat3x3<f32>>';
        case 'mat3x2[]':
            return 'array<mat3x2<f32>>';
        case 'mat3x3[]':
            return 'array<mat3x3<f32>>';
        case 'mat3x4[]':
            return 'array<mat3x4<f32>>';

        case 'mat4':
            return 'mat4x4<f32>';
        case 'mat4x2':
            return 'mat4x2<f32>';
        case 'mat4x3':
            return 'mat4x3<f32>';
        case 'mat4x4':
            return 'mat4x4<f32>';
        case 'mat4[]':
            return 'array<mat4x4<f32>>';
        case 'mat4x2[]':
            return 'array<mat4x2<f32>>';
        case 'mat4x3[]':
            return 'array<mat4x3<f32>>';
        case 'mat4x4[]':
            return 'array<mat4x4<f32>>';

        case 'texture2D':
            return 'texture_2d<f32>';
    }
    return type;
}
