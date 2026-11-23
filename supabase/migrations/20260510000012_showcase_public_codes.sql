-- Migration 0012: Short public codes for showcase links

ALTER TABLE showcases
ADD COLUMN IF NOT EXISTS public_code text;

UPDATE showcases
SET public_code = substring(replace(id::text, '-', '') from 1 for 12)
WHERE public_code IS NULL;

ALTER TABLE showcases
ALTER COLUMN public_code SET DEFAULT substring(replace(gen_random_uuid()::text, '-', '') from 1 for 12);

ALTER TABLE showcases
ALTER COLUMN public_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS showcases_public_code_idx
ON showcases(public_code);
