import { ApiValidationError } from "@/lib/api-response";
import { isGender } from "@/lib/gender";

export interface CreateKhachHangInput {
	hoTen: string;
	cccdPassport: string;
	soDienThoai: string;
	gioiTinh?: string;
	quocTich?: string;
	email?: string;
	ghiChu?: string;
}

export type UpdateKhachHangInput = Partial<CreateKhachHangInput>;

function toOptionalString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function toOptionalGender(value: unknown) {
	const gender = toOptionalString(value);
	if (gender && !isGender(gender)) throw new ApiValidationError("Giới tính không hợp lệ");
	return gender;
}

/** Parse + validate the body of `POST /api/khach-hang`. Throws `ApiValidationError` on bad input. */
export function parseCreateKhachHangInput(body: unknown): CreateKhachHangInput {
	if (typeof body !== "object" || body === null) {
		throw new ApiValidationError("Request body phải là object");
	}
	const { hoTen, cccdPassport, soDienThoai, gioiTinh, quocTich, email, ghiChu } = body as Record<string, unknown>;

	if (typeof hoTen !== "string" || hoTen.trim().length === 0) {
		throw new ApiValidationError("hoTen là bắt buộc");
	}
	if (typeof cccdPassport !== "string" || cccdPassport.trim().length === 0) {
		throw new ApiValidationError("cccdPassport là bắt buộc");
	}
	if (typeof soDienThoai !== "string" || soDienThoai.trim().length === 0) {
		throw new ApiValidationError("soDienThoai là bắt buộc");
	}

	return {
		hoTen: hoTen.trim(),
		cccdPassport: cccdPassport.trim(),
		soDienThoai: soDienThoai.trim(),
		gioiTinh: toOptionalGender(gioiTinh),
		quocTich: toOptionalString(quocTich),
		email: toOptionalString(email),
		ghiChu: toOptionalString(ghiChu),
	};
}

/** Parse + validate the body of `PATCH /api/khach-hang/[id]` (partial update). */
export function parseUpdateKhachHangInput(body: unknown): UpdateKhachHangInput {
	if (typeof body !== "object" || body === null) {
		throw new ApiValidationError("Request body phải là object");
	}
	const { hoTen, cccdPassport, soDienThoai, gioiTinh, quocTich, email, ghiChu } = body as Record<string, unknown>;

	const input: UpdateKhachHangInput = {};

	if (hoTen !== undefined) {
		if (typeof hoTen !== "string" || hoTen.trim().length === 0) {
			throw new ApiValidationError("hoTen không hợp lệ");
		}
		input.hoTen = hoTen.trim();
	}
	if (cccdPassport !== undefined) {
		if (typeof cccdPassport !== "string" || cccdPassport.trim().length === 0) {
			throw new ApiValidationError("cccdPassport không hợp lệ");
		}
		input.cccdPassport = cccdPassport.trim();
	}
	if (soDienThoai !== undefined) {
		if (typeof soDienThoai !== "string" || soDienThoai.trim().length === 0) {
			throw new ApiValidationError("soDienThoai không hợp lệ");
		}
		input.soDienThoai = soDienThoai.trim();
	}
	if (gioiTinh !== undefined) input.gioiTinh = toOptionalGender(gioiTinh);
	if (quocTich !== undefined) input.quocTich = toOptionalString(quocTich);
	if (email !== undefined) input.email = toOptionalString(email);
	if (ghiChu !== undefined) input.ghiChu = toOptionalString(ghiChu);

	return input;
}
