-- Each name's best run per board ("forever", or "daily:YYYY-MM-DD").
CREATE TABLE best (
  board TEXT NOT NULL,
  name TEXT NOT NULL,
  score INTEGER NOT NULL,
  waves INTEGER NOT NULL,
  at TEXT NOT NULL,
  PRIMARY KEY (board, name)
);
CREATE INDEX best_rank ON best (board, score DESC, at);

-- How many names each board has, so a board's size is one row read.
CREATE TABLE boards (
  board TEXT PRIMARY KEY,
  names INTEGER NOT NULL
);

-- Every submission for two days, for the rate limit. `ip` is a salted hash, never the address.
CREATE TABLE runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  ip TEXT NOT NULL,
  name TEXT NOT NULL,
  seed INTEGER NOT NULL,
  waves INTEGER NOT NULL,
  kills INTEGER NOT NULL,
  daily TEXT
);
CREATE INDEX runs_ip ON runs (ip, at);
CREATE INDEX runs_at ON runs (at);
