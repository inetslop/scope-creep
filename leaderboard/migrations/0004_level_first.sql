-- The level a run was played at (how many level augments were on) ranks first, then the score;
-- the score now carries the level's multiplier. "Today" is the UTC day (read in the Worker).
-- Runs posted before this are level 0 at ×1.
ALTER TABLE runs ADD COLUMN level INTEGER NOT NULL DEFAULT 0;
ALTER TABLE runs ADD COLUMN mul REAL NOT NULL DEFAULT 1;
ALTER TABLE best ADD COLUMN level INTEGER NOT NULL DEFAULT 0;
ALTER TABLE best ADD COLUMN mul REAL NOT NULL DEFAULT 1;
DROP INDEX best_rank;
CREATE INDEX best_rank ON best (board, level DESC, score DESC, at);
