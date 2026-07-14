"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

interface KhachHangFormProps {
	khachHang?: {
		khachHangId: number;
		hoTen: string;
		cccdPassport: string;
		soDienThoai: string;
		gioiTinh: string | null;
		quocTich: string | null;
		email: string | null;
		ghiChu: string | null;
	};
}

const inputClass =
	"rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#101828] outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

/** Create/edit form for KhachHang — same component posts to POST or PATCH depending on `khachHang` prop. */
export default function KhachHangForm({ khachHang }: KhachHangFormProps) {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const isEditing = Boolean(khachHang);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setIsSubmitting(true);

		const formData = new FormData(event.currentTarget);
		const payload = {
			hoTen: formData.get("hoTen"),
			cccdPassport: formData.get("cccdPassport"),
			soDienThoai: formData.get("soDienThoai"),
			gioiTinh: formData.get("gioiTinh") || undefined,
			quocTich: formData.get("quocTich") || undefined,
			email: formData.get("email") || undefined,
			ghiChu: formData.get("ghiChu") || undefined,
		};

		try {
			const url = isEditing ? `/api/khach-hang/${khachHang!.khachHangId}` : "/api/khach-hang";
			const method = isEditing ? "PATCH" : "POST";
			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const result = await response.json();

			if (!response.ok || !result.success) {
				throw new Error(result.error ?? "Có lỗi xảy ra");
			}

			router.push("/khach-hang");
			router.refresh();
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : "Có lỗi xảy ra");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-[#d7ece7] bg-white p-6 shadow-sm">
			{error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

			<label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
				Họ tên *
				<input name="hoTen" required defaultValue={khachHang?.hoTen} className={inputClass} />
			</label>

			<label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
				CCCD/Passport *
				<input name="cccdPassport" required defaultValue={khachHang?.cccdPassport} className={inputClass} />
			</label>

			<label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
				Số điện thoại *
				<input name="soDienThoai" required defaultValue={khachHang?.soDienThoai} className={inputClass} />
			</label>

			<label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
				Giới tính
				<input name="gioiTinh" defaultValue={khachHang?.gioiTinh ?? ""} className={inputClass} />
			</label>

			<label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
				Quốc tịch
				<input name="quocTich" defaultValue={khachHang?.quocTich ?? ""} className={inputClass} />
			</label>

			<label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
				Email
				<input name="email" type="email" defaultValue={khachHang?.email ?? ""} className={inputClass} />
			</label>

			<label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
				Ghi chú
				<textarea name="ghiChu" defaultValue={khachHang?.ghiChu ?? ""} className={inputClass} />
			</label>

			<button
				type="submit"
				disabled={isSubmitting}
				className="mt-2 rounded-lg bg-[#0f766e] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b625b] disabled:opacity-50"
			>
				{isSubmitting ? "Đang lưu..." : isEditing ? "Cập nhật" : "Tạo mới"}
			</button>
		</form>
	);
}
