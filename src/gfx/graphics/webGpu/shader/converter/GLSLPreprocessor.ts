import { Reader } from './Reader';
/**
 * @internal
 */
class MacroSubstitution {
    public name: string = '';
    public value: string = '';
    public args: Array<string> = [];
}

/**
 * @internal
 * GLSL code preprocessor
 * @group GFX
 */
export class GLSLPreprocessor extends Reader {
    private _result: string;
    private _skipLine: boolean;
    private _definitionTables: Map<string, any>;

    constructor(source: string) {
        super(source);
        this._result = '';
        this._skipLine = false;
        this._definitionTables = new Map<string, any>();
        this.parse();
    }

    private parse() {
        this.readChar();
        while (this._char !== '\0') {
            this.skipWhitespace();

            // Skip the comments
            if (this._char === '/') {
                // Skip single-line comments
                if (this.peekChar() === '/') {
                    this.skipComment();
                    continue;
                }
                // Skip multi-line comments
                if (this.peekChar() === '*') {
                    this.skipMultilineComment();
                    continue;
                }
            }

            // Preprocessing command
            if (this._char === '#') {
                this.readCharAndSkipWhitespace();
                var name = this.readIdentifier();
                switch (name) {
                    case 'version':
                        let version = this.readLine().trim();
                        break;
                    case 'define':
                        this.readCharAndSkipWhitespace();
                        var defineName = this.readIdentifier();
                        if (this.getChar() === '(') {
                            let macro = new MacroSubstitution();
                            this.readCharAndSkipWhitespace();
                            if (this.getChar() !== ')') {
                                do {
                                    var argName = this.readIdentifier();
                                    macro.args.push(argName);
                                    this.skipWhitespace();
                                    if (this.getChar() === ',') {
                                        this.readCharAndSkipWhitespace();
                                        continue;
                                    }
                                } while (this.getChar() !== ')');
                            }
                            this.readCharAndSkipWhitespace();
                            macro.name = defineName;
                            macro.value = this.readLine().trim();
                            this._definitionTables.set(defineName, macro);
                            this.readCharAndSkipWhitespace();
                        } else {
                            let defineValue = this.readLine().trim();
                            if (defineValue[0] == '=') {
                                defineValue = defineValue.substring(1);
                            }
                            this._definitionTables.set(defineName, defineValue);
                        }
                        break;
                    case 'if':
                        let condition = this.readLine().trim();
                        if (condition == '0' || condition == 'false') {
                            this._skipLine = true;
                            break;
                        }
                        if (this._definitionTables.has(condition)) {
                            condition = this._definitionTables.get(condition);
                            if (condition == '0' || condition == 'false') {
                                this._skipLine = true;
                                break;
                            }
                        }
                        break;
                    case 'ifdef':
                        this.readCharAndSkipWhitespace();
                        var value = this.readIdentifier();
                        this._skipLine = !this._definitionTables.has(value);
                        break;
                    case 'else':
                        this._skipLine = !this._skipLine;
                        break;
                    case 'endif':
                        this._skipLine = false;
                        break;
                    default:
                        throw 'Unknown preprocessing command:' + name;
                }
            } else {
                var line = this.readLine();
                if (!this._skipLine) {
                    for (let key of this._definitionTables.keys()) {
                        let index = line.indexOf(key);
                        if (index != -1) {
                            let value = this._definitionTables.get(key);
                            if (typeof value === 'string') {
                                line = line.replace(key, value);
                            } else {
                                let macro = value as MacroSubstitution;
                                let reader = new Reader(line.substring(index + key.length));
                                reader.readCharAndSkipWhitespace();
                                if (reader.getChar() === '(') {
                                    reader.readCharAndSkipWhitespace();
                                    for (let count = 1; reader.getChar() !== '\0' && count > 0;) {
                                        switch (reader.getChar()) {
                                            case '(':
                                                count++;
                                                break;
                                            case ')':
                                                count--;
                                                break;
                                        }
                                        reader.readCharAndSkipWhitespace();
                                    }
                                }

                                let nBeginPos = index;
                                let nEndPos = nBeginPos + key.length + reader.currPosition;
                                let expr = line.substring(nBeginPos, nEndPos).trim();

                                if (macro.args.length > 0) {
                                    let args: string[] = [];
                                    let argsStr = expr.substring(expr.indexOf('(') + 1, expr.lastIndexOf(')')).trim();
                                    if (argsStr.length > 0) {
                                        args = this.parseArgs(argsStr);
                                    }

                                    let macroValue = macro.value.substring(macro.value.indexOf('('));
                                    for (let i = 0; i < macro.args.length; i++) {
                                        macroValue = macroValue.replace(macro.args[i], args[i]);
                                    }
                                    macroValue = macro.value.substring(0, macro.value.indexOf('(')) + macroValue;

                                    line = line.replace(expr, macroValue);
                                } else {
                                    line = line.replace(expr, macro.value);
                                }
                            }
                        }
                    }
                    this._result += line;
                }
                this.readChar();
            }
        }
    }

    public get source(): string {
        return this._result;
    }

    private parseArgs(str: string): string[] {
        let result: string[] = [];
        let count = 0;
        let reader = new Reader(str);
        let position = reader.currPosition;
        reader.readCharAndSkipWhitespace();
        if (reader.getChar() !== '\0') {
            reader.readCharAndSkipWhitespace();
            for (; reader.getChar() !== '\0';) {
                switch (reader.getChar()) {
                    case '(':
                        count++;
                        break;
                    case ')':
                        count--;
                        break;
                    case ',':
                        if (count == 0) {
                            let arg = str.substring(position, reader.currPosition);
                            result.push(arg);
                            position = reader.currPosition + 1;
                        }
                        break;
                }
                reader.readCharAndSkipWhitespace();
            }
        }

        if (position < reader.currPosition) {
            let arg = str.substring(position, reader.currPosition);
            result.push(arg);
        }

        return result;
    }
}
