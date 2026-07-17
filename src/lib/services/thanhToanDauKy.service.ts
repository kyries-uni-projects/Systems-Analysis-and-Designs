import { ApiNotFoundError, ApiValidationError } from "@/lib/api-response";
import { TRANG_THAI_CHO_BAN_GIAO } from "@/lib/nhan-phong-rules";
import { prisma } from "@/lib/prisma";
import {
	capNhatTrangThaiHoSoNhanPhong,
	demSoHoSoChoThanhToan,
	docHoSoThanhToanTheoMa,
	layDanhSachChoThanhToan,
	TRANG_THAI_CHO_THANH_TOAN_DAU_KY,
	type HoSoNhanPhongPaymentRecord,
} from "@/lib/repositories/hoSoNhanPhong.repository";
import {
	kiemTraDaThanhToan,
	layHopDongDaKyTheoHoSo,
	luuDanhSachDaThu,
	type HopDongThanhToanRecord,
} from "@/lib/repositories/thanhToanDauKy.repository";
import type {
	LuuThanhToanDauKyInput,
	ThanhToanDauKyDetail,
	ThanhToanDauKyListItem,
	ThanhToanKhoanThu,
} from "@/types/nhan-phong";

const TRANG_THAI_HOP_DONG_DA_KY = "Da ky";

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

function formatMoney(value: number) {
	return `${value.toLocaleString("vi-VN")} đ`;
}

function formatRoom(hopDong: HopDongThanhToanRecord) {
	if (hopDong.chiTietHopDongs.length === 0) return "Chưa có phòng";
	return hopDong.chiTietHopDongs
		.map((detail) => {
			const room = detail.phong?.maPhong ?? "Chưa rõ phòng";
			return detail.giuong ? `${room} - Giường ${detail.giuong.maGiuongLocal}` : room;
		})
		.join(", ");
}

function layHopDong(record: HoSoNhanPhongPaymentRecord) {
	if (!record.hopDong) throw new ApiValidationError("Ho so chua co hop dong de thanh toan.");
	return record.hopDong;
}

function tinhTienThueKyDau(hopDong: HopDongThanhToanRecord | NonNullable<HoSoNhanPhongPaymentRecord["hopDong"]>) {
	return hopDong.chiTietHopDongs.reduce((sum, detail) => {
		return sum + detail.giaThueThoaThuan * detail.soGiuongQuyDoi;
	}, 0);
}

function taoKhoanThuDauKy(hopDong: HopDongThanhToanRecord | NonNullable<HoSoNhanPhongPaymentRecord["hopDong"]>): ThanhToanKhoanThu[] {
	const tienThue = tinhTienThueKyDau(hopDong);
	const soGiuong = hopDong.chiTietHopDongs.reduce((sum, detail) => sum + detail.soGiuongQuyDoi, 0);
	const firstDetail = hopDong.chiTietHopDongs[0];
	const charges: ThanhToanKhoanThu[] = [
		{
			id: "rent-first-period",
			source: "rent",
			label: "Tiền thuê kỳ đầu",
			description: firstDetail ? `${formatMoney(firstDetail.giaThueThoaThuan)}/giường × ${Math.max(soGiuong, 1)} giường` : "Tiền thuê kỳ đầu",
			amount: tienThue,
		},
	];

	for (const fee of hopDong.khoanPhiHopDongs) {
		charges.push({
			id: `service-${fee.idKhoanPhiHopDong}`,
			source: "service",
			khoanPhiHopDongId: fee.idKhoanPhiHopDong,
			label: fee.khoanPhiDichVu.tenLoaiPhi,
			description: `${formatMoney(fee.donGiaApDung)} x ${fee.soLuong}`,
			amount: fee.thanhTien,
		});
	}

	return charges;
}

function mapListItem(record: HoSoNhanPhongPaymentRecord): ThanhToanDauKyListItem {
	const hopDong = layHopDong(record);
	const hoSoDatCoc = record.hoSoDatCoc;
	return {
		id: String(record.hoSoNhanPhongId),
		hoSoNhanPhongId: record.hoSoNhanPhongId,
		hopDongId: hopDong.hopDongId,
		code: record.maHoSoNhanPhong,
		contractCode: hopDong.maHopDong,
		customer: hoSoDatCoc.khachHang.hoTen,
		rentType: hoSoDatCoc.hinhThucThue,
		startDate: formatDate(hoSoDatCoc.ngayBatDauDuKien),
	};
}

function mapDetail(record: HoSoNhanPhongPaymentRecord): ThanhToanDauKyDetail {
	const base = mapListItem(record);
	const hopDong = layHopDong(record);
	const charges = taoKhoanThuDauKy(hopDong);
	const total = charges.reduce((sum, charge) => sum + charge.amount, 0);

	return {
		...base,
		room: formatRoom(hopDong as HopDongThanhToanRecord),
		duration: `${diffMonths(record.hoSoDatCoc.ngayBatDauDuKien, record.hoSoDatCoc.ngayKetThucDuKien)} tháng`,
		paymentCycle: hopDong.kyThanhToan ?? "Hàng tháng, trước ngày 05",
		receiptStatus: "Chờ xác nhận",
		paymentTime: new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
		charges,
		total,
	};
}

export async function danhSachThanhToanDauKy(tuKhoa?: string) {
	const [records, total] = await Promise.all([
		layDanhSachChoThanhToan(tuKhoa),
		demSoHoSoChoThanhToan(),
	]);

	return {
		total,
		items: records.map(mapListItem),
	};
}

export async function chiTietThanhToanDauKy(maHoSoNhanPhong: string) {
	const record = await docHoSoThanhToanTheoMa(maHoSoNhanPhong);
	if (!record) throw new ApiNotFoundError("Ho so khong ton tai. Vui long nhap lai ma ho so.");
	const hopDong = layHopDong(record);
	if (record.trangThai !== TRANG_THAI_CHO_THANH_TOAN_DAU_KY || hopDong.trangThai !== TRANG_THAI_HOP_DONG_DA_KY) {
		throw new ApiValidationError("Ho so chua du dieu kien de thanh toan.");
	}
	return mapDetail(record);
}

function validateCharges(charges: ThanhToanKhoanThu[]) {
	if (!Array.isArray(charges) || charges.length === 0) {
		throw new ApiValidationError("Chua co khoan thu de thanh toan.");
	}
	for (const charge of charges) {
		if (!charge.label?.trim() || !Number.isFinite(charge.amount) || charge.amount <= 0) {
			throw new ApiValidationError("Thong tin khoan thu khong hop le.");
		}
	}
}

function taoDanhSachKhoanThuDaXacNhan(hopDong: HopDongThanhToanRecord, input: LuuThanhToanDauKyInput) {
	const canonicalCharges = taoKhoanThuDauKy(hopDong);
	const submittedBaseCharges = input.charges.filter((charge) => charge.source !== "extra");
	const baseChargesValid = canonicalCharges.length === submittedBaseCharges.length
		&& canonicalCharges.every((canonical) => submittedBaseCharges.some((submitted) =>
			submitted.id === canonical.id
			&& submitted.source === canonical.source
			&& submitted.amount === canonical.amount
			&& (submitted.khoanPhiHopDongId ?? null) === (canonical.khoanPhiHopDongId ?? null)
		));

	if (!baseChargesValid) {
		throw new ApiValidationError("Cac khoan thu bat buoc da thay doi. Vui long tai lai ho so.");
	}

	const extraCharges = input.charges
		.filter((charge) => charge.source === "extra")
		.map((charge, index) => ({
			id: `extra-${index + 1}`,
			source: "extra" as const,
			label: charge.label.trim(),
			description: charge.description?.trim() || "Khoản phí bổ sung",
			amount: charge.amount,
		}));

	return [...canonicalCharges, ...extraCharges];
}

export async function hoanTatThanhToanDauKy(maHoSoNhanPhong: string, keToanId: number, input: LuuThanhToanDauKyInput) {
	validateCharges(input.charges);

	return prisma.$transaction(async (tx) => {
		const record = await docHoSoThanhToanTheoMa(maHoSoNhanPhong, tx);
		if (!record) throw new ApiNotFoundError("Ho so khong ton tai. Vui long nhap lai ma ho so.");
		if (record.trangThai !== TRANG_THAI_CHO_THANH_TOAN_DAU_KY) {
			throw new ApiValidationError("Ho so chua du dieu kien de thanh toan.");
		}

		const hopDong = await layHopDongDaKyTheoHoSo(record.hoSoNhanPhongId, tx);
		if (!hopDong || hopDong.trangThai !== TRANG_THAI_HOP_DONG_DA_KY) {
			throw new ApiValidationError("Ho so chua du dieu kien de thanh toan.");
		}
		if (await kiemTraDaThanhToan(hopDong.hopDongId, tx)) {
			throw new ApiValidationError("Ho so nay da thanh toan dau ky.");
		}

		const charges = taoDanhSachKhoanThuDaXacNhan(hopDong, input);
		await luuDanhSachDaThu(hopDong.hopDongId, keToanId, charges, input.phuongThucThu ?? "Tien mat", tx);
		await capNhatTrangThaiHoSoNhanPhong(record.hoSoNhanPhongId, TRANG_THAI_CHO_BAN_GIAO, tx);

		return {
			maHoSoNhanPhong: record.maHoSoNhanPhong,
			maHopDong: hopDong.maHopDong,
			trangThaiHoSo: TRANG_THAI_CHO_BAN_GIAO,
			soTien: charges.reduce((sum, charge) => sum + charge.amount, 0),
		};
	});
}
