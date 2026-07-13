"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, ChevronRight, Search, XCircle } from "lucide-react";

type MatchingRoom = {
	phongId: number;
	maPhong: string;
	khu: string | null;
	tang: number | null;
	sucChua: number;
	loaiPhong: string;
	donGia: number;
	tienIch: string | null;
	soGiuongTrong: number;
};

type SubmissionResult = {
	yeuCau: { yeuCauId: number; trangThai: string };
	phongPhuHop: MatchingRoom[];
};

const initialForm = {
	hoTen: "",
	cccdPassport: "",
	gioiTinh: "",
	quocTich: "Việt Nam",
	soDienThoai: "",
	email: "",
	ghiChu: "",
	loaiThue: "Thuê giường",
	khuVucMongMuon: "Tất cả khu vực",
	soNguoiDuKien: "1",
	mucGiaTu: "",
	mucGiaDen: "",
	thoiGianDuKienVaoO: "",
	thoiHanThueThang: "",
};

const amenities = ["Yên tĩnh", "Gần trung tâm", "Có điều hòa", "Giờ giấc tự do", "Gửi xe"];

const inputClass =
	"mt-1.5 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#155DFC] focus:ring-2 focus:ring-blue-100";
const labelClass = "text-xs font-medium text-slate-600";

function formatPrice(price: number) {
	return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(price);
}

export default function YeuCauThueForm() {
	const [form, setForm] = useState(initialForm);
	const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
	const [result, setResult] = useState<SubmissionResult | null>(null);
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	function updateField(field: keyof typeof form, value: string) {
		setForm((current) => ({ ...current, [field]: value }));
	}

	function toggleAmenity(amenity: string) {
		setSelectedAmenities((current) => (current.includes(amenity) ? current.filter((item) => item !== amenity) : [...current, amenity]));
	}

	function resetForm() {
		setForm(initialForm);
		setSelectedAmenities([]);
		setResult(null);
		setError("");
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		setResult(null);
		setIsSubmitting(true);

		try {
			const response = await fetch("/api/yeu-cau-thue", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...form, tieuChiUuTien: selectedAmenities }),
			});
			const payload: { success: boolean; data?: SubmissionResult; error?: string } = await response.json();
			if (!response.ok || !payload.success || !payload.data) {
				throw new Error(payload.error ?? "Không thể lưu yêu cầu thuê phòng.");
			}
			setResult(payload.data);
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : "Không thể lưu yêu cầu thuê phòng.");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="pb-10">
			<div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
				<span>Đăng ký thuê phòng</span>
				<ChevronRight className="size-4" aria-hidden="true" />
				<span className="font-medium text-slate-900">Ghi nhận yêu cầu thuê phòng</span>
			</div>
			<h1 className="text-2xl font-bold text-slate-900">Ghi nhận yêu cầu thuê phòng</h1>

			<ol className="my-7 grid grid-cols-4 gap-2 sm:gap-4" aria-label="Tiến trình thuê phòng">
				{["Thông tin khách hàng", "Tiêu chí thuê phòng", "Kết quả phù hợp", "Lập lịch xem phòng"].map((step, index) => (
					<li key={step} className="flex min-w-0 items-center gap-2 last:flex-none">
						<div className="flex flex-col items-center text-center">
							<span
								className={`flex size-8 items-center justify-center rounded-full border-2 text-sm font-medium ${index === 0 ? "border-[#155DFC] bg-[#155DFC] text-white" : "border-slate-300 bg-white text-slate-500"}`}
							>
								{index + 1}
							</span>
							<span className={`mt-2 max-w-24 text-xs leading-4 ${index === 0 ? "font-semibold text-slate-800" : "text-slate-500"}`}>{step}</span>
						</div>
						{index < 3 && <span className="mb-8 hidden h-0.5 flex-1 bg-slate-200 sm:block" />}
					</li>
				))}
			</ol>

			<div className="grid gap-5 lg:grid-cols-2">
				<section className="rounded-lg border border-[#d7ece7] bg-[#f8fefd] p-5 shadow-sm">
					<h2 className="text-base font-semibold text-slate-900">Thông tin khách hàng</h2>
					<div className="mt-5 space-y-4">
						<label className={labelClass}>
							Họ và tên <span className="text-red-500">*</span>
							<input
								required
								value={form.hoTen}
								onChange={(event) => updateField("hoTen", event.target.value)}
								placeholder="Nhập họ và tên"
								className={inputClass}
							/>
						</label>
						<label className={labelClass}>
							Số CCCD/Passport <span className="text-red-500">*</span>
							<input
								required
								value={form.cccdPassport}
								onChange={(event) => updateField("cccdPassport", event.target.value)}
								placeholder="Nhập số CCCD/Passport"
								className={inputClass}
							/>
						</label>
						<label className={labelClass}>
							Giới tính <span className="text-red-500">*</span>
							<select required value={form.gioiTinh} onChange={(event) => updateField("gioiTinh", event.target.value)} className={inputClass}>
								<option value="">Chọn giới tính</option>
								<option>Nam</option>
								<option>Nữ</option>
								<option>Khác</option>
							</select>
						</label>
						<label className={labelClass}>
							Quốc tịch <span className="text-red-500">*</span>
							<input required value={form.quocTich} onChange={(event) => updateField("quocTich", event.target.value)} className={inputClass} />
						</label>
						<label className={labelClass}>
							Số điện thoại <span className="text-red-500">*</span>
							<input
								required
								type="tel"
								value={form.soDienThoai}
								onChange={(event) => updateField("soDienThoai", event.target.value)}
								placeholder="Nhập số điện thoại"
								className={inputClass}
							/>
						</label>
						<label className={labelClass}>
							Email
							<input
								type="email"
								value={form.email}
								onChange={(event) => updateField("email", event.target.value)}
								placeholder="Nhập email"
								className={inputClass}
							/>
						</label>
						<label className={labelClass}>
							Ghi chú
							<textarea
								value={form.ghiChu}
								onChange={(event) => updateField("ghiChu", event.target.value)}
								placeholder="Nhập ghi chú"
								className={`${inputClass} h-20 resize-y py-2`}
							/>
						</label>
					</div>
				</section>

				<section className="rounded-lg border border-[#d7ece7] bg-[#f8fefd] p-5 shadow-sm">
					<h2 className="text-base font-semibold text-slate-900">Tiêu chí thuê phòng</h2>
					<div className="mt-5 space-y-4">
						<fieldset>
							<legend className={labelClass}>
								Loại thuê <span className="text-red-500">*</span>
							</legend>
							<div className="mt-1.5 grid grid-cols-2 gap-2">
								{["Thuê giường", "Thuê nguyên phòng"].map((type) => (
									<button
										key={type}
										type="button"
										onClick={() => updateField("loaiThue", type)}
										className={`h-10 rounded-md border text-sm font-medium transition ${form.loaiThue === type ? "border-[#155DFC] bg-blue-50 text-[#155DFC]" : "border-slate-200 bg-white text-slate-600 hover:border-blue-200"}`}
									>
										{type}
									</button>
								))}
							</div>
						</fieldset>
						<label className={labelClass}>
							Khu vực mong muốn
							<select value={form.khuVucMongMuon} onChange={(event) => updateField("khuVucMongMuon", event.target.value)} className={inputClass}>
								<option>Tất cả khu vực</option>
								<option>Khu A</option>
								<option>Khu B</option>
								<option>Khu C</option>
							</select>
						</label>
						<label className={labelClass}>
							Số người dự kiến ở <span className="text-red-500">*</span>
							<input
								required
								min="1"
								type="number"
								value={form.soNguoiDuKien}
								onChange={(event) => updateField("soNguoiDuKien", event.target.value)}
								className={inputClass}
							/>
						</label>
						<fieldset>
							<legend className={labelClass}>Mức giá mong muốn</legend>
							<div className="mt-1.5 grid grid-cols-2 gap-2">
								<input
									min="0"
									type="number"
									value={form.mucGiaTu}
									onChange={(event) => updateField("mucGiaTu", event.target.value)}
									placeholder="Từ (VND)"
									className={inputClass}
								/>
								<input
									min="0"
									type="number"
									value={form.mucGiaDen}
									onChange={(event) => updateField("mucGiaDen", event.target.value)}
									placeholder="Đến (VND)"
									className={inputClass}
								/>
							</div>
						</fieldset>
						<label className={labelClass}>
							Thời gian dự kiến vào ở
							<input
								type="date"
								value={form.thoiGianDuKienVaoO}
								onChange={(event) => updateField("thoiGianDuKienVaoO", event.target.value)}
								className={inputClass}
							/>
						</label>
						<label className={labelClass}>
							Thời hạn thuê
							<select value={form.thoiHanThueThang} onChange={(event) => updateField("thoiHanThueThang", event.target.value)} className={inputClass}>
								<option value="">Chọn thời hạn</option>
								<option value="3">3 tháng</option>
								<option value="6">6 tháng</option>
								<option value="12">12 tháng</option>
								<option value="24">24 tháng</option>
							</select>
						</label>
						<fieldset>
							<legend className={labelClass}>Các tiêu chí ưu tiên khác</legend>
							<div className="mt-2 flex flex-wrap gap-2">
								{amenities.map((amenity) => (
									<button
										key={amenity}
										type="button"
										onClick={() => toggleAmenity(amenity)}
										aria-pressed={selectedAmenities.includes(amenity)}
										className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${selectedAmenities.includes(amenity) ? "bg-teal-100 text-teal-800 ring-1 ring-teal-400" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
									>
										{amenity}
									</button>
								))}
							</div>
						</fieldset>
					</div>
				</section>
			</div>

			{error && (
				<div className="mt-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
					<XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
					{error}
				</div>
			)}

			<div className="mt-5 flex flex-wrap justify-end gap-3">
				<button
					type="button"
					onClick={resetForm}
					className="h-10 rounded-md bg-red-500 px-5 text-sm font-semibold text-white transition hover:bg-red-600"
				>
					Hủy
				</button>
				<button
					type="submit"
					disabled={isSubmitting}
					className="inline-flex h-10 items-center gap-2 rounded-md bg-[#155DFC] px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
				>
					<Search className="size-4" aria-hidden="true" />
					{isSubmitting ? "Đang lưu..." : "Lưu và tìm phòng phù hợp"}
				</button>
			</div>

			{result && (
				<section className="mt-8 border border-blue-100 bg-white p-5">
					<div className="flex items-start gap-3">
						<CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#155DFC]" aria-hidden="true" />
						<div>
							<h2 className="font-semibold text-slate-900">Đã ghi nhận yêu cầu #{result.yeuCau.yeuCauId}</h2>
							<p className="mt-1 text-sm text-slate-600">
								Trạng thái: {result.yeuCau.trangThai}. Tìm thấy {result.phongPhuHop.length} phòng phù hợp.
							</p>
						</div>
					</div>
					{result.phongPhuHop.length > 0 ? (
						<div className="mt-5 grid gap-3 sm:grid-cols-2">
							{result.phongPhuHop.map((room) => (
								<article key={room.phongId} className="border border-slate-200 p-4">
									<div className="flex items-start justify-between gap-3">
										<div>
											<h3 className="font-semibold text-slate-900">Phòng {room.maPhong}</h3>
											<p className="mt-1 text-sm text-slate-500">
												{room.loaiPhong} · {room.khu ?? "Chưa phân khu"}
												{room.tang ? ` · Tầng ${room.tang}` : ""}
											</p>
										</div>
										<strong className="text-sm text-[#155DFC]">{formatPrice(room.donGia)}</strong>
									</div>
									<p className="mt-3 text-sm text-slate-600">
										Sức chứa {room.sucChua} người · {room.soGiuongTrong} giường trống
									</p>
									{room.tienIch && <p className="mt-1 text-xs text-slate-500">{room.tienIch}</p>}
								</article>
							))}
						</div>
					) : (
						<p className="mt-5 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
							Chưa tìm thấy phòng phù hợp với các tiêu chí đã chọn. Bạn có thể điều chỉnh khu vực, mức giá hoặc tiện ích.
						</p>
					)}
				</section>
			)}
		</form>
	);
}
