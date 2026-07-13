import { NextRequest, NextResponse } from "next/server";
import { demoAccounts, roleLabels, SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE, SESSION_USER_COOKIE_NAME } from "@/lib/auth";

export function GET(request: NextRequest) {
	if (request.cookies.get(SESSION_COOKIE_NAME)?.value !== SESSION_COOKIE_VALUE) {
		return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
	}

	const username = request.cookies.get(SESSION_USER_COOKIE_NAME)?.value;
	const account = username ? demoAccounts[username] : undefined;
	if (!account) {
		return NextResponse.json({ error: "Phiên đăng nhập không hợp lệ." }, { status: 401 });
	}

	return NextResponse.json({ name: account.name, role: account.role, roleLabel: roleLabels[account.role] });
}
