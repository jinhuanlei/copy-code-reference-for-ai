import * as assert from 'assert';
import { buildReference, normalizeLineRange } from '../reference';

const CFG = {
    prefix: '@',
    pathLineSeparator: ':',
    lineRangeSeparator: '-',
};

suite('buildReference', () => {
    test('single line', () => {
        const out = buildReference(
            { path: 'src/foo.ts', startLine: 10, endLine: 10 },
            CFG,
        );
        assert.strictEqual(out, '@src/foo.ts:10');
    });

    test('multi-line range', () => {
        const out = buildReference(
            { path: 'src/foo.ts', startLine: 10, endLine: 20 },
            CFG,
        );
        assert.strictEqual(out, '@src/foo.ts:10-20');
    });

    test('absolute path renders as-is', () => {
        const out = buildReference(
            { path: '/Users/me/project/src/foo.ts', startLine: 10, endLine: 20 },
            CFG,
        );
        assert.strictEqual(out, '@/Users/me/project/src/foo.ts:10-20');
    });

    test('custom path-line separator (#)', () => {
        const out = buildReference(
            { path: 'src/foo.ts', startLine: 10, endLine: 20 },
            { ...CFG, pathLineSeparator: '#' },
        );
        assert.strictEqual(out, '@src/foo.ts#10-20');
    });

    test('custom range separator (..)', () => {
        const out = buildReference(
            { path: 'src/foo.ts', startLine: 10, endLine: 20 },
            { ...CFG, lineRangeSeparator: '..' },
        );
        assert.strictEqual(out, '@src/foo.ts:10..20');
    });

    test('hash prefix', () => {
        const out = buildReference(
            { path: 'src/foo.ts', startLine: 10, endLine: 10 },
            { ...CFG, prefix: '#' },
        );
        assert.strictEqual(out, '#src/foo.ts:10');
    });
});

suite('normalizeLineRange', () => {
    test('caret (empty selection) returns 1-based single line', () => {
        assert.deepStrictEqual(normalizeLineRange(9, 9, 0, 0), { startLine: 10, endLine: 10 });
    });

    test('single-line partial selection', () => {
        assert.deepStrictEqual(normalizeLineRange(9, 9, 4, 12), { startLine: 10, endLine: 10 });
    });

    test('multi-line selection', () => {
        assert.deepStrictEqual(normalizeLineRange(9, 19, 0, 5), { startLine: 10, endLine: 20 });
    });

    test('trailing-newline selection (end at column 0) trims last line', () => {
        assert.deepStrictEqual(normalizeLineRange(9, 20, 0, 0), { startLine: 10, endLine: 20 });
    });

    test('does not trim when start === end even if end char is 0', () => {
        assert.deepStrictEqual(normalizeLineRange(9, 9, 0, 0), { startLine: 10, endLine: 10 });
    });
});