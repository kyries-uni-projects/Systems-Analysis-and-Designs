import type { NextRequest } from "next/server";
import { apiError, apiSuccess, withApiErrorHandling } from "@/lib/api-response";
import { requireApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { lapYeuCauThanhToanCoc, traHoSoChoSaleCapNhat } from "@/lib/services/hoSoDatCocService";

async function parseHoSoId(params: Promise<{ id: string }>) {
	const { id } = await params;
	const hoSoId = Number(id);
	return Number.isInteger(hoSoId) && hoSoId > 0 ? hoSoId : null;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["ketoan"]);
		if ("error" in auth) return auth.error;
		const account = auth.user;
		const username = auth.user.username;

		const hoSoId = await parseHoSoId(params);
		if (!hoSoId) return apiError("ID hồ sơ không hợp lệ.", 400);

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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["ketoan"]);
		if ("error" in auth) return auth.error;

		const hoSoId = await parseHoSoId(params);
		if (!hoSoId) return apiError("ID hồ sơ không hợp lệ.", 400);

		const body = await request.json().catch(() => ({}));
		const lyDoCanCapNhat = typeof body.lyDoCanCapNhat === "string" ? body.lyDoCanCapNhat : "";
		const result = await traHoSoChoSaleCapNhat(hoSoId, lyDoCanCapNhat);
		if (!result) return apiError("Không tìm thấy hồ sơ đặt cọc.", 404);

		return apiSuccess(result);
	});
}
