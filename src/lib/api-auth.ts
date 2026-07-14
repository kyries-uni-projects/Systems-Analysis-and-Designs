import type { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { SESSION_COOKIE_NAME, type Role } from "@/lib/auth";
import { verifySessionToken, type AuthenticatedSession } from "@/lib/session";

export async function getRequestSession(request: NextRequest) {
	return verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
}

export async function requireApiSession(
	request: NextRequest,
	roles?: Role[],
): Promise<{ user: AuthenticatedSession } | { error: NextResponse }> {
	const user = await getRequestSession(request);
	if (!user) return { error: apiError("Chưa đăng nhập hoặc phiên đăng nhập không hợp lệ.", 401) };
	if (roles && user.role !== "admin" && !roles.includes(user.role)) {
		return { error: apiError("Tài khoản không có quyền thực hiện thao tác này.", 403) };
	}
	return { user };
}

export function canReadDepositAtStatus(role: Role, status: string) {
	if (role === "admin" || role === "nhanvien") return true;
	if (role === "quanly") {
		return ["Chờ xác nhận quản lý", "Chờ xác nhận thanh toán", "Đã xác nhận thanh toán"].includes(status);
	}
	return ["Đã xác nhận điều kiện", "Chờ thanh toán"].includes(status);
}
