import authMiddleware from "@/authMiddleware";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
	transactionId: z.number(),
});

export const deleteTransaction = createServerFn({
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
				.delete(transactionsTable)
				.where(
					and(
						eq(transactionsTable.id, data.transactionId),
						eq(transactionsTable.userId, context.userId),
					),
				);
		} finally {
			await pool.end();
		}
	});
