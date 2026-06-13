# CLAUDE.md — Copy Code Reference for AI

## Project Overview

VS Code / Cursor extension that copies code references for different AI agents (like `@src/foo.ts:10-20`) to the clipboard for pasting into AI agents. Published to both the VS Code Marketplace and the Open VSX Registry.

- **Publisher**: see `package.json`
- **Current version**: see `package.json`
- **Entry point**: `src/extension.ts` — activates commands and wires settings
- **Core logic**: `src/reference.ts` — builds the reference

## Key Commands & Shortcuts

| Command                 | Mac               | Win/Linux          |
| ----------------------- | ----------------- | ------------------ |
| Copy Relative Reference | `Cmd+Shift+C`     | `Ctrl+Shift+C`     |
| Copy Absolute Reference | `Cmd+Shift+Alt+C` | `Ctrl+Shift+Alt+C` |

Both also appear in the editor right-click context menu.

## Dev Workflow

```bash
npm install            # install deps
npm run watch          # watch mode (esbuild + tsc type-check in parallel)
npm test               # compile-tests → compile → lint → run vscode-test
npm run check-types    # tsc type check only
npm run lint           # eslint src/
npm run compile        # check-types + lint + bundle (dev)
npm run package        # check-types + lint + bundle --production (creates dist/)
```

Build output lands in `dist/extension.js`. The `.vsix` package is produced by `vsce` during CI.

## SDLC — Making Changes

1. **Branch** — work on a feature branch; commit directly to `main` if user approves.
2. **Develop** — edit `src/`. Use `npm run watch` for live feedback.
3. **Test** — run `npm test` before marking work done. Tests live in `src/test/`.
4. **Type-check & lint** — `npm run compile` must pass cleanly (zero errors, zero warnings).
5. **PR / Push** — open a pull request against `main`, or push directly to `main` with user approval.

## Release Process — REQUIRES USER APPROVAL

> **Never run the release steps without explicit user confirmation.**

Releasing publishes to two public registries. Steps (user must authorise each):

1. Bump version: `npm version patch | minor | major`
   - Commits `package.json`, creates a local git tag.
2. Push commit + tag: `git push && git push --tags`
   - Triggers the CI/CD workflow (`.github/workflows/cicd.yml`).
   - CI publishes the `.vsix` to **Open VSX Registry** and **VS Code Marketplace**.

Secrets required in GitHub Actions: `OPEN_VSX_TOKEN`, `VS_MARKETPLACE_TOKEN`.

Manual publish (bypass CI — only with user approval):

```bash
vsce publish   # VS Marketplace
ovsx publish   # Open VSX
```

## Hard Rules for Agents

- **Do not push to `main`** without explicit user permission or approval.
- **Do not run `npm version`** or any release/publish command without explicit user permission.
- **Do not run `git push --tags`** without explicit user permission.
- **Do not run `vsce publish` or `ovsx publish`** without explicit user permission.
- Always run `npm test` and `npm run compile` before declaring a change complete.
- Prefer editing existing files over creating new ones.
- Do not add comments explaining what code does — only add a comment when the _why_ is non-obvious.
