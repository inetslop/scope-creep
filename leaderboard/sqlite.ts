/**
 * The part of D1's API the Worker uses, over Bun's SQLite: for the tests and the local server
 * (dev.ts), so neither needs Cloudflare. Applies migrations/ to a fresh database.
 */
import { Database } from 'bun:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import type { D1Database, D1Statement } from './src/worker.ts';

class Statement implements D1Statement {
  private readonly db: Database;
  private readonly sql: string;
  private values: unknown[] = [];

  constructor(db: Database, sql: string) {
    this.db = db;
    this.sql = sql;
  }

  bind(...values: unknown[]): D1Statement {
    const s = new Statement(this.db, this.sql);
    s.values = values;
    return s;
  }

  async first<T>(): Promise<T | null> {
    return (this.db.query(this.sql).get(...(this.values as never[])) as T | undefined) ?? null;
  }

  async all<T>(): Promise<{ results: T[] }> {
    return { results: this.db.query(this.sql).all(...(this.values as never[])) as T[] };
  }

  async run(): Promise<unknown> {
    return this.db.query(this.sql).run(...(this.values as never[]));
  }
}

/** A D1-shaped database over SQLite at `file` (":memory:" by default), with every migration applied once (as D1 tracks them). */
export function sqliteD1(file = ':memory:'): D1Database {
  const db = new Database(file);
  const dir = path.join(import.meta.dirname, 'migrations');
  db.exec('CREATE TABLE IF NOT EXISTS d1_migrations (name TEXT PRIMARY KEY)');
  const applied = new Set((db.query('SELECT name FROM d1_migrations').all() as { name: string }[]).map((r) => r.name));
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    if (applied.has(f)) continue;
    db.exec(fs.readFileSync(path.join(dir, f), 'utf8'));
    db.query('INSERT INTO d1_migrations (name) VALUES (?)').run(f);
  }
  return { prepare: (sql: string) => new Statement(db, sql) };
}
