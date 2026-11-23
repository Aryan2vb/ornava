-- The browser holds the Supabase publishable (anon) key for sign-in, which also
-- unlocks Supabase's auto-generated REST API over the public schema.
-- Ornava reads and writes these tables only from the server, over a direct
-- Postgres connection as the table owner (which bypasses RLS), so the REST API
-- must not expose them: enable RLS with no policies and revoke the API roles.
-- On plain Postgres (local Docker) the API roles do not exist; RLS is still enabled.
do $$
declare
  t record;
  has_api_roles boolean := exists (select 1 from pg_roles where rolname = 'anon')
    and exists (select 1 from pg_roles where rolname = 'authenticated');
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t.tablename);
    if has_api_roles then
      execute format('revoke all on table public.%I from anon, authenticated', t.tablename);
    end if;
  end loop;

  if has_api_roles then
    alter default privileges in schema public revoke all on tables from anon, authenticated;
    alter default privileges in schema public revoke all on sequences from anon, authenticated;
    alter default privileges in schema public revoke all on functions from anon, authenticated;
  end if;
end
$$;
