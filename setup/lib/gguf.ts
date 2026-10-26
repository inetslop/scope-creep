/**
 * Reads a GGUF file's metadata (not its weights) to learn the model's shape, and estimates how a
 * context size splits the model between GPU and CPU. Used by setup to show the trade-off.
 */
import fs from 'node:fs';
import path from 'node:path';

/** Total size of a GGUF, counting every part of a split model. */
export function modelBytes(file: string): number {
  const m = /^(.*)-00001-of-(\d{5})\.gguf$/i.exec(path.basename(file));
  if (!m) return fs.statSync(file).size;
  return fs
    .readdirSync(path.dirname(file))
    .filter((f) => f.startsWith(`${m[1]}-`) && f.endsWith(`-of-${m[2]}.gguf`))
    .reduce((sum, f) => sum + fs.statSync(path.join(path.dirname(file), f)).size, 0);
}

/** Value types in GGUF metadata (spec v3). */
const SCALAR: Record<number, [number, (b: Buffer, o: number) => number | boolean]> = {
  0: [1, (b, o) => b.readUInt8(o)],
  1: [1, (b, o) => b.readInt8(o)],
  2: [2, (b, o) => b.readUInt16LE(o)],
  3: [2, (b, o) => b.readInt16LE(o)],
  4: [4, (b, o) => b.readUInt32LE(o)],
  5: [4, (b, o) => b.readInt32LE(o)],
  6: [4, (b, o) => b.readFloatLE(o)],
  7: [1, (b, o) => b.readUInt8(o) !== 0],
  10: [8, (b, o) => Number(b.readBigUInt64LE(o))],
  11: [8, (b, o) => Number(b.readBigInt64LE(o))],
  12: [8, (b, o) => b.readDoubleLE(o)],
};
const STRING = 8;
const ARRAY = 9;

/** Parses the metadata block. Long arrays (the tokenizer's vocabulary) are skipped, not kept. */
export function parseGgufMetadata(buf: Buffer): Record<string, unknown> {
  if (buf.toString('latin1', 0, 4) !== 'GGUF') throw new Error('not a GGUF file');
  let o = 8; // magic + version
  o += 8; // tensor count
  const count = Number(buf.readBigUInt64LE(o));
  o += 8;
  const str = (): string => {
    const n = Number(buf.readBigUInt64LE(o));
    const s = buf.toString('utf8', o + 8, o + 8 + n);
    o += 8 + n;
    return s;
  };
  const value = (type: number): unknown => {
    if (type === STRING) return str();
    if (type === ARRAY) {
      const itemType = buf.readUInt32LE(o);
      const n = Number(buf.readBigUInt64LE(o + 4));
      o += 12;
      const keep = n <= 256;
      const items: unknown[] = [];
      for (let i = 0; i < n; i++) {
        const v = value(itemType);
        if (keep) items.push(v);
      }
      return keep ? items : `<${n} items>`;
    }
    const scalar = SCALAR[type];
    if (!scalar) throw new Error(`unknown GGUF value type ${type}`);
    const v = scalar[1](buf, o);
    o += scalar[0];
    return v;
  };
  const meta: Record<string, unknown> = {};
  for (let i = 0; i < count; i++) {
    const key = str();
    const type = buf.readUInt32LE(o);
    o += 4;
    meta[key] = value(type);
  }
  return meta;
}

/** Metadata of a GGUF on disk (reads only the header, at most 64 MB). */
export function readGgufMetadata(file: string): Record<string, unknown> {
  const fd = fs.openSync(file, 'r');
  try {
    const buf = Buffer.alloc(Math.min(fs.fstatSync(fd).size, 64 * 1024 * 1024));
    fs.readSync(fd, buf, 0, buf.length, 0);
    return parseGgufMetadata(buf);
  } finally {
    fs.closeSync(fd);
  }
}

/** Context cache elements per token: attention layers x KV heads x (key + value length). */
export function kvElementsPerToken(meta: Record<string, unknown>): number | undefined {
  const arch = meta['general.architecture'];
  if (typeof arch !== 'string') return undefined;
  const get = (k: string): unknown => meta[`${arch}.${k}`];
  const blocks = Number(get('block_count'));
  if (!(blocks > 0)) return undefined;
  // Multi-token-prediction layers aren't run when serving; hybrid models only cache every Nth layer.
  const layers = blocks - (Number(get('nextn_predict_layers')) || 0);
  const interval = Number(get('full_attention_interval')) || 1;
  const attentionLayers = Math.round(layers / interval);
  const kvHeadsRaw = get('attention.head_count_kv') ?? get('attention.head_count');
  const kvHeads = Array.isArray(kvHeadsRaw) ? Math.max(...kvHeadsRaw.map(Number)) : Number(kvHeadsRaw);
  const keyLength = Number(get('attention.key_length')) || Number(get('embedding_length')) / Number(get('attention.head_count'));
  const valueLength = Number(get('attention.value_length')) || keyLength;
  const total = attentionLayers * kvHeads * (keyLength + valueLength);
  return Number.isFinite(total) && total > 0 ? total : undefined;
}

export type CacheType = 'q8_0' | 'q4_0';
/** Bytes per cached element: q8_0 stores 32 values in 34 bytes, q4_0 in 18. */
export const CACHE_BYTES: Record<CacheType, number> = { q8_0: 34 / 32, q4_0: 18 / 32 };

const GIB = 1024 ** 3;
/** What llama.cpp's --fit keeps free on the GPU by default, and its working buffers (measured). */
const FIT_MARGIN_GIB = 1;
const BUFFERS_GIB = 0.75;

export interface GpuSplit {
  cacheGib: number;
  /** Estimated share of the weights that fit in VRAM (0..1). */
  onGpu: number;
}

/**
 * Rough split for a context size: VRAM minus what other programs use, llama.cpp's margin and
 * buffers, and the context cache; the rest holds weights. Within ~5% of what llama.cpp chose on an
 * RTX 4070 SUPER with a 10.9 GB model.
 */
export function gpuSplit(opts: { modelBytes: number; kvElementsPerToken: number; ctx: number; cache: CacheType; vramGib: number; vramOtherGib: number }): GpuSplit {
  const cacheGib = (opts.ctx * opts.kvElementsPerToken * CACHE_BYTES[opts.cache]) / GIB;
  const forWeights = opts.vramGib - opts.vramOtherGib - FIT_MARGIN_GIB - BUFFERS_GIB - cacheGib;
  return { cacheGib, onGpu: Math.min(1, Math.max(0, (forWeights * GIB) / opts.modelBytes)) };
}

export const CONTEXT_CHOICES = [32_768, 65_536, 100_000, 131_072];
