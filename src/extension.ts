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
    const selection = editor.selection;
    const { startLine, endLine } = normalizeLineRange(
        selection.start.line,
        selection.end.line,
        selection.start.character,
        selection.end.character,
    );

    const absolutePath = doc.uri.fsPath;
    const asRel = vscode.workspace.asRelativePath(doc.uri, false);
    const hasRelative = asRel !== absolutePath;

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

    const target = cfg.get<string>('autoFocusTarget', 'claudeCode');
    await focusAiInput(target);
}

async function focusAiInput(target: string): Promise<void> {
    if (target === 'none') {
        return;
    }
    const candidates =
        target === 'claudeCode'
            ? ['claude-code.focus', 'claude-code.focusInput', 'claude.focus', 'claude.focusInput']
            : target === 'vscodeChat'
                ? ['workbench.action.chat.focusInput', 'workbench.action.chat.open']
                : [];
    if (candidates.length === 0) {
        return;
    }
    try {
        const available = new Set(await vscode.commands.getCommands(true));
        for (const cmd of candidates) {
            if (available.has(cmd)) {
                await vscode.commands.executeCommand(cmd);
                return;
            }
        }
    } catch {
        // best-effort; clipboard copy already succeeded
    }
}