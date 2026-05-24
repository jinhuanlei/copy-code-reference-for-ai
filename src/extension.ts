import * as vscode from 'vscode';
import { buildReference, normalizeLineRange } from './reference';
import { getRepoInfo } from './git';
import { parseRemoteUrl, buildRemoteUrl } from './remote-reference';

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
        vscode.commands.registerCommand(
            'copyCodeRefForAi.copyRemoteReference',
            () => copyRemoteReference(),
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

async function copyRemoteReference(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('Copy Remote Reference: no active editor.');
        return;
    }

    const doc = editor.document;
    if (doc.isUntitled) {
        vscode.window.showWarningMessage('Copy Remote Reference: save the file first.');
        return;
    }
    if (doc.uri.scheme !== 'file') {
        vscode.window.showWarningMessage(
            `Copy Remote Reference: unsupported URI scheme "${doc.uri.scheme}".`,
        );
        return;
    }

    const result = getRepoInfo(doc.uri);
    if (result.kind === 'error') {
        const messages = {
            'no-extension': 'Copy Remote Reference: Git extension is not available.',
            'no-repo': 'Copy Remote Reference: file is not inside a git repository.',
            'no-remote': 'Copy Remote Reference: no remote found for this repository.',
        } as const;
        vscode.window.showWarningMessage(messages[result.reason]);
        return;
    }

    const { info } = result;
    const parsed = parseRemoteUrl(info.remoteUrl);
    if (!parsed) {
        vscode.window.showWarningMessage(
            `Copy Remote Reference: unsupported remote "${info.remoteUrl}".`,
        );
        return;
    }

    const cfg = vscode.workspace.getConfiguration(CONFIG_NS);
    const useCommit = cfg.get<string>('remoteRef', 'commit') === 'commit';
    const ref = (useCommit ? info.commit : info.branch) ?? info.commit ?? info.branch;
    if (!ref) {
        vscode.window.showWarningMessage('Copy Remote Reference: could not determine git ref.');
        return;
    }

    const rootPath = info.rootUri.fsPath.replace(/\\/g, '/');
    const filePath = doc.uri.fsPath.replace(/\\/g, '/');
    const relativePath = filePath.startsWith(rootPath + '/')
        ? filePath.slice(rootPath.length + 1)
        : filePath;

    const selection = editor.selection;
    const { startLine, endLine } = normalizeLineRange(
        selection.start.line,
        selection.end.line,
        selection.start.character,
        selection.end.character,
    );

    const url = buildRemoteUrl(parsed, relativePath, startLine, endLine, ref);
    await vscode.env.clipboard.writeText(url);
    const action = 'Open in Browser';
    const answer = await vscode.window.showInformationMessage(`Copied: ${url}`, action);
    if (answer === action) {
        await vscode.env.openExternal(vscode.Uri.parse(url));
    }
}