export type RemoteHost = 'github' | 'gitlab' | 'bitbucket';

export interface ParsedRemote {
    host: RemoteHost;
    owner: string;
    repo: string;
}

const HOST_MAP: Record<string, RemoteHost> = {
    'github.com': 'github',
    'gitlab.com': 'gitlab',
    'bitbucket.org': 'bitbucket',
};

export function parseRemoteUrl(url: string): ParsedRemote | null {
    let host: string;
    let owner: string;
    let repo: string;

    // SSH: git@github.com:owner/repo.git  or  ssh://git@github.com/owner/repo.git
    const sshColonMatch = url.match(/^(?:ssh:\/\/)?git@([^:/]+)[:/](.+?)(?:\.git)?$/);
    if (sshColonMatch) {
        host = sshColonMatch[1];
        const parts = sshColonMatch[2].split('/');
        if (parts.length < 2) { return null; }
        owner = parts[0];
        repo = parts[1];
    } else {
        // HTTPS: https://github.com/owner/repo.git
        let parsed: URL;
        try {
            parsed = new URL(url);
        } catch {
            return null;
        }
        host = parsed.hostname;
        const segments = parsed.pathname.replace(/^\//, '').replace(/\.git$/, '').split('/');
        if (segments.length < 2) { return null; }
        owner = segments[0];
        repo = segments[1];
    }

    const remoteHost = HOST_MAP[host];
    if (!remoteHost) { return null; }

    return { host: remoteHost, owner, repo };
}

export function buildRemoteUrl(
    remote: ParsedRemote,
    filePath: string,
    startLine: number | undefined,
    endLine: number | undefined,
    ref: string,
): string {
    const { host, owner, repo } = remote;
    const hasLines = startLine !== undefined && endLine !== undefined;
    const isSingleLine = hasLines && startLine === endLine;

    switch (host) {
        case 'github': {
            const anchor = !hasLines ? '' : isSingleLine
                ? `#L${startLine}`
                : `#L${startLine}-L${endLine}`;
            return `https://github.com/${owner}/${repo}/blob/${ref}/${filePath}${anchor}`;
        }
        case 'gitlab': {
            const anchor = !hasLines ? '' : isSingleLine
                ? `#L${startLine}`
                : `#L${startLine}-${endLine}`;
            return `https://gitlab.com/${owner}/${repo}/-/blob/${ref}/${filePath}${anchor}`;
        }
        case 'bitbucket': {
            const anchor = !hasLines ? '' : isSingleLine
                ? `#lines-${startLine}`
                : `#lines-${startLine}:${endLine}`;
            return `https://bitbucket.org/${owner}/${repo}/src/${ref}/${filePath}${anchor}`;
        }
    }
}
