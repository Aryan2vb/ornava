-- Per-upload text overlay metadata used before batch generation.
-- Copied into generations.overlay_text when a generation is created.
alter table images add column if not exists overlay_text jsonb;
