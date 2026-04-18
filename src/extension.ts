import * as vscode from 'vscode';
import { buildReference, normalizeLineRange } from './reference';

const CONFIG_NS = 'copyCodeRefForAi';

type Mode = 'relative' | 'absolute';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'copyCodeRefForAi.copyRelativeReference',
            () => copyReference('relative'),
        ),
        vscode.commands.registerCommand(
            'copyCodeRefForAi.copyAbsoluteReference',
            () => copyReference('absolute'),
        ),
    );
}

export function deactivate() { }

async function copyReference(mode: Mode): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('Copy Code Reference: no active editor.');
        return;
    }

    const doc = editor.document;
    if (doc.isUntitled) {
        vscode.window.showWarningMessage('Copy Code Reference: save the file first.');
        return;
    }
    if (doc.uri.scheme !== 'file') {
        vscode.window.showWarningMessage(
            `Copy Code Reference: unsupported URI scheme "${doc.uri.scheme}".`,
        );
        return;
    }

    const selection = editor.selection;
    const { startLine, endLine } = normalizeLineRange(
        selection.start.line,
        selection.end.line,
        selection.start.character,
        selection.end.character,
    );

    const fsPath = doc.uri.fsPath;
    // AI agents (Claude Code, VS Code Chat) universally expect POSIX-style
    // paths. Normalize Windows backslashes in the absolute branch; relative
    // paths from asRelativePath are already forward-slashed on all platforms.
    const absolutePath = fsPath.replace(/\\/g, '/');
    const asRel = vscode.workspace.asRelativePath(doc.uri, false);
    const hasRelative = asRel !== fsPath;

    let path: string;
    let fellBack = false;
    if (mode === 'absolute') {
        path = absolutePath;
    } else if (hasRelative) {
        path = asRel;
    } else {
        path = absolutePath;
        fellBack = true;
    }

    const cfg = vscode.workspace.getConfiguration(CONFIG_NS);
    const reference = buildReference(
        { path, startLine, endLine },
        {
            prefix: cfg.get<string>('prefix', '@'),
            pathLineSeparator: cfg.get<string>('pathLineSeparator', ':'),
            lineRangeSeparator: cfg.get<string>('lineRangeSeparator', '-'),
        },
    );

    await vscode.env.clipboard.writeText(reference);

    const note = fellBack ? ' (no workspace — used absolute)' : '';
    vscode.window.setStatusBarMessage(`Copied: ${reference}${note}`, 3000);
}