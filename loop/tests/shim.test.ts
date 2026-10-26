import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { hoistSystemMessages, rewriteRequest } from '../shim.ts';

describe('rewriteRequest', () => {
  it("sets reasoning_effort for the chat template, keeping other kwargs", () => {
    const body = { messages: [{ role: 'user', content: 'hi' }], chat_template_kwargs: { foo: 1 } };
    rewriteRequest(body, 'xhigh');
    assert.deepEqual(body.chat_template_kwargs, { foo: 1, reasoning_effort: 'xhigh' });
  });

  it('leaves the effort alone when none is configured', () => {
    const body: Parameters<typeof rewriteRequest>[0] = { messages: [{ role: 'user', content: 'hi' }] };
    rewriteRequest(body);
    assert.equal(body.chat_template_kwargs, undefined);
  });
});

describe('hoistSystemMessages', () => {
  it('moves mid-conversation system messages into the top-level system prompt', () => {
    const body = {
      system: [{ type: 'text', text: 'base' }],
      messages: [
        { role: 'user', content: 'hi' },
        { role: 'system', content: '# Environment' },
        { role: 'developer', content: [{ type: 'text', text: 'dev note' }] },
        { role: 'assistant', content: 'ok' },
      ],
    };
    assert.equal(hoistSystemMessages(body), true);
    assert.deepEqual(
      body.messages.map((m) => m.role),
      ['user', 'assistant'],
    );
    assert.deepEqual(
      (body.system as { text: string }[]).map((b) => b.text),
      ['base', '# Environment', 'dev note'],
    );
  });

  it('handles a string system prompt and leaves clean requests untouched', () => {
    const body = { system: 'base', messages: [{ role: 'system', content: 'env' }, { role: 'user', content: 'hi' }] };
    assert.equal(hoistSystemMessages(body), true);
    assert.deepEqual(body.system, [
      { type: 'text', text: 'base' },
      { type: 'text', text: 'env' },
    ]);
    const clean = { system: 'base', messages: [{ role: 'user', content: 'hi' }] };
    assert.equal(hoistSystemMessages(clean), false);
    assert.equal(clean.system, 'base');
  });
});
