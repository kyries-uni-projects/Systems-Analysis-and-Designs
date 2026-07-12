import type { NextRequest } from "next/server";
import { apiSuccess, ApiValidationError, withApiErrorHandling } from "@/lib/api-response";
import { listLoaiPhong, createLoaiPhong } from "@/lib/services/loaiPhongService";

// GET /api/loai-phong — small lookup table, used to populate the Phong form dropdown
export async function GET() {
	return withApiErrorHandling(async () => {
		const loaiPhongs = await listLoaiPhong();
		return apiSuccess(loaiPhongs);
	});
}

// POST /api/loai-phong
export async function POST(request: NextRequest) {
	return withApiErrorHandling(async () => {
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
