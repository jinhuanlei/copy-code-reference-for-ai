import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
    test('copyRelativeReference writes a reference to the clipboard', async () => {
        const doc = await vscode.workspace.openTextDocument({
            language: 'typescript',
            content: 'line1\nline2\nline3\nline4\n',
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(
            new vscode.Position(1, 0),
            new vscode.Position(2, 5),
        );

        await vscode.env.clipboard.writeText('');
        await vscode.commands.executeCommand('copyCodeRefForAi.copyRelativeReference');
        const clipboard = await vscode.env.clipboard.readText();

        // Untitled docs have no workspace-relative path, so the command falls back
        // to the absolute form. Lines are 1-based: selection row 1..2 → 2-3.
        assert.match(clipboard, /^@[^\s]+:2-3$/);
    });

    test('copyAbsoluteReference writes an absolute reference to the clipboard', async () => {
        const doc = await vscode.workspace.openTextDocument({
            language: 'typescript',
            content: 'alpha\nbeta\ngamma\n',
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(
            new vscode.Position(0, 0),
            new vscode.Position(0, 5),
        );

        await vscode.env.clipboard.writeText('');
        await vscode.commands.executeCommand('copyCodeRefForAi.copyAbsoluteReference');
        const clipboard = await vscode.env.clipboard.readText();

        // Single-line selection → no range separator.
        assert.match(clipboard, /^@[^\s]+:1$/);
    });
});