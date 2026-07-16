import { ApiValidationError } from "@/lib/api-response";

export interface CreatePhongInput {
	maPhong: string;
	idLoaiPhong: number;
	sucChua: number;
	khu?: string;
	tang?: number;
	gioiTinhApDung?: string;
	tienIch?: string;
	trangThai?: string;
}

export type UpdatePhongInput = Partial<CreatePhongInput>;

export interface CreateGiuongInput {
	maGiuongLocal: string;
	trangThai?: string;
}

export type UpdateGiuongInput = Partial<CreateGiuongInput>;

export interface PhongGiuongRecord {
	giuongId: number;
	phongId: number;
	maGiuongLocal: string;
	trangThai: string;
	dangCoNguoiThue: boolean;
	soHopDongHieuLuc: number;
}

export interface PhongRecord {
	phongId: number;
	maPhong: string;
	khu: string | null;
	tang: number | null;
	idLoaiPhong: number;
	sucChua: number;
	gioiTinhApDung: string | null;
	tienIch: string | null;
	trangThai: string;
	ngayTao: string;
	loaiPhong: {
		idLoaiPhong: number;
		tenLoaiPhong: string;
		donGia: number;
	};
	giuongs: PhongGiuongRecord[];
	dangCoNguoiThue: boolean;
	soHopDongHieuLuc: number;
}

function toOptionalString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function toOptionalInt(value: unknown): number | undefined {
	if (value === undefined || value === null || value === "") return undefined;
	const parsed = Number(value);
	return Number.isInteger(parsed) ? parsed : undefined;
}

export const AVAILABLE_ROOM_STATUSES = ["Trống", "DANG_HOAT_DONG", "Đang hoạt động"] as const;
export const MANAGEABLE_STATUSES = ["Trống", "Đang bảo trì", "Ngừng hoạt động"] as const;
export const PHONG_STATUSES = [
	...AVAILABLE_ROOM_STATUSES,
	"Đang chờ xác nhận",
	"Đã cọc",
	"Đang sử dụng",
	"Đang bảo trì",
	"Ngừng hoạt động",
] as const;
export const GIUONG_STATUSES = [
	"Trống",
	"Đang chờ xác nhận",
	"Đã cọc",
	"Đang sử dụng",
	"Dang su dung",
	"Đang bảo trì",
	"Ngừng hoạt động",
] as const;

function toOptionalStatus(value: unknown): string | undefined {
	const status = toOptionalString(value);
	if (status && !PHONG_STATUSES.includes(status as (typeof PHONG_STATUSES)[number])) {
		throw new ApiValidationError("trangThai phòng không hợp lệ");
	}
	return status;
}

/** Parse + validate the body of `POST /api/phong`. Throws `ApiValidationError` on bad input. */
export function parseCreatePhongInput(body: unknown): CreatePhongInput {
	if (typeof body !== "object" || body === null) {
		throw new ApiValidationError("Request body phải là object");
	}
	const { maPhong, idLoaiPhong, sucChua, khu, tang, gioiTinhApDung, tienIch, trangThai } = body as Record<string, unknown>;

	if (typeof maPhong !== "string" || maPhong.trim().length === 0) {
		throw new ApiValidationError("maPhong là bắt buộc");
	}
	const idLoaiPhongNum = Number(idLoaiPhong);
	if (!Number.isInteger(idLoaiPhongNum) || idLoaiPhongNum <= 0) {
		throw new ApiValidationError("idLoaiPhong là bắt buộc và phải là số nguyên hợp lệ");
	}
	const sucChuaNum = Number(sucChua);
	if (!Number.isInteger(sucChuaNum) || sucChuaNum <= 0) {
		throw new ApiValidationError("sucChua là bắt buộc và phải là số nguyên dương");
	}

	return {
		maPhong: maPhong.trim(),
		idLoaiPhong: idLoaiPhongNum,
		sucChua: sucChuaNum,
		khu: toOptionalString(khu),
		tang: toOptionalInt(tang),
		gioiTinhApDung: toOptionalString(gioiTinhApDung),
		tienIch: toOptionalString(tienIch),
		trangThai: toOptionalStatus(trangThai) ?? "Trống",
	};
}

/** Parse + validate the body of `PATCH /api/phong/[id]` (partial update). */
export function parseUpdatePhongInput(body: unknown): UpdatePhongInput {
	if (typeof body !== "object" || body === null) {
		throw new ApiValidationError("Request body phải là object");
	}
	const { maPhong, idLoaiPhong, sucChua, khu, tang, gioiTinhApDung, tienIch, trangThai } = body as Record<string, unknown>;

	const input: UpdatePhongInput = {};

	if (maPhong !== undefined) {
		if (typeof maPhong !== "string" || maPhong.trim().length === 0) {
			throw new ApiValidationError("maPhong không hợp lệ");
		}
		input.maPhong = maPhong.trim();
	}
	if (idLoaiPhong !== undefined) {
		const idLoaiPhongNum = Number(idLoaiPhong);
		if (!Number.isInteger(idLoaiPhongNum) || idLoaiPhongNum <= 0) {
			throw new ApiValidationError("idLoaiPhong không hợp lệ");
		}
		input.idLoaiPhong = idLoaiPhongNum;
	}
	if (sucChua !== undefined) {
		const sucChuaNum = Number(sucChua);
		if (!Number.isInteger(sucChuaNum) || sucChuaNum <= 0) {
			throw new ApiValidationError("sucChua không hợp lệ");
		}
		input.sucChua = sucChuaNum;
	}
	if (khu !== undefined) input.khu = toOptionalString(khu);
	if (tang !== undefined) input.tang = toOptionalInt(tang);
	if (gioiTinhApDung !== undefined) input.gioiTinhApDung = toOptionalString(gioiTinhApDung);
	if (tienIch !== undefined) input.tienIch = toOptionalString(tienIch);
	if (trangThai !== undefined) input.trangThai = toOptionalStatus(trangThai);

	return input;
}

function parseGiuongStatus(value: unknown): string | undefined {
	const status = toOptionalString(value);
	if (status && !GIUONG_STATUSES.includes(status as (typeof GIUONG_STATUSES)[number])) {
		throw new ApiValidationError("trangThai giường không hợp lệ");
	}
	return status;
}

export function parseCreateGiuongInput(body: unknown): CreateGiuongInput {
	if (typeof body !== "object" || body === null) {
		throw new ApiValidationError("Request body phải là object");
	}
	const { maGiuongLocal, trangThai } = body as Record<string, unknown>;
	if (typeof maGiuongLocal !== "string" || maGiuongLocal.trim().length === 0) {
		throw new ApiValidationError("Mã giường là bắt buộc");
	}
	return {
		maGiuongLocal: maGiuongLocal.trim(),
		trangThai: parseGiuongStatus(trangThai) ?? "Trống",
	};
}

export function parseUpdateGiuongInput(body: unknown): UpdateGiuongInput {
	if (typeof body !== "object" || body === null) {
		throw new ApiValidationError("Request body phải là object");
	}
	const { maGiuongLocal, trangThai } = body as Record<string, unknown>;
	const input: UpdateGiuongInput = {};
	if (maGiuongLocal !== undefined) {
		if (typeof maGiuongLocal !== "string" || maGiuongLocal.trim().length === 0) {
			throw new ApiValidationError("Mã giường không hợp lệ");
		}
		input.maGiuongLocal = maGiuongLocal.trim();
	}
	if (trangThai !== undefined) input.trangThai = parseGiuongStatus(trangThai);
	return input;
}
