import { ApiValidationError } from "@/lib/api-response";
import type { CapNhatThongTinHoSoDatCocInput } from "@/lib/services/hoSoDatCocService";

function optionalString(value: unknown) {
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function requiredString(value: unknown, fieldName: string) {
	const parsed = optionalString(value);
	if (!parsed) throw new ApiValidationError(`${fieldName} là bắt buộc.`);
	return parsed;
}

function requiredDate(value: unknown, fieldName: string) {
	const text = requiredString(value, fieldName);
	const date = new Date(`${text}T00:00:00.000Z`);
	if (Number.isNaN(date.getTime())) throw new ApiValidationError(`${fieldName} không hợp lệ.`);
	return date;
}

export function parseHoSoDatCocInput(body: unknown): CapNhatThongTinHoSoDatCocInput {
	if (typeof body !== "object" || body === null) {
		throw new ApiValidationError("Nội dung hồ sơ không hợp lệ.");
	}

	const { khachHang, yeuCauThue, ngayBatDauDuKien, ngayKetThucDuKien, lyDoTuChoi } = body as Record<string, unknown>;
	if (typeof khachHang !== "object" || khachHang === null || typeof yeuCauThue !== "object" || yeuCauThue === null) {
		throw new ApiValidationError("Thiếu thông tin khách hàng hoặc yêu cầu thuê.");
	}

	const customer = khachHang as Record<string, unknown>;
	const rentalRequest = yeuCauThue as Record<string, unknown>;
	const soNguoiDuKien = Number(rentalRequest.soNguoiDuKien);
	if (!Number.isInteger(soNguoiDuKien) || soNguoiDuKien < 1) {
		throw new ApiValidationError("Số người dự kiến phải lớn hơn 0.");
	}

	const startDate = requiredDate(ngayBatDauDuKien, "Ngày bắt đầu dự kiến");
	const endDate = requiredDate(ngayKetThucDuKien, "Ngày kết thúc dự kiến");
	if (endDate <= startDate) {
		throw new ApiValidationError("Ngày kết thúc dự kiến phải sau ngày bắt đầu dự kiến.");
	}

	return {
		khachHang: {
			hoTen: requiredString(customer.hoTen, "Họ và tên"),
			cccdPassport: requiredString(customer.cccdPassport, "Số CCCD"),
			gioiTinh: optionalString(customer.gioiTinh),
			quocTich: optionalString(customer.quocTich),
			soDienThoai: requiredString(customer.soDienThoai, "Số điện thoại"),
			email: optionalString(customer.email),
		},
		yeuCauThue: {
			soNguoiDuKien,
			loaiThue: requiredString(rentalRequest.loaiThue, "Loại thuê"),
			khuVucMongMuon: optionalString(rentalRequest.khuVucMongMuon),
		},
		ngayBatDauDuKien: startDate,
		ngayKetThucDuKien: endDate,
		lyDoTuChoi: optionalString(lyDoTuChoi),
	};
}
