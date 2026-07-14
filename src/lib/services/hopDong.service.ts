// lib/services/hopDong.service.ts
// Tầng Nghiệp vụ (BUS) cho HopDong — ứng với lớp "HopDong"
import { prisma, type Db } from "../prisma";
import { HopDongDB } from "../repositories/hopDong.repository";

export type HopDongInfo = {
	hopDongId: number; // khóa thật của cả hợp đồng — cần cho HopDong.capNhatTrangThaiNeuHetPhong()
	maHopDong: string;
	chiTietHopDongId: number | null; // khóa thật cần truyền cho YeuCauTraPhong.taoMoi() — null nếu HĐ chưa có phòng nào (hiếm/lỗi dữ liệu)
	khachHang: string;
	phongGiuong: string;
	ngayBatDau: Date;
	ngayKetThuc: Date;
	trangThai: string;
	tienCocGoc: number;
};

function toHopDongInfo(hd: NonNullable<Awaited<ReturnType<typeof HopDongDB.timTheoTuKhoa>>>): HopDongInfo {
	// 1 hợp đồng có thể có nhiều ChiTietHopDong (nhiều phòng) — với UC Trả phòng, ta hiển
	// thị + trả về khóa của dòng ĐẦU TIÊN. Nếu app thật cho trả phòng riêng từng phòng
	// trong 1 HĐ nhiều phòng, tầng GUI cần màn chọn phòng trước khi gọi hàm này (schema
	// hiện không tự phân biệt được "trả phòng nào" chỉ từ mã hợp đồng khi HĐ có >1 phòng).
	const cthd = hd.chiTietHopDongs[0];
	const phongGiuong = cthd?.phong ? `${cthd.phong.maPhong}${cthd.giuong ? " - " + cthd.giuong.maGiuongLocal : ""}` : "—";

	return {
		hopDongId: hd.hopDongId,
		maHopDong: hd.maHopDong,
		chiTietHopDongId: cthd?.chiTietHopDongId ?? null,
		khachHang: hd.khachHang.hoTen,
		phongGiuong,
		ngayBatDau: cthd?.ngayBatDau ?? hd.ngayKy ?? new Date(),
		ngayKetThuc: cthd?.ngayKetThuc ?? new Date(),
		trangThai: hd.trangThai,
		tienCocGoc: hd.tienCocGoc,
	};
}

export const HopDong = {
	/** UC1 Màn 1: B2. Tìm hợp đồng theo từ khóa/SĐT/họ tên. Trả null nếu không thấy (-> A2). */
	async timKiem(tuKhoa?: string, sdt?: string, hoTen?: string): Promise<HopDongInfo | null> {
		const hd = await HopDongDB.timTheoTuKhoa(tuKhoa, sdt, hoTen);
		return hd ? toHopDongInfo(hd) : null;
	},

	/** UC1 Màn 2: hiển thị lại chi tiết hợp đồng theo mã (màn tự fetch, không nhận object từ màn trước). */
	async layThongTin(maHopDong: string): Promise<HopDongInfo | null> {
		const hd = await HopDongDB.docThongTin(maHopDong);
		return hd ? toHopDongInfo(hd) : null;
	},

	/**
	 * Kiểm tra điều kiện được phép trả phòng: trạng thái phải "Đang cho thuê" hoặc "Đã hết hạn".
	 * Trả thêm coHetHan để UC1 Màn 3 (TaoMoi) dùng cho luồng phụ A4.
	 */
	kiemTraDieuKienTraPhong(trangThai: string): { hopLe: boolean; coHetHan: boolean } {
		const hopLe = trangThai === "Đang cho thuê" || trangThai === "Đã hết hạn";
		const coHetHan = trangThai === "Đã hết hạn";
		return { hopLe, coHetHan };
	},

	/** UC4 Màn 2 (nhánh khách đã ký): cập nhật trạng thái HĐ -> "Đã thanh lý". */
	async capNhatTrangThai(hopDongId: number, trangThaiMoi: string, db: Db = prisma): Promise<boolean> {
		return HopDongDB.capNhatTrangThai(hopDongId, trangThaiMoi, db);
	},

	/**
	 * UC4 Màn 2: chỉ đóng HĐ ("Đã thanh lý") nếu KHÔNG còn phòng nào khác (ChiTietHopDong
	 * khác) trong cùng hợp đồng đang chờ/đang thuê — tránh lỗi "1 hợp đồng nhiều phòng, trả
	 * 1 phòng mà đóng cả HĐ". Nếu còn phòng khác chưa xong, HopDong giữ nguyên trạng thái.
	 */
	async capNhatTrangThaiNeuHetPhong(hopDongId: number, chiTietHopDongIdHienTai: number, db: Db = prisma): Promise<boolean> {
		const conPhongKhac = await HopDongDB.demPhongKhacChuaHoanTat(hopDongId, chiTietHopDongIdHienTai, db);
		if (conPhongKhac > 0) return false; // chưa đóng HĐ, còn phòng khác đang hoạt động
		return HopDongDB.capNhatTrangThai(hopDongId, "Đã thanh lý", db);
	},
};
