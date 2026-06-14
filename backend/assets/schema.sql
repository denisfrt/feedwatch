CREATE TABLE IF NOT EXISTS t_feeds (
  k_id INTEGER PRIMARY KEY,
  f_name TEXT type UNIQUE NOT NULL,
  f_type TEXT CHECK( f_type IN ('yt') ) NOT NULL DEFAULT 'yt',
  f_video_ids TEXT NOT NULL DEFAULT '[]',
  f_order INTEGER NOT NULL DEFAULT 0
);

/*
ALTER TABLE t_feeds
ADD COLUMN f_order INTEGER NOT NULL DEFAULT 0;
*/

CREATE TABLE IF NOT EXISTS t_sessions (
  k_id INTEGER PRIMARY KEY AUTOINCREMENT,
  f_type TEXT CHECK( f_type IN ('yt') ) NOT NULL DEFAULT 'yt',
  f_token TEXT NOT NULL,
  f_refresh TEXT NOT NULL,
  f_token_expiry TIMESTAMP NOT NULL,
  f_refresh_expiry TIMESTAMP NOT NULL
);