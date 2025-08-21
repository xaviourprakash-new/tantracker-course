import { categoriesTable } from "./schema";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import dotenv from "dotenv";

dotenv.config();

const raw = process.env.DATABASE_URL!;
const normalized = raw.startsWith("postgres://")
	? raw.replace("postgres://", "postgresql://")
	: raw;

const pool = new Pool({ connectionString: normalized });
const db = drizzle(pool);

const categoriesSeedData: (typeof categoriesTable.$inferInsert)[] = [
	{ name: "Salary", type: "income" },
	{ name: "Rental Income", type: "income" },
	{ name: "Business Income", type: "income" },
	{ name: "Investments", type: "income" },
	{ name: "Other", type: "income" },
	{ name: "Housing", type: "expense" },
	{ name: "Transport", type: "expense" },
	{ name: "Food & Groceries", type: "expense" },
	{ name: "Health", type: "expense" },
	{ name: "Entertainment & Leisure", type: "expense" },
	{ name: "Other", type: "expense" },
];

async function main() {
	try {
		await db.insert(categoriesTable).values(categoriesSeedData);
		console.log("Seed completed");
	} catch (err) {
		console.error("Seeding failed:", err);
		process.exitCode = 1;
	} finally {
		await pool.end();
	}
}

main();
