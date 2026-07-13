import { ApiValidationError } from "@/lib/api-response";

export const RENTAL_TYPES = ["Thuê giường", "Thuê nguyên phòng"] as const;

export type RentalType = (typeof RENTAL_TYPES)[number];

export interface CreateYeuCauThueInput {
	hoTen: string;
	cccdPassport: string;
	gioiTinh: string;
	quocTich: string;
	soDienThoai: string;
	email?: string;
	ghiChu?: string;
	loaiThue: RentalType;
	khuVucMongMuon?: string;
	soNguoiDuKien: number;
	mucGiaTu?: number;
	mucGiaDen?: number;
	thoiGianDuKienVaoO?: Date;
	thoiHanThueThang?: number;
	tieuChiUuTien: string[];
}

function optionalString(value: unknown) {
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function optionalNumber(value: unknown, label: string) {
	if (value === undefined || value === null || value === "") return undefined;
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed < 0) {
		throw new ApiValidationError(`${label} không hợp lệ`);
	}
	return parsed;
}

export function parseCreateYeuCauThueInput(body: unknown): CreateYeuCauThueInput {
	if (typeof body !== "object" || body === null) {
		throw new ApiValidationError("Nội dung yêu cầu không hợp lệ");
	}

	const value = body as Record<string, unknown>;
	const requiredFields = [
		["hoTen", "Họ và tên"],
		["cccdPassport", "Số CCCD/Passport"],
		["gioiTinh", "Giới tính"],
		["quocTich", "Quốc tịch"],
		["soDienThoai", "Số điện thoại"],
	] as const;

	for (const [field, label] of requiredFields) {
		if (!optionalString(value[field])) {
			throw new ApiValidationError(`${label} là bắt buộc`);
		}
	}

	if (!RENTAL_TYPES.includes(value.loaiThue as RentalType)) {
		throw new ApiValidationError("Loại thuê không hợp lệ");
	}

	const soNguoiDuKien = Number(value.soNguoiDuKien);
	if (!Number.isInteger(soNguoiDuKien) || soNguoiDuKien <= 0) {
		throw new ApiValidationError("Số người dự kiến phải là số nguyên dương");
	}

	const mucGiaTu = optionalNumber(value.mucGiaTu, "Mức giá từ");
	const mucGiaDen = optionalNumber(value.mucGiaDen, "Mức giá đến");
	if (mucGiaTu !== undefined && mucGiaDen !== undefined && mucGiaTu > mucGiaDen) {
		throw new ApiValidationError("Mức giá từ không được lớn hơn mức giá đến");
	}

	const thoiHanThueThang = optionalNumber(value.thoiHanThueThang, "Thời hạn thuê");
	if (thoiHanThueThang !== undefined && (!Number.isInteger(thoiHanThueThang) || thoiHanThueThang <= 0)) {
		throw new ApiValidationError("Thời hạn thuê phải là số tháng hợp lệ");
	}

	const rawDate = optionalString(value.thoiGianDuKienVaoO);
	const thoiGianDuKienVaoO = rawDate ? new Date(`${rawDate}T00:00:00`) : undefined;
	if (thoiGianDuKienVaoO && Number.isNaN(thoiGianDuKienVaoO.valueOf())) {
		throw new ApiValidationError("Thời gian dự kiến vào ở không hợp lệ");
	}

	const tieuChiUuTien = Array.isArray(value.tieuChiUuTien)
		? value.tieuChiUuTien.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
		: [];

	return {
		hoTen: optionalString(value.hoTen)!,
		cccdPassport: optionalString(value.cccdPassport)!,
		gioiTinh: optionalString(value.gioiTinh)!,
		quocTich: optionalString(value.quocTich)!,
		soDienThoai: optionalString(value.soDienThoai)!,
		email: optionalString(value.email),
		ghiChu: optionalString(value.ghiChu),
		loaiThue: value.loaiThue as RentalType,
		khuVucMongMuon: value.khuVucMongMuon === "Tất cả khu vực" ? undefined : optionalString(value.khuVucMongMuon),
		soNguoiDuKien,
		mucGiaTu,
		mucGiaDen,
		thoiGianDuKienVaoO,
		thoiHanThueThang,
		tieuChiUuTien,
	};
}
