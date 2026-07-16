import type { NextRequest } from "next/server";
import { apiError, apiSuccess, withApiErrorHandling } from "@/lib/api-response";
import { requireApiSession } from "@/lib/api-auth";
import { createGiuong } from "@/lib/services/phongService";
import { parseCreateGiuongInput } from "@/types/phong";

interface RouteParams {
	params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["admin"]);
		if ("error" in auth) return auth.error;
		const { id: idParam } = await params;
		const phongId = Number(idParam);
		if (!Number.isInteger(phongId) || phongId <= 0) return apiError("id phòng không hợp lệ", 400);

		const input = parseCreateGiuongInput(await request.json());
		return apiSuccess(await createGiuong(phongId, input), 201);
	});
}
