import authMiddleware from "@/authMiddleware";
import { createServerFn } from "@tanstack/react-start";
import { addDays } from "date-fns";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
	id: z.number(),
	categoryId: z.coerce.number().positive("Please select a category"),
	transactionDate: z.string().refine((value) => {
		const parsedDate = new Date(value);
		return !isNaN(parsedDate.getTime()) && parsedDate <= addDays(new Date(), 1);
	}),
	amount: z.coerce.number().positive("Amount must be greater than 0"),
	description: z
		.string()
		.min(3, "Description must contain at least 3 characters")
		.max(300, "Description must contain a maximum of 300 characters"),
});

export const updateTransaction = createServerFn({
	method: "POST",
})
	.middleware([authMiddleware])
	.validator((data: z.infer<typeof schema>) => schema.parse(data))
	.handler(async ({ context, data }: any) => {
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
			await db
				.update(transactionsTable)
				.set({
					amount: data.amount.toString(),
					categoryId: data.categoryId,
					transactionDate: data.transactionDate,
					description: data.description,
				})
				.where(
					and(
						eq(transactionsTable.id, data.id),
						eq(transactionsTable.userId, context.userId),
					),
				);
		} finally {
			await pool.end();
		}
	});
