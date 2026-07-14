import type { NextRequest } from "next/server";
import { apiError, apiSuccess, ApiValidationError, withApiErrorHandling } from "@/lib/api-response";
import { requireApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { xacNhanThanhToanCoc } from "@/lib/services/hoSoDatCocService";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["quanly"]);
		if ("error" in auth) return auth.error;
		const account = auth.user;
		const username = auth.user.username;

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
