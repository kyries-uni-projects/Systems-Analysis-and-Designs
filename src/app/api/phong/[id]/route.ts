import type { NextRequest } from "next/server";
import { apiSuccess, apiError, withApiErrorHandling } from "@/lib/api-response";
import { getPhongById, updatePhong, deletePhong } from "@/lib/services/phongService";
import { parseUpdatePhongInput } from "@/types/phong";
import { requireApiSession } from "@/lib/api-auth";

interface RouteParams {
	params: Promise<{ id: string }>;
}

function parseId(idParam: string): number | null {
	const id = Number(idParam);
	return Number.isInteger(id) && id > 0 ? id : null;
}

// GET /api/phong/:id
export async function GET(request: NextRequest, { params }: RouteParams) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request);
		if ("error" in auth) return auth.error;
		const { id: idParam } = await params;
		const id = parseId(idParam);
		if (id === null) return apiError("id không hợp lệ", 400);

		const phong = await getPhongById(id);
		return apiSuccess(phong);
	});
}

// PATCH /api/phong/:id
export async function PATCH(request: NextRequest, { params }: RouteParams) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["quanly"]);
		if ("error" in auth) return auth.error;
		const { id: idParam } = await params;
		const id = parseId(idParam);
		if (id === null) return apiError("id không hợp lệ", 400);

		const body = await request.json();
		const input = parseUpdatePhongInput(body);
		const phong = await updatePhong(id, input);
		return apiSuccess(phong);
	});
}

// DELETE /api/phong/:id
export async function DELETE(request: NextRequest, { params }: RouteParams) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["quanly"]);
		if ("error" in auth) return auth.error;
		const { id: idParam } = await params;
		const id = parseId(idParam);
		if (id === null) return apiError("id không hợp lệ", 400);

		await deletePhong(id);
		return apiSuccess({ deleted: true });
	});
}
