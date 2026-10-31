/**
 * The client's connection, either a real WebSocket or an in-page loopback to a Room running in the
 * same tab (no server set, the smoke test). Both carry the same bytes through the same protocol.
 */
import type { Registry } from '../registry.ts';
import { Room } from '../sim/room.ts';

export interface ClientSocket {
  send(data: Uint8Array): void;
  close(): void;
  onopen: () => void;
  onmessage: (data: Uint8Array) => void;
  /** `clean`: we closed it ourselves. */
  onclose: (clean: boolean) => void;
}

export function webSocket(url: string): ClientSocket {
  const ws = new WebSocket(url);
  ws.binaryType = 'arraybuffer';
  let closedByUs = false;
  const socket: ClientSocket = {
    send: (data) => {
      // Our messages are always backed by a plain ArrayBuffer (Writer.finish copies).
      if (ws.readyState === WebSocket.OPEN) ws.send(data as Uint8Array<ArrayBuffer>);
    },
    close: () => {
      closedByUs = true;
      ws.close();
    },
    onopen: () => {},
    onmessage: () => {},
    onclose: () => {},
  };
  ws.onopen = () => socket.onopen();
  ws.onmessage = (e) => {
    if (e.data instanceof ArrayBuffer) socket.onmessage(new Uint8Array(e.data));
  };
  ws.onclose = () => socket.onclose(closedByUs);
  return socket;
}

/** A Room in this tab, with `lagMs` of simulated delay each way. */
export function localServer(registry: Registry, seed: number, lagMs = 0): { room: Room; connect(): ClientSocket } {
  const room = new Room(registry, seed);
  room.start();
  const later = (fn: () => void): void => {
    if (lagMs > 0) setTimeout(fn, lagMs);
    else queueMicrotask(fn);
  };
  return {
    room,
    connect() {
      let open = true;
      const socket: ClientSocket = {
        send: (data) => {
          if (open) later(() => open && conn.receive(data));
        },
        close: () => {
          if (!open) return;
          open = false;
          conn.closed();
          room.stop();
          socket.onclose(true);
        },
        onopen: () => {},
        onmessage: () => {},
        onclose: () => {},
      };
      const conn = room.connect({
        send: (data) => later(() => open && socket.onmessage(data)),
        close: () => {
          if (!open) return;
          open = false;
          later(() => socket.onclose(false));
        },
        backlog: 0,
      });
      later(() => socket.onopen());
      return socket;
    },
  };
}
