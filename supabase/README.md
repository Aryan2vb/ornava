# Ornava Database

Phase 1 uses Postgres as the source of truth for users, uploaded images, generation jobs, feedback, and an optional local event audit buffer.

## Migrations

Schema changes live in `migrations/` as `<timestamp>_<name>.sql`.

Hosted (Supabase project, linked with `supabase link`):

```bash
supabase db push        # apply new migrations
supabase config push    # apply auth settings from config.toml
```

Local Docker Postgres instead:

```bash
pnpm infra:up
pnpm db:migrate
pnpm db:check
```

Every table in `public` has row-level security on with no policies, and the
`anon`/`authenticated` roles have no grants: the app only reads and writes from
the server over `DATABASE_URL`. Keep it that way for new tables.

## Notes

- `app_users` is used instead of `users` to avoid conflicts with managed auth schemas such as Supabase `auth.users`.
- R2 object keys are stored, not public URLs.
- `generations` stores both `model_route` and concrete provider fields so the system stays model-portable while preserving auditability.
