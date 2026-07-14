import type { NextRequest } from "next/server";
import { apiError, apiSuccess, withApiErrorHandling } from "@/lib/api-response";
import { requireApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { lapYeuCauThanhToanCoc } from "@/lib/services/hoSoDatCocService";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["ketoan"]);
		if ("error" in auth) return auth.error;
		const account = auth.user;
		const username = auth.user.username;

		const { id } = await params;
		const hoSoId = Number(id);
		if (!Number.isInteger(hoSoId) || hoSoId < 1) return apiError("ID hồ sơ không hợp lệ.", 400);

		const nguoiDung = await prisma.nguoiDung.upsert({
			where: { tenDangNhap: username },
			update: {},
			create: {
				hoTen: account.name,
				tenDangNhap: username,
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
