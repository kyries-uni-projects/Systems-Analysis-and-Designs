import { NextRequest, NextResponse } from "next/server";
import { demoAccounts, isValidDemoLogin, SESSION_COOKIE_NAME, SESSION_USER_COOKIE_NAME } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createSessionToken } from "@/lib/session";
import { databaseRoleByRole, isActiveUserStatus, roleFromDatabase } from "@/lib/user-role";

export async function POST(request: NextRequest) {
	const body: unknown = await request.json().catch(() => null);
	const username = typeof body === "object" && body !== null && "username" in body ? body.username : null;
	const password = typeof body === "object" && body !== null && "password" in body ? body.password : null;

	if (typeof username !== "string" || typeof password !== "string") {
		return NextResponse.json({ error: "Tên đăng nhập hoặc mật khẩu không chính xác." }, { status: 401 });
	}

	const normalizedUsername = username.trim().toLowerCase();
	let account = await prisma.nguoiDung.findUnique({ where: { tenDangNhap: normalizedUsername } });
	const validLegacyDemo = isValidDemoLogin(normalizedUsername, password);
	if (!account && validLegacyDemo) {
		const demo = demoAccounts[normalizedUsername];
		account = await prisma.nguoiDung.create({
			data: {
				hoTen: demo.name,
				tenDangNhap: normalizedUsername,
				matKhauHash: await hashPassword(password),
				vaiTro: databaseRoleByRole[demo.role],
				trangThai: "Hoạt động",
			},
		});
	}
	if (!account) return NextResponse.json({ error: "Tên đăng nhập hoặc mật khẩu không chính xác." }, { status: 401 });

	let passwordMatches = await verifyPassword(password, account.matKhauHash);
	if (!passwordMatches && validLegacyDemo && !account.matKhauHash.startsWith("pbkdf2$")) {
		account = await prisma.nguoiDung.update({ where: { nguoiDungId: account.nguoiDungId }, data: { matKhauHash: await hashPassword(password) } });
		passwordMatches = true;
	}
	if (!passwordMatches) return NextResponse.json({ error: "Tên đăng nhập hoặc mật khẩu không chính xác." }, { status: 401 });
	if (!isActiveUserStatus(account.trangThai)) return NextResponse.json({ error: "Tài khoản đã ngừng hoạt động. Vui lòng liên hệ quản trị viên." }, { status: 403 });
	const role = roleFromDatabase(account.vaiTro);
	if (!role) return NextResponse.json({ error: "Tài khoản chưa được gán vai trò hợp lệ." }, { status: 403 });

	const response = NextResponse.json({ ok: true });
	response.cookies.set({
		name: SESSION_COOKIE_NAME,
		value: await createSessionToken({ username: account.tenDangNhap, name: account.hoTen, role, userId: account.nguoiDungId, sessionVersion: account.phienBanXacThuc }),
		httpOnly: true,
		maxAge: 60 * 60 * 8,
		path: "/",
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
	});
	response.cookies.delete(SESSION_USER_COOKIE_NAME);

	return response;
}
