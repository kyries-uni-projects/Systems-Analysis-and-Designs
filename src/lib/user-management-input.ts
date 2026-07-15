import type { Role } from "@/lib/auth";
import { ApiValidationError } from "@/lib/api-response";

export type UserManagementInput = {
	hoTen: string;
	tenDangNhap: string;
	email: string;
	soDienThoai?: string;
	chiNhan?: string;
	vaiTro: Role;
	trangThai: "Hoạt động" | "Ngừng hoạt động";
	matKhau?: string;
};

const allowedRoles: Role[] = ["admin", "nhanvien", "quanly", "ketoan"];

export function parseUserManagementInput(body: Record<string, unknown>, mode: "create" | "update"): UserManagementInput {
	const text = (key: string) => typeof body[key] === "string" ? body[key].trim() : "";
	const hoTen = text("hoTen");
	const tenDangNhap = text("tenDangNhap").toLowerCase();
	const email = text("email").toLowerCase();
	const soDienThoai = text("soDienThoai") || undefined;
	const chiNhan = text("chiNhan") || undefined;
	const vaiTro = text("vaiTro") as Role;
	const trangThai = text("trangThai") as UserManagementInput["trangThai"];
	const matKhau = typeof body.matKhau === "string" && body.matKhau ? body.matKhau : undefined;

	if (!hoTen || !tenDangNhap || !email) throw new ApiValidationError("Vui lòng điền đầy đủ Họ tên, Tên đăng nhập và Email.");
	if (hoTen.length < 2 || hoTen.length > 100) throw new ApiValidationError("Họ và tên phải từ 2 đến 100 ký tự.");
	if (!/^[a-z0-9._-]{3,32}$/.test(tenDangNhap)) throw new ApiValidationError("Tên đăng nhập phải có 3-32 ký tự, chỉ gồm chữ không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang.");
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) throw new ApiValidationError("Email không hợp lệ.");
	if (soDienThoai && !/^0\d{9}$/.test(soDienThoai)) throw new ApiValidationError("Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.");
	if (chiNhan && chiNhan.length > 100) throw new ApiValidationError("Tên chi nhánh không được vượt quá 100 ký tự.");
	if (!allowedRoles.includes(vaiTro)) throw new ApiValidationError("Vai trò người dùng không hợp lệ.");
	if (!["Hoạt động", "Ngừng hoạt động"].includes(trangThai)) throw new ApiValidationError("Trạng thái người dùng không hợp lệ.");
	if (mode === "create" && !matKhau) throw new ApiValidationError("Vui lòng nhập mật khẩu tạm thời.");
	if (matKhau && (matKhau.length < 6 || matKhau.length > 72)) throw new ApiValidationError("Mật khẩu phải từ 6 đến 72 ký tự.");

	return { hoTen, tenDangNhap, email, soDienThoai, chiNhan, vaiTro, trangThai, matKhau };
}
