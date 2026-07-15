import { ApiValidationError } from "@/lib/api-response";

export function parseLichHenNhanPhongInput(body: Record<string, unknown>) {
	const ngayNhanPhong = typeof body.ngayNhanPhong === "string" ? body.ngayNhanPhong.trim() : "";
	const gioNhanPhong = typeof body.gioNhanPhong === "string" ? body.gioNhanPhong.trim() : "";
	const ghiChu = typeof body.ghiChu === "string" ? body.ghiChu.trim() : undefined;

	if (!/^\d{4}-\d{2}-\d{2}$/.test(ngayNhanPhong)) throw new ApiValidationError("Ngày nhận phòng không hợp lệ.");
	if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(gioNhanPhong)) throw new ApiValidationError("Giờ nhận phòng không hợp lệ.");
	if (ghiChu && ghiChu.length > 500) throw new ApiValidationError("Ghi chú không được vượt quá 500 ký tự.");

	const date = new Date(`${ngayNhanPhong}T00:00:00`);
	if (Number.isNaN(date.getTime()) || date.getFullYear() !== Number(ngayNhanPhong.slice(0, 4)) || date.getMonth() + 1 !== Number(ngayNhanPhong.slice(5, 7)) || date.getDate() !== Number(ngayNhanPhong.slice(8, 10))) {
		throw new ApiValidationError("Ngày nhận phòng không tồn tại.");
	}

	return { ngayNhanPhong: date, gioNhanPhong, ghiChu };
}
