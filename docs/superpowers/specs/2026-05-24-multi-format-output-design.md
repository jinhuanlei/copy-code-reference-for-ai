# Multi-Format Output Profiles

## Problem

Users paste code references into different AI tools (Claude Code, OpenCode, ChatGPT, etc.) and collaboration tools (Slack, PRs). Each tool may prefer a different reference format. Currently the extension only supports one format at a time, configured via three separate settings (`prefix`, `pathLineSeparator`, `lineRangeSeparator`). Switching between formats requires changing multiple settings manually.

## Solution

Add preset format profiles and a unified "Copy as..." quick-pick command that lets users copy in any format without changing settings.

## Format Profiles

| Profile ID | Label | Prefix | Path-Line Sep | Line Range Sep | Output Example |
|---|---|---|---|---|---|
| `custom` | Custom (default) | (from settings) | (from settings) | (from settings) | `@src/foo.ts:10-20` |
| `claude-code` | Claude Code | `@` | `#` | `-` | `@src/foo.ts#10-20` |
| `opencode` | OpenCode | `@` | `:` | `-` | `@src/foo.ts:10-20` |
| `plain` | Plain | `` | `:` | `-` | `src/foo.ts:10-20` |

When `format` is set to anything other than `custom`, the profile's built-in values override `prefix`, `pathLineSeparator`, and `lineRangeSeparator`.

### New Setting

**`copyCodeRefForAi.format`** — enum: `custom` | `claude-code` | `opencode` | `plain`. Default: `custom`.

Backward compatible: existing users with custom prefix/separator settings see no change.

## "Copy as..." Command

New command: `copyCodeRefForAi.copyAs`

Opens a VS Code quick-pick menu with these options:

1. **Claude Code** — `@path#line-line`
2. **OpenCode** — `@path:line-line`
3. **Plain** — `path:line-line`
4. **Custom (current settings)** — uses the three existing settings
5. **Remote Permalink** — delegates to existing remote reference logic (auto-detects GitHub/GitLab/Bitbucket)

For local format options (Claude Code, OpenCode, Plain, Custom), the path is **relative** — same behavior as `copyRelativeReference`. If no workspace is open, it falls back to absolute (matching current behavior).

User picks one → reference is copied to clipboard immediately. The `format` setting is NOT changed.

The quick-pick items show a preview of the actual output for the current selection, e.g.:

```
$(file-code) Claude Code        @src/reference.ts#13-19
$(file-code) OpenCode           @src/reference.ts:13-19
$(file-code) Plain              src/reference.ts:13-19
$(gear) Custom (current)        @src/reference.ts:13-20
$(link) Remote Permalink        https://github.com/owner/repo/blob/abc/src/reference.ts#L13-L19
```

## Architecture

### New file: `src/formats.ts`

Defines `FormatProfile` interface and the built-in profiles:

```ts
export interface FormatProfile {
  id: string;
  label: string;
  prefix: string;
  pathLineSeparator: string;
  lineRangeSeparator: string;
}

export const FORMAT_PROFILES: FormatProfile[] = [
  { id: 'claude-code', label: 'Claude Code', prefix: '@', pathLineSeparator: '#', lineRangeSeparator: '-' },
  { id: 'opencode', label: 'OpenCode', prefix: '@', pathLineSeparator: ':', lineRangeSeparator: '-' },
  { id: 'plain', label: 'Plain', prefix: '', pathLineSeparator: ':', lineRangeSeparator: '-' },
];

export function resolveFormatConfig(formatSetting: string, userConfig: FormatterConfig): FormatterConfig { ... }
```

`resolveFormatConfig` returns the effective `FormatterConfig`:
- If `formatSetting === 'custom'`, returns `userConfig` (existing settings)
- Otherwise, finds the matching profile and returns its config

### Changes to `src/extension.ts`

1. `copyReference()` calls `resolveFormatConfig()` instead of reading individual settings directly.
2. New `copyAs()` function registered as `copyCodeRefForAi.copyAs`:
   - Resolves the current editor and selection (shared logic with `copyReference`)
   - Builds a preview string for each format profile + remote permalink
   - Shows quick-pick
   - On selection, copies the appropriate reference

### Shared selection resolution

Extract the common editor/selection/line-normalization logic from `copyReference` into a helper function used by both `copyReference` and `copyAs`. This avoids duplication.

### package.json changes

- Add `copyCodeRefForAi.format` enum setting to `contributes.configuration`
- Add `copyCodeRefForAi.copyAs` command to `contributes.commands`
- Add context menu entry for "Copy as..." in `contributes.menus.editor/context`

## What Does NOT Change

- `copyRemoteReference` command remains separate and untouched
- Existing keyboard shortcuts (`Cmd+Shift+C`, `Cmd+Shift+Alt+C`) continue to use the `format` setting
- `buildReference` and `normalizeLineRange` in `src/reference.ts` are unchanged
- `src/git.ts` and `src/remote-reference.ts` are unchanged

## Testing

- Unit tests for `resolveFormatConfig` in `src/test/formats.test.ts`
- Unit tests for the existing `buildReference` continue to pass
- Manual testing: verify each format profile produces correct output
- Manual testing: verify "Copy as..." quick-pick shows correct previews
- Manual testing: verify backward compatibility (default `custom` format matches current behavior)
