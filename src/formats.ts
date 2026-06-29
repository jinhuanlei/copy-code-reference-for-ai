import { FormatterConfig } from "./reference";

export interface FormatProfile {
  id: string;
  label: string;
  prefix: string;
  pathLineSeparator: string;
  lineRangeSeparator: string;
}

export const FORMAT_PROFILES: FormatProfile[] = [
  {
    id: "claude-code",
    label: "Claude Code",
    prefix: "@",
    pathLineSeparator: "#",
    lineRangeSeparator: "-",
  },
  {
    id: "opencode",
    label: "OpenCode",
    prefix: "@",
    pathLineSeparator: ":",
    lineRangeSeparator: "-",
  },
  {
    id: "plain",
    label: "Plain",
    prefix: "",
    pathLineSeparator: ":",
    lineRangeSeparator: "-",
  },
];

export function resolveFormatConfig(
  formatSetting: string,
  userConfig: FormatterConfig,
): FormatterConfig {
  if (formatSetting === "custom") {
    return userConfig;
  }
  const { prefix, pathLineSeparator, lineRangeSeparator } =
    FORMAT_PROFILES.find((p) => p.id === formatSetting) ?? userConfig;
  return { prefix, pathLineSeparator, lineRangeSeparator };
}
