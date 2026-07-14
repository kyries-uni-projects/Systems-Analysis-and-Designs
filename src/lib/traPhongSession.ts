// src/lib/traPhongSession.ts
// (Nhóm 4) Cầu nối giữa hệ đăng nhập chung của cả app (src/lib/auth.ts — cookie chỉ lưu tên
// đăng nhập, không có ID) và nhu cầu riêng của Nhóm 4: các bảng ghi dữ liệu trả phòng
// (BienBanKiemTraTraPhong.quanLyId, DoiSoatHoanCoc.keToanId, YeuCauTraPhong.nhanVienId...)
// bắt buộc phải có `nguoiDungId` THẬT (khóa ngoại tới bảng NguoiDung), không thể chỉ ghi
// tên đăng nhập.
//
// KHÔNG đụng vào src/lib/auth.ts hay cơ chế cookie hiện có — chỉ đọc lại đúng 2 cookie đó,
// rồi tự tra thêm 1 lần vào bảng NguoiDung theo tenDangNhap để lấy nguoiDungId. Bảng
// NguoiDung cần có sẵn 4 dòng ứng với 4 tài khoản demo (prisma/seed.ts của Nhóm 4 tạo sẵn).
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { Role } from "@/lib/auth";
import { getSessionFromCookieStore } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";

export type TraPhongSessionUser = {
	nguoiDungId: number;
	tenDangNhap: string;
	hoTen: string;
	vaiTro: Role;
};

/** Đọc phiên đăng nhập hiện tại — null nếu chưa đăng nhập hoặc tài khoản không hợp lệ. */
export async function getTraPhongSession(): Promise<TraPhongSessionUser | null> {
	const store = await cookies();
	const account = await getSessionFromCookieStore(store);
	if (!account) return null;
	const username = account.username;

	const nguoiDung = await prisma.nguoiDung.findUnique({ where: { tenDangNhap: username } });
	if (!nguoiDung) return null; // tài khoản demo tồn tại nhưng chưa có dòng NguoiDung tương ứng — chưa seed

	return { nguoiDungId: nguoiDung.nguoiDungId, tenDangNhap: username, hoTen: account.name, vaiTro: account.role };
}

/**
 * Dùng ở đầu mỗi route handler cần bảo vệ theo vai trò. admin luôn được phép.
 * Trả `{ user }` nếu hợp lệ, hoặc `{ error: NextResponse }` — route chỉ cần
 * `const auth = await requireTraPhongRole([...]); if ("error" in auth) return auth.error;`
 */
export async function requireTraPhongRole(roles: Role[]): Promise<{ user: TraPhongSessionUser } | { error: NextResponse }> {
	const user = await getTraPhongSession();
	if (!user) {
		return { error: apiError("Chưa đăng nhập hoặc tài khoản không hợp lệ.", 401) };
	}
	if (user.vaiTro === "admin") return { user };
	if (!roles.includes(user.vaiTro)) {
		return { error: apiError(`Tài khoản vai trò "${user.vaiTro}" không có quyền thực hiện thao tác này.`, 403) };
	}
	return { user };
}
