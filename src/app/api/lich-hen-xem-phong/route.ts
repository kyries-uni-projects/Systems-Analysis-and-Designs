import type { NextRequest } from "next/server";
import { apiSuccess, ApiValidationError, withApiErrorHandling } from "@/lib/api-response";
import { demoAccounts, SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE, SESSION_USER_COOKIE_NAME } from "@/lib/auth";
import { taoLichHen, layDanhSachYeuCauChuaLapLich } from "@/lib/services/lichHenXemPhongService";
import { parseCreateLichHenInput } from "@/types/lich-hen-xem-phong";

/** GET — Lấy danh sách yêu cầu thuê có thể lập lịch */
export async function GET(request: NextRequest) {
	return withApiErrorHandling(async () => {
		if (request.cookies.get(SESSION_COOKIE_NAME)?.value !== SESSION_COOKIE_VALUE) {
			throw new ApiValidationError("Vui lòng đăng nhập");
		}

		const data = await layDanhSachYeuCauChuaLapLich();
		return apiSuccess(data);
	});
}

/** POST — Tạo lịch hẹn mới (theo Sequence Diagram) */
export async function POST(request: NextRequest) {
	return withApiErrorHandling(async () => {
		if (request.cookies.get(SESSION_COOKIE_NAME)?.value !== SESSION_COOKIE_VALUE) {
			throw new ApiValidationError("Vui lòng đăng nhập để tạo lịch hẹn");
		}

		const username = request.cookies.get(SESSION_USER_COOKIE_NAME)?.value;
		const account = username ? demoAccounts[username] : undefined;
		if (!account || (account.role !== "nhanvien" && account.role !== "admin")) {
			throw new ApiValidationError("Tài khoản hiện tại không có quyền tạo lịch hẹn xem phòng");
		}

		const input = parseCreateLichHenInput(await request.json());
		const result = await taoLichHen(input, { username: username!, name: account.name, role: account.role });
		return apiSuccess(result, 201);
	});
}
