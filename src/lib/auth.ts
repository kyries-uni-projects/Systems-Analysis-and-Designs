export const SESSION_COOKIE_NAME = "homestay_dorm_session";
export const SESSION_COOKIE_VALUE = "authenticated";
export const SESSION_USER_COOKIE_NAME = "homestay_dorm_user";

export type Role = "admin" | "nhanvien" | "quanly" | "ketoan";

export const roleLabels: Record<Role, string> = {
	admin: "Quản trị hệ thống",
	nhanvien: "Nhân viên",
	quanly: "Quản lý",
	ketoan: "Kế toán",
};

export type SessionUser = {
	name: string;
	role: Role;
	position: string;
};

export const demoAccounts: Record<string, { password: string; role: Role; name: string }> = {
	admin: { password: "admin123", role: "admin", name: "Nguyễn Văn An" },
	nhanvien01: { password: "nv123", role: "nhanvien", name: "Phạm Thị Dung" },
	quanly01: { password: "ql123", role: "quanly", name: "Trần Thị Bình" },
	ketoan01: { password: "kt123", role: "ketoan", name: "Lê Minh Cường" },
};

export function isValidDemoLogin(username: string, password: string) {
	return demoAccounts[username]?.password === password;
}
