import type { NextRequest } from "next/server";
import { apiError, apiSuccess, withApiErrorHandling } from "@/lib/api-response";
import { requireApiSession } from "@/lib/api-auth";
import { parseHoSoDatCocInput } from "@/lib/hoSoDatCocInput";
import { capNhatThongTinHoSoDatCoc } from "@/lib/services/hoSoDatCocService";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["nhanvien"]);
		if ("error" in auth) return auth.error;

		const { id } = await params;
		const hoSoId = Number(id);
		if (!Number.isInteger(hoSoId) || hoSoId < 1) {
			return apiError("ID hồ sơ không hợp lệ.", 400);
		}

		const hoSo = await capNhatThongTinHoSoDatCoc(hoSoId, parseHoSoDatCocInput(await request.json()));
		if (!hoSo) return apiError("Không tìm thấy hồ sơ đặt cọc.", 404);

		return apiSuccess(hoSo);
	});
}
