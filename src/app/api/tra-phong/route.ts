import type { NextRequest } from "next/server";
import { requireTraPhongRole } from "@/lib/traPhongSession";
import { HoSoTraPhong } from "@/lib/services/hoSoTraPhong.service";
import { HopDong } from "@/lib/services/hopDong.service";
import { YeuCauTraPhong } from "@/lib/services/yeuCauTraPhong.service";
import { formatMaHoSo } from "@/lib/maHoSo";
import { apiSuccess, apiError, withApiErrorHandling } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

/** GET /api/tra-phong — màn "Danh sách hồ sơ trả phòng" (hub), mọi vai trò liên quan xem được. */
export async function GET() {
	const auth = await requireTraPhongRole(["nhanvien", "quanly", "ketoan"]);
	if ("error" in auth) return auth.error;

	return withApiErrorHandling(async () => {
		const list = await HoSoTraPhong.layDanhSach();
		return apiSuccess(list);
	});
}

/**
 * POST /api/tra-phong — UC1 Màn 3 (Ghi nhận thời gian trả phòng), tạo hồ sơ mới.
 * Body: { maHopDong, ngayTraPhongDuKien (ISO date), gioTraPhong?, lyDoTraPhong? }
 */
export async function POST(req: NextRequest) {
	const auth = await requireTraPhongRole(["nhanvien"]);
	if ("error" in auth) return auth.error;

	return withApiErrorHandling(async () => {
		const body = await req.json();
		const maHopDong = typeof body?.maHopDong === "string" ? body.maHopDong.trim() : "";
		const ngayTraPhongDuKienRaw = body?.ngayTraPhongDuKien;
		const gioTraPhong = typeof body?.gioTraPhong === "string" && body.gioTraPhong ? body.gioTraPhong : undefined;
		const lyDoTraPhong = typeof body?.lyDoTraPhong === "string" && body.lyDoTraPhong ? body.lyDoTraPhong : undefined;

		if (!maHopDong || !ngayTraPhongDuKienRaw) {
			return apiError("Thiếu maHopDong hoặc ngayTraPhongDuKien.", 400);
		}
		const ngayTraPhongDuKien = new Date(ngayTraPhongDuKienRaw);
		if (Number.isNaN(ngayTraPhongDuKien.getTime())) {
			return apiError("ngayTraPhongDuKien không hợp lệ.", 400);
		}
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		if (ngayTraPhongDuKien < today) {
			return apiError("Ngày trả phòng dự kiến không được ở trong quá khứ.", 400);
		}

		const hopDong = await HopDong.layThongTin(maHopDong);
		if (!hopDong) {
			return apiError("Không tìm thấy hợp đồng.", 404);
		}
		if (hopDong.chiTietHopDongId == null) {
			return apiError("Hợp đồng chưa có phòng nào được gán, không thể đăng ký trả phòng.", 409);
		}
		const activeRequest = await prisma.yeuCauTraPhong.findFirst({
			where: { chiTietHopDongId: hopDong.chiTietHopDongId, trangThai: { notIn: ["Hoàn tất"] } },
			select: { yeuCauTraPhongId: true },
		});
		if (activeRequest) {
			return apiError("Phòng/giường này đã có một hồ sơ trả phòng đang được xử lý.", 409);
		}

		const { hopLe } = HopDong.kiemTraDieuKienTraPhong(hopDong.trangThai);
		if (!hopLe) {
			return apiError(`Hợp đồng đang ở trạng thái "${hopDong.trangThai}", không thể đăng ký trả phòng.`, 409);
		}

		const created = await YeuCauTraPhong.taoMoi({
			chiTietHopDongId: hopDong.chiTietHopDongId,
			hopDong: { trangThai: hopDong.trangThai },
			ngayTraPhongDuKien,
			gioTraPhong,
			lyDoTraPhong,
			nhanVienId: auth.user.nguoiDungId,
		});

		const hoSo = await HoSoTraPhong.layThongTin(created.yeuCauTraPhongId);
		return apiSuccess({ hoSo, maHoSo: formatMaHoSo(created.yeuCauTraPhongId) }, 201);
	});
}
