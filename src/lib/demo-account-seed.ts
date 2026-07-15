import type { PrismaClient } from "@prisma/client";
import { demoAccounts } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { databaseRoleByRole } from "@/lib/user-role";

/** Upsert only the four preset demo users. Existing operational data is left untouched. */
export async function ensureDemoAccounts(prisma: PrismaClient) {
	const upsert = async (username: keyof typeof demoAccounts) => {
		const account = demoAccounts[username];
		const data = {
			hoTen: account.name,
			tenDangNhap: username,
			vaiTro: databaseRoleByRole[account.role],
		};
		return prisma.nguoiDung.upsert({
			where: { tenDangNhap: username },
			update: data,
			create: { ...data, matKhauHash: await hashPassword(account.password), trangThai: "Hoạt động" },
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
