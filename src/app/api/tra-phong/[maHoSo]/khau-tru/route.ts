import { requireTraPhongRole } from "@/lib/traPhongSession";
import { parseMaHoSoOrError } from "@/lib/apiHelpers";
import { HoSoTraPhong } from "@/lib/services/hoSoTraPhong.service";
import { BienBanKiemTraTraPhong } from "@/lib/services/bienBanKiemTra.service";
import { apiSuccess, withApiErrorHandling } from "@/lib/api-response";

/**
 * GET /api/tra-phong/[maHoSo]/khau-tru — UC3 Màn 2 (Khấu trừ phát sinh): đọc lại danh sách
 * khoản khấu trừ Quản lý đã ghi nhận khi kiểm tra ở UC2, để Kế toán thấy ngay thay vì phải
 * tự gõ lại (lỗi đã sửa — trước đây UC3 không có route này nên màn luôn trống).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ maHoSo: string }> }) {
	const auth = await requireTraPhongRole(["ketoan"]);
	if ("error" in auth) return auth.error;

	return withApiErrorHandling(async () => {
		const { maHoSo } = await params;
		const parsed = parseMaHoSoOrError(maHoSo);
		if ("error" in parsed) return parsed.error;

		const hoSo = await HoSoTraPhong.layThongTin(parsed.id);
		if (!hoSo || hoSo.bienBanKiemTraId == null) {
			return apiSuccess([]);
		}

		const inspection = await BienBanKiemTraTraPhong.layThongTin(hoSo.bienBanKiemTraId);
		const list = inspection?.khoanKhauTrus ?? [];
		const obligations = inspection?.nghiaVuConLais ?? [];
		return apiSuccess(
			[
			...list.map((kt: { sttKhauTru: number; loaiKhoanKhauTru: string; moTa: string | null; soTien: number }) => ({
				sttKhauTru: kt.sttKhauTru,
				loaiKhoanKhauTru: kt.loaiKhoanKhauTru,
				moTa: kt.moTa,
				soTien: kt.soTien,
			})),
			...obligations.map((item: { sttNghiaVu: number; loaiNghiaVu: string; ghiChu: string | null; soTienConNo: number }) => ({
				sttKhauTru: `NV-${item.sttNghiaVu}`,
				loaiKhoanKhauTru: item.loaiNghiaVu,
				moTa: item.ghiChu,
				soTien: item.soTienConNo,
			})),
			],
		);
	});
}
