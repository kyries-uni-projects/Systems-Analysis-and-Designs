import type { NextRequest } from "next/server";
import { apiSuccess, ApiValidationError, withApiErrorHandling } from "@/lib/api-response";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE } from "@/lib/auth";
import { getYeuCauThueWithDetails, timPhongPhuHop } from "@/lib/services/lichHenXemPhongService";

/** GET — Lấy chi tiết yêu cầu thuê + KH + phòng phù hợp */
export async function GET(request: NextRequest, { params }: { params: Promise<{ yeuCauId: string }> }) {
	return withApiErrorHandling(async () => {
		if (request.cookies.get(SESSION_COOKIE_NAME)?.value !== SESSION_COOKIE_VALUE) {
			throw new ApiValidationError("Vui lòng đăng nhập");
		}

		const { yeuCauId } = await params;
		const id = Number(yeuCauId);
		if (!Number.isInteger(id) || id <= 0) {
			throw new ApiValidationError("Mã yêu cầu thuê không hợp lệ");
		}

		const yeuCau = await getYeuCauThueWithDetails(id);
		const phongPhuHop = await timPhongPhuHop(id);

		return apiSuccess({
			yeuCau: {
				yeuCauId: yeuCau.yeuCauId,
				loaiThue: yeuCau.loaiThue,
				khuVucMongMuon: yeuCau.khuVucMongMuon,
				soNguoiDuKien: yeuCau.soNguoiDuKien,
				trangThai: yeuCau.trangThai,
				ngayTao: yeuCau.ngayTao,
			},
			khachHang: {
				khachHangId: yeuCau.khachHang.khachHangId,
				hoTen: yeuCau.khachHang.hoTen,
				soDienThoai: yeuCau.khachHang.soDienThoai,
				email: yeuCau.khachHang.email,
				cccdPassport: yeuCau.khachHang.cccdPassport,
			},
			phongPhuHop,
			lichHenHienTai: yeuCau.lichHenXemPhongs.map((lh) => ({
				lichHenId: lh.lichHenId,
				phong: lh.phong.maPhong,
				ngayXem: lh.ngayXem,
				gioBatDau: lh.gioBatDau,
				gioKetThuc: lh.gioKetThuc,
				trangThai: lh.trangThai,
			})),
		});
	});
}
