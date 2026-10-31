/** Little binary writer and reader for the network messages (DataView, big-endian). */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export class Writer {
  private buf: ArrayBuffer;
  private view: DataView;
  private bytes: Uint8Array;
  pos = 0;

  constructor(size = 4096) {
    this.buf = new ArrayBuffer(size);
    this.view = new DataView(this.buf);
    this.bytes = new Uint8Array(this.buf);
  }

  private ensure(n: number): void {
    if (this.pos + n <= this.buf.byteLength) return;
    let size = this.buf.byteLength * 2;
    while (size < this.pos + n) size *= 2;
    const next = new ArrayBuffer(size);
    new Uint8Array(next).set(this.bytes.subarray(0, this.pos));
    this.buf = next;
    this.view = new DataView(next);
    this.bytes = new Uint8Array(next);
  }

  reset(): this {
    this.pos = 0;
    return this;
  }

  u8(v: number): void {
    this.ensure(1);
    this.view.setUint8(this.pos, v);
    this.pos += 1;
  }

  i8(v: number): void {
    this.ensure(1);
    this.view.setInt8(this.pos, v);
    this.pos += 1;
  }

  u16(v: number): void {
    this.ensure(2);
    this.view.setUint16(this.pos, v);
    this.pos += 2;
  }

  i16(v: number): void {
    this.ensure(2);
    this.view.setInt16(this.pos, v);
    this.pos += 2;
  }

  u32(v: number): void {
    this.ensure(4);
    this.view.setUint32(this.pos, v);
    this.pos += 4;
  }

  /** At most 255 bytes of UTF-8. */
  str(s: string): void {
    const b = encoder.encode(s);
    const n = Math.min(b.length, 255);
    this.u8(n);
    this.ensure(n);
    this.bytes.set(b.subarray(0, n), this.pos);
    this.pos += n;
  }

  /** Overwrites a u16 written earlier: counts that are only known after their items. */
  setU16(at: number, v: number): void {
    this.view.setUint16(at, v);
  }

  /** A copy of what was written, safe to send while this writer is reused. */
  finish(): Uint8Array {
    return this.bytes.slice(0, this.pos);
  }
}

export class Reader {
  private view: DataView;
  private bytes: Uint8Array;
  pos = 0;

  constructor(data: Uint8Array | ArrayBuffer) {
    this.bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    this.view = new DataView(this.bytes.buffer, this.bytes.byteOffset, this.bytes.byteLength);
  }

  get remaining(): number {
    return this.bytes.byteLength - this.pos;
  }

  u8(): number {
    const v = this.view.getUint8(this.pos);
    this.pos += 1;
    return v;
  }

  i8(): number {
    const v = this.view.getInt8(this.pos);
    this.pos += 1;
    return v;
  }

  u16(): number {
    const v = this.view.getUint16(this.pos);
    this.pos += 2;
    return v;
  }

  i16(): number {
    const v = this.view.getInt16(this.pos);
    this.pos += 2;
    return v;
  }

  u32(): number {
    const v = this.view.getUint32(this.pos);
    this.pos += 4;
    return v;
  }

  str(): string {
    const n = this.u8();
    if (this.pos + n > this.bytes.byteLength) throw new RangeError('string past the end of the message');
    const s = decoder.decode(this.bytes.subarray(this.pos, this.pos + n));
    this.pos += n;
    return s;
  }
}
