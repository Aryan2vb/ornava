-- Ornava Phase 1 initial schema
-- Scope: users, images, generations, feedback, and optional event audit buffer.

create extension if not exists "pgcrypto";

do $$ begin
  create type image_status as enum ('created', 'uploaded', 'failed', 'deleted');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type generation_mode as enum ('on_model', 'studio', 'close_up');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type generation_status as enum ('queued', 'processing', 'completed', 'failed', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type feedback_rating as enum ('usable', 'not_usable');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type feedback_reason as enum (
    'design_changed',
    'stone_or_detail_changed',
    'unrealistic_model_or_skin',
    'too_dark_or_dull',
    'bad_crop_or_composition',
    'generation_failed_or_incomplete',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  phone text unique,
  name text,
  avatar_url text,
  beta_cohort text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz,
  constraint app_users_identity_check check (email is not null or phone is not null)
);

create table if not exists images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  original_object_key text not null,
  thumbnail_object_key text,
  working_object_key text,
  status image_status not null default 'created',
  file_type text not null,
  file_size_bytes integer not null,
  width integer,
  height integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint images_file_type_check check (file_type in ('image/jpeg', 'image/png', 'image/webp')),
  constraint images_file_size_check check (file_size_bytes > 0),
  constraint images_dimensions_check check (
    (width is null and height is null)
    or (width > 0 and height > 0)
  )
);

create table if not exists generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  image_id uuid not null references images(id) on delete cascade,
  previous_generation_id uuid references generations(id) on delete set null,
  mode generation_mode not null,
  status generation_status not null default 'queued',
  output_object_key text,
  model_route text not null,
  prompt_template_version text not null,
  provider text,
  provider_model_id text,
  provider_job_id text,
  adapter_version text,
  client_request_id text not null,
  attempt_count integer not null default 0,
  failure_code text,
  failure_message_safe text,
  generation_duration_ms integer,
  queue_wait_ms integer,
  estimated_cost_minor integer,
  raw_provider_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint generations_attempt_count_check check (attempt_count >= 0),
  constraint generations_duration_check check (generation_duration_ms is null or generation_duration_ms >= 0),
  constraint generations_queue_wait_check check (queue_wait_ms is null or queue_wait_ms >= 0),
  constraint generations_cost_check check (estimated_cost_minor is null or estimated_cost_minor >= 0),
  constraint generations_completed_output_check check (
    status <> 'completed' or output_object_key is not null
  ),
  constraint generations_user_client_request_unique unique (user_id, client_request_id)
);

create table if not exists generation_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  generation_id uuid not null references generations(id) on delete cascade,
  rating feedback_rating not null,
  reason feedback_reason,
  free_text text,
  created_at timestamptz not null default now(),
  constraint generation_feedback_reason_required check (
    rating = 'usable' or reason is not null
  )
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_users(id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists images_user_created_idx on images(user_id, created_at desc);
create index if not exists images_status_idx on images(status);

create index if not exists generations_user_created_idx on generations(user_id, created_at desc);
create index if not exists generations_image_created_idx on generations(image_id, created_at desc);
create index if not exists generations_status_created_idx on generations(status, created_at asc);
create index if not exists generations_model_route_idx on generations(model_route);
create index if not exists generations_provider_model_idx on generations(provider, provider_model_id);

create index if not exists generation_feedback_generation_idx on generation_feedback(generation_id);
create index if not exists generation_feedback_user_created_idx on generation_feedback(user_id, created_at desc);

create index if not exists events_user_created_idx on events(user_id, created_at desc);
create index if not exists events_name_created_idx on events(event_name, created_at desc);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_app_users_updated_at on app_users;
create trigger set_app_users_updated_at
before update on app_users
for each row execute function set_updated_at();

drop trigger if exists set_images_updated_at on images;
create trigger set_images_updated_at
before update on images
for each row execute function set_updated_at();

drop trigger if exists set_generations_updated_at on generations;
create trigger set_generations_updated_at
before update on generations
for each row execute function set_updated_at();
