import type { PrismaClient } from "@prisma/client";
import { demoAccounts, type Role } from "@/lib/auth";

const databaseRoleByRole: Record<Role, string> = {
	admin: "Admin",
	nhanvien: "Sale",
	quanly: "QuanLy",
	ketoan: "KeToan",
};

/** Upsert only the four preset demo users. Existing operational data is left untouched. */
export async function ensureDemoAccounts(prisma: PrismaClient) {
	const upsert = (username: keyof typeof demoAccounts) => {
		const account = demoAccounts[username];
		const data = {
			hoTen: account.name,
			tenDangNhap: username,
			vaiTro: databaseRoleByRole[account.role],
		};
		return prisma.nguoiDung.upsert({
			where: { tenDangNhap: username },
			update: data,
			create: { ...data, matKhauHash: "demo-login-verified-by-signed-session" },
		});
	};

	const [admin, nhanvien01, quanly01, ketoan01] = await Promise.all([
		upsert("admin"),
		upsert("nhanvien01"),
		upsert("quanly01"),
		upsert("ketoan01"),
	]);
	return { admin, nhanvien01, quanly01, ketoan01 };
}
