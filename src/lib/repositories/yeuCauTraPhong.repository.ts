// lib/repositories/yeuCauTraPhong.repository.ts
// Tầng Dữ liệu (DB) cho YeuCauTraPhong — ứng với lớp "YeuCauTraPhongDB"
//
// SỬA (schema v7): 2 khóa loại trừ nhau đổi tên — trước là hoSoNhanPhongId/hoSoDatCocId,
// giờ là chiTietHopDongId (1 phòng cụ thể trong hợp đồng đã ký) / chiTietDatCocId (1 phòng
// cụ thể trong hồ sơ đặt cọc, dùng cho case "hoàn 80% — chưa ký hợp đồng").
import { prisma, type Db } from "../prisma";

// Chuỗi include dùng chung cho docThongTin()/layDanhSach() — là nguồn duy nhất, KHÔNG lặp
// lại ở hoSoTraPhong.repository.ts nữa.
export const yeuCauTraPhongIncludeChain = {
	chiTietHopDong: {
		include: {
			phong: true,
			giuong: true,
			hopDong: { include: { khachHang: true } },
		},
	},
	// Nhánh "hoàn 80%" — hồ sơ trả phòng tạo trực tiếp từ ChiTietDatCoc (chưa ký hợp đồng).
	// UC1 hiện tại (chỉ tìm theo HopDong) chưa có đường tạo hồ sơ dạng này, nhưng include ở
	// đây để tầng BUS đọc ĐÚNG nếu có bản ghi loại này.
	chiTietDatCoc: {
		include: {
			phong: true,
			giuong: true,
			hoSoDatCoc: { include: { khachHang: true } },
		},
	},
	bienBanKiemTraTraPhong: { include: { doiSoatHoanCoc: { include: { giaoDichHoanCoc: true } } } },
	bienBanTraPhong: true,
} as const;

export const YeuCauTraPhongDB = {
	/**
	 * UC1 Màn 3: tạo hồ sơ trả phòng mới.
	 * SỬA: đúng 1 trong 2 khóa `chiTietHopDongId`/`chiTietDatCocId` — validate ở tầng BUS.
	 */
	async them(
		data: {
			chiTietHopDongId?: number;
			chiTietDatCocId?: number;
			nhanVienId: number;
			ngayTraPhongDuKien: Date;
			gioTraPhong?: string;
			lyDoTraPhong?: string;
			coHetHanTheoLich: string;
			trangThai: string;
		},
		db: Db = prisma,
	) {
		return db.yeuCauTraPhong.create({ data });
	},

	/** Dùng ở nhiều màn (UC2 M1/M2, UC3 M1/M2, UC4 M1, UC4 M3, UC4 M5...) để hiển thị lại thông tin. */
	async docThongTin(yeuCauTraPhongId: number, db: Db = prisma) {
		return db.yeuCauTraPhong.findUnique({
			where: { yeuCauTraPhongId },
			include: yeuCauTraPhongIncludeChain,
		});
	},

	/** Toàn bộ danh sách — dùng cho màn "Danh sách hồ sơ trả phòng". */
	async layDanhSach(db: Db = prisma) {
		return db.yeuCauTraPhong.findMany({
			include: yeuCauTraPhongIncludeChain,
			orderBy: { ngayTao: "desc" },
		});
	},

	/** Dùng ở UC2 M3, UC3 M3, UC4 M2 nhánh từ chối, UC4 M4. */
	async capNhatTrangThai(yeuCauTraPhongId: number, trangThaiMoi: string, db: Db = prisma) {
		const result = await db.yeuCauTraPhong.update({
			where: { yeuCauTraPhongId },
			data: { trangThai: trangThaiMoi },
		});
		return !!result;
	},
};
