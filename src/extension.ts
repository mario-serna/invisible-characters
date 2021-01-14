// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { subscribeToDocumentChanges, cleanInvisibleCharacters, INV_CHAR_MENTION } from './diagnosticInvisibleCharacters';

const COMMAND = 'invisible-characters.checkInvisibleCharacters';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "invisible-characters" is now active!');

	let activeTextEditor = vscode.window.activeTextEditor;
	const invisibleCharacterDiagnostics = vscode.languages.createDiagnosticCollection("invisible-character");
	context.subscriptions.push(invisibleCharacterDiagnostics);

	if (activeTextEditor) {
		subscribeToDocumentChanges(context, activeTextEditor, invisibleCharacterDiagnostics);
	}

	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider('*', new InvisibleCharacterInfo(), {
			providedCodeActionKinds: InvisibleCharacterInfo.providedCodeActionKinds
		})
	);

	let disposable = vscode.commands.registerCommand(COMMAND, () => {
		let activeTextEditor = vscode.window.activeTextEditor;
		// The code you place here will be executed every time your command is executed
		if (activeTextEditor) {
			cleanInvisibleCharacters(activeTextEditor, invisibleCharacterDiagnostics);
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }

// Provide code actions corresponding to diagnostic problems
export class InvisibleCharacterInfo implements vscode.CodeActionProvider {

	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];

	provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.CodeAction[] {
		// for each diagnostic entry that has the matching `code`, create a code action command
		return context.diagnostics
			.filter(diagnostic => diagnostic.code === INV_CHAR_MENTION)
			.map(diagnostic => this.createCommandCodeAction(diagnostic));
	}

	private createCommandCodeAction(diagnostic: vscode.Diagnostic): vscode.CodeAction {
		const action = new vscode.CodeAction('Clean all Non-Printable Characters', vscode.CodeActionKind.QuickFix);
		action.command = { command: COMMAND, title: 'Clean all Non-Printable Characters', tooltip: 'This will clean all Non-Printable Characters in the current document' };
		action.diagnostics = [diagnostic];
		action.isPreferred = true;
		return action;
	}
}
