-- Logo branding settings per user
-- Stores logo R2 key and compositing preferences

create table if not exists user_logo_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  logo_object_key text not null,
  position text not null default 'bottom-right'
    check (position in ('top-left', 'top-right', 'bottom-left', 'bottom-right', 'bottom-center')),
  size_percent integer not null default 12
    check (size_percent between 8 and 25),
  enabled boolean not null default true,
  file_size_bytes integer not null check (file_size_bytes > 0),
  width integer not null check (width >= 100),
  height integer not null check (height >= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_logo_settings_one_per_user unique (user_id)
);

create index if not exists user_logo_settings_user_idx on user_logo_settings(user_id);

drop trigger if exists set_user_logo_settings_updated_at on user_logo_settings;
create trigger set_user_logo_settings_updated_at
before update on user_logo_settings
for each row execute function set_updated_at();
