import { ApiValidationError } from "@/lib/api-response";
import type { CapNhatThongTinHoSoDatCocInput } from "@/lib/services/hoSoDatCocService";
import { isGender } from "@/lib/gender";

function optionalString(value: unknown) {
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function requiredString(value: unknown, fieldName: string) {
	const parsed = optionalString(value);
	if (!parsed) throw new ApiValidationError(`${fieldName} là bắt buộc.`);
	return parsed;
}

function optionalGender(value: unknown) {
	const gender = optionalString(value);
	if (gender && !isGender(gender)) throw new ApiValidationError("Giới tính không hợp lệ.");
	return gender;
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

	const { yeuCauId, khachHang, yeuCauThue, chiTietDatCoc, ngayBatDauDuKien, ngayKetThucDuKien, lyDoTuChoi } = body as Record<string, unknown>;
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
	const sourceRequestId = yeuCauId === undefined ? undefined : Number(yeuCauId);
	if (sourceRequestId !== undefined && (!Number.isInteger(sourceRequestId) || sourceRequestId < 1)) {
		throw new ApiValidationError("Yêu cầu thuê đã chọn không hợp lệ.");
	}
	let depositDetail: CapNhatThongTinHoSoDatCocInput["chiTietDatCoc"];
	if (chiTietDatCoc !== undefined) {
		if (typeof chiTietDatCoc !== "object" || chiTietDatCoc === null) {
			throw new ApiValidationError("Thông tin tài chính đặt cọc không hợp lệ.");
		}
		const detail = chiTietDatCoc as Record<string, unknown>;
		const giaThueThoaThuan = Number(detail.giaThueThoaThuan);
		const soGiuongQuyDoi = Number(detail.soGiuongQuyDoi);
		if (!Number.isFinite(giaThueThoaThuan) || giaThueThoaThuan <= 0) {
			throw new ApiValidationError("Giá thuê thỏa thuận phải lớn hơn 0.");
		}
		if (!Number.isInteger(soGiuongQuyDoi) || soGiuongQuyDoi < 1) {
			throw new ApiValidationError("Số giường thuê phải là số nguyên lớn hơn 0.");
		}
		depositDetail = { giaThueThoaThuan, soGiuongQuyDoi };
	}

	return {
		yeuCauId: sourceRequestId,
		khachHang: {
			hoTen: requiredString(customer.hoTen, "Họ và tên"),
			cccdPassport: requiredString(customer.cccdPassport, "Số CCCD"),
			gioiTinh: optionalGender(customer.gioiTinh),
			quocTich: optionalString(customer.quocTich),
			soDienThoai: requiredString(customer.soDienThoai, "Số điện thoại"),
			email: optionalString(customer.email),
		},
		yeuCauThue: {
			soNguoiDuKien,
			loaiThue: requiredString(rentalRequest.loaiThue, "Loại thuê"),
			khuVucMongMuon: optionalString(rentalRequest.khuVucMongMuon),
		},
		chiTietDatCoc: depositDetail,
		ngayBatDauDuKien: startDate,
		ngayKetThucDuKien: endDate,
		lyDoTuChoi: optionalString(lyDoTuChoi),
	};
}
