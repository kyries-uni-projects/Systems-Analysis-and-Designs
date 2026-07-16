import { ApiNotFoundError, ApiValidationError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import {
	capNhatTrangThaiHoSoNhanPhong,
	demSoHoSoChoKyHopDong,
	docHoSoLapHopDongTheoMa,
	layDanhSachChoKyHopDong,
	TRANG_THAI_CHO_KY_HOP_DONG,
	TRANG_THAI_CHO_THANH_TOAN_DAU_KY,
	type HoSoNhanPhongContractRecord,
} from "@/lib/repositories/hoSoNhanPhong.repository";
import {
	kiemTraHopDongTonTaiTheoHoSo,
	layDanhSachKhoanPhiDangApDung,
	layDieuKhoanViPhamDangApDung,
	layMauNoiQuyDangApDung,
	layNoiQuyDangApDung,
	taoHopDongDaKy,
} from "@/lib/repositories/lapHopDong.repository";
import type {
	LapHopDongDetail,
	LapHopDongListItem,
	LuuHopDongInput,
} from "@/types/nhan-phong";

const TRANG_THAI_HOP_DONG_DA_KY = "Da ky";
const KY_THANH_TOAN_MAC_DINH = "Hang thang, truoc ngay 05";

function formatDate(value: Date | null | undefined) {
	if (!value) return "";
	return new Intl.DateTimeFormat("vi-VN", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		timeZone: "Asia/Ho_Chi_Minh",
	}).format(value);
}

function diffMonths(start: Date, end: Date) {
	const months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
	return Math.max(1, months || 1);
}

function normaliseRentType(value: string): "giường" | "phòng" {
	const lower = value.toLowerCase();
	return lower.includes("phong") || lower.includes("phòng") ? "phòng" : "giường";
}

function formatRoom(record: HoSoNhanPhongContractRecord) {
	const details = record.hoSoDatCoc.chiTietDatCocs;
	if (details.length === 0) return "Chua co phong";
	return details
		.map((detail) => {
			const room = detail.phong?.maPhong ?? "Chua ro phong";
			return detail.giuong ? `${room} – Giường ${detail.giuong.maGiuongLocal}` : room;
		})
		.join(", ");
}

function formatFloor(record: HoSoNhanPhongContractRecord) {
	const phong = record.hoSoDatCoc.chiTietDatCocs[0]?.phong;
	if (!phong) return "";
	const parts = [];
	if (phong.tang != null) parts.push(`Tầng ${phong.tang}`);
	if (phong.khu) parts.push(`Dãy ${phong.khu}`);
	return parts.join(" – ");
}

function splitRules(value?: string | null) {
	if (!value) return [];
	return value
		.split(/\r?\n|[.;]\s*/u)
		.map((item) => item.trim())
		.filter(Boolean);
}

function mapListItem(record: HoSoNhanPhongContractRecord): LapHopDongListItem {
	const hoSoDatCoc = record.hoSoDatCoc;
	return {
		id: String(record.hoSoNhanPhongId),
		hoSoNhanPhongId: record.hoSoNhanPhongId,
		code: record.maHoSoNhanPhong,
		customer: hoSoDatCoc.khachHang.hoTen,
		rentType: normaliseRentType(hoSoDatCoc.hinhThucThue),
		duration: `${diffMonths(hoSoDatCoc.ngayBatDauDuKien, hoSoDatCoc.ngayKetThucDuKien)} tháng`,
	};
}

function contractCode(maHoSoNhanPhong: string) {
	return `HD-${maHoSoNhanPhong}`;
}

async function buildDetail(record: HoSoNhanPhongContractRecord): Promise<LapHopDongDetail> {
	const base = mapListItem(record);
	const representative = record.thanhVienLuuTrus.find((member) => member.laNguoiDaiDien);
	const activeMembers = record.thanhVienLuuTrus.filter((member) => !member.laNguoiDaiDien && member.trangThaiThamGia !== "LOAI_KHOI_HO_SO");
	const details = record.hoSoDatCoc.chiTietDatCocs;
	const firstDetail = details[0];
	const totalRent = details.reduce((sum, detail) => sum + detail.giaThueThoaThuan * detail.soGiuongQuyDoi, 0);
	const totalDeposit = details.reduce((sum, detail) => sum + detail.tienCocPhanBo, 0);
	const bedCount = details.reduce((sum, detail) => sum + detail.soGiuongQuyDoi, 0);

	const [fees, mauNoiQuy, noiQuy, dieuKhoanViPham] = await Promise.all([
		layDanhSachKhoanPhiDangApDung(),
		layMauNoiQuyDangApDung(),
		layNoiQuyDangApDung(),
		layDieuKhoanViPhamDangApDung(),
	]);

	return {
		...base,
		cccd: record.hoSoDatCoc.khachHang.cccdPassport,
		dob: formatDate(representative?.ngaySinh),
		phone: record.hoSoDatCoc.khachHang.soDienThoai,
		address: record.hoSoDatCoc.khachHang.ghiChu ?? "",
		room: formatRoom(record),
		floor: formatFloor(record),
		bedCount,
		pricePerBed: firstDetail?.giaThueThoaThuan ?? 0,
		totalRent,
		startDate: formatDate(record.hoSoDatCoc.ngayBatDauDuKien),
		endDate: formatDate(record.hoSoDatCoc.ngayKetThucDuKien),
		deposit: totalDeposit,
		contractCode: contractCode(record.maHoSoNhanPhong),
		paymentCycle: KY_THANH_TOAN_MAC_DINH,
		members: activeMembers.map((member) => ({
			name: member.hoTen,
			cccd: member.soGiayTo,
		})),
		serviceFees: fees.map((fee) => ({
			idKhoanPhi: fee.idKhoanPhi,
			label: fee.tenLoaiPhi,
			value: `${fee.donGia.toLocaleString("vi-VN")} đ${fee.donViTinh ? `/${fee.donViTinh}` : ""}`,
			donGia: fee.donGia,
			donViTinh: fee.donViTinh,
		})),
		depositRules: splitRules(mauNoiQuy?.quyDinhHoanCoc),
		dormRules: noiQuy.length > 0 ? noiQuy.map((rule) => rule.noiDung) : splitRules(mauNoiQuy?.noiQuy),
		violationRules: dieuKhoanViPham.length > 0 ? dieuKhoanViPham.map((rule) => rule.noiDung) : splitRules(mauNoiQuy?.dieuKhoanViPham),
	};
}

export async function danhSachLapHopDong(tuKhoa?: string) {
	const [records, total] = await Promise.all([
		layDanhSachChoKyHopDong(tuKhoa),
		demSoHoSoChoKyHopDong(),
	]);

	return {
		total,
		items: records.map(mapListItem),
	};
}

export async function chiTietLapHopDong(maHoSoNhanPhong: string) {
	const record = await docHoSoLapHopDongTheoMa(maHoSoNhanPhong);
	if (!record) throw new ApiNotFoundError("Ho so khong ton tai. Vui long nhap lai ma ho so.");
	if (record.trangThai !== TRANG_THAI_CHO_KY_HOP_DONG || record.hopDong) {
		throw new ApiValidationError("Ho so chua du dieu kien de lap hop dong.");
	}
	return buildDetail(record);
}

export async function luuHopDong(maHoSoNhanPhong: string, nhanVienId: number, input: LuuHopDongInput) {
	if (!input.daXacNhanKhachDaKy) {
		throw new ApiValidationError("Ban chua xac nhan khach hang da ky vao hop dong.");
	}

	return prisma.$transaction(async (tx) => {
		const record = await docHoSoLapHopDongTheoMa(maHoSoNhanPhong, tx);
		if (!record) throw new ApiNotFoundError("Ho so khong ton tai. Vui long nhap lai ma ho so.");
		if (record.trangThai !== TRANG_THAI_CHO_KY_HOP_DONG) {
			throw new ApiValidationError("Ho so chua du dieu kien de lap hop dong.");
		}
		if (record.hopDong || (await kiemTraHopDongTonTaiTheoHoSo(record.hoSoNhanPhongId, tx))) {
			throw new ApiValidationError("Ho so nay da co hop dong.");
		}
		if (record.hoSoDatCoc.chiTietDatCocs.length === 0) {
			throw new ApiValidationError("Ho so chua co thong tin phong/giuong de lap hop dong.");
		}

		const mauNoiQuy = await layMauNoiQuyDangApDung(tx);
		if (!mauNoiQuy) throw new ApiValidationError("Chua co mau noi quy dang ap dung de lap hop dong.");

		const fees = await layDanhSachKhoanPhiDangApDung(tx);
		const totalDeposit = record.hoSoDatCoc.chiTietDatCocs.reduce((sum, detail) => sum + detail.tienCocPhanBo, 0);
		const now = new Date();
		const hopDong = await taoHopDongDaKy(
			{
				maHopDong: contractCode(record.maHoSoNhanPhong),
				hoSoNhanPhongId: record.hoSoNhanPhongId,
				khachHangId: record.hoSoDatCoc.khachHangId,
				nhanVienId,
				idMauNoiQuy: mauNoiQuy.idMauNoiQuy,
				kyThanhToan: KY_THANH_TOAN_MAC_DINH,
				tienCocGoc: totalDeposit,
				trangThai: TRANG_THAI_HOP_DONG_DA_KY,
				ngayKy: now,
				chiTietDatCocs: record.hoSoDatCoc.chiTietDatCocs.map((detail) => ({
					chiTietDatCocId: detail.chiTietDatCocId,
					phongId: detail.phongId,
					giuongId: detail.giuongId,
					hinhThucThue: record.hoSoDatCoc.hinhThucThue,
					giaThueThoaThuan: detail.giaThueThoaThuan,
					tienCocPhanBo: detail.tienCocPhanBo,
					ngayBatDau: record.hoSoDatCoc.ngayBatDauDuKien,
					ngayKetThuc: record.hoSoDatCoc.ngayKetThucDuKien,
				})),
				khoanPhiDichVus: fees.map((fee) => ({
					idKhoanPhi: fee.idKhoanPhi,
					donGia: fee.donGia,
					soLuong: 1,
					thanhTien: fee.donGia,
					ghiChu: fee.donViTinh,
				})),
			},
			tx,
		);

		await capNhatTrangThaiHoSoNhanPhong(record.hoSoNhanPhongId, TRANG_THAI_CHO_THANH_TOAN_DAU_KY, tx);

		return {
			maHoSoNhanPhong: record.maHoSoNhanPhong,
			maHopDong: hopDong.maHopDong,
			trangThaiHopDong: TRANG_THAI_HOP_DONG_DA_KY,
			trangThaiHoSo: TRANG_THAI_CHO_THANH_TOAN_DAU_KY,
		};
	});
}
