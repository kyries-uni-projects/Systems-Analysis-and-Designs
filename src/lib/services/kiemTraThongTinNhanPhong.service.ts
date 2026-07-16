import { ApiNotFoundError, ApiValidationError } from "@/lib/api-response";
import { parseLocalCalendarDate } from "@/lib/calendar-date";
import { prisma } from "@/lib/prisma";
import {
	capNhatThoiGianCuTru,
	capNhatTrangThaiHoSoNhanPhong,
	demSoHoSoChoNhanPhong,
	kiemTraTonTaiTheoHoSoDatCoc,
	layDanhSachChoNhanPhong,
	layThongTinChiTiet,
	themHoSoNhanPhong,
	tinhSucChuaDaDat,
	TRANG_THAI_CHO_DUYET_DIEU_KIEN_LUU_TRU,
	type HoSoDatCocCheckInRecord,
} from "@/lib/repositories/hoSoNhanPhong.repository";
import {
	kiemTraTonTaiSoGiayTo,
	themNhieu,
	xoaTheoHoSoNhanPhong,
} from "@/lib/repositories/thanhVienLuuTru.repository";
import type {
	KiemTraThongTinDetail,
	KiemTraThongTinListItem,
	LuuKiemTraThongTinInput,
	ThanhVienLuuTruInput,
} from "@/types/nhan-phong";

function formatDate(value: Date | null | undefined) {
	if (!value) return "";
	return new Intl.DateTimeFormat("vi-VN", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		timeZone: "Asia/Ho_Chi_Minh",
	}).format(value);
}

function addMonths(date: Date, months: number) {
	const result = new Date(date);
	result.setMonth(result.getMonth() + months);
	return result;
}

function formatRoom(hoSo: HoSoDatCocCheckInRecord) {
	const details = hoSo.chiTietDatCocs;
	if (details.length === 0) return "Chưa chọn phòng/giường";

	return details
		.map((detail) => {
			const room = detail.phong?.maPhong ?? "Chưa rõ phòng";
			return detail.giuong ? `${room} – Giường ${detail.giuong.maGiuongLocal}` : room;
		})
		.join(", ");
}

function mapListItem(hoSo: HoSoDatCocCheckInRecord): KiemTraThongTinListItem {
	return {
		id: String(hoSo.hoSoDatCocId),
		hoSoDatCocId: hoSo.hoSoDatCocId,
		code: hoSo.maHoSoDatCoc,
		customer: hoSo.khachHang.hoTen,
		room: formatRoom(hoSo),
		appointmentTime: hoSo.gioHenNhanPhong ?? "",
		appointmentDate: formatDate(hoSo.ngayHenNhanPhong),
		status: hoSo.trangThai,
		cccd: hoSo.khachHang.cccdPassport,
		gender: hoSo.khachHang.gioiTinh ?? "",
		phone: hoSo.khachHang.soDienThoai,
	};
}

function mapDetail(hoSo: HoSoDatCocCheckInRecord): KiemTraThongTinDetail {
	const base = mapListItem(hoSo);
	const representative = hoSo.hoSoNhanPhong?.thanhVienLuuTrus.find((member) => member.laNguoiDaiDien);
	const months = Math.max(
		1,
		Math.round((hoSo.ngayKetThucDuKien.getTime() - hoSo.ngayBatDauDuKien.getTime()) / (1000 * 60 * 60 * 24 * 30)),
	);

	return {
		...base,
		hinhThucThue: hoSo.hinhThucThue,
		ngayBatDauCuTru: formatDate(hoSo.ngayBatDauDuKien),
		thoiHanThueThang: months,
		ghiChu: hoSo.hoSoNhanPhong?.ghiChu ?? "",
		daXacMinhGiayTo: representative?.daXacMinhGiayTo ?? true,
		members:
			hoSo.hoSoNhanPhong?.thanhVienLuuTrus
				.filter((member) => !member.laNguoiDaiDien)
				.map((member) => ({
					name: member.hoTen,
					cccd: member.soGiayTo,
					gender: member.gioiTinh ?? "",
					phone: member.soDienThoai ?? "",
				})) ?? [],
	};
}

function validateMember(member: ThanhVienLuuTruInput, index: number) {
	if (!member.name.trim()) throw new ApiValidationError(`Thành viên ${index + 1}: vui lòng nhập họ và tên.`);
	if (!/^\d{12}$/u.test(member.cccd.trim())) throw new ApiValidationError(`Thành viên ${index + 1}: số CCCD phải gồm 12 chữ số.`);
	if (!["Nam", "Nữ", "Khác"].includes(member.gender)) throw new ApiValidationError(`Thành viên ${index + 1}: giới tính không hợp lệ.`);
	if (!/^(0|\+84)\d{9,10}$/u.test(member.phone.trim())) throw new ApiValidationError(`Thành viên ${index + 1}: số điện thoại không hợp lệ.`);
}

function taoMaHoSoNhanPhong(hoSoDatCocId: number) {
	const now = new Date();
	return `NP${now.getFullYear()}-${String(hoSoDatCocId).padStart(6, "0")}`;
}

export async function danhSachKiemTraThongTin(tuKhoa?: string) {
	const [records, total] = await Promise.all([
		layDanhSachChoNhanPhong(tuKhoa),
		demSoHoSoChoNhanPhong(),
	]);

	return {
		total,
		items: records.map(mapListItem),
	};
}

export async function chiTietKiemTraThongTin(maHoSoDatCoc: string) {
	const hoSo = await layThongTinChiTiet(maHoSoDatCoc);
	if (!hoSo) throw new ApiNotFoundError("Không tìm thấy hồ sơ đặt cọc.");
	return mapDetail(hoSo);
}

export async function luuVaChuyenKiemTraDieuKien(
	maHoSoDatCoc: string,
	nhanVienId: number,
	input: LuuKiemTraThongTinInput,
) {
	const ngayBatDau = parseLocalCalendarDate(input.ngayBatDauCuTru);
	if (Number.isNaN(ngayBatDau.getTime())) throw new ApiValidationError("Ngày bắt đầu cư trú không hợp lệ.");
	if (!Number.isInteger(input.thoiHanThueThang) || input.thoiHanThueThang <= 0) {
		throw new ApiValidationError("Thời hạn thuê phải lớn hơn 0 tháng.");
	}
	if (!input.daXacMinhGiayTo) throw new ApiValidationError("Vui lòng xác minh giấy tờ tùy thân trước khi lưu.");

	const extraMembers = input.members.map((member) => ({
		name: member.name.trim(),
		cccd: member.cccd.trim(),
		gender: member.gender,
		phone: member.phone.trim(),
	}));
	extraMembers.forEach(validateMember);

	const uniqueCccd = new Set(extraMembers.map((member) => member.cccd));
	if (uniqueCccd.size !== extraMembers.length) throw new ApiValidationError("Danh sách thành viên có số CCCD bị trùng.");

	return prisma.$transaction(async (tx) => {
		const hoSo = await layThongTinChiTiet(maHoSoDatCoc, tx);
		if (!hoSo) throw new ApiNotFoundError("Không tìm thấy hồ sơ đặt cọc.");
		if (hoSo.chiTietDatCocs.length === 0) throw new ApiValidationError("Hồ sơ chưa có thông tin phòng/giường đặt cọc.");
		if (await kiemTraTonTaiTheoHoSoDatCoc(hoSo.hoSoDatCocId, tx)) {
			throw new ApiValidationError("Hồ sơ này đã được chuyển sang bước kiểm tra điều kiện.");
		}

		const representative: ThanhVienLuuTruInput = {
			name: hoSo.khachHang.hoTen,
			cccd: hoSo.khachHang.cccdPassport,
			gender: hoSo.khachHang.gioiTinh ?? "Khác",
			phone: hoSo.khachHang.soDienThoai,
		};
		validateMember(representative, 0);
		if (uniqueCccd.has(representative.cccd)) throw new ApiValidationError("Thành viên thêm mới trùng CCCD với khách hàng đại diện.");

		const soNguoiSauKhiLuu = extraMembers.length + 1;
		const sucChuaDaDat = await tinhSucChuaDaDat(hoSo.hoSoDatCocId, tx);
		if (soNguoiSauKhiLuu > sucChuaDaDat) {
			throw new ApiValidationError(`Số người ở (${soNguoiSauKhiLuu}) vượt quá sức chứa đã đặt (${sucChuaDaDat}).`);
		}

		const ngayKetThuc = addMonths(ngayBatDau, input.thoiHanThueThang);
		await capNhatThoiGianCuTru(hoSo.hoSoDatCocId, ngayBatDau, ngayKetThuc, tx);

		const hoSoNhanPhong = await themHoSoNhanPhong(
			{
				maHoSoNhanPhong: taoMaHoSoNhanPhong(hoSo.hoSoDatCocId),
				hoSoDatCocId: hoSo.hoSoDatCocId,
				nhanVienId,
				ghiChu: input.ghiChu?.trim() || null,
				trangThai: TRANG_THAI_CHO_DUYET_DIEU_KIEN_LUU_TRU,
			},
			tx,
		);

		await xoaTheoHoSoNhanPhong(hoSoNhanPhong.hoSoNhanPhongId, tx);
		const allMembers = [representative, ...extraMembers];
		for (const member of allMembers) {
			if (await kiemTraTonTaiSoGiayTo(hoSoNhanPhong.hoSoNhanPhongId, member.cccd, tx)) {
				throw new ApiValidationError(`Số CCCD ${member.cccd} đã tồn tại trong hồ sơ.`);
			}
		}

		await themNhieu(
			hoSoNhanPhong.hoSoNhanPhongId,
			hoSo.chiTietDatCocs[0].chiTietDatCocId,
			nhanVienId,
			allMembers.map((member, index) => ({
				hoTen: member.name,
				soGiayTo: member.cccd,
				gioiTinh: member.gender,
				soDienThoai: member.phone,
				laNguoiDaiDien: index === 0,
				daXacMinhGiayTo: input.daXacMinhGiayTo,
			})),
			tx,
		);
		await capNhatTrangThaiHoSoNhanPhong(hoSoNhanPhong.hoSoNhanPhongId, TRANG_THAI_CHO_DUYET_DIEU_KIEN_LUU_TRU, tx);

		return {
			maHoSoNhanPhong: hoSoNhanPhong.maHoSoNhanPhong,
			trangThai: TRANG_THAI_CHO_DUYET_DIEU_KIEN_LUU_TRU,
		};
	});
}
