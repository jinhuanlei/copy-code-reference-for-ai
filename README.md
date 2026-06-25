# Copy Code Reference for AI

Copy code references — `@src/foo.ts:10-20` (relative) or
`@/Users/you/project/src/foo.ts:10-20` (absolute) — straight to the clipboard,
ready to paste into Claude Code, the built-in VS Code Chat, or any other AI
input.

Works with both VS Code and Cursor.

## Commands

| Command                                 | Default shortcut                       | Output                                                           |
| --------------------------------------- | -------------------------------------- | ---------------------------------------------------------------- |
| **Copy Relative Code Reference for AI** | `Ctrl+Shift+C` / `Cmd+Shift+C`         | `@src/foo.ts:10-20`                                              |
| **Copy Absolute Code Reference for AI** | `Ctrl+Shift+Alt+C` / `Cmd+Shift+Alt+C` | `@/Users/you/project/src/foo.ts:10-20`                           |
| **Copy Code Reference as...**           | —                                      | Opens a quick-pick menu to copy in any format                    |
| **Copy Remote Reference**               | —                                      | `https://github.com/owner/repo/blob/commit/path/file.ts#L10-L20` |

- With just a caret (no selection), each command copies a single-line reference
  (e.g. `@src/foo.ts:10`).
- **Copy Code Reference as...** appears in the editor's right-click menu under
  the Copy/Paste section.
- Rebind either shortcut independently from VS Code's Keyboard Shortcuts UI.
- The relative command falls back to the absolute path when the file is outside
  every workspace folder.
- The remote reference command copies a GitHub/GitLab/Bitbucket permalink. After
  copying, a prompt offers to **Open in Browser**.

## "Copy as..." quick-pick

The **Copy Code Reference as...** command opens a menu showing every available
format with a live preview of the output for your current selection:

```
$(file-code) Claude Code        @src/reference.ts#13-19
$(file-code) OpenCode           @src/reference.ts:13-19
$(file-code) Plain              src/reference.ts:13-19
$(gear) Custom (current)        @src/reference.ts:13-19
$(link) Remote Permalink        https://github.com/owner/repo/blob/abc/src/reference.ts#L13-L19
```

Pick one and it copies immediately — your `format` setting is not changed.

## Settings

| Setting                               | Type   | Default    | Description                                                                  |
| ------------------------------------- | ------ | ---------- | ---------------------------------------------------------------------------- |
| `copyCodeRefForAi.format`             | enum   | `"custom"` | Preset format profile (see below)                                            |
| `copyCodeRefForAi.prefix`             | string | `"@"`      | Prefix character — only used when `format` is `"custom"`                     |
| `copyCodeRefForAi.pathLineSeparator`  | string | `":"`      | Between path and line number — only used when `format` is `"custom"`         |
| `copyCodeRefForAi.lineRangeSeparator` | string | `"-"`      | Between start and end line — only used when `format` is `"custom"`           |
| `copyCodeRefForAi.remoteRef`          | string | `"commit"` | Remote reference type: `"commit"` (stable permalink) or `"branch"` (mutable) |

### Format profiles

Set `copyCodeRefForAi.format` to one of the built-in profiles to switch formats
without touching the individual separator settings:

| Value           | Output example      | Notes                                                                |
| --------------- | ------------------- | -------------------------------------------------------------------- |
| `"custom"`      | `@src/foo.ts:10-20` | Uses your `prefix`/`pathLineSeparator`/`lineRangeSeparator` settings |
| `"claude-code"` | `@src/foo.ts#10-20` | Claude Code native format                                            |
| `"opencode"`    | `@src/foo.ts:10-20` | OpenCode format                                                      |
| `"plain"`       | `src/foo.ts:10-20`  | No prefix                                                            |

Existing users with custom separator settings see no change — the default is
`"custom"`.

### Output format examples

- Default: `@src/foo.ts:10-20`
- Single line (no selection): `@src/foo.ts:10`
- Absolute: `@/Users/you/project/src/foo.ts:10-20`
- Claude Code profile: `@src/foo.ts#10-20`
- Remote (GitHub):
  `https://github.com/owner/repo/blob/abc123/path/file.ts#L10-L20`

### Example `settings.json`

```json
{
  "copyCodeRefForAi.format": "claude-code",
  "copyCodeRefForAi.remoteRef": "commit"
}
```

Or with full custom separators:

```json
{
  "copyCodeRefForAi.format": "custom",
  "copyCodeRefForAi.prefix": "@",
  "copyCodeRefForAi.pathLineSeparator": ":",
  "copyCodeRefForAi.lineRangeSeparator": "-",
  "copyCodeRefForAi.remoteRef": "commit"
}
```

## Notes

Claude Code may auto-convert `@file:line` to `@file#line` — both formats resolve
to the same lines.
