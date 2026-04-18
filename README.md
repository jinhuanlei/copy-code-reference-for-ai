# Copy Code Reference for AI

Copy code references — `@src/foo.ts:10-20` (relative) or `@/Users/you/project/src/foo.ts:10-20` (absolute) — straight to the clipboard, ready to paste into Claude Code, the built-in VS Code Chat, or any other AI input.

Works with both VS Code and Cursor.

## Commands

| Command | Default shortcut | Output |
|---|---|---|
| **Copy Relative Code Reference for AI** | `Ctrl+Shift+C` / `Cmd+Shift+C` | `@src/foo.ts:10-20` |
| **Copy Absolute Code Reference for AI** | `Ctrl+Shift+Alt+C` / `Cmd+Shift+Alt+C` | `@/Users/you/project/src/foo.ts:10-20` |

- With just a caret (no selection), each command copies a single-line reference (e.g. `@src/foo.ts:10`).
- Both commands also appear in the editor's right-click menu under the Copy/Paste section.
- Rebind either shortcut independently from VS Code's Keyboard Shortcuts UI.
- The relative command falls back to the absolute path when the file is outside every workspace folder.

## Settings

| Setting | Type | Default | Description |
|---|---|---|---|
| `copyCodeRefForAi.autoFocusTarget` | string | `"claudeCode"` | `claudeCode` \| `vscodeChat` \| `none` — target to focus after copy |
| `copyCodeRefForAi.prefix` | string | `"@"` | Prefix character (e.g. `@` or `#`) |
| `copyCodeRefForAi.pathLineSeparator` | string | `":"` | Between path and line number |
| `copyCodeRefForAi.lineRangeSeparator` | string | `"-"` | Between start and end line |

### Output format examples

- Default: `@src/foo.ts:10-20`
- Single line (no selection): `@src/foo.ts:10`
- Absolute: `@/Users/you/project/src/foo.ts:10-20`
- `pathLineSeparator: "#"`: `@src/foo.ts#10-20`

### Example `settings.json`

```json
{
    "copyCodeRefForAi.autoFocusTarget": "claudeCode",
    "copyCodeRefForAi.prefix": "@",
    "copyCodeRefForAi.pathLineSeparator": ":",
    "copyCodeRefForAi.lineRangeSeparator": "-"
}
```

## Notes

Claude Code may auto-convert `@file:line` to `@file#line` — both formats resolve to the same lines.