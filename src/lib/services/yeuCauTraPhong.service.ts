// lib/services/yeuCauTraPhong.service.ts
// Tầng Nghiệp vụ (BUS) cho YeuCauTraPhong — ứng với lớp "YeuCauTraPhong"
import { prisma, type Db } from "../prisma";
import { YeuCauTraPhongDB } from "../repositories/yeuCauTraPhong.repository";
import type { HopDongInfo } from "./hopDong.service";

export const YeuCauTraPhong = {
	/**
	 * UC1 Màn 3 (Ghi nhận thời gian trả phòng): tạo hồ sơ trả phòng mới.
	 * SỬA (schema v7): nhận `chiTietHopDongId?`/`chiTietDatCocId?` (đổi tên từ
	 * hoSoNhanPhongId/hoSoDatCocId). Validate: phải truyền ĐÚNG 1 trong 2.
	 *
	 * Lưu ý: UI hiện tại (UC1 Màn 1) chỉ tìm kiếm trong bảng HopDong nên luôn truyền
	 * `chiTietHopDongId` — nhánh `chiTietDatCocId` chưa có màn hình nào gọi tới.
	 */
	async taoMoi(
		params: {
			chiTietHopDongId?: number;
			chiTietDatCocId?: number;
			hopDong?: Pick<HopDongInfo, "trangThai">; // chỉ có khi tạo theo nhánh chiTietHopDongId
			ngayTraPhongDuKien: Date;
			gioTraPhong?: string;
			lyDoTraPhong?: string;
			nhanVienId: number;
		},
		db: Db = prisma,
	) {
		const coDatChiTietHopDong = params.chiTietHopDongId != null;
		const coDatChiTietDatCoc = params.chiTietDatCocId != null;
		if (coDatChiTietHopDong === coDatChiTietDatCoc) {
			throw new Error(
				"YeuCauTraPhong.taoMoi: phải truyền đúng 1 trong 2 khóa chiTietHopDongId/chiTietDatCocId (không được cả hai hoặc thiếu cả hai).",
			);
		}

		// Nhánh "đã hết hạn theo lịch" (A4) chỉ áp dụng khi có hợp đồng thật; nhánh
		// chiTietDatCocId (chưa ký HĐ) không có khái niệm này — Kế toán tự chọn tỷ lệ hoàn
		// cọc 80% thủ công ở UC3 Màn 1.
		const coHetHan = params.hopDong?.trangThai === "Đã hết hạn";

		return YeuCauTraPhongDB.them(
			{
				chiTietHopDongId: params.chiTietHopDongId,
				chiTietDatCocId: params.chiTietDatCocId,
				nhanVienId: params.nhanVienId,
				ngayTraPhongDuKien: params.ngayTraPhongDuKien,
				gioTraPhong: params.gioTraPhong,
				lyDoTraPhong: params.lyDoTraPhong,
				coHetHanTheoLich: coHetHan ? "Có" : "Không",
				trangThai: "Đã đăng ký, chờ ngày trả phòng",
			},
			db,
		);
	},

	/** Cập nhật trạng thái hồ sơ — dùng lại ở UC2/UC3/UC4. */
	async capNhatTrangThai(yeuCauTraPhongId: number, trangThaiMoi: string, db: Db = prisma): Promise<boolean> {
		return YeuCauTraPhongDB.capNhatTrangThai(yeuCauTraPhongId, trangThaiMoi, db);
	},

	/**
	 * UC1 Màn 3: kiểm tra phòng/giường đã có hồ sơ trả phòng khác đang xử lý chưa.
	 * Trả về `{ yeuCauTraPhongId }` nếu có, `null` nếu không — dùng để chặn tạo trùng hồ sơ.
	 * SỬA: route trước đây tự gọi thẳng Prisma, nay đi qua đúng tầng BUS → DB.
	 */
	async timHoSoDangXuLyTheoPhong(chiTietHopDongId: number, db: Db = prisma) {
		return YeuCauTraPhongDB.timHoSoDangXuLyTheoPhong(chiTietHopDongId, db);
	},
};
