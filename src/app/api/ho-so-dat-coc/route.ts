import { NextRequest, NextResponse } from "next/server";
import { demoAccounts, SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE, SESSION_USER_COOKIE_NAME } from "@/lib/auth";
import { layDanhSachHoSoDatCoc } from "@/lib/services/hoSoDatCocService";

export async function GET(request: NextRequest) {
	const username = request.cookies.get(SESSION_USER_COOKIE_NAME)?.value;
	const account = username ? demoAccounts[username] : undefined;
	if (request.cookies.get(SESSION_COOKIE_NAME)?.value !== SESSION_COOKIE_VALUE || !account) {
		return NextResponse.json({ success: false, error: "Chưa xác thực." }, { status: 401 });
	}

	return NextResponse.json({ success: true, data: await layDanhSachHoSoDatCoc(account.role) });
}
