-- Add credits to app_users for beta generation quota
alter table app_users add column if not exists credits integer not null default 0;
