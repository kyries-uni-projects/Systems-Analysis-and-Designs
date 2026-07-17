import type { NextRequest } from "next/server";
import { requireTraPhongRole } from "@/lib/traPhongSession";
import { parseMaHoSoOrError } from "@/lib/apiHelpers";
import { GiaoDichHoanCoc } from "@/lib/services/giaoDichHoanCoc.service";
import { HoSoTraPhong } from "@/lib/services/hoSoTraPhong.service";
import { apiSuccess, apiError, withApiErrorHandling } from "@/lib/api-response";

/**
 * POST /api/tra-phong/[maHoSo]/hoan-coc — UC5 Màn 1, nút "Ghi nhận giao dịch hoàn cọc".
 * Body: { phuongThucHoan: "Tiền mặt" | "Chuyển khoản", soTaiKhoanNhan?, thoiDiemThucHien?, duongDanChungTu? }
 * `soTienHoan` KHÔNG nhận từ client — server tự lấy từ kết quả đối soát đã lưu.
 * SỬA: trước đây `thoiDiemThucHien` luôn lấy `new Date()` phía server, bỏ qua giá trị Kế toán
 * đã nhập trên form — giờ ưu tiên dùng giá trị client gửi lên nếu hợp lệ.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ maHoSo: string }> }) {
	const auth = await requireTraPhongRole(["ketoan"]);
	if ("error" in auth) return auth.error;

	return withApiErrorHandling(async () => {
		const { maHoSo } = await params;
		const parsed = parseMaHoSoOrError(maHoSo);
		if ("error" in parsed) return parsed.error;

		const body = await req.json();
		const phuongThucHoan = body?.phuongThucHoan;
		if (phuongThucHoan !== "Tiền mặt" && phuongThucHoan !== "Chuyển khoản") {
			return apiError("phuongThucHoan không hợp lệ.", 400);
		}
		if (phuongThucHoan === "Chuyển khoản" && (typeof body.soTaiKhoanNhan !== "string" || !body.soTaiKhoanNhan.trim())) {
			return apiError("Vui lòng nhập số tài khoản nhận khi hoàn cọc bằng chuyển khoản.", 400);
		}
		let thoiDiemThucHien = new Date();
		if (typeof body.thoiDiemThucHien === "string" && body.thoiDiemThucHien) {
			const parsedDate = new Date(body.thoiDiemThucHien);
			if (!Number.isNaN(parsedDate.getTime())) thoiDiemThucHien = parsedDate;
		}
		// SỬA: trước đây không kiểm tra gì thêm — cho phép ghi nhận giao dịch đã "thực hiện"
		// vào 1 thời điểm còn chưa tới, vô lý về nghiệp vụ (giống UC4, chặn NGƯỢC với UC1).
		if (thoiDiemThucHien > new Date()) {
			return apiError("Thời điểm thực hiện không được ở trong tương lai.", 400);
		}

		const hoSo = await HoSoTraPhong.layThongTin(parsed.id);
		if (!hoSo) return apiError("Không tìm thấy hồ sơ.", 404);
		if (hoSo.doiSoatId == null) {
			return apiError("Hồ sơ chưa có kết quả đối soát.", 409);
		}
		if (hoSo.trangThaiHoSo !== "Đã xác nhận đối soát" || hoSo.bienBanTraPhongId == null) {
			return apiError("Chỉ được hoàn cọc sau khi biên bản trả phòng và thanh lý đã được ký.", 409);
		}
		if (!hoSo.soTienHoan || hoSo.soTienHoan <= 0) {
			return apiError("Hồ sơ không có số dư cần hoàn cọc.", 409);
		}
		if (hoSo.daHoanCoc) {
			return apiError("Hồ sơ đã được hoàn cọc trước đó.", 409);
		}

		const giaoDich = await GiaoDichHoanCoc.luu({
			doiSoatId: hoSo.doiSoatId,
			keToanId: auth.user.nguoiDungId,
			soTienHoan: hoSo.soTienHoan,
			phuongThucHoan,
			soTaiKhoanNhan: typeof body.soTaiKhoanNhan === "string" && body.soTaiKhoanNhan ? body.soTaiKhoanNhan : undefined,
			duongDanChungTu: typeof body.duongDanChungTu === "string" && body.duongDanChungTu ? body.duongDanChungTu : undefined,
			thoiDiemThucHien,
		});

		return apiSuccess(giaoDich, 201);
	});
}
