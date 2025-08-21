import { createServerFn } from "@tanstack/react-start";

export const getCategories = createServerFn({
	method: "GET",
}).handler(async () => {
	// dynamic import of Node-only modules so the browser bundle doesn't include them
	const dotenv = await import("dotenv");
	const { Pool } = await import("pg");
	const { drizzle } = await import("drizzle-orm/node-postgres");
	const { categoriesTable } = await import("@/db/schema");

	dotenv.config();

	const raw = process.env.DATABASE_URL!;
	const normalized = raw.startsWith("postgres://")
		? raw.replace("postgres://", "postgresql://")
		: raw;

	const pool = new Pool({ connectionString: normalized });
	const db = drizzle(pool);

	try {
		const rows = await db.select().from(categoriesTable);
		return rows;
	} finally {
		await pool.end();
	}
});
