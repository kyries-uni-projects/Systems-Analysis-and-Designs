import type { NextRequest } from "next/server";
import { apiError, apiSuccess, withApiErrorHandling } from "@/lib/api-response";
import { requireApiSession } from "@/lib/api-auth";
import { updateGiuong } from "@/lib/services/phongService";
import { parseUpdateGiuongInput } from "@/types/phong";

interface RouteParams {
	params: Promise<{ id: string; giuongId: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["admin"]);
		if ("error" in auth) return auth.error;
		const routeParams = await params;
		const phongId = Number(routeParams.id);
		const giuongId = Number(routeParams.giuongId);
		if (!Number.isInteger(phongId) || phongId <= 0 || !Number.isInteger(giuongId) || giuongId <= 0) {
			return apiError("id phòng hoặc giường không hợp lệ", 400);
		}

		const body = await request.json();
		const input = parseUpdateGiuongInput(body);
		const xacNhanDangThue = typeof body === "object" && body !== null && (body as Record<string, unknown>).xacNhanDangThue === true;
		return apiSuccess(await updateGiuong(phongId, giuongId, input, { xacNhanDangThue }));
	});
}
