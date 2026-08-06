import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("DATABASE_URL is missing!");
  process.exit(1);
}

const sql = neon(dbUrl);

async function main() {
  console.log("Migrating database schema for Phase 2...");
  await sql`
    ALTER TABLE risk_scores 
    ADD COLUMN IF NOT EXISTS business_logic_analysis jsonb,
    ADD COLUMN IF NOT EXISTS ai_summary text;
  `;
  console.log("✅ Database schema migration completed successfully!");
}

main().catch(console.error);
