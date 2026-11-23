-- Store v0.2 zero-typing guided generation selections.

alter table generations
  add column if not exists generation_brief jsonb not null default '{}'::jsonb;

create index if not exists generations_generation_brief_gin_idx
  on generations using gin (generation_brief);
