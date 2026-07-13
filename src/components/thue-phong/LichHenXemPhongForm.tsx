"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AlertTriangle, CalendarDays, Check, CheckCircle2, ChevronRight, Clock, XCircle } from "lucide-react";

// ============================================================
// Types
// ============================================================

type KhachHangInfo = {
	khachHangId: number;
	hoTen: string;
	soDienThoai: string;
	email: string | null;
	cccdPassport: string;
};

type YeuCauInfo = {
	yeuCauId: number;
	loaiThue: string;
	khuVucMongMuon: string | null;
	soNguoiDuKien: number;
	trangThai: string;
	ngayTao: string;
};

type PhongPhuHop = {
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

type YeuCauListItem = {
	yeuCauId: number;
	loaiThue: string;
	soNguoiDuKien: number;
	trangThai: string;
	ngayTao: string;
	khachHang: { hoTen: string; soDienThoai: string; email: string | null };
	lichHenXemPhongs: unknown[];
};

type DetailResponse = {
	yeuCau: YeuCauInfo;
	khachHang: KhachHangInfo;
	phongPhuHop: PhongPhuHop[];
	lichHenHienTai: unknown[];
};

type CreateResult = {
	lichHen: {
		lichHenId: number;
		phong: string;
		ngayXem: string;
		gioBatDau: string;
		gioKetThuc: string;
		trangThai: string;
	};
	thongBao: {
		success: boolean;
		message: string;
	};
};

// ============================================================
// Shared styles (adapted from Figma design tokens)
// ============================================================

const inputClass =
	"mt-1 h-[42px] w-full rounded-lg border border-slate-900 bg-white px-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#155DFC] focus:ring-2 focus:ring-blue-100";
const labelClass = "text-sm font-medium text-[#364153]";

function formatPrice(price: number) {
	return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(price);
}

function formatDate(dateString: string) {
	return new Date(dateString).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ============================================================
// Stepper Component (matching Figma: 4 steps with check icons)
// ============================================================

const STEPS = ["Thông tin khách hàng", "Tiêu chí thuê phòng", "Kết quả phù hợp", "Lập lịch xem phòng"];

function Stepper({ currentStep }: { currentStep: number }) {
	return (
		<ol className="mx-auto mt-6 flex w-full max-w-[896px] items-center justify-between" aria-label="Tiến trình thuê phòng">
			{STEPS.map((step, index) => {
				const isCompleted = index < currentStep;
				const isCurrent = index === currentStep;

				return (
					<li key={step} className="flex min-w-0 items-center last:flex-none">
						<div className="flex flex-col items-center text-center">
							{/* Circle */}
							<span
								className={`flex size-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors ${
									isCompleted
										? "border-[#00bba7] bg-[#00bba7] text-white"
										: isCurrent
											? "border-[#2b7fff] bg-[#2b7fff] text-white"
											: "border-slate-300 bg-white text-slate-500"
								}`}
							>
								{isCompleted ? <Check className="size-5" strokeWidth={2.5} /> : index + 1}
							</span>
							{/* Label */}
							<span className={`mt-2 w-24 text-sm leading-5 ${isCurrent || isCompleted ? "font-medium text-[#101828]" : "text-slate-500"}`}>
								{step}
							</span>
						</div>
						{/* Connector line */}
						{index < STEPS.length - 1 && (
							<span className={`mx-4 mb-8 hidden h-0.5 w-24 sm:block ${isCompleted ? "bg-[#00bba7]" : "bg-slate-200"}`} />
						)}
					</li>
				);
			})}
		</ol>
	);
}

// ============================================================
// Main Component: MHLapLichXemPhong
// ============================================================

export default function LichHenXemPhongForm() {
	// State management
	const [view, setView] = useState<"list" | "form" | "success">("list");
	const [yeuCauList, setYeuCauList] = useState<YeuCauListItem[]>([]);
	const [selectedYeuCau, setSelectedYeuCau] = useState<DetailResponse | null>(null);
	const [selectedPhongId, setSelectedPhongId] = useState<number | null>(null);
	const [showPhongList, setShowPhongList] = useState(false);

	// Form fields (matching Figma: dtpNgayXemPhong, txtGioBatDau, txtGioKetThucDuKien)
	const [ngayXem, setNgayXem] = useState("");
	const [gioBatDau, setGioBatDau] = useState("");
	const [gioKetThuc, setGioKetThuc] = useState("");

	// Status
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [fieldErrors, setFieldErrors] = useState<{ ngayXem?: string; gioBatDau?: string; gioKetThuc?: string; phong?: string }>({});
	const [result, setResult] = useState<CreateResult | null>(null);

	// Show chi tiết yêu cầu
	const [showChiTiet, setShowChiTiet] = useState(false);

	// ============================================================
	// Data fetching
	// ============================================================

	const fetchYeuCauList = useCallback(async () => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/lich-hen-xem-phong");
			const payload = await response.json();
			if (payload.success && payload.data) {
				setYeuCauList(payload.data);
			}
		} catch {
			setError("Không thể tải danh sách yêu cầu thuê");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchYeuCauList();
	}, [fetchYeuCauList]);

	async function selectYeuCau(yeuCauId: number) {
		setIsLoading(true);
		setError("");
		try {
			const response = await fetch(`/api/lich-hen-xem-phong/${yeuCauId}`);
			const payload = await response.json();
			if (!response.ok || !payload.success || !payload.data) {
				throw new Error(payload.error ?? "Không thể tải chi tiết yêu cầu thuê");
			}
			setSelectedYeuCau(payload.data);
			setView("form");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Lỗi khi tải chi tiết yêu cầu thuê");
		} finally {
			setIsLoading(false);
		}
	}

	// ============================================================
	// Form submission (Sequence: xác nhận tạo lịch hẹn → validate → lưu → gửi thông báo)
	// ============================================================

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		setFieldErrors({});
		setIsSubmitting(true);

		if (!selectedYeuCau || !selectedPhongId) {
			setFieldErrors({ phong: "Vui lòng chọn phòng trước khi tạo lịch hẹn" });
			setIsSubmitting(false);
			return;
		}

		try {
			const response = await fetch("/api/lich-hen-xem-phong", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					yeuCauId: selectedYeuCau.yeuCau.yeuCauId,
					phongId: selectedPhongId,
					ngayXem,
					gioBatDau,
					gioKetThuc,
				}),
			});

			const payload = await response.json();
			if (!response.ok || !payload.success || !payload.data) {
				throw new Error(payload.error ?? "Không thể tạo lịch hẹn");
			}

			setResult(payload.data);
			setView("success");
		} catch (err) {
			const errMsg = err instanceof Error ? err.message : "Lỗi khi tạo lịch hẹn";
			if (errMsg.includes("Ngày xem phòng")) {
				setFieldErrors({ ngayXem: errMsg });
			} else if (errMsg.includes("Giờ bắt đầu") || errMsg.includes("Giờ hẹn")) {
				setFieldErrors({ gioBatDau: errMsg });
			} else if (errMsg.includes("Giờ kết thúc")) {
				setFieldErrors({ gioKetThuc: errMsg });
			} else if (errMsg.includes("Trùng lịch")) {
				setFieldErrors({ gioBatDau: errMsg, gioKetThuc: errMsg });
			} else {
				setError(errMsg);
			}
		} finally {
			setIsSubmitting(false);
		}
	}

	function handleGoBack() {
		setView("list");
		setSelectedYeuCau(null);
		setSelectedPhongId(null);
		setShowPhongList(false);
		setNgayXem("");
		setGioBatDau("");
		setGioKetThuc("");
		setError("");
		setFieldErrors({});
		setResult(null);
		setShowChiTiet(false);
	}

	function handleCreateNew() {
		handleGoBack();
		void fetchYeuCauList();
	}

	// ============================================================
	// View: Step 1 — Chọn yêu cầu thuê
	// ============================================================

	if (view === "list") {
		return (
			<div className="pb-10">
				{/* Breadcrumb */}
				<div className="mb-2 flex items-center gap-2 text-sm text-[#4a5565]">
					<span>Đăng ký thuê phòng</span>
					<ChevronRight className="size-4" aria-hidden="true" />
					<span className="font-medium text-[#101828]">Lập lịch xem phòng</span>
				</div>
				<h1 className="text-2xl font-bold text-[#101828]">Lập lịch xem phòng</h1>

				<Stepper currentStep={3} />

				{error && (
					<div className="mt-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
						<XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
						{error}
					</div>
				)}

				<section className="mt-8">
					<h2 className="text-lg font-semibold text-[#101828]">Chọn yêu cầu thuê để lập lịch</h2>
					<p className="mt-1 text-sm text-[#4a5565]">Danh sách các yêu cầu thuê phòng đang chờ lập lịch xem phòng.</p>

					{isLoading ? (
						<div className="mt-6 flex items-center justify-center py-12 text-sm text-slate-500">
							<div className="mr-3 size-5 animate-spin rounded-full border-2 border-[#155DFC] border-t-transparent" />
							Đang tải danh sách...
						</div>
					) : yeuCauList.length === 0 ? (
						<div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
							<CalendarDays className="mx-auto size-10 text-slate-300" />
							<p className="mt-3 text-sm font-medium text-slate-500">Không có yêu cầu thuê nào đang chờ lập lịch</p>
							<p className="mt-1 text-xs text-slate-400">Hãy tạo yêu cầu thuê phòng trước khi lập lịch xem phòng.</p>
						</div>
					) : (
						<div className="mt-4 grid gap-3">
							{yeuCauList.map((yc) => (
								<button
									key={yc.yeuCauId}
									type="button"
									onClick={() => selectYeuCau(yc.yeuCauId)}
									className="group flex items-center justify-between rounded-xl border border-[#e5e7eb] bg-white p-5 text-left shadow-sm transition hover:border-[#155DFC] hover:shadow-md"
								>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-3">
											<span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-[#155DFC]">
												#{yc.yeuCauId}
											</span>
											<span className="text-base font-medium text-[#101828]">{yc.khachHang.hoTen}</span>
										</div>
										<div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#4a5565]">
											<span>SĐT: {yc.khachHang.soDienThoai}</span>
											<span>Loại: {yc.loaiThue}</span>
											<span>Số người: {yc.soNguoiDuKien}</span>
											<span>Ngày tạo: {formatDate(yc.ngayTao)}</span>
										</div>
									</div>
									<ChevronRight className="ml-3 size-5 shrink-0 text-slate-400 transition group-hover:text-[#155DFC]" />
								</button>
							))}
						</div>
					)}
				</section>
			</div>
		);
	}

	// ============================================================
	// View: Success — Kết quả tạo lịch hẹn
	// ============================================================

	if (view === "success" && result) {
		return (
			<div className="pb-10">
				<div className="mb-2 flex items-center gap-2 text-sm text-[#4a5565]">
					<span>Đăng ký thuê phòng</span>
					<ChevronRight className="size-4" aria-hidden="true" />
					<span className="font-medium text-[#101828]">Lập lịch xem phòng</span>
				</div>
				<h1 className="text-2xl font-bold text-[#101828]">Lập lịch xem phòng</h1>

				<Stepper currentStep={3} />

				<div className="mx-auto mt-8 max-w-2xl">
					{/* Kết quả thành công */}
					<div className="rounded-xl border border-[#e5e7eb] bg-white p-8 shadow-sm">
						<div className="flex items-start gap-4">
							<div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-green-100">
								<CheckCircle2 className="size-6 text-green-600" />
							</div>
							<div>
								<h2 className="text-xl font-semibold text-[#101828]">Tạo lịch hẹn thành công!</h2>
								<p className="mt-1 text-sm text-[#4a5565]">Lịch hẹn #{result.lichHen.lichHenId} đã được lưu vào hệ thống.</p>
							</div>
						</div>

						<div className="mt-6 rounded-lg bg-slate-50 p-5">
							<div className="grid gap-3 text-sm sm:grid-cols-2">
								<div>
									<span className="text-[#4a5565]">Phòng:</span>{" "}
									<span className="font-medium text-[#101828]">{result.lichHen.phong}</span>
								</div>
								<div>
									<span className="text-[#4a5565]">Ngày xem:</span>{" "}
									<span className="font-medium text-[#101828]">{formatDate(result.lichHen.ngayXem)}</span>
								</div>
								<div>
									<span className="text-[#4a5565]">Giờ bắt đầu:</span>{" "}
									<span className="font-medium text-[#101828]">{result.lichHen.gioBatDau}</span>
								</div>
								<div>
									<span className="text-[#4a5565]">Giờ kết thúc:</span>{" "}
									<span className="font-medium text-[#101828]">{result.lichHen.gioKetThuc}</span>
								</div>
							</div>
						</div>

						{/* Thông báo gửi */}
						<div
							className={`mt-4 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
								result.thongBao.success
									? "border-green-200 bg-green-50 text-green-700"
									: "border-amber-200 bg-amber-50 text-amber-700"
							}`}
						>
							{result.thongBao.success ? (
								<CheckCircle2 className="mt-0.5 size-4 shrink-0" />
							) : (
								<AlertTriangle className="mt-0.5 size-4 shrink-0" />
							)}
							{result.thongBao.message}
						</div>
					</div>

					<div className="mt-6 flex justify-center">
						<button
							type="button"
							onClick={handleCreateNew}
							className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#155DFC] px-6 text-base font-medium text-white transition hover:bg-blue-700"
						>
							<CalendarDays className="size-4" />
							Tạo lịch hẹn mới
						</button>
					</div>
				</div>
			</div>
		);
	}

	// ============================================================
	// View: Form — MHLapLichXemPhong (Figma design)
	// ============================================================

	const selectedPhong = selectedYeuCau?.phongPhuHop.find((p) => p.phongId === selectedPhongId);

	return (
		<form onSubmit={handleSubmit} className="pb-10">
			{/* Breadcrumb */}
			<div className="mb-2 flex items-center gap-2 text-sm text-[#4a5565]">
				<span>Đăng ký thuê phòng</span>
				<ChevronRight className="size-4" aria-hidden="true" />
				<span className="font-medium text-[#101828]">Lập lịch xem phòng</span>
			</div>
			<h1 className="text-2xl font-bold text-[#101828]">Lập lịch xem phòng</h1>

			{/* Stepper — Step 4 active */}
			<Stepper currentStep={3} />

			{/* Form content — 2 cards layout matching Figma */}
			<div className="mt-8 grid gap-6 lg:grid-cols-[minmax(280px,310px)_1fr]">
				{/* Left card: Thông tin khách hàng (lblHoTen, lblSDT, lblEmail, lnkXemChiTiet) */}
				<section className="rounded-[10px] border border-[#e5e7eb] bg-white p-6 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.1)]">
					<h2 className="text-lg font-semibold text-[#101828]">Thông tin khách hàng</h2>

					{selectedYeuCau && (
						<div className="mt-4 space-y-3">
							{/* lblHoTen */}
							<div>
								<p className="text-sm text-[#4a5565]">Họ tên</p>
								<p className="text-base font-medium text-[#101828]">{selectedYeuCau.khachHang.hoTen}</p>
							</div>
							{/* lblSDT */}
							<div>
								<p className="text-sm text-[#4a5565]">SĐT</p>
								<p className="text-base font-medium text-[#101828]">{selectedYeuCau.khachHang.soDienThoai}</p>
							</div>
							{/* lblEmail */}
							<div>
								<p className="text-sm text-[#4a5565]">Email</p>
								<p className="text-base font-medium text-[#101828]">{selectedYeuCau.khachHang.email ?? "—"}</p>
							</div>

							{/* lnkXemChiTiet */}
							<button
								type="button"
								onClick={() => setShowChiTiet(!showChiTiet)}
								className="mt-2 text-sm font-medium text-[#155DFC] transition hover:text-blue-700"
							>
								{showChiTiet ? "Ẩn chi tiết yêu cầu" : "Xem chi tiết yêu cầu"}
							</button>

							{showChiTiet && (
								<div className="mt-2 rounded-lg border border-blue-100 bg-blue-50/50 p-4 text-sm">
									<div className="space-y-1.5 text-[#4a5565]">
										<p>
											Mã YC: <span className="font-medium text-[#101828]">#{selectedYeuCau.yeuCau.yeuCauId}</span>
										</p>
										<p>
											Loại thuê: <span className="font-medium text-[#101828]">{selectedYeuCau.yeuCau.loaiThue}</span>
										</p>
										<p>
											Khu vực: <span className="font-medium text-[#101828]">{selectedYeuCau.yeuCau.khuVucMongMuon ?? "Tất cả"}</span>
										</p>
										<p>
											Số người: <span className="font-medium text-[#101828]">{selectedYeuCau.yeuCau.soNguoiDuKien}</span>
										</p>
										<p>
											CCCD: <span className="font-medium text-[#101828]">{selectedYeuCau.khachHang.cccdPassport}</span>
										</p>
									</div>
								</div>
							)}
						</div>
					)}
				</section>

				{/* Right card: Thông tin lịch hẹn */}
				<section className="rounded-[10px] border border-[#e5e7eb] bg-white p-6 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.1)]">
					<h2 className="text-lg font-semibold text-[#101828]">Thông tin lịch hẹn</h2>

					<div className="mt-6 space-y-5">
						{/* Chọn phòng */}
						<div>
							<label className={labelClass}>
								Phòng xem <span className="text-[#fb2c36]">*</span>
							</label>
							{selectedPhong ? (
								<div className={`mt-1 flex items-center justify-between rounded-lg border px-3 py-2.5 ${fieldErrors.phong ? "border-[#fb2c36]" : "border-slate-900 bg-white"}`}>
									<div className="text-sm">
										<span className="font-medium text-[#101828]">Phòng {selectedPhong.maPhong}</span>
										<span className="mx-2 text-slate-300">·</span>
										<span className="text-[#4a5565]">{selectedPhong.loaiPhong}</span>
										<span className="mx-2 text-slate-300">·</span>
										<span className="text-[#155DFC]">{formatPrice(selectedPhong.donGia)}</span>
									</div>
									<button
										type="button"
										onClick={() => setShowPhongList(true)}
										className="text-xs font-medium text-[#155DFC] hover:text-blue-700"
									>
										Đổi phòng
									</button>
								</div>
							) : (
								<button
									type="button"
									onClick={() => setShowPhongList(true)}
									className={`mt-1 flex h-[42px] w-full items-center justify-center gap-2 rounded-lg border border-dashed text-sm transition ${fieldErrors.phong ? "border-[#fb2c36] text-[#fb2c36]" : "border-slate-400 bg-white text-[#4a5565] hover:border-[#155DFC] hover:text-[#155DFC]"}`}
								>
									<CalendarDays className="size-4" />
									Chọn phòng để xem
								</button>
							)}
							{fieldErrors.phong && <p className="mt-1 text-xs text-[#fb2c36]">{fieldErrors.phong}</p>}
						</div>

						{/* Danh sách phòng phù hợp (modal / dropdown) */}
						{showPhongList && selectedYeuCau && (
							<div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
								<div className="mb-3 flex items-center justify-between">
									<h3 className="text-sm font-semibold text-[#101828]">
										Phòng phù hợp ({selectedYeuCau.phongPhuHop.length})
									</h3>
									<button
										type="button"
										onClick={() => setShowPhongList(false)}
										className="text-xs text-slate-500 hover:text-slate-700"
									>
										Đóng
									</button>
								</div>
								{selectedYeuCau.phongPhuHop.length === 0 ? (
									<p className="text-sm text-amber-700">Không tìm thấy phòng phù hợp với tiêu chí.</p>
								) : (
									<div className="grid gap-2 sm:grid-cols-2">
										{selectedYeuCau.phongPhuHop.map((room) => (
											<button
												key={room.phongId}
												type="button"
												onClick={() => {
													setSelectedPhongId(room.phongId);
													setShowPhongList(false);
												}}
												className={`rounded-lg border p-3 text-left text-sm transition ${
													selectedPhongId === room.phongId
														? "border-[#155DFC] bg-blue-50 ring-1 ring-[#155DFC]"
														: "border-[#e5e7eb] bg-white hover:border-[#155DFC]"
												}`}
											>
												<div className="flex items-start justify-between">
													<span className="font-medium text-[#101828]">Phòng {room.maPhong}</span>
													<span className="text-xs font-medium text-[#155DFC]">{formatPrice(room.donGia)}</span>
												</div>
												<p className="mt-1 text-xs text-[#4a5565]">
													{room.loaiPhong} · {room.khu ?? "Chưa phân khu"}
													{room.tang ? ` · Tầng ${room.tang}` : ""}
												</p>
												<p className="mt-0.5 text-xs text-[#4a5565]">
													Sức chứa {room.sucChua} · {room.soGiuongTrong} giường trống
												</p>
											</button>
										))}
									</div>
								)}
							</div>
						)}

						{/* dtpNgayXemPhong — DatePicker */}
						<div>
							<label className={labelClass} htmlFor="ngayXemPhong">
								Ngày xem phòng <span className="text-[#fb2c36]">*</span>
							</label>
							<input
								id="ngayXemPhong"
								type="date"
								required
								value={ngayXem}
								onChange={(e) => { setNgayXem(e.target.value); setFieldErrors((prev) => ({ ...prev, ngayXem: undefined })); }}
								min={new Date().toISOString().split("T")[0]}
								className={`${inputClass} ${fieldErrors.ngayXem ? "border-[#fb2c36] focus:border-[#fb2c36] focus:ring-red-100" : ""}`}
							/>
							{fieldErrors.ngayXem && <p className="mt-1 text-xs text-[#fb2c36]">{fieldErrors.ngayXem}</p>}
						</div>

						{/* txtGioBatDau + txtGioKetThucDuKien — side by side matching Figma */}
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className={labelClass} htmlFor="gioBatDau">
									Giờ bắt đầu <span className="text-[#fb2c36]">*</span>
								</label>
								<div className="relative">
									<input
										id="gioBatDau"
										type="time"
										required
										value={gioBatDau}
										onChange={(e) => { setGioBatDau(e.target.value); setFieldErrors((prev) => ({ ...prev, gioBatDau: undefined })); }}
										className={`${inputClass} ${fieldErrors.gioBatDau ? "border-[#fb2c36] focus:border-[#fb2c36] focus:ring-red-100" : ""}`}
									/>
									<Clock className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
								</div>
								{fieldErrors.gioBatDau && <p className="mt-1 text-xs text-[#fb2c36]">{fieldErrors.gioBatDau}</p>}
							</div>
							<div>
								<label className={labelClass} htmlFor="gioKetThuc">
									Giờ kết thúc dự kiến <span className="text-[#fb2c36]">*</span>
								</label>
								<div className="relative">
									<input
										id="gioKetThuc"
										type="time"
										required
										value={gioKetThuc}
										onChange={(e) => { setGioKetThuc(e.target.value); setFieldErrors((prev) => ({ ...prev, gioKetThuc: undefined })); }}
										className={`${inputClass} ${fieldErrors.gioKetThuc ? "border-[#fb2c36] focus:border-[#fb2c36] focus:ring-red-100" : ""}`}
									/>
									<Clock className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
								</div>
								{fieldErrors.gioKetThuc && <p className="mt-1 text-xs text-[#fb2c36]">{fieldErrors.gioKetThuc}</p>}
							</div>
						</div>
					</div>
				</section>
			</div>

			{/* Error message — HienThiLoi(thongBao) */}
			{error && (
				<div className="mt-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
					<XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
					{error}
				</div>
			)}

			{/* Buttons: btnQuayLai + btnXacNhanTaoLichHen (matching Figma layout) */}
			<div className="mt-8 flex items-center justify-between">
				{/* btnQuayLai */}
				<button
					type="button"
					onClick={handleGoBack}
					className="h-[46px] rounded-[10px] border border-[#101828] bg-white px-6 text-base font-medium text-[#364153] transition hover:bg-slate-50"
				>
					Quay lại
				</button>

				{/* btnXacNhanTaoLichHen */}
				<button
					type="submit"
					disabled={isSubmitting || !selectedPhongId}
					className="h-[46px] rounded-[10px] bg-[#155DFC] px-6 text-base font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
				>
					{isSubmitting ? "Đang tạo lịch hẹn..." : "Xác nhận tạo lịch hẹn"}
				</button>
			</div>
		</form>
	);
}
