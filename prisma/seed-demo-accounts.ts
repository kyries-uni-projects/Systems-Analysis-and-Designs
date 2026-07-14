import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { ensureDemoAccounts } from "../src/lib/demo-account-seed";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

ensureDemoAccounts(prisma)
	.then(() => console.log("Đã đồng bộ 4 tài khoản demo: admin, nhanvien01, quanly01, ketoan01."))
	.finally(async () => prisma.$disconnect());
