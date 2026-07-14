import type { NextRequest } from "next/server";
import { requireTraPhongRole } from "@/lib/traPhongSession";
import { parseMaHoSoOrError } from "@/lib/apiHelpers";
import { BienBanTraPhong } from "@/lib/services/bienBanTraPhong.service";
import { HoSoTraPhong } from "@/lib/services/hoSoTraPhong.service";
import { apiSuccess, apiError, withApiErrorHandling } from "@/lib/api-response";

/**
 * POST /api/tra-phong/[maHoSo]/thanh-ly — UC4 Màn 2, nút "Ký xác nhận & lưu" (chỉ gọi khi
 * khách ĐÃ KÝ — nhánh từ chối dùng route riêng /thanh-ly/tu-choi).
 * Body: { ngayTraPhongThucTe (ISO date), tinhTrangBanGiaoCuoi? }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ maHoSo: string }> }) {
	const auth = await requireTraPhongRole(["quanly"]);
	if ("error" in auth) return auth.error;

	return withApiErrorHandling(async () => {
		const { maHoSo } = await params;
		const parsed = parseMaHoSoOrError(maHoSo);
		if ("error" in parsed) return parsed.error;

		const body = await req.json();
		const ngayTraPhongThucTeRaw = body?.ngayTraPhongThucTe;
		if (!ngayTraPhongThucTeRaw) {
			return apiError("Thiếu ngayTraPhongThucTe.", 400);
		}
		const ngayTraPhongThucTe = new Date(ngayTraPhongThucTeRaw);
		if (Number.isNaN(ngayTraPhongThucTe.getTime())) {
			return apiError("ngayTraPhongThucTe không hợp lệ.", 400);
		}

		const hoSo = await HoSoTraPhong.layThongTin(parsed.id);
		if (!hoSo) return apiError("Không tìm thấy hồ sơ.", 404);
		if (hoSo.doiSoatId == null || hoSo.chiTietHopDongId == null || hoSo.hopDongId == null) {
			return apiError("Hồ sơ chưa đủ điều kiện lập biên bản thanh lý (thiếu đối soát hoặc chi tiết hợp đồng).", 409);
		}

		const bb = await BienBanTraPhong.luu({
			yeuCauTraPhongId: parsed.id,
			chiTietHopDongId: hoSo.chiTietHopDongId,
			hopDongId: hoSo.hopDongId,
			doiSoatId: hoSo.doiSoatId,
			quanLyId: auth.user.nguoiDungId,
			ngayTraPhongThucTe,
			tinhTrangBanGiaoCuoi:
				typeof body.tinhTrangBanGiaoCuoi === "string" && body.tinhTrangBanGiaoCuoi ? body.tinhTrangBanGiaoCuoi : undefined,
		});

		return apiSuccess(bb, 201);
	});
}
