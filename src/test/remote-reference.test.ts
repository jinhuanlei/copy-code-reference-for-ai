import * as assert from 'assert';
import { parseRemoteUrl, buildRemoteUrl, ParsedRemote } from '../remote-reference';

suite('parseRemoteUrl', () => {
    suite('GitHub', () => {
        test('HTTPS with .git suffix', () => {
            assert.deepStrictEqual(parseRemoteUrl('https://github.com/owner/repo.git'), {
                host: 'github', owner: 'owner', repo: 'repo',
            });
        });

        test('HTTPS without .git suffix', () => {
            assert.deepStrictEqual(parseRemoteUrl('https://github.com/owner/repo'), {
                host: 'github', owner: 'owner', repo: 'repo',
            });
        });

        test('SSH colon form', () => {
            assert.deepStrictEqual(parseRemoteUrl('git@github.com:owner/repo.git'), {
                host: 'github', owner: 'owner', repo: 'repo',
            });
        });

        test('SSH url form', () => {
            assert.deepStrictEqual(parseRemoteUrl('ssh://git@github.com/owner/repo.git'), {
                host: 'github', owner: 'owner', repo: 'repo',
            });
        });
    });

    suite('GitLab', () => {
        test('HTTPS with .git suffix', () => {
            assert.deepStrictEqual(parseRemoteUrl('https://gitlab.com/owner/repo.git'), {
                host: 'gitlab', owner: 'owner', repo: 'repo',
            });
        });

        test('SSH colon form', () => {
            assert.deepStrictEqual(parseRemoteUrl('git@gitlab.com:owner/repo.git'), {
                host: 'gitlab', owner: 'owner', repo: 'repo',
            });
        });
    });

    suite('Bitbucket', () => {
        test('HTTPS with .git suffix', () => {
            assert.deepStrictEqual(parseRemoteUrl('https://bitbucket.org/owner/repo.git'), {
                host: 'bitbucket', owner: 'owner', repo: 'repo',
            });
        });

        test('SSH colon form', () => {
            assert.deepStrictEqual(parseRemoteUrl('git@bitbucket.org:owner/repo.git'), {
                host: 'bitbucket', owner: 'owner', repo: 'repo',
            });
        });
    });

    test('unknown host returns null', () => {
        assert.strictEqual(parseRemoteUrl('https://selfhosted.example.com/owner/repo.git'), null);
    });

    test('invalid URL returns null', () => {
        assert.strictEqual(parseRemoteUrl('not-a-url'), null);
    });
});

suite('buildRemoteUrl', () => {
    const github: ParsedRemote = { host: 'github', owner: 'alice', repo: 'myrepo' };
    const gitlab: ParsedRemote = { host: 'gitlab', owner: 'alice', repo: 'myrepo' };
    const bitbucket: ParsedRemote = { host: 'bitbucket', owner: 'alice', repo: 'myrepo' };
    const path = 'src/foo.ts';
    const ref = 'abc1234';

    suite('GitHub', () => {
        test('single line', () => {
            assert.strictEqual(
                buildRemoteUrl(github, path, 10, 10, ref),
                'https://github.com/alice/myrepo/blob/abc1234/src/foo.ts#L10',
            );
        });

        test('range', () => {
            assert.strictEqual(
                buildRemoteUrl(github, path, 10, 20, ref),
                'https://github.com/alice/myrepo/blob/abc1234/src/foo.ts#L10-L20',
            );
        });
    });

    suite('GitLab', () => {
        test('single line', () => {
            assert.strictEqual(
                buildRemoteUrl(gitlab, path, 10, 10, ref),
                'https://gitlab.com/alice/myrepo/-/blob/abc1234/src/foo.ts#L10',
            );
        });

        test('range', () => {
            assert.strictEqual(
                buildRemoteUrl(gitlab, path, 10, 20, ref),
                'https://gitlab.com/alice/myrepo/-/blob/abc1234/src/foo.ts#L10-20',
            );
        });
    });

    suite('Bitbucket', () => {
        test('single line', () => {
            assert.strictEqual(
                buildRemoteUrl(bitbucket, path, 10, 10, ref),
                'https://bitbucket.org/alice/myrepo/src/abc1234/src/foo.ts#lines-10',
            );
        });

        test('range', () => {
            assert.strictEqual(
                buildRemoteUrl(bitbucket, path, 10, 20, ref),
                'https://bitbucket.org/alice/myrepo/src/abc1234/src/foo.ts#lines-10:20',
            );
        });
    });

    suite('no line numbers — file-level URLs', () => {
        test('GitHub omits anchor', () => {
            assert.strictEqual(
                buildRemoteUrl(github, path, undefined, undefined, ref),
                'https://github.com/alice/myrepo/blob/abc1234/src/foo.ts',
            );
        });

        test('GitLab omits anchor', () => {
            assert.strictEqual(
                buildRemoteUrl(gitlab, path, undefined, undefined, ref),
                'https://gitlab.com/alice/myrepo/-/blob/abc1234/src/foo.ts',
            );
        });

        test('Bitbucket omits anchor', () => {
            assert.strictEqual(
                buildRemoteUrl(bitbucket, path, undefined, undefined, ref),
                'https://bitbucket.org/alice/myrepo/src/abc1234/src/foo.ts',
            );
        });
    });
});
