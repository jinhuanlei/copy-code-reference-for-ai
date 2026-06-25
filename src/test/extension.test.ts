import * as assert from "assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";

suite("Extension Test Suite", () => {
  let tempFile: string;

  setup(() => {
    tempFile = path.join(
      os.tmpdir(),
      `copy-code-ref-test-${Date.now()}-${Math.random().toString(36).slice(2)}.ts`,
    );
    fs.writeFileSync(tempFile, "line1\nline2\nline3\nline4\n");
  });

  teardown(() => {
    try {
      fs.unlinkSync(tempFile);
    } catch {
      // file may already be gone; ignore
    }
  });

  test("copyRelativeReference falls back to POSIX absolute for an out-of-workspace file", async () => {
    const doc = await vscode.workspace.openTextDocument(
      vscode.Uri.file(tempFile),
    );
    const editor = await vscode.window.showTextDocument(doc);
    editor.selection = new vscode.Selection(
      new vscode.Position(1, 0),
      new vscode.Position(2, 5),
    );

    await vscode.env.clipboard.writeText("");
    await vscode.commands.executeCommand(
      "copyCodeRefForAi.copyRelativeReference",
    );
    const clipboard = await vscode.env.clipboard.readText();

    const expected = `@${tempFile.replace(/\\/g, "/")}:2-3`;
    assert.strictEqual(clipboard, expected);
  });

  test("copyAbsoluteReference writes a POSIX-normalized absolute reference", async () => {
    const doc = await vscode.workspace.openTextDocument(
      vscode.Uri.file(tempFile),
    );
    const editor = await vscode.window.showTextDocument(doc);
    editor.selection = new vscode.Selection(
      new vscode.Position(0, 0),
      new vscode.Position(0, 5),
    );

    await vscode.env.clipboard.writeText("");
    await vscode.commands.executeCommand(
      "copyCodeRefForAi.copyAbsoluteReference",
    );
    const clipboard = await vscode.env.clipboard.readText();

    const expected = `@${tempFile.replace(/\\/g, "/")}:1`;
    assert.strictEqual(clipboard, expected);
  });

  test("copyFileReference copies a path reference with no line numbers", async () => {
    await vscode.env.clipboard.writeText("");
    await vscode.commands.executeCommand(
      "copyCodeRefForAi.copyFileReference",
      vscode.Uri.file(tempFile),
    );
    const clipboard = await vscode.env.clipboard.readText();

    const expected = `@${tempFile.replace(/\\/g, "/")}`;
    assert.strictEqual(clipboard, expected);
  });

  suite("hidden copyFileReference wiring (see docs/adr/0001)", () => {
    const pkg = vscode.extensions.getExtension(
      "jinhuanlei.copy-code-reference-for-ai",
    )?.packageJSON;

    test("extension manifest is loaded", () => {
      assert.ok(pkg, "extension manifest should be available");
    });

    test("copyFileReference is NOT in contributes.commands (kept hidden)", () => {
      const ids: string[] = (pkg.contributes?.commands ?? []).map(
        (c: { command: string }) => c.command,
      );
      assert.ok(
        !ids.includes("copyCodeRefForAi.copyFileReference"),
        "copyFileReference must stay out of the command palette",
      );
    });

    test("copyFileReference keybinding is registered", () => {
      const keys: string[] = (pkg.contributes?.keybindings ?? []).map(
        (k: { command: string }) => k.command,
      );
      assert.ok(keys.includes("copyCodeRefForAi.copyFileReference"));
    });

    test("explicit activation event keeps the keybinding working", () => {
      assert.ok(
        (pkg.activationEvents ?? []).includes(
          "onCommand:copyCodeRefForAi.copyFileReference",
        ),
        "missing onCommand activation event would cause 'command not found'",
      );
    });
  });

  test("untitled document does not overwrite the clipboard", async () => {
    const doc = await vscode.workspace.openTextDocument({
      language: "typescript",
      content: "scratch\n",
    });
    await vscode.window.showTextDocument(doc);

    const sentinel = "CLIPBOARD-SENTINEL-UNTOUCHED";
    await vscode.env.clipboard.writeText(sentinel);
    await vscode.commands.executeCommand(
      "copyCodeRefForAi.copyRelativeReference",
    );
    const clipboard = await vscode.env.clipboard.readText();

    assert.strictEqual(clipboard, sentinel);
  });
});
