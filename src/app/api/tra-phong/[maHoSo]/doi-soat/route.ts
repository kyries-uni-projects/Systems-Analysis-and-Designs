import type { NextRequest } from "next/server";
import { requireTraPhongRole } from "@/lib/traPhongSession";
import { parseMaHoSoOrError } from "@/lib/apiHelpers";
import { DoiSoatHoanCoc } from "@/lib/services/doiSoatHoanCoc.service";
import { HoSoTraPhong } from "@/lib/services/hoSoTraPhong.service";
import { apiSuccess, apiError, withApiErrorHandling } from "@/lib/api-response";

/**
 * POST /api/tra-phong/[maHoSo]/doi-soat — UC3 Màn 3, nút "Xác nhận đối soát" (khách đồng ý).
 * Body: { tyLeHoanCoc, dsKhauTru[] }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ maHoSo: string }> }) {
	const auth = await requireTraPhongRole(["ketoan"]);
	if ("error" in auth) return auth.error;

	return withApiErrorHandling(async () => {
		const { maHoSo } = await params;
		const parsed = parseMaHoSoOrError(maHoSo);
		if ("error" in parsed) return parsed.error;

		const body = await req.json();
		const tyLeHoanCoc = Number(body?.tyLeHoanCoc);
		const dsKhauTru = Array.isArray(body?.dsKhauTru) ? body.dsKhauTru : [];
		if (!Number.isFinite(tyLeHoanCoc) || tyLeHoanCoc < 0) {
			return apiError("tyLeHoanCoc không hợp lệ.", 400);
		}

		const hoSo = await HoSoTraPhong.layThongTin(parsed.id);
		if (!hoSo) return apiError("Không tìm thấy hồ sơ.", 404);
		if (hoSo.bienBanKiemTraId == null) {
			return apiError("Hồ sơ chưa có biên bản kiểm tra, chưa thể đối soát.", 409);
		}

		const soTienHoanCoBan = DoiSoatHoanCoc.tinhSoTienHoanTheoTyLe(hoSo.tienCocGoc, tyLeHoanCoc);

		const doiSoat = await DoiSoatHoanCoc.luu({
			yeuCauTraPhongId: parsed.id,
			bienBanKiemTraId: hoSo.bienBanKiemTraId,
			keToanId: auth.user.nguoiDungId,
			tienCocGoc: hoSo.tienCocGoc,
			tyLeHoanCoc,
			soTienHoanCoBan,
			dsKhauTru,
		});

		return apiSuccess(doiSoat, 201);
	});
}
