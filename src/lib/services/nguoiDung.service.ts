import { Prisma } from "@prisma/client";
import type { Role } from "@/lib/auth";
import { ApiValidationError } from "@/lib/api-response";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { databaseRoleByRole, roleFromDatabase } from "@/lib/user-role";
import type { UserManagementInput } from "@/lib/user-management-input";

const userSelect = {
	nguoiDungId: true,
	hoTen: true,
	tenDangNhap: true,
	email: true,
	soDienThoai: true,
	chiNhan: true,
	vaiTro: true,
	trangThai: true,
	ngayTao: true,
} as const;

function normalizeUser<T extends { vaiTro: string }>(user: T) {
	return { ...user, role: roleFromDatabase(user.vaiTro) };
}

async function ensureNotLastActiveAdmin(userId: number, nextRole?: Role, nextStatus?: string) {
	const user = await prisma.nguoiDung.findUnique({ where: { nguoiDungId: userId }, select: { vaiTro: true, trangThai: true } });
	if (!user || roleFromDatabase(user.vaiTro) !== "admin" || user.trangThai !== "Hoạt động") return;
	if ((nextRole === undefined || nextRole === "admin") && (nextStatus === undefined || nextStatus === "Hoạt động")) return;
	const activeAdmins = await prisma.nguoiDung.count({ where: { trangThai: "Hoạt động", vaiTro: { in: ["Admin", "admin", "Quản trị hệ thống"] } } });
	if (activeAdmins <= 1) throw new ApiValidationError("Hệ thống phải còn ít nhất một tài khoản Quản trị đang hoạt động.");
}

export async function layDanhSachNguoiDung() {
	const users = await prisma.nguoiDung.findMany({
		where: { trangThai: { not: "Đã xóa" } },
		select: userSelect,
		orderBy: { ngayTao: "asc" },
	});
	return users.map(normalizeUser);
}

export async function taoNguoiDung(input: UserManagementInput) {
	try {
		const user = await prisma.nguoiDung.create({
			data: {
				hoTen: input.hoTen,
				tenDangNhap: input.tenDangNhap,
				matKhauHash: await hashPassword(input.matKhau!),
				email: input.email,
				soDienThoai: input.soDienThoai,
				chiNhan: input.chiNhan,
				vaiTro: databaseRoleByRole[input.vaiTro],
				trangThai: input.trangThai,
			},
			select: userSelect,
		});
		return normalizeUser(user);
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
			throw new ApiValidationError("Tên đăng nhập đã được sử dụng. Vui lòng chọn tên khác.");
		}
		throw error;
	}
}

export async function capNhatNguoiDung(userId: number, input: UserManagementInput, currentUserId: number) {
	const existing = await prisma.nguoiDung.findUnique({ where: { nguoiDungId: userId } });
	if (!existing || existing.trangThai === "Đã xóa") return null;
	if (input.tenDangNhap !== existing.tenDangNhap) throw new ApiValidationError("Tên đăng nhập không thể thay đổi.");
	if (userId === currentUserId && (input.vaiTro !== "admin" || input.trangThai !== "Hoạt động")) {
		throw new ApiValidationError("Không thể tự hạ quyền hoặc ngừng tài khoản đang đăng nhập.");
	}
	await ensureNotLastActiveAdmin(userId, input.vaiTro, input.trangThai);
	const shouldInvalidate = Boolean(input.matKhau) || existing.trangThai !== input.trangThai;

	const user = await prisma.nguoiDung.update({
		where: { nguoiDungId: userId },
		data: {
			hoTen: input.hoTen,
			email: input.email,
			soDienThoai: input.soDienThoai ?? null,
			chiNhan: input.chiNhan ?? null,
			vaiTro: databaseRoleByRole[input.vaiTro],
			trangThai: input.trangThai,
			...(input.matKhau ? { matKhauHash: await hashPassword(input.matKhau) } : {}),
			...(shouldInvalidate ? { phienBanXacThuc: { increment: 1 } } : {}),
		},
		select: userSelect,
	});
	return normalizeUser(user);
}

export async function doiTrangThaiNguoiDung(userId: number, active: boolean, currentUserId: number) {
	const existing = await prisma.nguoiDung.findUnique({ where: { nguoiDungId: userId } });
	if (!existing || existing.trangThai === "Đã xóa") return null;
	if (userId === currentUserId && !active) throw new ApiValidationError("Không thể ngừng tài khoản đang đăng nhập.");
	const status = active ? "Hoạt động" : "Ngừng hoạt động";
	await ensureNotLastActiveAdmin(userId, undefined, status);
	if (existing.trangThai === status) {
		const current = await prisma.nguoiDung.findUniqueOrThrow({ where: { nguoiDungId: userId }, select: userSelect });
		return normalizeUser(current);
	}
	const user = await prisma.nguoiDung.update({
		where: { nguoiDungId: userId },
		data: { trangThai: status, phienBanXacThuc: { increment: 1 } },
		select: userSelect,
	});
	return normalizeUser(user);
}

export async function xoaNguoiDung(userId: number, currentUserId: number) {
	const existing = await prisma.nguoiDung.findUnique({ where: { nguoiDungId: userId } });
	if (!existing || existing.trangThai === "Đã xóa") return null;
	if (userId === currentUserId) throw new ApiValidationError("Không thể xóa tài khoản đang đăng nhập.");
	await ensureNotLastActiveAdmin(userId, undefined, "Đã xóa");
	await prisma.nguoiDung.update({
		where: { nguoiDungId: userId },
		data: { trangThai: "Đã xóa", phienBanXacThuc: { increment: 1 } },
	});
	return { nguoiDungId: userId };
}
