import { NextRequest, NextResponse } from "next/server";
import { isValidDemoLogin, SESSION_COOKIE_NAME, SESSION_USER_COOKIE_NAME } from "@/lib/auth";
import { createSessionToken } from "@/lib/session";

export async function POST(request: NextRequest) {
	const body: unknown = await request.json().catch(() => null);
	const username = typeof body === "object" && body !== null && "username" in body ? body.username : null;
	const password = typeof body === "object" && body !== null && "password" in body ? body.password : null;

	if (typeof username !== "string" || typeof password !== "string" || !isValidDemoLogin(username.trim(), password)) {
		return NextResponse.json({ error: "Tên đăng nhập hoặc mật khẩu không chính xác." }, { status: 401 });
	}

	const normalizedUsername = username.trim();
	const response = NextResponse.json({ ok: true });
	response.cookies.set({
		name: SESSION_COOKIE_NAME,
		value: await createSessionToken(normalizedUsername),
		httpOnly: true,
		maxAge: 60 * 60 * 8,
		path: "/",
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
	});
	response.cookies.delete(SESSION_USER_COOKIE_NAME);

	return response;
}
