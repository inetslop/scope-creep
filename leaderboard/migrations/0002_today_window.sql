-- "Today" is now each name's best run of the last 24 hours, read from the run log; the
-- per-day boards ("daily:YYYY-MM-DD") and the day's seed are gone.
ALTER TABLE runs ADD COLUMN score INTEGER NOT NULL DEFAULT 0;
UPDATE runs SET score = waves * 100 + kills;
ALTER TABLE runs DROP COLUMN daily;
CREATE INDEX runs_name_at ON runs (name, at);
DELETE FROM best WHERE board LIKE 'daily:%';
DELETE FROM boards WHERE board LIKE 'daily:%';
