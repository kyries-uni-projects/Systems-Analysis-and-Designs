import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess, withApiErrorHandling } from "@/lib/api-response";
import { demoAccounts, SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE, SESSION_USER_COOKIE_NAME } from "@/lib/auth";
import { parseHoSoDatCocInput } from "@/lib/hoSoDatCocInput";
import { layDanhSachHoSoDatCoc, taoHoSoDatCoc } from "@/lib/services/hoSoDatCocService";

export async function GET(request: NextRequest) {
	const username = request.cookies.get(SESSION_USER_COOKIE_NAME)?.value;
	const account = username ? demoAccounts[username] : undefined;
	if (request.cookies.get(SESSION_COOKIE_NAME)?.value !== SESSION_COOKIE_VALUE || !account) {
		return NextResponse.json({ success: false, error: "Chưa xác thực." }, { status: 401 });
	}

	return NextResponse.json({ success: true, data: await layDanhSachHoSoDatCoc(account.role) });
}

export async function POST(request: NextRequest) {
	return withApiErrorHandling(async () => {
		const username = request.cookies.get(SESSION_USER_COOKIE_NAME)?.value;
		const account = username ? demoAccounts[username] : undefined;
		if (request.cookies.get(SESSION_COOKIE_NAME)?.value !== SESSION_COOKIE_VALUE || !account || !username) {
			return apiError("Chưa xác thực.", 401);
		}
		if (account.role !== "nhanvien" && account.role !== "admin") {
			return apiError("Tài khoản không có quyền lập hồ sơ đặt cọc.", 403);
		}

		const hoSo = await taoHoSoDatCoc(parseHoSoDatCocInput(await request.json()), {
			username,
			name: account.name,
			role: account.role,
		});
		return apiSuccess(hoSo, 201);
	});
}
