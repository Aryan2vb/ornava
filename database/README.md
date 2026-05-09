# Ornava Database

Phase 1 uses Postgres as the source of truth for users, uploaded images, generation jobs, feedback, and an optional local event audit buffer.

## Migrations

- `migrations/0001_phase1_initial.sql`: initial Phase 1 schema.

## Notes

- `app_users` is used instead of `users` to avoid conflicts with managed auth schemas such as Supabase `auth.users`.
- R2 object keys are stored, not public URLs.
- `generations` stores both `model_route` and concrete provider fields so the system stays model-portable while preserving auditability.
