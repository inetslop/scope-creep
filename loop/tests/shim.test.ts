import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { samplingFor, type FleetConfig } from '../config.ts';
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

describe('sampling', () => {
  it('writes the configured sampling into the request, over what the client sent', () => {
    const body = { messages: [{ role: 'user', content: 'hi' }], temperature: 0.2, max_tokens: 100 } as Parameters<typeof rewriteRequest>[0] & Record<string, unknown>;
    rewriteRequest(body, 'xhigh', { temperature: 1, top_k: 20, presence_penalty: 1, min_p: undefined });
    assert.equal(body.temperature, 1);
    assert.equal(body.top_k, 20);
    assert.equal(body.presence_penalty, 1);
    assert.equal(body.max_tokens, 100);
    assert.equal('min_p' in body, false);
    assert.deepEqual(body.chat_template_kwargs, { reasoning_effort: 'xhigh' });
  });

  it('merges a machine override over the fleet default', () => {
    const fleet = { machines: { yoga: { sampling: { presence_penalty: 1 } }, desktop: {} }, loop: { sampling: { temperature: 1, presence_penalty: 0 } } } as unknown as FleetConfig;
    assert.deepEqual(samplingFor(fleet, 'yoga'), { temperature: 1, presence_penalty: 1 });
    assert.deepEqual(samplingFor(fleet, 'desktop'), { temperature: 1, presence_penalty: 0 });
    assert.deepEqual(samplingFor({ machines: {}, loop: {} } as unknown as FleetConfig, 'x'), {});
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
