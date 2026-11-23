-- Migration 0011: Public Showcases and Activity Tracking

CREATE TABLE IF NOT EXISTS showcases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS showcase_items (
  showcase_id uuid NOT NULL REFERENCES showcases(id) ON DELETE CASCADE,
  generation_id uuid NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  PRIMARY KEY (showcase_id, generation_id)
);

CREATE TABLE IF NOT EXISTS showcase_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  showcase_id uuid NOT NULL REFERENCES showcases(id) ON DELETE CASCADE,
  generation_id uuid REFERENCES generations(id) ON DELETE SET NULL,
  viewer_fingerprint text,
  device_info text,
  viewer_location text,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS showcases_user_idx ON showcases(user_id);
CREATE INDEX IF NOT EXISTS showcase_items_showcase_idx ON showcase_items(showcase_id);
CREATE INDEX IF NOT EXISTS showcase_views_showcase_idx ON showcase_views(showcase_id);
CREATE INDEX IF NOT EXISTS showcase_views_time_idx ON showcase_views(viewed_at DESC);

-- Updated_at trigger for showcases
DROP TRIGGER IF EXISTS set_showcases_updated_at ON showcases;
CREATE TRIGGER set_showcases_updated_at
BEFORE UPDATE ON showcases
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
