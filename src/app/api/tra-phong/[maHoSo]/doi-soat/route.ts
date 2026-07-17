import type { NextRequest } from "next/server";
import { requireTraPhongRole } from "@/lib/traPhongSession";
import { parseMaHoSoOrError } from "@/lib/apiHelpers";
import { DoiSoatHoanCoc } from "@/lib/services/doiSoatHoanCoc.service";
import { HoSoTraPhong } from "@/lib/services/hoSoTraPhong.service";
import { apiSuccess, apiError, withApiErrorHandling } from "@/lib/api-response";
import { BienBanKiemTraTraPhong } from "@/lib/services/bienBanKiemTra.service";

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
		const dsKhauTru: Array<{ loaiKhoanKhauTru: string; moTa?: string; soTien: number }> = Array.isArray(body?.dsKhauTru) ? body.dsKhauTru : [];
		if (!Number.isFinite(tyLeHoanCoc) || ![50, 70, 80, 100].includes(tyLeHoanCoc)) {
			return apiError("tyLeHoanCoc không hợp lệ.", 400);
		}
		if (dsKhauTru.some((item) => !item || typeof item.loaiKhoanKhauTru !== "string" || !Number.isFinite(Number(item.soTien)) || Number(item.soTien) < 0)) {
			return apiError("Danh sách khấu trừ không hợp lệ.", 400);
		}

		const hoSo = await HoSoTraPhong.layThongTin(parsed.id);
		if (!hoSo) return apiError("Không tìm thấy hồ sơ.", 404);
		if (hoSo.trangThaiHoSo !== "Đã kiểm tra, chờ đối soát cọc") {
			return apiError("Hồ sơ không ở bước đối soát hoàn cọc.", 409);
		}
		if (hoSo.bienBanKiemTraId == null) {
			return apiError("Hồ sơ chưa có biên bản kiểm tra, chưa thể đối soát.", 409);
		}
		const inspection = await BienBanKiemTraTraPhong.layThongTin(hoSo.bienBanKiemTraId);
		const mandatoryTotal = (inspection?.khoanKhauTrus ?? []).reduce((sum, item) => sum + item.soTien, 0)
			+ (inspection?.nghiaVuConLais ?? []).reduce((sum, item) => sum + item.soTienConNo, 0);
		const submittedTotal = dsKhauTru.reduce((sum, item) => sum + Number(item.soTien), 0);
		if (submittedTotal < mandatoryTotal) {
			return apiError("Danh sách đối soát chưa bao gồm đầy đủ khấu trừ và nghĩa vụ còn nợ từ biên bản kiểm tra.", 400);
		}
		// SỬA: trước đây chỉ dựa vào trạng thái HopDong TẠI THỜI ĐIỂM đối soát — bỏ qua
		// coHetHanTheoLich đã được chốt và lưu lại từ lúc đăng ký trả phòng (UC1, nhánh A4).
		// Giờ coi hợp đồng là "đã hết hạn" nếu HOẶC trạng thái hiện tại là vậy, HOẶC cờ đã
		// chốt trước đó là "Có" — tránh bị lệch nếu trạng thái hợp đồng thay đổi giữa 2 mốc.
		const coiLaHetHan = hoSo.trangThaiHopDong === "Đã hết hạn" || hoSo.coHetHanTheoLich === "Có";
		const expectedRate = hoSo.laHoSoDatCocChuaKyHD
			? 80
			: DoiSoatHoanCoc.deXuatTyLeHoanCoc(coiLaHetHan ? "Đã hết hạn" : hoSo.trangThaiHopDong, Math.max(0, (hoSo.ngayTraPhong.getFullYear() - hoSo.ngayBatDauLuuTru.getFullYear()) * 12 + hoSo.ngayTraPhong.getMonth() - hoSo.ngayBatDauLuuTru.getMonth()));
		if (tyLeHoanCoc !== expectedRate) return apiError(`Tỷ lệ hoàn cọc đúng cho hồ sơ này là ${expectedRate}%.`, 400);

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
