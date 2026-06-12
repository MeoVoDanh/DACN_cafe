import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function main() {
  const [tables] = await db.query("SHOW TABLES");
  const dbName = process.env.DB_NAME;
  const tableKey = `Tables_in_${dbName}`;
  
  console.log(`Database: ${dbName}\n`);
  for (const t of tables) {
    const tableName = t[tableKey];
    console.log(`=== TABLE: ${tableName} ===`);
    const [cols] = await db.query(`DESCRIBE \`${tableName}\``);
    console.table(cols.map(c => ({
      Field: c.Field,
      Type: c.Type,
      Null: c.Null,
      Key: c.Key,
      Default: c.Default,
      Extra: c.Extra
    })));
  }
  await db.end();
}

main().catch(console.error);
