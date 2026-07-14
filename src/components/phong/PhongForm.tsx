"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { GENDER_OPTIONS } from "@/lib/gender";

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

const inputClass =
	"rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#101828] outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

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
		<form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-[#d7ece7] bg-white p-6 shadow-sm">
			{error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

			<label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
				Mã phòng *
				<input name="maPhong" required defaultValue={phong?.maPhong} className={inputClass} />
			</label>

			<label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
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

			<label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
				Sức chứa *
				<input name="sucChua" type="number" min={1} required defaultValue={phong?.sucChua} className={inputClass} />
			</label>

			<label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
				Khu
				<input name="khu" defaultValue={phong?.khu ?? ""} className={inputClass} />
			</label>

			<label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
				Tầng
				<input name="tang" type="number" defaultValue={phong?.tang ?? ""} className={inputClass} />
			</label>

			<label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
				Giới tính áp dụng
				<select name="gioiTinhApDung" defaultValue={phong?.gioiTinhApDung ?? ""} className={inputClass}>
					<option value="">Không giới hạn</option>
					{GENDER_OPTIONS.map((gender) => (
						<option key={gender} value={gender}>{gender}</option>
					))}
				</select>
			</label>

			<label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
				Tiện ích
				<input name="tienIch" defaultValue={phong?.tienIch ?? ""} className={inputClass} />
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
