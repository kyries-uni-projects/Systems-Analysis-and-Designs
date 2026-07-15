"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Edit3, Plus, Search, ShieldCheck, Trash2, UserRound, UsersRound, X } from "lucide-react";
import type { Role } from "@/lib/auth";

type UserRecord = {
	nguoiDungId: number;
	hoTen: string;
	tenDangNhap: string;
	email: string | null;
	soDienThoai: string | null;
	chiNhan: string | null;
	vaiTro: string;
	role: Role | null;
	trangThai: string;
	ngayTao: string;
};

type FormState = {
	hoTen: string;
	tenDangNhap: string;
	email: string;
	soDienThoai: string;
	chiNhan: string;
	vaiTro: Role;
	trangThai: "Hoạt động" | "Ngừng hoạt động";
	matKhau: string;
};

const emptyForm: FormState = {
	hoTen: "",
	tenDangNhap: "",
	email: "",
	soDienThoai: "",
	chiNhan: "",
	vaiTro: "nhanvien",
	trangThai: "Hoạt động",
	matKhau: "",
};

const roleMeta: Record<Role, { label: string; className: string }> = {
	admin: { label: "Quản trị hệ thống", className: "bg-slate-100 text-slate-700" },
	quanly: { label: "Quản lý", className: "bg-blue-50 text-blue-700" },
	ketoan: { label: "Kế toán", className: "bg-amber-50 text-amber-700" },
	nhanvien: { label: "Nhân viên", className: "bg-teal-50 text-teal-700" },
};

const avatarColors = ["bg-teal-500", "bg-blue-500", "bg-amber-500", "bg-violet-500", "bg-pink-500", "bg-[#1b2b4b]"];

function initials(name: string) {
	return name.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]?.toUpperCase()).join("");
}

function readError(payload: unknown, fallback: string) {
	if (typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string") return payload.error;
	return fallback;
}

export default function UserManagementPage() {
	const [users, setUsers] = useState<UserRecord[]>([]);
	const [search, setSearch] = useState("");
	const [roleFilter, setRoleFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");
	const [isLoading, setIsLoading] = useState(true);
	const [pageError, setPageError] = useState("");
	const [success, setSuccess] = useState("");
	const [editingUser, setEditingUser] = useState<UserRecord | null | undefined>(undefined);
	const [deleteUser, setDeleteUser] = useState<UserRecord | null>(null);

	const loadUsers = useCallback(async () => {
		try {
			setPageError("");
			const response = await fetch("/api/users", { cache: "no-store" });
			const payload = await response.json();
			if (!response.ok || !payload.success) throw new Error(readError(payload, "Không thể tải danh sách người dùng."));
			setUsers(payload.data);
		} catch (error) {
			setPageError(error instanceof Error ? error.message : "Không thể tải danh sách người dùng.");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		const loadTimer = window.setTimeout(() => { void loadUsers(); });
		return () => window.clearTimeout(loadTimer);
	}, [loadUsers]);

	const filteredUsers = useMemo(() => {
		const term = search.trim().toLocaleLowerCase("vi-VN");
		return users.filter((user) => {
			const matchesSearch = !term || [user.hoTen, user.tenDangNhap, user.email ?? "", user.soDienThoai ?? ""].some((value) => value.toLocaleLowerCase("vi-VN").includes(term));
			return matchesSearch && (roleFilter === "all" || user.role === roleFilter) && (statusFilter === "all" || user.trangThai === statusFilter);
		});
	}, [roleFilter, search, statusFilter, users]);

	const stats = {
		total: users.length,
		active: users.filter((user) => user.trangThai === "Hoạt động").length,
		admins: users.filter((user) => user.role === "admin").length,
		staff: users.filter((user) => user.role === "nhanvien").length,
	};

	async function toggleStatus(user: UserRecord) {
		setPageError("");
		setSuccess("");
		const nextActive = user.trangThai !== "Hoạt động";
		const response = await fetch(`/api/users/${user.nguoiDungId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ active: nextActive }),
		});
		const payload = await response.json().catch(() => ({}));
		if (!response.ok || !payload.success) {
			setPageError(readError(payload, "Không thể cập nhật trạng thái tài khoản."));
			return;
		}
		setUsers((current) => current.map((item) => item.nguoiDungId === user.nguoiDungId ? payload.data : item));
		setSuccess(nextActive ? "Đã kích hoạt tài khoản." : "Đã ngừng tài khoản và vô hiệu hóa các phiên đăng nhập cũ.");
	}

	async function confirmDelete() {
		if (!deleteUser) return;
		const response = await fetch(`/api/users/${deleteUser.nguoiDungId}`, { method: "DELETE" });
		const payload = await response.json().catch(() => ({}));
		if (!response.ok || !payload.success) {
			setDeleteUser(null);
			setPageError(readError(payload, "Không thể xóa tài khoản."));
			return;
		}
		setUsers((current) => current.filter((item) => item.nguoiDungId !== deleteUser.nguoiDungId));
		setDeleteUser(null);
		setSuccess("Đã xóa tài khoản và vô hiệu hóa các phiên đăng nhập cũ.");
	}

	return (
		<main className="min-h-full bg-[#f2f6fb] px-4 py-8 sm:px-8">
			<div className="mx-auto w-full max-w-5xl">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div><h1 className="text-2xl font-bold text-[#1b2b4b]">Quản lý người dùng</h1><p className="mt-1 text-sm text-slate-500">Quản lý tài khoản và phân quyền cho nhân viên hệ thống</p></div>
					<button type="button" onClick={() => setEditingUser(null)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#20365f] px-5 text-sm font-semibold text-white transition hover:bg-[#182b4e]"><Plus className="size-4" />Thêm người dùng</button>
				</div>

				{pageError && <div className="mt-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"><AlertTriangle className="size-4 shrink-0" />{pageError}</div>}
				{success && <div className="mt-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><CheckCircle2 className="size-4 shrink-0" />{success}</div>}

				<section className="mt-6 grid gap-4 sm:grid-cols-2">
					<StatCard icon={<UsersRound className="size-6" />} value={stats.total} label="Tổng tài khoản" color="text-[#1b2b4b]" />
					<StatCard icon={<CheckCircle2 className="size-6" />} value={stats.active} label="Đang hoạt động" color="text-teal-600" />
					<StatCard icon={<ShieldCheck className="size-6" />} value={stats.admins} label="Quản trị viên" color="text-blue-600" />
					<StatCard icon={<UserRound className="size-6" />} value={stats.staff} label="Nhân viên" color="text-amber-500" />
				</section>

				<section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
					<div className="grid gap-3 md:grid-cols-[minmax(260px,1fr)_180px_180px_auto]">
						<label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên, username, email..." className="h-11 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" /></label>
						<FilterSelect value={roleFilter} onChange={setRoleFilter}><option value="all">Tất cả vai trò</option>{Object.entries(roleMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</FilterSelect>
						<FilterSelect value={statusFilter} onChange={setStatusFilter}><option value="all">Tất cả trạng thái</option><option value="Hoạt động">Hoạt động</option><option value="Ngừng hoạt động">Ngừng hoạt động</option></FilterSelect>
						<span className="self-center text-right text-xs text-slate-400">{filteredUsers.length} kết quả</span>
					</div>
				</section>

				<section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
					<div className="overflow-x-auto">
						<table className="w-full min-w-220 text-left text-sm">
							<thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4 font-semibold">Người dùng</th><th className="px-3 py-4 font-semibold">Vai trò</th><th className="px-3 py-4 font-semibold">Liên hệ</th><th className="px-3 py-4 font-semibold">Chi nhánh</th><th className="px-3 py-4 font-semibold">Trạng thái</th><th className="px-3 py-4 font-semibold">Ngày tạo</th><th className="px-5 py-4 text-right font-semibold">Thao tác</th></tr></thead>
							<tbody className="divide-y divide-slate-100">
								{filteredUsers.map((user, index) => {
									const meta = user.role ? roleMeta[user.role] : { label: user.vaiTro, className: "bg-slate-100 text-slate-600" };
									const active = user.trangThai === "Hoạt động";
									return <tr key={user.nguoiDungId} className="text-slate-600">
										<td className="px-5 py-4"><div className="flex items-center gap-3"><span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarColors[index % avatarColors.length]}`}>{initials(user.hoTen)}</span><div><p className="font-medium text-[#1b2b4b]">{user.hoTen}</p><p className="text-xs text-slate-400">@{user.tenDangNhap}</p></div></div></td>
										<td className="px-3 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${meta.className}`}>{meta.label}</span></td>
										<td className="px-3 py-4"><p>{user.email || "—"}</p><p className="mt-0.5 text-xs text-slate-400">{user.soDienThoai || "—"}</p></td>
										<td className="px-3 py-4 text-xs">{user.chiNhan || "—"}</td>
										<td className="px-3 py-4"><button type="button" onClick={() => void toggleStatus(user)} className="inline-flex items-center gap-2 text-xs"><span className={`relative h-5 w-9 rounded-full transition ${active ? "bg-teal-500" : "bg-slate-200"}`}><span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition ${active ? "left-4.5" : "left-0.5"}`} /></span><span className={active ? "text-teal-600" : "text-slate-400"}>{active ? "Hoạt động" : "Ngừng"}</span></button></td>
										<td className="px-3 py-4 text-xs">{new Date(user.ngayTao).toLocaleDateString("vi-VN")}</td>
										<td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => setEditingUser(user)} aria-label={`Chỉnh sửa ${user.hoTen}`} className="rounded-md p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Edit3 className="size-4" /></button><button type="button" onClick={() => setDeleteUser(user)} aria-label={`Xóa ${user.hoTen}`} className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="size-4" /></button></div></td>
									</tr>;
								})}
								{!isLoading && filteredUsers.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">Không có người dùng phù hợp.</td></tr>}
								{isLoading && <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">Đang tải danh sách người dùng...</td></tr>}
							</tbody>
						</table>
					</div>
				</section>
			</div>

			{editingUser !== undefined && <UserFormModal user={editingUser} onClose={() => setEditingUser(undefined)} onSaved={(user, created) => { setUsers((current) => created ? [...current, user] : current.map((item) => item.nguoiDungId === user.nguoiDungId ? user : item)); setEditingUser(undefined); setSuccess(created ? "Tạo tài khoản thành công." : "Đã lưu thay đổi người dùng."); }} />}
			{deleteUser && <DeleteModal user={deleteUser} onClose={() => setDeleteUser(null)} onConfirm={() => void confirmDelete()} />}
		</main>
	);
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
	return <div className="flex min-h-20 items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm"><span className={color}>{icon}</span><div><p className={`text-2xl font-bold ${color}`}>{value}</p><p className="text-xs text-slate-500">{label}</p></div></div>;
}

function FilterSelect({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: React.ReactNode }) {
	return <label className="relative"><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-600 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100">{children}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /></label>;
}

function UserFormModal({ user, onClose, onSaved }: { user: UserRecord | null; onClose: () => void; onSaved: (user: UserRecord, created: boolean) => void }) {
	const isCreate = user === null;
	const [form, setForm] = useState<FormState>(() => user ? { hoTen: user.hoTen, tenDangNhap: user.tenDangNhap, email: user.email ?? "", soDienThoai: user.soDienThoai ?? "", chiNhan: user.chiNhan ?? "", vaiTro: user.role ?? "nhanvien", trangThai: user.trangThai === "Hoạt động" ? "Hoạt động" : "Ngừng hoạt động", matKhau: "" } : emptyForm);
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const update = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));

	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		if (!form.hoTen.trim() || !form.tenDangNhap.trim() || !form.email.trim()) { setError("Vui lòng điền đầy đủ Họ tên, Tên đăng nhập và Email."); return; }
		if (isCreate && !form.matKhau) { setError("Vui lòng nhập mật khẩu tạm thời."); return; }
		setIsSubmitting(true);
		const response = await fetch(isCreate ? "/api/users" : `/api/users/${user.nguoiDungId}`, { method: isCreate ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
		const payload = await response.json().catch(() => ({}));
		setIsSubmitting(false);
		if (!response.ok || !payload.success) { setError(readError(payload, isCreate ? "Không thể tạo tài khoản." : "Không thể lưu thay đổi.")); return; }
		onSaved(payload.data, isCreate);
	}

	return <ModalShell onClose={onClose}>
		<div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-[#1b2b4b]">{isCreate ? "Thêm người dùng mới" : "Chỉnh sửa người dùng"}</h2><p className="mt-1 text-xs text-slate-400">{isCreate ? "Điền thông tin để tạo tài khoản mới" : `Cập nhật thông tin cho @${user.tenDangNhap}`}</p></div><CloseButton onClick={onClose} /></div>
		{error && <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{error}</div>}
		<form onSubmit={submit} className="mt-6">
			<div className="grid gap-4 sm:grid-cols-2">
				<FormField className="sm:col-span-2" label="Họ và tên" required value={form.hoTen} onChange={(value) => update("hoTen", value)} placeholder="Nguyễn Văn A" />
				<FormField label="Tên đăng nhập" required value={form.tenDangNhap} onChange={(value) => update("tenDangNhap", value)} placeholder="nguyenvana" disabled={!isCreate} hint={!isCreate ? "Không thể thay đổi tên đăng nhập" : undefined} />
				<FormField label="Số điện thoại" value={form.soDienThoai} onChange={(value) => update("soDienThoai", value)} placeholder="09xxxxxxxx" />
				<FormField className="sm:col-span-2" label="Email" required type="email" value={form.email} onChange={(value) => update("email", value)} placeholder="email@homestaydorm.vn" />
				<FormField label="Chi nhánh" value={form.chiNhan} onChange={(value) => update("chiNhan", value)} placeholder="Chi nhánh trung tâm" />
				<FormField label={isCreate ? "Mật khẩu tạm thời" : "Mật khẩu mới"} required={isCreate} type="password" value={form.matKhau} onChange={(value) => update("matKhau", value)} placeholder={isCreate ? "Tối thiểu 6 ký tự" : "Để trống nếu giữ nguyên"} />
				<SelectField label="Vai trò" value={form.vaiTro} onChange={(value) => update("vaiTro", value)}><option value="nhanvien">Nhân viên</option><option value="quanly">Quản lý</option><option value="ketoan">Kế toán</option><option value="admin">Quản trị hệ thống</option></SelectField>
				<SelectField label="Trạng thái" value={form.trangThai} onChange={(value) => update("trangThai", value)}><option value="Hoạt động">Hoạt động</option><option value="Ngừng hoạt động">Ngừng hoạt động</option></SelectField>
			</div>
			<div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5"><button type="button" onClick={onClose} className="h-11 rounded-lg bg-slate-100 text-sm font-medium text-slate-600">Hủy</button><button disabled={isSubmitting} className="h-11 rounded-lg bg-[#20365f] text-sm font-semibold text-white disabled:opacity-50">{isSubmitting ? "Đang lưu..." : isCreate ? "Tạo tài khoản" : "Lưu thay đổi"}</button></div>
		</form>
	</ModalShell>;
}

function DeleteModal({ user, onClose, onConfirm }: { user: UserRecord; onClose: () => void; onConfirm: () => void }) {
	return <ModalShell narrow onClose={onClose}><div className="text-center"><span className="mx-auto flex size-14 items-center justify-center rounded-full bg-red-50 text-red-500"><Trash2 className="size-7" /></span><h2 className="mt-5 text-xl font-bold text-[#1b2b4b]">Xác nhận xóa tài khoản</h2><p className="mt-2 text-sm text-slate-500">Bạn có chắc muốn xóa tài khoản của</p><p className="mt-1 font-semibold text-[#1b2b4b]">{user.hoTen}</p><p className="text-xs text-slate-400">@{user.tenDangNhap}</p><p className="mt-5 text-xs text-red-500">Tài khoản sẽ không thể đăng nhập hoặc xuất hiện trong danh sách.</p></div><div className="mt-6 grid grid-cols-2 gap-3"><button type="button" onClick={onClose} className="h-11 rounded-lg bg-slate-100 text-sm font-medium text-slate-600">Hủy</button><button type="button" onClick={onConfirm} className="h-11 rounded-lg bg-red-500 text-sm font-semibold text-white hover:bg-red-600">Xóa tài khoản</button></div></ModalShell>;
}

function ModalShell({ children, onClose, narrow = false }: { children: React.ReactNode; onClose: () => void; narrow?: boolean }) {
	return <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 px-4 py-10" role="dialog" aria-modal="true"><button type="button" aria-label="Đóng" onClick={onClose} className="fixed inset-0" /><section className={`relative z-10 w-full rounded-2xl bg-white p-7 shadow-2xl ${narrow ? "max-w-lg" : "max-w-xl"}`}>{children}</section></div>;
}

function CloseButton({ onClick }: { onClick: () => void }) { return <button type="button" onClick={onClick} aria-label="Đóng" className="rounded-md p-1 text-slate-400 hover:bg-slate-100"><X className="size-5" /></button>; }

function FormField({ label, value, onChange, placeholder, required, disabled, hint, type = "text", className = "" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean; disabled?: boolean; hint?: string; type?: string; className?: string }) {
	return <label className={`block text-sm font-medium text-[#1b2b4b] ${className}`}>{label}{required && <span className="ml-1 text-red-500">*</span>}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} disabled={disabled} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 disabled:text-slate-400" />{hint && <span className="mt-1 block text-[11px] font-normal text-slate-400">{hint}</span>}</label>;
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
	return <label className="block text-sm font-medium text-[#1b2b4b]">{label}<span className="relative mt-2 block"><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100">{children}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /></span></label>;
}
