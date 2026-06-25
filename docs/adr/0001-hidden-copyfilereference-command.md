# ADR 0001: `copyFileReference` is an intentionally hidden command

- **Status**: Accepted
- **Date**: 2026-06-24

## Context

The extension registers `copyCodeRefForAi.copyFileReference`, which copies a
file path reference (no line numbers) — e.g. `@src/foo.ts`. We needed a fast way
to grab a file reference from the Explorer without adding noise to the UI.

VS Code already provides a visible "Copy Path" / copy action in the Explorer
context menu, so adding another visible entry would clutter the command palette
and right-click menus with a near-duplicate action.

## Decision

Keep `copyFileReference` as a **hidden, keyboard-only command**:

- It is registered via `registerCommand` in `src/extension.ts` so the Explorer
  `Cmd+Shift+C` (`Ctrl+Shift+C`) keybinding works.
- It is deliberately **omitted from `contributes.commands` and all `menus`** in
  `package.json`. As a result it does not appear in the command palette or any
  right-click menu.
- Because it is not in `contributes.commands`, VS Code does **not**
  auto-generate an `onCommand:` activation event for it. We therefore add an
  **explicit `onCommand:copyCodeRefForAi.copyFileReference` entry to
  `activationEvents`** so the keybinding still wakes the extension in a fresh
  window. Without this the keybinding fails with "command not found".
- Its prefix is configurable via the `copyCodeRefForAi.fileRefPrefix` setting,
  which falls back to the active format profile's prefix when unset.

## Consequences

- The feature is discoverable only via the keybinding (and this ADR) — that is
  the intended trade-off in favour of a clean UI.
- **Do not "fix" the missing command-palette entry** — the omission is by
  design. A code comment at the registration site in `src/extension.ts` points
  here.
- If we ever want to surface it, add it to `contributes.commands` (and
  optionally `menus`) and supersede this ADR.
