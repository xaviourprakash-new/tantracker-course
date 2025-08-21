import authMiddleware from "@/authMiddleware";
import { createServerFn } from "@tanstack/react-start";
import { addDays } from "date-fns";
import { z } from "zod";

const transactionSchema = z.object({
	categoryId: z.coerce.number().positive("Please select a category"),
	transactionDate: z
		.string()
		.transform((value) => new Date(value))
		.refine((date) => {
			return !isNaN(date.getTime()) && date <= addDays(new Date(), 1);
		}, "Transaction date cannot be in the future"),
	amount: z.coerce.number().positive("Amount must be greater than 0"),
	description: z
		.string()
		.min(3, "Description must contain at least 3 characters")
		.max(300, "Description must contain a maximum of 300 characters"),
});

export const createTransaction = createServerFn({
	method: "POST",
})
	.middleware([authMiddleware])
	.validator((data: z.infer<typeof transactionSchema>) =>
		transactionSchema.parse(data),
	)
	.handler(async ({ data, context }: any) => {
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
			const userId = context?.userId;
			const transaction = await db
				.insert(transactionsTable)
				.values({
					userId,
					amount: data.amount.toString(),
					description: data.description,
					categoryId: data.categoryId,
					transactionDate: data.transactionDate, // Now properly formatted as Date
				})
				.returning();

			return transaction;
		} finally {
			await pool.end();
		}
	});
