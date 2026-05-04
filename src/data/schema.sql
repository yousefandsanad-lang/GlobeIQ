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
