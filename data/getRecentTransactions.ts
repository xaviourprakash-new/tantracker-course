import authMiddleware from "@/authMiddleware";
import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";

export const getRecentTransactions = createServerFn({
	method: "GET",
})
	.middleware([authMiddleware])
	.handler(async ({ context }: any) => {
		// dynamic import of Node-only modules so the browser bundle doesn't include them
		const { Pool } = await import("pg");
		const { drizzle } = await import("drizzle-orm/node-postgres");
		const { transactionsTable, categoriesTable } = await import("@/db/schema");
		const dotenv = await import("dotenv");

		dotenv.config();

		const raw = process.env.DATABASE_URL!;
		const normalized = raw.startsWith("postgres://")
			? raw.replace("postgres://", "postgresql://")
			: raw;

		const pool = new Pool({ connectionString: normalized });
		const db = drizzle(pool);

		try {
			const transactions = await db
				.select({
					id: transactionsTable.id,
					description: transactionsTable.description,
					amount: transactionsTable.amount,
					transactionDate: transactionsTable.transactionDate,
					category: categoriesTable.name,
					transactionType: categoriesTable.type,
				})
				.from(transactionsTable)
				.where(eq(transactionsTable.userId, context.userId))
				.orderBy(desc(transactionsTable.transactionDate))
				.leftJoin(
					categoriesTable,
					eq(transactionsTable.categoryId, categoriesTable.id),
				)
				.limit(5);

			return transactions;
		} finally {
			await pool.end();
		}
	});
