import type { NextRequest } from "next/server";
import { requireTraPhongRole } from "@/lib/traPhongSession";
import { parseMaHoSoOrError } from "@/lib/apiHelpers";
import { BienBanKiemTraTraPhong } from "@/lib/services/bienBanKiemTra.service";
import { apiSuccess, apiError, withApiErrorHandling } from "@/lib/api-response";
import { HoSoTraPhong } from "@/lib/services/hoSoTraPhong.service";
import { TaiSanBanGiao } from "@/lib/services/taiSanBanGiao.service";

/**
 * POST /api/tra-phong/[maHoSo]/kiem-tra — UC2 Màn 3, nút "Xác nhận hoàn tất kiểm tra".
 * Body: { tinhTrangVeSinh?, ghiChuKiemTra?, coHuHong, dsChiTietTaiSan[], dsKhauTru[], dsNghiaVu[] }
 * `dsChiTietTaiSan`: [{ idTaiSanBanGiao, soLuongDaTra, tinhTrangKhiTra, coHuHongMatMat, chiPhiBoiThuong, ghiChu? }]
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ maHoSo: string }> }) {
	const auth = await requireTraPhongRole(["quanly"]);
	if ("error" in auth) return auth.error;

	return withApiErrorHandling(async () => {
		const { maHoSo } = await params;
		const parsed = parseMaHoSoOrError(maHoSo);
		if ("error" in parsed) return parsed.error;

		const body = await req.json();
		const hoSo = await HoSoTraPhong.layThongTin(parsed.id);
		if (!hoSo) return apiError("Không tìm thấy hồ sơ.", 404);
		if (!["Đã đăng ký, chờ ngày trả phòng", "Đang xử lý trả phòng"].includes(hoSo.trangThaiHoSo)) {
			return apiError("Hồ sơ không ở bước kiểm tra tình trạng phòng/giường.", 409);
		}
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const returnDate = new Date(hoSo.ngayTraPhong);
		returnDate.setHours(0, 0, 0, 0);
		if (today < returnDate) return apiError("Chưa đến ngày trả phòng đã đăng ký.", 409);
		if (!Array.isArray(body?.dsKhauTru) || !Array.isArray(body?.dsNghiaVu)) {
			return apiError("Thiếu dsKhauTru/dsNghiaVu.", 400);
		}
		if (!Array.isArray(body?.dsChiTietTaiSan)) {
			return apiError("Thiếu dsChiTietTaiSan.", 400);
		}
		const handedAssets = await TaiSanBanGiao.layDanhSachTheoHoSo(parsed.id);
		const inspectedById = new Map(body.dsChiTietTaiSan.map((item: { idTaiSanBanGiao?: unknown }) => [Number(item?.idTaiSanBanGiao), item]));
		if (handedAssets.some((asset) => !inspectedById.has(asset.idTaiSanBanGiao))) {
			return apiError("Vui lòng kiểm tra và ghi nhận đầy đủ tất cả tài sản đã bàn giao.", 400);
		}
		if ([...body.dsKhauTru, ...body.dsNghiaVu].some((item) => Number(item?.soTien ?? item?.soTienConNo) < 0)) {
			return apiError("Số tiền khấu trừ/nghĩa vụ không được âm.", 400);
		}

		const bb = await BienBanKiemTraTraPhong.luu({
			yeuCauTraPhongId: parsed.id,
			quanLyId: auth.user.nguoiDungId,
			tinhTrangVeSinh: typeof body.tinhTrangVeSinh === "string" ? body.tinhTrangVeSinh : undefined,
			ghiChuKiemTra: typeof body.ghiChuKiemTra === "string" ? body.ghiChuKiemTra : undefined,
			coHuHong: !!body.coHuHong,
			dsChiTietTaiSan: body.dsChiTietTaiSan,
			dsKhauTru: body.dsKhauTru,
			dsNghiaVu: body.dsNghiaVu,
		});

		return apiSuccess(bb, 201);
	});
}
