import type { NextRequest } from "next/server";
import { apiSuccess, ApiValidationError, withApiErrorHandling } from "@/lib/api-response";
import { listLoaiPhong, createLoaiPhong } from "@/lib/services/loaiPhongService";
import { requireApiSession } from "@/lib/api-auth";

// GET /api/loai-phong — small lookup table, used to populate the Phong form dropdown
export async function GET(request: NextRequest) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request);
		if ("error" in auth) return auth.error;
		const loaiPhongs = await listLoaiPhong();
		return apiSuccess(loaiPhongs);
	});
}

// POST /api/loai-phong
export async function POST(request: NextRequest) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["quanly"]);
		if ("error" in auth) return auth.error;
		const body = await request.json();
		if (typeof body !== "object" || body === null) {
			throw new ApiValidationError("Request body phải là object");
		}
		const { tenLoaiPhong, donGia } = body as Record<string, unknown>;

		if (typeof tenLoaiPhong !== "string" || tenLoaiPhong.trim().length === 0) {
			throw new ApiValidationError("tenLoaiPhong là bắt buộc");
		}
		const donGiaNum = Number(donGia);
		if (!Number.isFinite(donGiaNum) || donGiaNum < 0) {
			throw new ApiValidationError("donGia là bắt buộc và phải là số hợp lệ");
		}

		const loaiPhong = await createLoaiPhong({ tenLoaiPhong: tenLoaiPhong.trim(), donGia: donGiaNum });
		return apiSuccess(loaiPhong, 201);
	});
}
