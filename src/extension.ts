// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';


function splitIdentifierByRegex(identifier: string): string[] {
	if (!identifier) {
		return [""];
	}

	// 根据不同的命名风格分割字符串
	if (/^[A-Z][a-zA-Z]*$/.test(identifier)) {
		// VarBigHump: 大驼峰
		return identifier.split(/(?=[A-Z])/).map(word => word.toLowerCase());
	} else if (/^[a-z][a-zA-Z]*$/.test(identifier)) {
		// varLittleHump: 小驼峰
		return identifier.split(/(?=[A-Z])/).map(word => word.toLowerCase());
	} else if (/^[a-z]+(_[a-z]+)*$/.test(identifier)) {
		// var_snake_case: 蛇形命名
		return identifier.split('_');
	} else if (/^[A-Z]+(_[A-Z]+)*$/.test(identifier)) {
		// VAR_CONSTANT_CASE: 常量命名
		return identifier.split('_').map(word => word.toLowerCase());
	} else {
		// 其他不支持的命名风格 返回原字符串
		return [identifier];
	}
}

function splitIdentifierByState(identifier: string): string[] {
    if (!identifier) {
        return [""];
    }
    var result: string[] = [];
    // 用于存放当前单词的字母数组
    var temp: string[] = [];
    enum State {
        INIT,
        LOWER,
        UPPER,
        INVALID
    }

    function pushWord(): void {
        if (temp.length > 0) {
            result.push(temp.join(""));
        }
        temp = [];
    }

    function FSM(state: State, char: string): State {
        switch (state) {
            case State.INIT: {
                if (char.match(/[a-z]/)) {
                    // 小写字母

                    // 转移动作
                    // 记录新单词
                    temp.push(char);
                    return State.LOWER;
                }
                else if (char.match(/[A-Z]/)) {
                    // 大写字母

                    // 转移动作
                    // 记录新单词
                    temp.push(char.toLowerCase());
                    return State.UPPER;
                }
                else {
                    return State.INVALID;
                }
            }
            case State.LOWER: {
                if (char.match(/[a-z\d]/)) {
                    // 小写字母或数字

                    // 转移动作
                    temp.push(char);
                    return State.LOWER;
                }
                else if (char.match(/[A-Z]/)) {
                    // 大写字母

                    // 转移动作
                    // 前一个单词匹配完成
                    pushWord();
                    // 记录新单词
                    temp.push(char.toLowerCase());
                    return State.UPPER;
                }
                else if (char.match(/[_ ]/)) {
                    // 空格或下划线

                    // 转移动作
                    // 前一个单词匹配完成
                    pushWord();
                    return State.INIT;
                }
                else {
                    return State.INVALID;
                }
            }
            case State.UPPER: {
                if (char.match(/[a-z]/)) {
                    // 小写字母

                    // 转移动作
                    temp.push(char.toLowerCase());
                    return State.LOWER;
                }
                else if (char.match(/[A-Z\d]/)) {
                    // 大写字母或数字

                    // 转移动作
                    temp.push(char.toLowerCase());
                    return State.UPPER;
                }
                else if (char.match(/[_ ]/)) {
                    // 空格或下划线

                    // 转移动作
                    // 前一个单词匹配完成
                    pushWord();
                    return State.INIT;
                }
                else {
                    return State.INVALID;
                }
            }
            default: {
                return State.INVALID;
            }
        }
    }

    let currentState: State = State.INIT;
    for (let i = 0; i < identifier.length; i++) {
        currentState = FSM(currentState, identifier[i]);
        if (currentState === State.INVALID) {
            // 遇到非法字符，直接返回
            return [identifier];
        }
    }
    pushWord();

    return result;
}

/**
 * 根据不同的命名风格分割为全小写字符串数组
 *
 * @param identifier 待分割的字符串
 * @returns 分割后的字符串数组
 */
function splitIdentifier(identifier: string): string[] {
    return splitIdentifierByState(identifier);
}

function convertToBigHump(identifier: string): string {
	const words = splitIdentifier(identifier);
	if (words.length === 1) {
		return words[0];
	}
	return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join("");
}

function convertToLittleHump(identifier: string): string {
	const words = splitIdentifier(identifier);
	if (words.length === 1) {
		return words[0];
	}
	var newIdentifier = words.map((word, index) => {
		if (index === 0) {
			return word.charAt(0).toLowerCase() + word.slice(1);
		}
		return word.charAt(0).toUpperCase() + word.slice(1);
	}).join("");
	return newIdentifier;
}

function convertToSnakeCase(identifier: string): string {
	const words = splitIdentifier(identifier);
	return words.join("_");
}

function convertToConstantCase(identifier: string): string {
	const words = splitIdentifier(identifier);
	return words.map(word => word.toUpperCase()).join("_");
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "naming-style" is now active!');

	const disposable_list = [
		vscode.commands.registerCommand('naming-style.convertToBigHump', () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				return;
			}
			const selections = editor.selections;
			const text = editor.document.getText(selections[0]);
			const newText = convertToBigHump(text);
			editor.edit(editBuilder => {
				selections.forEach(selection => {
					editBuilder.replace(selection, newText);
				});
			});
		}),
		vscode.commands.registerCommand('naming-style.convertToLittleHump', () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				return;
			}
			const selections = editor.selections;
			const text = editor.document.getText(selections[0]);
			const newText = convertToLittleHump(text);
			editor.edit(editBuilder => {
				selections.forEach(selection => {
					editBuilder.replace(selection, newText);
				});
			});
		}),
		vscode.commands.registerCommand('naming-style.convertToSnakeCase', () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				return;
			}
			const selections = editor.selections;
			const text = editor.document.getText(selections[0]);
			const newText = convertToSnakeCase(text);
			editor.edit(editBuilder => {
				selections.forEach(selection => {
					editBuilder.replace(selection, newText);
				});
			});
		}),
		vscode.commands.registerCommand('naming-style.convertToConstantCase', () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				return;
			}
			const selections = editor.selections;
			const text = editor.document.getText(selections[0]);
			const newText = convertToConstantCase(text);
			editor.edit(editBuilder => {
				selections.forEach(selection => {
					editBuilder.replace(selection, newText);
				});
			});
		})
	];

	disposable_list.forEach(disposable => { context.subscriptions.push(disposable); });
}

// This method is called when your extension is deactivated
export function deactivate() {}
