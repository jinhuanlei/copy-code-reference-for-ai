import * as vscode from "vscode";

// Minimal subset of the VS Code Git extension public API
interface GitExtension {
  getAPI(version: 1): GitAPI;
}

interface GitAPI {
  getRepository(uri: vscode.Uri): GitRepository | null;
}

interface GitRepository {
  readonly rootUri: vscode.Uri;
  readonly state: RepositoryState;
}

interface RepositoryState {
  readonly HEAD: Branch | undefined;
  readonly remotes: Remote[];
}

interface Branch {
  readonly name: string | undefined;
  readonly commit: string | undefined;
}

interface Remote {
  readonly name: string;
  readonly fetchUrl: string | undefined;
  readonly pushUrl: string | undefined;
}

export interface RepoInfo {
  rootUri: vscode.Uri;
  remoteUrl: string;
  branch: string | undefined;
  commit: string | undefined;
}

export type RepoLookupResult =
  | { kind: "ok"; info: RepoInfo }
  | { kind: "error"; reason: "no-extension" | "no-repo" | "no-remote" };

export function getRepoInfo(uri: vscode.Uri): RepoLookupResult {
  const gitExt = vscode.extensions.getExtension<GitExtension>("vscode.git");
  if (!gitExt?.isActive) {
    return { kind: "error", reason: "no-extension" };
  }

  const repo = gitExt.exports.getAPI(1).getRepository(uri);
  if (!repo) {
    return { kind: "error", reason: "no-repo" };
  }

  const remote = repo.state.remotes[0];
  const remoteUrl = remote?.fetchUrl ?? remote?.pushUrl;
  if (!remoteUrl) {
    return { kind: "error", reason: "no-remote" };
  }

  return {
    kind: "ok",
    info: {
      rootUri: repo.rootUri,
      remoteUrl,
      branch: repo.state.HEAD?.name,
      commit: repo.state.HEAD?.commit,
    },
  };
}
