import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isTransientGitError } from '../git.ts';

describe('git network errors', () => {
  it('retries DNS and connection failures, never rejections or conflicts', () => {
    for (const e of [
      "fatal: unable to access 'https://github.com/inetslop/scope-creep.git/': Could not resolve host: github.com",
      "fatal: unable to access 'https://github.com/x/y.git/': Failed to connect to github.com port 443 after 21 ms: Couldn't connect to server",
      "fatal: unable to access 'https://github.com/x/y.git/': Recv failure: Connection reset by peer",
      'error: RPC failed; curl 92 HTTP/2 stream 5 was not closed cleanly: CANCEL (err 8)\nfatal: the remote end hung up unexpectedly',
    ]) {
      assert.equal(isTransientGitError(e), true, e);
    }
    for (const e of [
      ' ! [rejected]        HEAD -> main (fetch first)\nerror: failed to push some refs to \'https://github.com/x/y.git\'',
      "remote: Permission to x/y.git denied to someone.\nfatal: unable to access 'https://github.com/x/y.git/': The requested URL returned error: 403",
      'CONFLICT (content): Merge conflict in game/src/main.ts',
    ]) {
      assert.equal(isTransientGitError(e), false, e);
    }
  });
});
