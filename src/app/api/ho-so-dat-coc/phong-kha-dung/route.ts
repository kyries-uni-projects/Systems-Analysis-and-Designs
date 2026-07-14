import type { NextRequest } from "next/server";
import { apiError, apiSuccess, withApiErrorHandling } from "@/lib/api-response";
import { demoAccounts, SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE, SESSION_USER_COOKIE_NAME } from "@/lib/auth";
import { layDanhSachPhongGiuongKhaDung } from "@/lib/services/hoSoDatCocService";

export async function GET(request: NextRequest) {
	return withApiErrorHandling(async () => {
		const username = request.cookies.get(SESSION_USER_COOKIE_NAME)?.value;
		const account = username ? demoAccounts[username] : undefined;
		if (request.cookies.get(SESSION_COOKIE_NAME)?.value !== SESSION_COOKIE_VALUE || !account) {
			return apiError("Chưa xác thực.", 401);
		}
		if (account.role !== "nhanvien" && account.role !== "admin") {
			return apiError("Tài khoản không có quyền xác định yêu cầu đặt cọc.", 403);
		}

		return apiSuccess(await layDanhSachPhongGiuongKhaDung());
	});
}
