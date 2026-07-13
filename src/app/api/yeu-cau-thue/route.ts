import type { NextRequest } from "next/server";
import { apiSuccess, ApiValidationError, withApiErrorHandling } from "@/lib/api-response";
import { demoAccounts, SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE, SESSION_USER_COOKIE_NAME } from "@/lib/auth";
import { createYeuCauThue } from "@/lib/services/yeuCauThueService";
import { parseCreateYeuCauThueInput } from "@/types/yeu-cau-thue";

export async function POST(request: NextRequest) {
	return withApiErrorHandling(async () => {
		if (request.cookies.get(SESSION_COOKIE_NAME)?.value !== SESSION_COOKIE_VALUE) {
			throw new ApiValidationError("Vui lòng đăng nhập để ghi nhận yêu cầu thuê phòng");
		}

		const username = request.cookies.get(SESSION_USER_COOKIE_NAME)?.value;
		const account = username ? demoAccounts[username] : undefined;
		if (!account || (account.role !== "nhanvien" && account.role !== "admin")) {
			throw new ApiValidationError("Tài khoản hiện tại không có quyền ghi nhận yêu cầu thuê phòng");
		}

		const input = parseCreateYeuCauThueInput(await request.json());
		const result = await createYeuCauThue(input, { username: username!, name: account.name, role: account.role });
		return apiSuccess(result, 201);
	});
}
