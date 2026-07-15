import type { NextRequest } from "next/server";
import { apiError, apiSuccess, withApiErrorHandling } from "@/lib/api-response";
import { requireApiSession } from "@/lib/api-auth";
import { huyYeuCauDatCoc } from "@/lib/services/hoSoDatCocService";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["nhanvien"]);
		if ("error" in auth) return auth.error;
		const { id } = await params;
		const hoSoId = Number(id);
		if (!Number.isInteger(hoSoId) || hoSoId < 1) return apiError("ID hồ sơ không hợp lệ.", 400);
		const body: unknown = await request.json().catch(() => ({}));
		const reason = typeof body === "object" && body !== null && "lyDo" in body && typeof body.lyDo === "string" ? body.lyDo : undefined;
		const result = await huyYeuCauDatCoc(hoSoId, reason);
		if (!result) return apiError("Không tìm thấy hồ sơ đặt cọc.", 404);
		return apiSuccess(result);
	});
}
