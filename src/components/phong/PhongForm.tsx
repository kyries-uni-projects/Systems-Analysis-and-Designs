"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

interface LoaiPhongOption {
	idLoaiPhong: number;
	tenLoaiPhong: string;
}

interface PhongFormProps {
	loaiPhongs: LoaiPhongOption[];
	phong?: {
		phongId: number;
		maPhong: string;
		khu: string | null;
		tang: number | null;
		idLoaiPhong: number;
		sucChua: number;
		gioiTinhApDung: string | null;
		tienIch: string | null;
		trangThai: string;
	};
}

const inputClass = "rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

/** Create/edit form for Phong — same component posts to POST or PATCH depending on `phong` prop. */
export default function PhongForm({ loaiPhongs, phong }: PhongFormProps) {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const isEditing = Boolean(phong);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setIsSubmitting(true);

		const formData = new FormData(event.currentTarget);
		const payload = {
			maPhong: formData.get("maPhong"),
			idLoaiPhong: formData.get("idLoaiPhong"),
			sucChua: formData.get("sucChua"),
			khu: formData.get("khu") || undefined,
			tang: formData.get("tang") || undefined,
			gioiTinhApDung: formData.get("gioiTinhApDung") || undefined,
			tienIch: formData.get("tienIch") || undefined,
			trangThai: formData.get("trangThai") || undefined,
		};

		try {
			const url = isEditing ? `/api/phong/${phong!.phongId}` : "/api/phong";
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

			router.push("/phong");
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
				Mã phòng *
				<input name="maPhong" required defaultValue={phong?.maPhong} className={inputClass} />
			</label>

			<label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
				Loại phòng *
				<select name="idLoaiPhong" required defaultValue={phong?.idLoaiPhong ?? ""} className={inputClass}>
					<option value="">-- Chọn loại phòng --</option>
					{loaiPhongs.map((loaiPhong) => (
						<option key={loaiPhong.idLoaiPhong} value={loaiPhong.idLoaiPhong}>
							{loaiPhong.tenLoaiPhong}
						</option>
					))}
				</select>
			</label>

			<label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
				Sức chứa *
				<input name="sucChua" type="number" min={1} required defaultValue={phong?.sucChua} className={inputClass} />
			</label>

			<label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
				Khu
				<input name="khu" defaultValue={phong?.khu ?? ""} className={inputClass} />
			</label>

			<label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
				Tầng
				<input name="tang" type="number" defaultValue={phong?.tang ?? ""} className={inputClass} />
			</label>

			<label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
				Giới tính áp dụng
				<input name="gioiTinhApDung" defaultValue={phong?.gioiTinhApDung ?? ""} className={inputClass} />
			</label>

			<label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
				Tiện ích
				<input name="tienIch" defaultValue={phong?.tienIch ?? ""} className={inputClass} />
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
