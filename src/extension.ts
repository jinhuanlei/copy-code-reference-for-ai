import * as vscode from 'vscode';
import { buildReference, normalizeLineRange, FormatterConfig } from './reference';
import { getRepoInfo } from './git';
import { parseRemoteUrl, buildRemoteUrl } from './remote-reference';
import { FORMAT_PROFILES, resolveFormatConfig } from './formats';

const CONFIG_NS = 'copyCodeRefForAi';

type Mode = 'relative' | 'absolute';

interface ResolvedSelection {
    path: string;
    startLine: number;
    endLine: number;
    fellBack: boolean;
}

type RemoteUrlResult =
    | { kind: 'ok'; url: string }
    | { kind: 'error'; message: string };

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
        vscode.commands.registerCommand(
            'copyCodeRefForAi.copyAs',
            () => copyAs(),
        ),
    );
}

export function deactivate() { }

function resolveSelection(mode: Mode): ResolvedSelection | string {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return 'Copy Code Reference: no active editor.';
    }

    const doc = editor.document;
    if (doc.isUntitled) {
        return 'Copy Code Reference: save the file first.';
    }
    if (doc.uri.scheme !== 'file') {
        return `Copy Code Reference: unsupported URI scheme "${doc.uri.scheme}".`;
    }

    const selection = editor.selection;
    const { startLine, endLine } = normalizeLineRange(
        selection.start.line,
        selection.end.line,
        selection.start.character,
        selection.end.character,
    );

    const fsPath = doc.uri.fsPath;
    // AI agents universally expect POSIX-style paths. Normalize Windows backslashes
    // in the absolute branch; relative paths from asRelativePath are already forward-slashed.
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

    return { path, startLine, endLine, fellBack };
}

function getUserConfig(): FormatterConfig {
    const cfg = vscode.workspace.getConfiguration(CONFIG_NS);
    return {
        prefix: cfg.get<string>('prefix', '@'),
        pathLineSeparator: cfg.get<string>('pathLineSeparator', ':'),
        lineRangeSeparator: cfg.get<string>('lineRangeSeparator', '-'),
    };
}

function resolveRemoteUrl(docUri: vscode.Uri, startLine: number, endLine: number): RemoteUrlResult {
    const repoResult = getRepoInfo(docUri);
    if (repoResult.kind === 'error') {
        const messages = {
            'no-extension': 'Git extension is not available.',
            'no-repo': 'File is not inside a git repository.',
            'no-remote': 'No remote found for this repository.',
        } as const;
        return { kind: 'error', message: messages[repoResult.reason] };
    }

    const { info } = repoResult;
    const parsed = parseRemoteUrl(info.remoteUrl);
    if (!parsed) {
        return { kind: 'error', message: `Unsupported remote "${info.remoteUrl}".` };
    }

    const cfg = vscode.workspace.getConfiguration(CONFIG_NS);
    const useCommit = cfg.get<string>('remoteRef', 'commit') === 'commit';
    const ref = (useCommit ? info.commit : info.branch) ?? info.commit ?? info.branch;
    if (!ref) {
        return { kind: 'error', message: 'Could not determine git ref.' };
    }

    const rootPath = info.rootUri.fsPath.replace(/\\/g, '/');
    const filePath = docUri.fsPath.replace(/\\/g, '/');
    const relativePath = filePath.startsWith(rootPath + '/')
        ? filePath.slice(rootPath.length + 1)
        : filePath;

    return { kind: 'ok', url: buildRemoteUrl(parsed, relativePath, startLine, endLine, ref) };
}

async function copyReference(mode: Mode): Promise<void> {
    const result = resolveSelection(mode);
    if (typeof result === 'string') {
        vscode.window.showWarningMessage(result);
        return;
    }

    const { path, startLine, endLine, fellBack } = result;

    const cfg = vscode.workspace.getConfiguration(CONFIG_NS);
    const formatSetting = cfg.get<string>('format', 'custom');
    const formatConfig = resolveFormatConfig(formatSetting, getUserConfig());

    const reference = buildReference({ path, startLine, endLine }, formatConfig);
    await vscode.env.clipboard.writeText(reference);

    const note = fellBack ? ' (no workspace — used absolute)' : '';
    vscode.window.setStatusBarMessage(`Copied: ${reference}${note}`, 3000);
}

async function copyAs(): Promise<void> {
    const result = resolveSelection('relative');
    if (typeof result === 'string') {
        vscode.window.showWarningMessage(result);
        return;
    }

    const { path, startLine, endLine } = result;
    const userConfig = getUserConfig();
    const doc = vscode.window.activeTextEditor!.document;

    interface QuickPickItemEx extends vscode.QuickPickItem {
        value: string | null;
        isRemote: boolean;
    }

    const items: QuickPickItemEx[] = FORMAT_PROFILES.map(profile => {
        const ref = buildReference({ path, startLine, endLine }, {
            prefix: profile.prefix,
            pathLineSeparator: profile.pathLineSeparator,
            lineRangeSeparator: profile.lineRangeSeparator,
        });
        return { label: `$(file-code) ${profile.label}`, description: ref, value: ref, isRemote: false };
    });

    const customRef = buildReference({ path, startLine, endLine }, userConfig);
    items.push({
        label: '$(gear) Custom (current settings)',
        description: customRef,
        value: customRef,
        isRemote: false,
    });

    const remoteResult = resolveRemoteUrl(doc.uri, startLine, endLine);
    items.push(remoteResult.kind === 'ok'
        ? { label: '$(link) Remote Permalink', description: remoteResult.url, value: remoteResult.url, isRemote: true }
        : { label: '$(link) Remote Permalink', description: `(${remoteResult.message})`, value: null, isRemote: true },
    );

    const picked = await vscode.window.showQuickPick(items, {
        placeHolder: 'Copy reference as…',
        matchOnDescription: true,
    });

    if (!picked || picked.value === null) {
        return;
    }

    await vscode.env.clipboard.writeText(picked.value);

    if (picked.isRemote) {
        const action = 'Open in Browser';
        const answer = await vscode.window.showInformationMessage(`Copied: ${picked.value}`, action);
        if (answer === action) {
            await vscode.env.openExternal(vscode.Uri.parse(picked.value));
        }
    } else {
        vscode.window.setStatusBarMessage(`Copied: ${picked.value}`, 3000);
    }
}

async function copyRemoteReference(): Promise<void> {
    const result = resolveSelection('relative');
    if (typeof result === 'string') {
        vscode.window.showWarningMessage(result.replace('Copy Code Reference', 'Copy Remote Reference'));
        return;
    }

    const { startLine, endLine } = result;
    const doc = vscode.window.activeTextEditor!.document;
    const remoteResult = resolveRemoteUrl(doc.uri, startLine, endLine);

    if (remoteResult.kind === 'error') {
        vscode.window.showWarningMessage(`Copy Remote Reference: ${remoteResult.message}`);
        return;
    }

    const { url } = remoteResult;
    await vscode.env.clipboard.writeText(url);
    const action = 'Open in Browser';
    const answer = await vscode.window.showInformationMessage(`Copied: ${url}`, action);
    if (answer === action) {
        await vscode.env.openExternal(vscode.Uri.parse(url));
    }
}
