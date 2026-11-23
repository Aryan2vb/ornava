-- Invite code system for beta access control
create table if not exists invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_by uuid references app_users(id) on delete set null,
  used_by uuid references app_users(id) on delete set null,
  used_at timestamptz,
  max_uses integer not null default 1,
  use_count integer not null default 0,
  created_at timestamptz not null default now(),
  constraint invite_codes_max_uses_check check (max_uses > 0),
  constraint invite_codes_use_count_check check (use_count >= 0 and use_count <= max_uses)
);

-- Track which invite code a user used to sign up
alter table app_users add column if not exists invite_code_id uuid references invite_codes(id) on delete set null;

create index if not exists invite_codes_code_idx on invite_codes(code);
create index if not exists invite_codes_created_by_idx on invite_codes(created_by);
