import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const raw = process.env.DATABASE_URL!;
const normalized = raw.startsWith("postgres://")
	? raw.replace("postgres://", "postgresql://")
	: raw;

export default defineConfig({
	out: "./drizzle",
	schema: "./db/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: normalized,
	},
});
