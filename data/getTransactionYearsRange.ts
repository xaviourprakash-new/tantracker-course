import authMiddleware from "@/authMiddleware";
import { createServerFn } from "@tanstack/react-start";
import { asc, eq } from "drizzle-orm";

export const getTransactionYearsRange = createServerFn({
	method: "GET",
})
	.middleware([authMiddleware])
	.handler(async ({ context }: any) => {
		// dynamic import of Node-only modules so the browser bundle doesn't include them
		const { Pool } = await import("pg");
		const { drizzle } = await import("drizzle-orm/node-postgres");
		const { transactionsTable } = await import("@/db/schema");
		const dotenv = await import("dotenv");

		dotenv.config();

		const raw = process.env.DATABASE_URL!;
		const normalized = raw.startsWith("postgres://")
			? raw.replace("postgres://", "postgresql://")
			: raw;

		const pool = new Pool({ connectionString: normalized });
		const db = drizzle(pool);

		try {
			const today = new Date();
			const [earliestTransaction] = await db
				.select()
				.from(transactionsTable)
				.where(eq(transactionsTable.userId, context?.userId))
				.orderBy(asc(transactionsTable.transactionDate))
				.limit(1);

			const currentYear = today.getFullYear();
			const earliestYear = earliestTransaction
				? new Date(earliestTransaction.transactionDate).getFullYear()
				: currentYear;

			const years = Array.from({ length: currentYear - earliestYear + 1 }).map(
				(_, i) => {
					return currentYear - i;
				},
			);

			return years;
		} finally {
			await pool.end();
		}
	});
