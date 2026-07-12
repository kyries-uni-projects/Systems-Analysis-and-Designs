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

const inputClass = "rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

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
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			{error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}

			<label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
				Họ tên *
				<input name="hoTen" required defaultValue={khachHang?.hoTen} className={inputClass} />
			</label>

			<label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
				CCCD/Passport *
				<input name="cccdPassport" required defaultValue={khachHang?.cccdPassport} className={inputClass} />
			</label>

			<label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
				Số điện thoại *
				<input name="soDienThoai" required defaultValue={khachHang?.soDienThoai} className={inputClass} />
			</label>

			<label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
				Giới tính
				<input name="gioiTinh" defaultValue={khachHang?.gioiTinh ?? ""} className={inputClass} />
			</label>

			<label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
				Quốc tịch
				<input name="quocTich" defaultValue={khachHang?.quocTich ?? ""} className={inputClass} />
			</label>

			<label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
				Email
				<input name="email" type="email" defaultValue={khachHang?.email ?? ""} className={inputClass} />
			</label>

			<label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
				Ghi chú
				<textarea name="ghiChu" defaultValue={khachHang?.ghiChu ?? ""} className={inputClass} />
			</label>

			<button
				type="submit"
				disabled={isSubmitting}
				className="mt-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
			>
				{isSubmitting ? "Đang lưu..." : isEditing ? "Cập nhật" : "Tạo mới"}
			</button>
		</form>
	);
}
