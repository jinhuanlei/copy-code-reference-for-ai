import * as assert from "assert";
import { resolveFormatConfig, FORMAT_PROFILES } from "../formats";
import { FormatterConfig } from "../reference";

const USER_CONFIG: FormatterConfig = {
  prefix: "#",
  pathLineSeparator: "|",
  lineRangeSeparator: "~",
};

suite("resolveFormatConfig", () => {
  test("custom returns userConfig unchanged", () => {
    const result = resolveFormatConfig("custom", USER_CONFIG);
    assert.deepStrictEqual(result, USER_CONFIG);
  });

  test("unknown profile falls back to userConfig", () => {
    const result = resolveFormatConfig("nonexistent", USER_CONFIG);
    assert.deepStrictEqual(result, USER_CONFIG);
  });

  test("claude-code profile overrides all three fields", () => {
    const result = resolveFormatConfig("claude-code", USER_CONFIG);
    assert.deepStrictEqual(result, {
      prefix: "@",
      pathLineSeparator: "#",
      lineRangeSeparator: "-",
    });
  });

  test("opencode profile overrides all three fields", () => {
    const result = resolveFormatConfig("opencode", USER_CONFIG);
    assert.deepStrictEqual(result, {
      prefix: "@",
      pathLineSeparator: ":",
      lineRangeSeparator: "-",
    });
  });

  test("plain profile has empty prefix", () => {
    const result = resolveFormatConfig("plain", USER_CONFIG);
    assert.deepStrictEqual(result, {
      prefix: "",
      pathLineSeparator: ":",
      lineRangeSeparator: "-",
    });
  });

  test("every FORMAT_PROFILES entry resolves correctly", () => {
    for (const profile of FORMAT_PROFILES) {
      const result = resolveFormatConfig(profile.id, USER_CONFIG);
      assert.strictEqual(result.prefix, profile.prefix, `${profile.id} prefix`);
      assert.strictEqual(
        result.pathLineSeparator,
        profile.pathLineSeparator,
        `${profile.id} pathLineSeparator`,
      );
      assert.strictEqual(
        result.lineRangeSeparator,
        profile.lineRangeSeparator,
        `${profile.id} lineRangeSeparator`,
      );
    }
  });
});
