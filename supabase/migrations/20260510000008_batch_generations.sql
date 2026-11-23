-- Batch generation support
CREATE TABLE IF NOT EXISTS batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'ready', 'generating', 'completed', 'cancelled')),
  generation_brief jsonb,
  image_count integer NOT NULL DEFAULT 0,
  generated_count integer NOT NULL DEFAULT 0,
  completed_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS batches_user_status_idx ON batches(user_id, status);
CREATE INDEX IF NOT EXISTS batches_user_created_idx ON batches(user_id, created_at DESC);

-- Link images to a batch (optional — null for single uploads)
ALTER TABLE images ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES batches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS images_batch_id_idx ON images(batch_id) WHERE batch_id IS NOT NULL;

-- Link generations to a batch
ALTER TABLE generations ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES batches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS generations_batch_id_idx ON generations(batch_id) WHERE batch_id IS NOT NULL;

-- Trigger for batches updated_at
DROP TRIGGER IF EXISTS set_batches_updated_at ON batches;
CREATE TRIGGER set_batches_updated_at
BEFORE UPDATE ON batches
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
