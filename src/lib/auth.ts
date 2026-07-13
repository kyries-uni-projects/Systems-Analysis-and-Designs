export const SESSION_COOKIE_NAME = "homestay_dorm_session";
export const SESSION_COOKIE_VALUE = "authenticated";

export type Role = "admin" | "nhanvien" | "quanly" | "ketoan";

export const roleLabels: Record<Role, string> = {
	admin: "Quản trị hệ thống",
	nhanvien: "Nhân viên",
	quanly: "Quản lý",
	ketoan: "Kế toán",
};

export const demoAccounts: Record<string, { password: string; role: Role }> = {
	admin: { password: "admin123", role: "admin" },
	nhanvien01: { password: "nv123", role: "nhanvien" },
	quanly01: { password: "ql123", role: "quanly" },
	ketoan01: { password: "kt123", role: "ketoan" },
};

export function isValidDemoLogin(username: string, password: string) {
	return demoAccounts[username]?.password === password;
}
