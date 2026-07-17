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
		// SỬA: trước đây không kiểm tra gì thêm — cho phép ghi nhận "đã trả phòng" vào 1 ngày
		// còn chưa tới, vô lý về nghiệp vụ. Đây là ngày ghi nhận việc ĐÃ xảy ra nên phải chặn
		// NGƯỢC với UC1 (không cho ở tương lai, thay vì không cho ở quá khứ).
		const endOfToday = new Date();
		endOfToday.setHours(23, 59, 59, 999);
		if (ngayTraPhongThucTe > endOfToday) {
			return apiError("Ngày trả phòng thực tế không được ở trong tương lai.", 400);
		}

		const hoSo = await HoSoTraPhong.layThongTin(parsed.id);
		if (!hoSo) return apiError("Không tìm thấy hồ sơ.", 404);
		if (hoSo.trangThaiHoSo !== "Đã xác nhận đối soát" || hoSo.bienBanTraPhongId != null) {
			return apiError("Hồ sơ không ở bước lập biên bản trả phòng và thanh lý.", 409);
		}
		if ((hoSo.soTienHoan ?? 0) < 0 && body?.daThanhToanPhatSinh !== true) {
			return apiError("Khách hàng chưa được xác nhận đã thanh toán đủ khoản phát sinh.", 409);
		}
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
