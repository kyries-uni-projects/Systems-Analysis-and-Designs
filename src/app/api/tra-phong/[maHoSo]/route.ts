import { requireTraPhongRole } from "@/lib/traPhongSession";
import { parseMaHoSoOrError } from "@/lib/apiHelpers";
import { HoSoTraPhong } from "@/lib/services/hoSoTraPhong.service";
import { apiSuccess, apiError, withApiErrorHandling } from "@/lib/api-response";

/** GET /api/tra-phong/[maHoSo] — dùng ở hầu hết màn "tự fetch theo khóa" của UC2-UC5. */
export async function GET(_req: Request, { params }: { params: Promise<{ maHoSo: string }> }) {
	const auth = await requireTraPhongRole(["nhanvien", "quanly", "ketoan"]);
	if ("error" in auth) return auth.error;

	return withApiErrorHandling(async () => {
		const { maHoSo } = await params;
		const parsed = parseMaHoSoOrError(maHoSo);
		if ("error" in parsed) return parsed.error;

		const hoSo = await HoSoTraPhong.layThongTin(parsed.id);
		if (!hoSo) return apiError("Không tìm thấy hồ sơ.", 404);
		return apiSuccess(hoSo);
	});
}
