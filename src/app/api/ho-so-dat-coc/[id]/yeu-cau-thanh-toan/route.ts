import type { NextRequest } from "next/server";
import { apiError, apiSuccess, withApiErrorHandling } from "@/lib/api-response";
import { demoAccounts, SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE, SESSION_USER_COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lapYeuCauThanhToanCoc } from "@/lib/services/hoSoDatCocService";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withApiErrorHandling(async () => {
		const username = request.cookies.get(SESSION_USER_COOKIE_NAME)?.value;
		const account = username ? demoAccounts[username] : undefined;
		if (request.cookies.get(SESSION_COOKIE_NAME)?.value !== SESSION_COOKIE_VALUE || !account) return apiError("Chưa xác thực.", 401);
		if (account.role !== "ketoan" && account.role !== "admin") return apiError("Tài khoản không có quyền lập yêu cầu thanh toán.", 403);

		const { id } = await params;
		const hoSoId = Number(id);
		if (!Number.isInteger(hoSoId) || hoSoId < 1) return apiError("ID hồ sơ không hợp lệ.", 400);

		const nguoiDung = await prisma.nguoiDung.upsert({
			where: { tenDangNhap: username! },
			update: {},
			create: {
				hoTen: account.name,
				tenDangNhap: username!,
				matKhauHash: "demo-session-account",
				vaiTro: account.role,
			},
			select: { nguoiDungId: true },
		});

		const yeuCau = await lapYeuCauThanhToanCoc(hoSoId, nguoiDung.nguoiDungId);
		if (!yeuCau) return apiError("Không tìm thấy hồ sơ đặt cọc.", 404);
		return apiSuccess(yeuCau);
	});
}
