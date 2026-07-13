import { ApiValidationError } from "@/lib/api-response";

export interface CreateLichHenInput {
	yeuCauId: number;
	phongId: number;
	ngayXem: string; // ISO date string (YYYY-MM-DD)
	gioBatDau: string; // HH:mm format
	gioKetThuc: string; // HH:mm format
}

function requireString(value: unknown, label: string): string {
	if (typeof value !== "string" || !value.trim()) {
		throw new ApiValidationError(`${label} là bắt buộc`);
	}
	return value.trim();
}

function requirePositiveInt(value: unknown, label: string): number {
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed <= 0) {
		throw new ApiValidationError(`${label} không hợp lệ`);
	}
	return parsed;
}

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseCreateLichHenInput(body: unknown): CreateLichHenInput {
	if (typeof body !== "object" || body === null) {
		throw new ApiValidationError("Nội dung yêu cầu không hợp lệ");
	}

	const value = body as Record<string, unknown>;

	const yeuCauId = requirePositiveInt(value.yeuCauId, "Mã yêu cầu thuê");
	const phongId = requirePositiveInt(value.phongId, "Mã phòng");

	const ngayXem = requireString(value.ngayXem, "Ngày xem phòng");
	const parsedDate = new Date(`${ngayXem}T00:00:00`);
	if (Number.isNaN(parsedDate.valueOf())) {
		throw new ApiValidationError("Ngày xem phòng không hợp lệ");
	}

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	if (parsedDate < today) {
		throw new ApiValidationError("Ngày xem phòng không được là ngày trong quá khứ");
	}

	const gioBatDau = requireString(value.gioBatDau, "Giờ bắt đầu");
	if (!TIME_REGEX.test(gioBatDau)) {
		throw new ApiValidationError("Giờ bắt đầu không hợp lệ (định dạng HH:mm)");
	}

	const gioKetThuc = requireString(value.gioKetThuc, "Giờ kết thúc dự kiến");
	if (!TIME_REGEX.test(gioKetThuc)) {
		throw new ApiValidationError("Giờ kết thúc dự kiến không hợp lệ (định dạng HH:mm)");
	}

	if (gioBatDau >= gioKetThuc) {
		throw new ApiValidationError("Giờ kết thúc phải sau giờ bắt đầu");
	}

	return { yeuCauId, phongId, ngayXem, gioBatDau, gioKetThuc };
}
