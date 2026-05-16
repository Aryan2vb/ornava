-- Per-generation text overlay (purity + weight badge)
-- Stored as jsonb: {"purity": "22K", "weightGm": "4.2", "position": "bottom-left"}
alter table generations add column if not exists overlay_text jsonb;
