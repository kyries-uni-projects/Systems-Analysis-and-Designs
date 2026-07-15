import type { Role } from "@/lib/auth";

export const databaseRoleByRole: Record<Role, string> = {
	admin: "Admin",
	nhanvien: "Sale",
	quanly: "QuanLy",
	ketoan: "KeToan",
};

export function roleFromDatabase(value: string): Role | null {
	const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll(/[^a-zA-Z]/g, "").toLowerCase();
	if (normalized === "admin" || normalized === "quantri" || normalized === "quantrihethong") return "admin";
	if (normalized === "sale" || normalized === "nhanvien") return "nhanvien";
	if (normalized === "quanly") return "quanly";
	if (normalized === "ketoan") return "ketoan";
	return null;
}

export function isActiveUserStatus(value: string) {
	return value === "Hoạt động";
}
