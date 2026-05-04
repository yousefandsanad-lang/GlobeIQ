CREATE TABLE IF NOT EXISTS players (
  id uuid references auth.users primary key,
  created_at timestamp default now()
);

CREATE TABLE IF NOT EXISTS atlas (
  id uuid default gen_random_uuid() primary key,
  player_id uuid references players(id),
  country_id text not null,
  discovered_at timestamp default now(),
  UNIQUE(player_id, country_id)
);

CREATE TABLE IF NOT EXISTS streaks (
  player_id uuid references players(id) primary key,
  current_streak int default 0,
  best_streak int default 0,
  last_played_date date
);

-- -------------------------------------------------------
-- Row Level Security
-- Run this block in the Supabase SQL editor.
-- Ensures each user can only read and write their own data.
-- -------------------------------------------------------

-- players
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "players: select own row"
  ON players FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "players: insert own row"
  ON players FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "players: update own row"
  ON players FOR UPDATE
  USING (id = auth.uid());

-- atlas
ALTER TABLE atlas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "atlas: select own rows"
  ON atlas FOR SELECT
  USING (player_id = auth.uid());

CREATE POLICY "atlas: insert own rows"
  ON atlas FOR INSERT
  WITH CHECK (player_id = auth.uid());

CREATE POLICY "atlas: update own rows"
  ON atlas FOR UPDATE
  USING (player_id = auth.uid());

CREATE POLICY "atlas: delete own rows"
  ON atlas FOR DELETE
  USING (player_id = auth.uid());

-- streaks
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "streaks: select own row"
  ON streaks FOR SELECT
  USING (player_id = auth.uid());

CREATE POLICY "streaks: insert own row"
  ON streaks FOR INSERT
  WITH CHECK (player_id = auth.uid());

CREATE POLICY "streaks: update own row"
  ON streaks FOR UPDATE
  USING (player_id = auth.uid());
