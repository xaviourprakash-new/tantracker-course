import authMiddleware from "@/authMiddleware";
import { createServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";

const today = new Date();

const schema = z.object({
	month: z.number().min(1).max(12),
	year: z
		.number()
		.min(today.getFullYear() - 100)
		.max(today.getFullYear()),
});

export const getTransactionsByMonth = createServerFn({
	method: "GET",
})
	.middleware([authMiddleware])
	.validator((data: z.infer<typeof schema>) => schema.parse(data))
	.handler(async ({ context, data }: any) => {
		// dynamic import of Node-only modules so the browser bundle doesn't include them
		const { Pool } = await import("pg");
		const { drizzle } = await import("drizzle-orm/node-postgres");
		const { categoriesTable, transactionsTable } = await import("@/db/schema");
		const dotenv = await import("dotenv");

		dotenv.config();

		const raw = process.env.DATABASE_URL!;
		const normalized = raw.startsWith("postgres://")
			? raw.replace("postgres://", "postgresql://")
			: raw;

		const pool = new Pool({ connectionString: normalized });
		const db = drizzle(pool);

		const earliestDate = new Date(data.year, data.month - 1, 1);
		const latestDate = new Date(data.year, data.month, 0);

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
				.where(
					and(
						eq(transactionsTable.userId, context.userId),
						gte(
							transactionsTable.transactionDate,
							format(earliestDate, "yyyy-MM-dd"),
						),
						lte(
							transactionsTable.transactionDate,
							format(latestDate, "yyyy-MM-dd"),
						),
					),
				)
				.orderBy(desc(transactionsTable.transactionDate))
				.leftJoin(
					categoriesTable,
					eq(transactionsTable.categoryId, categoriesTable.id),
				);

			return transactions;
		} finally {
			await pool.end();
		}
	});
