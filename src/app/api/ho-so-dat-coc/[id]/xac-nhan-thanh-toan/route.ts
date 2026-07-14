import type { NextRequest } from "next/server";
import { apiError, apiSuccess, ApiValidationError, withApiErrorHandling } from "@/lib/api-response";
import { demoAccounts, SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE, SESSION_USER_COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { xacNhanThanhToanCoc } from "@/lib/services/hoSoDatCocService";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withApiErrorHandling(async () => {
		const username = request.cookies.get(SESSION_USER_COOKIE_NAME)?.value;
		const account = username ? demoAccounts[username] : undefined;
		if (request.cookies.get(SESSION_COOKIE_NAME)?.value !== SESSION_COOKIE_VALUE || !account || !username) {
			return apiError("Chưa xác thực.", 401);
		}
		if (account.role !== "quanly" && account.role !== "admin") {
			return apiError("Tài khoản không có quyền xác nhận thanh toán cọc.", 403);
		}

		const { id } = await params;
		const hoSoId = Number(id);
		if (!Number.isInteger(hoSoId) || hoSoId < 1) return apiError("ID hồ sơ không hợp lệ.", 400);
		const body = (await request.json()) as Record<string, unknown>;
		if (typeof body.xacNhan !== "boolean") throw new ApiValidationError("Quyết định xác nhận không hợp lệ.");
		const lyDoTuChoi = typeof body.lyDoTuChoi === "string" ? body.lyDoTuChoi.trim() : undefined;

		const quanLy = await prisma.nguoiDung.upsert({
			where: { tenDangNhap: username },
			update: {},
			create: { hoTen: account.name, tenDangNhap: username, matKhauHash: "demo-session-account", vaiTro: account.role },
			select: { nguoiDungId: true },
		});
		const result = await xacNhanThanhToanCoc(hoSoId, quanLy.nguoiDungId, body.xacNhan, lyDoTuChoi);
		if (!result) return apiError("Không tìm thấy hồ sơ đặt cọc.", 404);
		return apiSuccess(result);
	});
}
