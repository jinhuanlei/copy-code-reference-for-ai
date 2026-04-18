export interface FormatterConfig {
    prefix: string;
    pathLineSeparator: string;
    lineRangeSeparator: string;
}

export interface ReferenceInput {
    path: string;
    startLine: number;
    endLine: number;
}

export function buildReference(input: ReferenceInput, config: FormatterConfig): string {
    const { prefix, pathLineSeparator, lineRangeSeparator } = config;
    const suffix =
        input.startLine === input.endLine
            ? `${pathLineSeparator}${input.startLine}`
            : `${pathLineSeparator}${input.startLine}${lineRangeSeparator}${input.endLine}`;
    return `${prefix}${input.path}${suffix}`;
}

export function normalizeLineRange(
    startLine0: number,
    endLine0: number,
    _startChar: number,
    endChar: number,
): { startLine: number; endLine: number } {
    let end = endLine0;
    if (endChar === 0 && end > startLine0) {
        end -= 1;
    }
    return { startLine: startLine0 + 1, endLine: end + 1 };
}