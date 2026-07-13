import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

const adapter = new PrismaBetterSqlite3({
	url: process.env.DATABASE_URL ?? "file:./dev.db",
});

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		adapter,
		log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
	});

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
}

/**
 * (Nhóm 4) Kiểu dùng chung cho các hàm ở tầng DB (repositories/): nhận client "prisma"
 * bình thường hoặc "tx" (transaction client) được Prisma truyền vào callback của
 * `prisma.$transaction(async (tx) => {...})`, để nhiều lệnh ghi cùng nằm chung 1
 * transaction thật (rollback được khi có lỗi giữa chừng).
 */
export type Db = Prisma.TransactionClient | typeof prisma;
