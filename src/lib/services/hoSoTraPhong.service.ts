// lib/services/hoSoTraPhong.service.ts
// Tầng Nghiệp vụ (BUS) cho lớp tổng hợp "HoSoTraPhong" — dùng ở màn "Danh sách hồ sơ trả
// phòng" và làm nguồn LayThongTin() dùng chung cho phần lớn các màn "tự fetch theo khóa"
// trong UC2/UC3/UC4/UC5.
import { HoSoTraPhongDB } from "../repositories/hoSoTraPhong.repository";
import { formatMaHoSo, formatMaBienBanKiemTra } from "../maHoSo";

export type TrangThaiHoSo =
	| "Đã đăng ký, chờ ngày trả phòng"
	| "Đang xử lý trả phòng"
	| "Đã kiểm tra, chờ đối soát cọc"
	| "Đã xác nhận đối soát"
	| "Hoàn tất"
	| "Chờ giải quyết tranh chấp";

export type HoSoTraPhongInfo = {
	yeuCauTraPhongId: number;
	maHoSo: string; // định dạng hiển thị, xem lib/maHoSo.ts
	hopDongId: number | null; // khóa thật — cần cho HopDong.capNhatTrangThaiNeuHetPhong()
	chiTietHopDongId: number | null; // khóa thật — cần cho BienBanTraPhong.luu()
	soHopDong: string;
	khachHang: string;
	phongGiuong: string;
	phongId: number | null; // khóa thật — cần cho PhongGiuong.capNhatTrangThai() ở UC4 M4
	giuongId: number | null; // khóa thật — null nếu khách thuê nguyên phòng (không theo giường)
	tienCocGoc: number; // SỬA (schema v7): giờ lấy từ phần cọc phân bổ RIÊNG cho phòng này
	// (chiTietHopDong.tienCocPhanBo / chiTietDatCoc.tienCocPhanBo) thay vì tổng tiền cọc cả
	// hợp đồng — chính xác hơn cho hợp đồng nhiều phòng.
	ngayBatDauLuuTru: Date;
	ngayTraPhong: Date;
	trangThaiHopDong: string;
	trangThaiHoSo: TrangThaiHoSo;
	bienBanKiemTraId: number | null;
	maBienBanKiemTra: string | null;
	tongKhauTruKiemTra: number | null;
	doiSoatId: number | null;
	tyLeHoanCoc: number | null;
	soTienHoan: number | null;
	bienBanTraPhongId: number | null;
	daHoanCoc: boolean; // suy ra từ sự TỒN TẠI của GiaoDichHoanCoc, không phải field riêng
	// true khi hồ sơ này KHÔNG đi qua HopDong/ChiTietHopDong mà tạo trực tiếp từ
	// ChiTietDatCoc (case "hoàn 80%" — đặt cọc nhưng chưa ký hợp đồng).
	laHoSoDatCocChuaKyHD: boolean;
};

type RawHoSo = NonNullable<Awaited<ReturnType<typeof HoSoTraPhongDB.layThongTin>>>;

function map(hs: RawHoSo): HoSoTraPhongInfo {
	// Nhánh chính: hồ sơ đi qua hợp đồng đã ký (chiTietHopDongId).
	const cthd = hs.chiTietHopDong;
	const hopDong = cthd?.hopDong;

	// Nhánh "hoàn 80%": hồ sơ tạo trực tiếp từ ChiTietDatCoc (chiTietDatCocId), CHƯA có
	// HopDong.
	const ctdc = hs.chiTietDatCoc;
	const laHoSoDatCocChuaKyHD = hs.chiTietHopDongId == null && hs.chiTietDatCocId != null;

	const khachHang = hopDong?.khachHang ?? ctdc?.hoSoDatCoc?.khachHang;
	const phong = cthd?.phong ?? ctdc?.phong;
	const giuong = cthd?.giuong ?? ctdc?.giuong;
	const tienCocGoc = cthd?.tienCocPhanBo ?? ctdc?.tienCocPhanBo ?? 0;

	const bbkt = hs.bienBanKiemTraTraPhong;
	const doiSoat = bbkt?.doiSoatHoanCoc;
	const giaoDich = doiSoat?.giaoDichHoanCoc;
	const bbtp = hs.bienBanTraPhong;

	const soTienHoan = doiSoat
		? doiSoat.soTienCanThuThem > 0
			? -doiSoat.soTienCanThuThem
			: doiSoat.soTienHoanThucNhan
		: null;

	return {
		yeuCauTraPhongId: hs.yeuCauTraPhongId,
		maHoSo: formatMaHoSo(hs.yeuCauTraPhongId),
		hopDongId: cthd?.hopDongId ?? null,
		chiTietHopDongId: hs.chiTietHopDongId,
		soHopDong: hopDong?.maHopDong ?? "—",
		khachHang: khachHang?.hoTen ?? "—",
		phongGiuong: phong ? `${phong.maPhong}${giuong ? " - " + giuong.maGiuongLocal : ""}` : "—",
		phongId: phong?.phongId ?? null,
		giuongId: giuong?.giuongId ?? null,
		tienCocGoc,
		ngayBatDauLuuTru: cthd?.ngayBatDau ?? hs.ngayTao,
		ngayTraPhong: hs.ngayTraPhongDuKien,
		trangThaiHopDong: hopDong?.trangThai ?? ctdc?.trangThai ?? "—",
		trangThaiHoSo: hs.trangThai as TrangThaiHoSo,
		bienBanKiemTraId: bbkt?.bienBanKiemTraId ?? null,
		maBienBanKiemTra: bbkt ? formatMaBienBanKiemTra(bbkt.bienBanKiemTraId) : null,
		tongKhauTruKiemTra: null,
		doiSoatId: doiSoat?.doiSoatId ?? null,
		tyLeHoanCoc: doiSoat?.tyLeHoanCoc ?? null,
		soTienHoan,
		bienBanTraPhongId: bbtp?.bienBanTraPhongId ?? null,
		daHoanCoc: !!giaoDich,
		laHoSoDatCocChuaKyHD,
	};
}

export const HoSoTraPhong = {
	/** Màn "Danh sách hồ sơ trả phòng": lấy toàn bộ hồ sơ, mọi trạng thái. */
	async layDanhSach(): Promise<HoSoTraPhongInfo[]> {
		const list = await HoSoTraPhongDB.layDanhSach();
		return list.map(map);
	},

	/** Dùng ở hầu hết các màn "tự fetch theo khóa" trong UC2-UC5 (HienThi(maHoSo)). */
	async layThongTin(yeuCauTraPhongId: number): Promise<HoSoTraPhongInfo | null> {
		const hs = await HoSoTraPhongDB.layThongTin(yeuCauTraPhongId);
		return hs ? map(hs) : null;
	},
};
