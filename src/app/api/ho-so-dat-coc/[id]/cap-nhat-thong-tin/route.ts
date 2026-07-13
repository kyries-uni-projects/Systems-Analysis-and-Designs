import type { NextRequest } from "next/server";
import { apiError, apiSuccess, ApiValidationError, withApiErrorHandling } from "@/lib/api-response";
import { demoAccounts, SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE, SESSION_USER_COOKIE_NAME } from "@/lib/auth";
import { capNhatThongTinHoSoDatCoc, type CapNhatThongTinHoSoDatCocInput } from "@/lib/services/hoSoDatCocService";

function optionalString(value: unknown) {
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function requiredString(value: unknown, fieldName: string) {
	const parsed = optionalString(value);
	if (!parsed) throw new ApiValidationError(`${fieldName} là bắt buộc.`);
	return parsed;
}

function parseInput(body: unknown): CapNhatThongTinHoSoDatCocInput {
	if (typeof body !== "object" || body === null) {
		throw new ApiValidationError("Nội dung cập nhật không hợp lệ.");
	}

	const { khachHang, yeuCauThue, lyDoTuChoi } = body as Record<string, unknown>;
	if (typeof khachHang !== "object" || khachHang === null || typeof yeuCauThue !== "object" || yeuCauThue === null) {
		throw new ApiValidationError("Thiếu thông tin khách hàng hoặc yêu cầu thuê.");
	}

	const customer = khachHang as Record<string, unknown>;
	const request = yeuCauThue as Record<string, unknown>;
	const soNguoiDuKien = Number(request.soNguoiDuKien);
	if (!Number.isInteger(soNguoiDuKien) || soNguoiDuKien < 1) {
		throw new ApiValidationError("Số người dự kiến phải lớn hơn 0.");
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
			loaiThue: requiredString(request.loaiThue, "Loại thuê"),
			khuVucMongMuon: optionalString(request.khuVucMongMuon),
		},
		lyDoTuChoi: optionalString(lyDoTuChoi),
	};
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withApiErrorHandling(async () => {
		const username = request.cookies.get(SESSION_USER_COOKIE_NAME)?.value;
		const account = username ? demoAccounts[username] : undefined;
		if (request.cookies.get(SESSION_COOKIE_NAME)?.value !== SESSION_COOKIE_VALUE || !account) {
			return apiError("Chưa xác thực.", 401);
		}
		if (account.role !== "nhanvien" && account.role !== "admin") {
			return apiError("Tài khoản không có quyền cập nhật hồ sơ đặt cọc.", 403);
		}

		const { id } = await params;
		const hoSoId = Number(id);
		if (!Number.isInteger(hoSoId) || hoSoId < 1) {
			return apiError("ID hồ sơ không hợp lệ.", 400);
		}

		const hoSo = await capNhatThongTinHoSoDatCoc(hoSoId, parseInput(await request.json()));
		if (!hoSo) return apiError("Không tìm thấy hồ sơ đặt cọc.", 404);

		return apiSuccess(hoSo);
	});
}
