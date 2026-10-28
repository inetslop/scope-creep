import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { samplingFor, type FleetConfig } from '../config.ts';
import { hoistSystemMessages, isCompactionRequest, rewriteRequest } from '../shim.ts';

describe('rewriteRequest', () => {
  it("sets reasoning_effort for the chat template, keeping other kwargs", () => {
    const body = { messages: [{ role: 'user', content: 'hi' }], chat_template_kwargs: { foo: 1 } };
    rewriteRequest(body, 'xhigh');
    assert.deepEqual(body.chat_template_kwargs, { foo: 1, reasoning_effort: 'xhigh' });
  });

  it("gives Claude Code's compaction request low effort, so thinking can't eat the summary", () => {
    const ask = 'CRITICAL: Respond with TEXT ONLY. Do NOT call any tools.\n…\nREMINDER: Do NOT call any tools. Respond with plain text only — an <analysis> block followed by a <summary> block.';
    const compact: Parameters<typeof rewriteRequest>[0] = { messages: [{ role: 'user', content: 'the task' }, { role: 'assistant', content: 'reading' }, { role: 'user', content: [{ type: 'text', text: ask }] }] };
    assert.equal(isCompactionRequest(compact), true);
    rewriteRequest(compact, 'xhigh');
    assert.deepEqual(compact.chat_template_kwargs, { reasoning_effort: 'low' });
    // Low even when the machine configures no effort (the template's default may think at length).
    const bare: Parameters<typeof rewriteRequest>[0] = { messages: [{ role: 'user', content: ask }] };
    rewriteRequest(bare);
    assert.deepEqual(bare.chat_template_kwargs, { reasoning_effort: 'low' });
  });

  it('never takes a normal turn for a compaction, even when a file the agent read quotes the prompt', () => {
    const ask = 'Do NOT call any tools. Respond with an <analysis> block followed by a <summary> block.';
    const read: Parameters<typeof rewriteRequest>[0] = { messages: [{ role: 'user', content: [{ type: 'tool_result', text: ask }] }] };
    assert.equal(isCompactionRequest(read), false);
    assert.equal(isCompactionRequest({ messages: [{ role: 'user', content: 'Design T0062.' }] }), false);
    assert.equal(isCompactionRequest({ messages: [] }), false);
    rewriteRequest(read, 'medium');
    assert.deepEqual(read.chat_template_kwargs, { reasoning_effort: 'medium' });
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
    rewriteRequest(body, 'xhigh', { temperature: 1, top_k: 20, top_p: undefined });
    assert.equal(body.temperature, 1);
    assert.equal(body.top_k, 20);
    assert.equal(body.max_tokens, 100);
    assert.equal('top_p' in body, false);
    assert.deepEqual(body.chat_template_kwargs, { reasoning_effort: 'xhigh' });
  });

  it('only sends what llama.cpp applies on /v1/messages (presence_penalty and min_p are server arguments)', () => {
    const body = { messages: [] } as Parameters<typeof rewriteRequest>[0] & Record<string, unknown>;
    rewriteRequest(body, undefined, { temperature: 1, presence_penalty: 1, min_p: 0.1 } as never);
    assert.deepEqual(Object.keys(body).sort(), ['messages', 'temperature']);
  });

  it('merges a machine override over the fleet default', () => {
    const fleet = { machines: { yoga: { sampling: { temperature: 0.8 } }, desktop: {} }, loop: { sampling: { temperature: 1, top_k: 20 } } } as unknown as FleetConfig;
    assert.deepEqual(samplingFor(fleet, 'yoga'), { temperature: 0.8, top_k: 20 });
    assert.deepEqual(samplingFor(fleet, 'desktop'), { temperature: 1, top_k: 20 });
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
