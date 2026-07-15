import { requireTraPhongRole } from "@/lib/traPhongSession";
import { parseMaHoSoOrError } from "@/lib/apiHelpers";
import { BienBanTraPhong } from "@/lib/services/bienBanTraPhong.service";
import { HoSoTraPhong } from "@/lib/services/hoSoTraPhong.service";
import { apiSuccess, apiError, withApiErrorHandling } from "@/lib/api-response";

/**
 * POST /api/tra-phong/[maHoSo]/hoan-tat — UC4 Màn 4, nút "Hoàn tất thủ tục trả phòng".
 * Nút này ở UI chỉ bấm được khi checkbox "đã thu hồi chìa khóa" đã tích, nên không cần
 * nhận cờ này từ body — luôn true khi route được gọi.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ maHoSo: string }> }) {
	const auth = await requireTraPhongRole(["quanly"]);
	if ("error" in auth) return auth.error;

	return withApiErrorHandling(async () => {
		const { maHoSo } = await params;
		const parsed = parseMaHoSoOrError(maHoSo);
		if ("error" in parsed) return parsed.error;

		const hoSo = await HoSoTraPhong.layThongTin(parsed.id);
		if (!hoSo) return apiError("Không tìm thấy hồ sơ.", 404);
		if (hoSo.bienBanTraPhongId == null || hoSo.phongId == null) {
			return apiError("Hồ sơ chưa có biên bản trả phòng hoặc thiếu thông tin phòng.", 409);
		}
		if (hoSo.trangThaiHoSo !== "Đã xác nhận đối soát") {
			return apiError("Hồ sơ không ở bước hoàn tất thủ tục trả phòng.", 409);
		}
		if ((hoSo.soTienHoan ?? 0) > 0 && !hoSo.daHoanCoc) {
			return apiError("Chưa thể hoàn tất vì khoản hoàn cọc chưa được chi trả.", 409);
		}

		await BienBanTraPhong.hoanTat({
			bienBanTraPhongId: hoSo.bienBanTraPhongId,
			yeuCauTraPhongId: parsed.id,
			phongId: hoSo.phongId,
			giuongId: hoSo.giuongId,
			chiTietHopDongId: hoSo.chiTietHopDongId,
			daThuHoiChiaKhoa: true,
		});

		return apiSuccess({ ok: true });
	});
}
