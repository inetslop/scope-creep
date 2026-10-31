-- Critter Clash's boards, separate from Chokepoint's. A run is one life of one player in the
-- match, posted by the game server (never by a browser). "today" is read from the run log (the
-- last 24 hours), "forever" from each name's best.
CREATE TABLE cc_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  name TEXT NOT NULL,
  score INTEGER NOT NULL,
  kills INTEGER NOT NULL,
  prestige INTEGER NOT NULL
);
CREATE INDEX cc_runs_at ON cc_runs (at);
CREATE INDEX cc_runs_name_at ON cc_runs (name, at);

CREATE TABLE cc_best (
  name TEXT PRIMARY KEY,
  score INTEGER NOT NULL,
  kills INTEGER NOT NULL,
  prestige INTEGER NOT NULL,
  at TEXT NOT NULL
);
CREATE INDEX cc_best_rank ON cc_best (score DESC, at);

-- How many names "forever" has, so its size is one row read.
CREATE TABLE cc_count (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  names INTEGER NOT NULL
);
