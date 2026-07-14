// lib/repositories/hopDong.repository.ts
// Tầng Dữ liệu (DB) cho HopDong — ứng với lớp "HopDongDB"
//
// SỬA (schema v7): HopDong giờ 1:1 với HoSoNhanPhong (hoSoNhanPhongId unique) — KHÔNG còn
// kiểu "1 HopDong nhiều HoSoNhanPhong" như trước. Phòng/giường của từng phòng trong 1 hợp
// đồng nhiều phòng giờ nằm ở bảng mới `ChiTietHopDong` (nhiều dòng / 1 HopDong, mỗi dòng =
// 1 phòng). Do đó "1 hợp đồng nhiều phòng" giờ đọc qua `hopDong.chiTietHopDongs[]` thay vì
// qua nhiều `HoSoNhanPhong`.
import { prisma, type Db } from "../prisma";

export const HopDongDB = {
	/** UC1 Màn 1 (Tìm kiếm hợp đồng): tìm theo mã HĐ hoặc theo SĐT/họ tên khách hàng. */
	async timTheoTuKhoa(tuKhoa?: string, sdt?: string, hoTen?: string) {
		return prisma.hopDong.findFirst({
			where: {
				OR: [
					tuKhoa ? { maHopDong: tuKhoa } : undefined,
					sdt ? { khachHang: { soDienThoai: sdt } } : undefined,
					hoTen ? { khachHang: { hoTen: { contains: hoTen } } } : undefined,
				].filter(Boolean) as object[],
			},
			include: {
				khachHang: true,
				chiTietHopDongs: { include: { phong: true, giuong: true } },
			},
		});
	},

	/** UC1 Màn 2 (Thông tin hợp đồng): lấy chi tiết theo đúng 1 mã hợp đồng. */
	async docThongTin(maHopDong: string) {
		return prisma.hopDong.findUnique({
			where: { maHopDong },
			include: {
				khachHang: true,
				chiTietHopDongs: { include: { phong: true, giuong: true } },
			},
		});
	},

	/**
	 * UC4 Màn 2: đếm số ChiTietHopDong KHÁC (cùng hợp đồng, khác phòng đang xử lý) mà
	 * YeuCauTraPhong tương ứng CHƯA "Hoàn tất" — dùng để tránh đóng cả hợp đồng khi hợp
	 * đồng có nhiều phòng và mới chỉ 1 phòng được trả.
	 * SỬA (schema v7): trước đây đếm ở cấp HoSoNhanPhong, giờ đếm ở cấp ChiTietHopDong (đúng
	 * cấp "1 phòng trong hợp đồng" theo cấu trúc mới).
	 */
	async demPhongKhacChuaHoanTat(hopDongId: number, chiTietHopDongIdHienTai: number, db: Db = prisma): Promise<number> {
		return db.chiTietHopDong.count({
			where: {
				hopDongId,
				chiTietHopDongId: { not: chiTietHopDongIdHienTai },
				OR: [
					{ yeuCauTraPhongs: { none: {} } }, // phòng còn lại chưa từng đăng ký trả phòng -> vẫn đang ở
					{ yeuCauTraPhongs: { every: { trangThai: { not: "Hoàn tất" } } } },
				],
			},
		});
	},

	/** UC4 Màn 2 (Lập biên bản & ký thanh lý): cập nhật trạng thái HĐ -> "Đã thanh lý". */
	async capNhatTrangThai(hopDongId: number, trangThaiMoi: string, db: Db = prisma) {
		const result = await db.hopDong.update({
			where: { hopDongId },
			data: { trangThai: trangThaiMoi },
		});
		return !!result;
	},
};
