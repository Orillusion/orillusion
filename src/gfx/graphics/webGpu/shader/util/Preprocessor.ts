import { ShaderLib } from '../../../../../assets/shader/ShaderLib';

/**
 * @internal
 * @group GFX
 */
export class Preprocessor {

    public static parse(code: string, defineValue: { [name: string]: any }): string {
        code = this.filterComment(code);
        code = this.parsePreprocess(new PreprocessorContext(), code, defineValue);
        code = this.parseAutoBindingForGroupX(code, 1);
        return code;
    }

    public static parseComputeShader(code: string, defineValue: { [name: string]: any }): string {
        code = this.filterComment(code);
        code = this.parsePreprocess(new PreprocessorContext(), code, defineValue);
        return code;
    }

    protected static parsePreprocess(context: PreprocessorContext, code: string, defineValue: { [name: string]: any }): string {
        let begIndex = code.indexOf('#');
        if (begIndex == -1) {
            return code;
        }
        let header = code.substring(0, begIndex);
        let endIndex = code.indexOf('\n', code.lastIndexOf('#'));
        let codeBlock = code.substring(begIndex, endIndex);
        let tail = code.substring(endIndex);
        return header + this.parsePreprocessCommand(context, codeBlock, defineValue) + tail;
    }

    protected static parseAutoBindingForGroupX(code: string, nGroup: number): string {
        let offset = 0;
        let result = '';
        let group = new Map<number, number>();
        while (offset < code.length) {
            let nLeftIndex = code.indexOf('@group(', offset);
            if (nLeftIndex == -1) {
                result += code.substring(offset);
                break;
            }
            let nRightIndex = code.indexOf(')', nLeftIndex);
            let groupID = Number.parseInt(code.substring(nLeftIndex + 7, nRightIndex));
            nLeftIndex = code.indexOf('@binding(', nRightIndex);
            nRightIndex = code.indexOf(')', nLeftIndex);

            // let bindingID = code.substring(nLeftIndex + 9, nRightIndex);

            result += code.substring(offset, nLeftIndex);
            if (groupID == nGroup) {
                if (group.has(groupID)) {
                    let lastBindingId = group.get(groupID) + 1;
                    result += `@binding(${lastBindingId})`;
                    group.set(groupID, lastBindingId);
                } else {
                    result += '@binding(0)';
                    group.set(groupID, 0);
                }
            } else {
                result += code.substring(nLeftIndex, nRightIndex + 1);
            }
            offset = nRightIndex + 1;
        }

        return result;
    }

    protected static parsePreprocessCommand(context: PreprocessorContext, code: string, defineValue: { [name: string]: any }): string {
        let result: string = '';
        let lines = code.split('\n');
        let stack: Array<boolean> = [false];
        let stackElseif: Array<boolean> = [false];
        for (let i: number = 0; i < lines.length; i++) {
            let line = lines[i];
            let skip = stack[stack.length - 1];
            if (line.trim().indexOf('#') != 0) {
                if (!skip) {
                    result += line + '\n';
                }
                continue;
            }
            let command = line.trim();
            if (command.indexOf('#if') != -1) {
                if (skip && stack.length > 1) {
                    stack.push(skip);
                    continue;
                }
                let condition = command.substring(3).trim();
                skip = !this.parseCondition(condition, defineValue);
                stack.push(skip);
                stackElseif.push(!skip);
                continue;
            } else if ((command.indexOf('#elseif') != -1) || (command.indexOf('#else') != -1 && command.indexOf(' if') != -1)) {
                let skipElseif = stackElseif[stackElseif.length - 1];
                if (skipElseif) {
                    stack.pop();
                    skip = true;
                    stack.push(skip);
                    continue;
                }
                stack.pop();
                skip = stack[stack.length - 1];
                if (skip && stack.length > 1) {
                    stack.push(skip);
                    continue;
                }
                let condition = command.substring(command.indexOf('if') + 2).trim();
                if (condition == '') {
                    console.error(`preprocess command error, conditions missing: ${command}`);
                }
                skip = !this.parseCondition(condition, defineValue);
                stack.push(skip);
                stackElseif.push(!skip);
                continue;
            } else if (command.indexOf('#else') != -1) {
                stack.pop();
                if (skip && (stack.length > 1 && stack[stack.length - 1])) {
                    stack.push(skip);
                } else {
                    stack.push(!skip);
                }
                continue;
            } else if (command.indexOf('#endif') != -1) {
                stack.pop();
                stackElseif.pop();
                continue;
            } else if (command.indexOf('#include') != -1) {
                let includeName = '';
                let char = command.charAt(command.length - 1);
                if (char == `>`) {
                    includeName = this.extract(command, '<', '>');
                } else {
                    includeName = this.extract(command, char, char);
                }

                if (!context.includeMap.has(includeName)) {
                    context.includeMap.set(includeName, true);

                    let code = ShaderLib.getShader(includeName);
                    if (!code) {
                        throw `${command} error: '${includeName}' not found`;
                    }

                    code = this.filterComment(code);
                    code = this.parsePreprocess(context, code, defineValue);
                    result += code + '\r\n';
                }
                continue;
            } else if (command.indexOf('#define ') != -1) {
                let expression = command.substring(command.indexOf('#define ') + 8).trim();
                let index = expression.indexOf(' ');
                let name = expression;
                let value = '';
                if (index != -1) {
                    name = expression.substring(0, index).trim();
                    value = expression.substring(index + 1).trim();
                }
                defineValue[name] = value;
                continue;
            } else throw 'nonsupport: ' + command;
        }
        return result;
    }

    protected static parseCondition(condition: string, defineValue: { [name: string]: any }): boolean {
        let value = defineValue[condition];
        if (value == undefined) {
            return false;
        }
        return value == true || value != 0;
    }

    public static filterComment(code: string): string {
        let result = '';
        let findSingleComment = true;
        let findMultiComment = true;
        for (let offset = 0; offset < code.length;) {
            let index1 = findSingleComment ? code.indexOf('//', offset) : -1;
            let index2 = findMultiComment ? code.indexOf('/*', offset) : -1;

            if (index1 == -1 && index2 == -1) {
                result += code.substring(offset);
                break;
            }

            findSingleComment = index1 != -1;
            findMultiComment = index2 != -1;

            if (index1 != -1 && index2 != -1) {
                if (index1 < index2) {
                    index2 = -1;
                } else {
                    index1 = -1;
                }
            }

            if (index1 != -1) {
                index2 = code.indexOf('\n', index1);
                result += code.substring(offset, index1);
                offset = index2 != -1 ? index2 : code.length;
            } else if (index2 != -1) {
                index1 = code.indexOf('*/', index2);
                result += code.substring(offset, index2);
                offset = index1 + 2;
            }
        }

        return result;
    }

    protected static extract(str: string, leftStr: string, rightStr: string): string {
        let indexL = str.indexOf(leftStr) + leftStr.length;
        let indexR = str.indexOf(rightStr, indexL);
        return str.substring(indexL, indexR).trim();
    }
}

class PreprocessorContext {
    public includeMap = new Map<string, boolean>();

    constructor() {
    }
}
