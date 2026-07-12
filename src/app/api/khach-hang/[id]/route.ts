import type { NextRequest } from "next/server";
import { apiSuccess, apiError, withApiErrorHandling } from "@/lib/api-response";
import { getKhachHangById, updateKhachHang, deleteKhachHang } from "@/lib/services/khachHangService";
import { parseUpdateKhachHangInput } from "@/types/khach-hang";

interface RouteParams {
	params: Promise<{ id: string }>;
}

function parseId(idParam: string): number | null {
	const id = Number(idParam);
	return Number.isInteger(id) && id > 0 ? id : null;
}

// GET /api/khach-hang/:id
export async function GET(_request: NextRequest, { params }: RouteParams) {
	return withApiErrorHandling(async () => {
		const { id: idParam } = await params;
		const id = parseId(idParam);
		if (id === null) return apiError("id không hợp lệ", 400);

		const khachHang = await getKhachHangById(id);
		return apiSuccess(khachHang);
	});
}

// PATCH /api/khach-hang/:id
export async function PATCH(request: NextRequest, { params }: RouteParams) {
	return withApiErrorHandling(async () => {
		const { id: idParam } = await params;
		const id = parseId(idParam);
		if (id === null) return apiError("id không hợp lệ", 400);

		const body = await request.json();
		const input = parseUpdateKhachHangInput(body);
		const khachHang = await updateKhachHang(id, input);
		return apiSuccess(khachHang);
	});
}

// DELETE /api/khach-hang/:id
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
	return withApiErrorHandling(async () => {
		const { id: idParam } = await params;
		const id = parseId(idParam);
		if (id === null) return apiError("id không hợp lệ", 400);

		await deleteKhachHang(id);
		return apiSuccess({ deleted: true });
	});
}
