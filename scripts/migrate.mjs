import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import "dotenv/config";
import pg from "pg";

const { Client } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required to run migrations.");
  process.exit(1);
}

const migrationsDir = join(process.cwd(), "database", "migrations");
const client = new Client({ connectionString: databaseUrl });

await client.connect();

try {
  await client.query(`
    create table if not exists schema_migrations (
      version text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const version = file.replace(/\.sql$/, "");
    const alreadyApplied = await client.query(
      "select 1 from schema_migrations where version = $1",
      [version],
    );

    if (alreadyApplied.rowCount) {
      console.info(`Skipping ${file}`);
      continue;
    }

    const sql = await readFile(join(migrationsDir, file), "utf8");

    console.info(`Applying ${file}`);
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query(
        "insert into schema_migrations (version) values ($1)",
        [version],
      );
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }

  console.info("Migrations complete.");
} finally {
  await client.end();
}
