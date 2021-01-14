/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';

/** Code that is used to associate diagnostic entries with code actions. */
export const INV_CHAR_MENTION = 'invisible_character_mention';

/** String to detect in the text document. */
const INV_CHAR = [
    "\\0-\\x08",
    "\\u000B",
    "\\u000C",
    "\\u000E-\\u001F",
    "\\x7F-\\u0084",
    "\\u0086-\\x9F",
    "\\u00A0",
    "\\xAD",
    "\\u200B-\\u200F",
    "\\u202A-\\u202E",
    "\\u2060-\\u206F",
    "\\u2072",
    "\\uFEFD-\\uFF00",
    "\\uFFEF-\\uFFFB"
];

/**
 * Analyzes the text document for problems. 
 * This code finds all Non-Printable Characters.
 * @param activeTextEditor text editor to analyze
 * @param invisibleCharDiagnostics diagnostic collection
 */
export function refreshDiagnostics(activeTextEditor: vscode.TextEditor, invisibleCharDiagnostics: vscode.DiagnosticCollection): void {
    const diagnostics: vscode.Diagnostic[] = [];
    const regEx = new RegExp(`[${INV_CHAR.join('')}]`, 'g');

    if (!activeTextEditor) {
        return;
    }

    const text = activeTextEditor.document.getText();
    const invisibleCharacters: vscode.DecorationOptions[] = [];
    let match;

    while ((match = regEx.exec(text))) {
        const startPos = activeTextEditor.document.positionAt(match.index);
        const endPos = activeTextEditor.document.positionAt(match.index + match[0].length);
        const range = new vscode.Range(startPos, endPos);
        const decoration = { range: range, hoverMessage: 'Non-Printable Character' };
        invisibleCharacters.push(decoration);
        diagnostics.push(createDiagnostic(range));

    }
    invisibleCharDiagnostics.set(activeTextEditor.document.uri, diagnostics);
}

function createDiagnostic(range: vscode.Range): vscode.Diagnostic {
    const diagnostic = new vscode.Diagnostic(range, "Invalid Character",
        vscode.DiagnosticSeverity.Error);
    diagnostic.code = INV_CHAR_MENTION;
    return diagnostic;
}

export function cleanInvisibleCharacters(activeTextEditor: vscode.TextEditor, invisibleCharDiagnostics: vscode.DiagnosticCollection) {
    const regEx = new RegExp(`[${INV_CHAR.join('')}]`, 'g');

    if (!activeTextEditor) {
        return;
    }

    const text = activeTextEditor.document.getText().replace(regEx, '');

    const workEdits = new vscode.WorkspaceEdit();
    const range = new vscode.Range(activeTextEditor.document.lineAt(0).range.start, activeTextEditor.document.lineAt(activeTextEditor.document.lineCount - 1).range.end);
    workEdits.replace(activeTextEditor.document.uri, range, text);
    vscode.workspace.applyEdit(workEdits); // apply the edits
    invisibleCharDiagnostics.set(activeTextEditor.document.uri, []);
}

export function subscribeToDocumentChanges(context: vscode.ExtensionContext, activeTextEditor: vscode.TextEditor, invisibleCharDiagnostics: vscode.DiagnosticCollection): void {

    if (activeTextEditor) {
        refreshDiagnostics(activeTextEditor, invisibleCharDiagnostics);
    }

    context.subscriptions.push(
        vscode.workspace.onWillSaveTextDocument(event => {
            refreshDiagnostics(activeTextEditor, invisibleCharDiagnostics);
        })
    );

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                activeTextEditor = editor;
                refreshDiagnostics(editor, invisibleCharDiagnostics);
            }
        })
    );

    /*context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            if (activeTextEditor && event.document === activeTextEditor.document) {
                refreshDiagnostics(activeTextEditor, invisibleCharDiagnostics);
            }
        })
    );*/

    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(doc => invisibleCharDiagnostics.delete(doc.uri))
    );

}