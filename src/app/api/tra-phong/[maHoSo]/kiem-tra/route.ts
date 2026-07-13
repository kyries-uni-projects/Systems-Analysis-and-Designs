import type { NextRequest } from "next/server";
import { requireTraPhongRole } from "@/lib/traPhongSession";
import { parseMaHoSoOrError } from "@/lib/apiHelpers";
import { BienBanKiemTraTraPhong } from "@/lib/services/bienBanKiemTra.service";
import { apiSuccess, apiError, withApiErrorHandling } from "@/lib/api-response";

/**
 * POST /api/tra-phong/[maHoSo]/kiem-tra — UC2 Màn 3, nút "Xác nhận hoàn tất kiểm tra".
 * Body: { tinhTrangVeSinh?, ghiChuKiemTra?, coHuHong, dsKhauTru[], dsNghiaVu[] }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ maHoSo: string }> }) {
	const auth = await requireTraPhongRole(["quanly"]);
	if ("error" in auth) return auth.error;

	return withApiErrorHandling(async () => {
		const { maHoSo } = await params;
		const parsed = parseMaHoSoOrError(maHoSo);
		if ("error" in parsed) return parsed.error;

		const body = await req.json();
		if (!Array.isArray(body?.dsKhauTru) || !Array.isArray(body?.dsNghiaVu)) {
			return apiError("Thiếu dsKhauTru/dsNghiaVu.", 400);
		}

		const bb = await BienBanKiemTraTraPhong.luu({
			yeuCauTraPhongId: parsed.id,
			quanLyId: auth.user.nguoiDungId,
			tinhTrangVeSinh: typeof body.tinhTrangVeSinh === "string" ? body.tinhTrangVeSinh : undefined,
			ghiChuKiemTra: typeof body.ghiChuKiemTra === "string" ? body.ghiChuKiemTra : undefined,
			coHuHong: !!body.coHuHong,
			dsKhauTru: body.dsKhauTru,
			dsNghiaVu: body.dsNghiaVu,
		});

		return apiSuccess(bb, 201);
	});
}
