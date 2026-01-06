import * as dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load env vars for Prisma CLI (Migrate) explicitly.
// Next.js uses .env.local automatically, but Prisma config needs it loaded here.
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
