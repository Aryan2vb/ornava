import "dotenv/config";
import pg from "pg";

const { Client } = pg;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required to check the database.");
  process.exit(1);
}

const client = new Client({ connectionString: databaseUrl });

await client.connect();

try {
  const result = await client.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
    order by table_name
  `);

  console.info(result.rows.map((row) => row.table_name).join("\n"));
} finally {
  await client.end();
}
