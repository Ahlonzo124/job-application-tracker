import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const username = "admin";
  const password = "admin12345"; // WRITE THIS DOWN – NO RECOVERY

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { username },
    update: {},
    create: { username, password: hashed },
  });

  const result = await prisma.application.updateMany({
    where: { userId: null },
    data: { userId: user.id },
  });

  console.log("✅ Admin user:", user.username);
  console.log("🆔 User ID:", user.id);
  console.log("📦 Applications claimed:", result.count);
  console.log("⚠️  Credentials:", username, "/", password);
  console.log("⚠️  There is NO password recovery. Save this.");
}

main()
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
