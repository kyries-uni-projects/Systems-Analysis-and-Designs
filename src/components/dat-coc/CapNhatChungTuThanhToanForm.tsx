"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, ChevronRight, FileText, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

type PaymentCertificate = {
	chungTuId: number;
	duongDanFile: string;
	soTienThucNhan: number;
	kenhThanhToan: string | null;
	thoiDiemNhan: string;
	trangThaiXacNhan: string;
	lyDoTuChoi: string | null;
};

type DepositDetail = {
	hoSoDatCocId: number;
	maHoSoDatCoc: string;
	trangThai: string;
	khachHang: { hoTen: string; soDienThoai: string; email: string | null };
	phong: { maPhong: string } | null;
	giuong: { maGiuongLocal: string } | null;
	yeuCauThanhToanCoc: {
		yeuCauThanhToanId: number;
		soTienCoc: number;
		hanThanhToan: string;
		soTaiKhoanNhan: string | null;
		trangThai: string;
		keToan: { hoTen: string };
	} | null;
	chungTuThanhToan: PaymentCertificate | null;
};

const controlClass =
	"h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-[#101828] outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-teal-100";

function formatCurrency(value: number) {
	return new Intl.NumberFormat("vi-VN").format(value) + " VND";
}

function currentLocalDateTime() {
	const now = new Date();
	return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export default function CapNhatChungTuThanhToanForm({ hoSoId }: { hoSoId: number }) {
	const router = useRouter();
	const { sessionUser, isLoading: isAuthLoading } = useAuth();
	const [hoSo, setHoSo] = useState<DepositDetail | null>(null);
	const [file, setFile] = useState<File | null>(null);
	const [soTienThucNhan, setSoTienThucNhan] = useState("");
	const [kenhThanhToan, setKenhThanhToan] = useState("Chuyển khoản ngân hàng");
	const [thoiDiemNhan, setThoiDiemNhan] = useState(currentLocalDateTime);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		async function loadDetail() {
			try {
				const response = await fetch(`/api/ho-so-dat-coc/${hoSoId}`);
				const payload = await response.json();
				if (!response.ok || !payload.success) throw new Error(payload.error || "Không thể tải hồ sơ đặt cọc.");
				const detail = payload.data.hoSo as DepositDetail;
				setHoSo(detail);
				setSoTienThucNhan(String(detail.yeuCauThanhToanCoc?.soTienCoc ?? ""));
			} catch (loadError) {
				setError(loadError instanceof Error ? loadError.message : "Không thể tải hồ sơ đặt cọc.");
			} finally {
				setIsLoading(false);
			}
		}

		void loadDetail();
	}, [hoSoId]);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!file) {
			setError("Vui lòng chọn tệp chứng từ thanh toán.");
			return;
		}
		setError("");
		setIsSubmitting(true);
		try {
			const formData = new FormData();
			formData.set("chungTu", file);
			formData.set("soTienThucNhan", soTienThucNhan);
			formData.set("kenhThanhToan", kenhThanhToan);
			formData.set("thoiDiemNhan", new Date(thoiDiemNhan).toISOString());
			const response = await fetch(`/api/ho-so-dat-coc/${hoSoId}/chung-tu-thanh-toan`, { method: "POST", body: formData });
			const payload = await response.json();
			if (!response.ok || !payload.success) throw new Error(payload.error || "Không thể cập nhật chứng từ thanh toán.");
			setSubmitted(true);
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : "Không thể cập nhật chứng từ thanh toán.");
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleCancelRequest() {
		if (!window.confirm("Khách hàng xác nhận hủy yêu cầu đặt cọc? Phòng/giường sẽ được giải phóng.")) return;
		setError("");
		setIsSubmitting(true);
		try {
			const response = await fetch(`/api/ho-so-dat-coc/${hoSoId}/huy`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ lyDo: "Khách hàng chủ động hủy yêu cầu đặt cọc." }),
			});
			const payload = await response.json();
			if (!response.ok || !payload.success) throw new Error(payload.error || "Không thể hủy yêu cầu đặt cọc.");
			router.push("/deposit");
			router.refresh();
		} catch (cancelError) {
			setError(cancelError instanceof Error ? cancelError.message : "Không thể hủy yêu cầu đặt cọc.");
		} finally {
			setIsSubmitting(false);
		}
	}

	if (isAuthLoading || isLoading) return <p className="py-12 text-center text-sm text-slate-500">Đang tải thông tin thanh toán...</p>;
	if (!sessionUser || (sessionUser.role !== "nhanvien" && sessionUser.role !== "admin")) {
		return <p className="py-12 text-center text-sm text-red-600">Tài khoản hiện tại không có quyền cập nhật chứng từ thanh toán.</p>;
	}
	if (!hoSo || !hoSo.yeuCauThanhToanCoc) {
		return <p className="py-12 text-center text-sm text-red-600">{error || "Hồ sơ chưa có yêu cầu thanh toán cọc."}</p>;
	}

	const existingCertificate = hoSo.chungTuThanhToan;
	const isWaitingForManager = hoSo.trangThai === "Chờ xác nhận thanh toán" || submitted;
	if (isWaitingForManager) {
		return (
			<div className="mx-auto max-w-3xl pb-10">
				<nav className="mb-6 flex items-center gap-2 text-[13px] text-slate-500">
					<span>Đặt cọc &amp; xác nhận thuê</span><ChevronRight className="size-4" /><span>Cập nhật chứng từ thanh toán</span>
				</nav>
				<section className="rounded-xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
					<div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
						<CheckCircle2 className="size-9" aria-hidden="true" />
					</div>
					<h1 className="mt-5 text-2xl font-bold text-[#101828]">Cập nhật chứng từ thành công!</h1>
					<p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">Chứng từ đã được lưu và chuyển đến Quản lý để xác nhận thanh toán cọc.</p>
					<div className="mx-auto mt-6 max-w-lg rounded-lg bg-slate-50 p-4 text-left">
						<SummaryRow label="Mã hồ sơ" value={hoSo.maHoSoDatCoc} />
						<SummaryRow label="Khách hàng" value={hoSo.khachHang.hoTen} />
						<SummaryRow label="Số tiền" value={formatCurrency(Number(soTienThucNhan))} />
						<SummaryRow label="Trạng thái" value="Chờ xác nhận thanh toán" last />
					</div>
					<button type="button" onClick={() => router.push("/deposit")} className="mt-7 h-11 rounded-lg bg-[#0f766e] px-6 text-sm font-semibold text-white">Quay về danh sách</button>
				</section>
			</div>
		);
	}

	if (hoSo.trangThai !== "Chờ thanh toán") {
		return <p className="py-12 text-center text-sm text-red-600">Hồ sơ không ở bước cập nhật chứng từ thanh toán.</p>;
	}

	return (
		<form onSubmit={handleSubmit} className="pb-10">
			<nav className="mb-3 flex items-center gap-2 text-[13px] text-slate-500" aria-label="Breadcrumb">
				<span>Đặt cọc &amp; xác nhận thuê</span><ChevronRight className="size-4" /><span className="font-medium text-[#101828]">Cập nhật chứng từ thanh toán</span>
			</nav>
			<h1 className="text-2xl font-bold text-[#101828]">Cập nhật chứng từ thanh toán</h1>
			<p className="mt-1 text-sm text-slate-500">Ghi nhận chứng từ khách hàng đã thanh toán cho hồ sơ {hoSo.maHoSoDatCoc}.</p>

			{existingCertificate?.trangThaiXacNhan === "Từ chối" && (
				<div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					<p className="font-semibold">Chứng từ trước đã bị từ chối</p>
					<p className="mt-1">{existingCertificate.lyDoTuChoi || "Vui lòng cập nhật chứng từ mới."}</p>
				</div>
			)}
			{error && <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

			<div className="mt-6 grid gap-5 lg:grid-cols-2">
				<section className="rounded-xl border border-[#d7ece7] bg-[#f8fefd] p-5 shadow-sm">
					<h2 className="mb-4 text-base font-semibold text-[#101828]">Thông tin yêu cầu thanh toán</h2>
					<SummaryRow label="Khách hàng" value={hoSo.khachHang.hoTen} />
					<SummaryRow label="Phòng/Giường" value={`${hoSo.phong?.maPhong ?? "—"}${hoSo.giuong ? ` - Giường ${hoSo.giuong.maGiuongLocal}` : ""}`} />
					<SummaryRow label="Số tiền phải thanh toán" value={formatCurrency(hoSo.yeuCauThanhToanCoc.soTienCoc)} />
					<SummaryRow label="Số tài khoản nhận" value={hoSo.yeuCauThanhToanCoc.soTaiKhoanNhan || "1234567890"} />
					<SummaryRow label="Hạn thanh toán" value={new Date(hoSo.yeuCauThanhToanCoc.hanThanhToan).toLocaleString("vi-VN")} valueClass="text-amber-600" last />
				</section>

				<section className="rounded-xl border border-[#d7ece7] bg-white p-5 shadow-sm">
					<h2 className="mb-4 text-base font-semibold text-[#101828]">Thông tin chứng từ</h2>
					<div className="grid gap-4 sm:grid-cols-2">
						<label className="block sm:col-span-2">
							<span className="mb-1.5 block text-xs font-medium text-slate-600">Số tiền thực nhận</span>
							<input type="number" min="1" required value={soTienThucNhan} onChange={(event) => setSoTienThucNhan(event.target.value)} className={controlClass} />
						</label>
						<label className="block">
							<span className="mb-1.5 block text-xs font-medium text-slate-600">Kênh thanh toán</span>
							<select value={kenhThanhToan} onChange={(event) => setKenhThanhToan(event.target.value)} className={controlClass}>
								<option>Chuyển khoản ngân hàng</option><option>Tiền mặt</option><option>Ví điện tử</option>
							</select>
						</label>
						<label className="block">
							<span className="mb-1.5 block text-xs font-medium text-slate-600">Thời điểm nhận</span>
							<input type="datetime-local" required value={thoiDiemNhan} onChange={(event) => setThoiDiemNhan(event.target.value)} className={controlClass} />
						</label>
					</div>
					<label className="mt-4 block cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-7 text-center transition hover:border-teal-500 hover:bg-teal-50">
						<input type="file" required accept="application/pdf,image/jpeg,image/png" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="sr-only" />
						{file ? <FileText className="mx-auto size-8 text-teal-600" /> : <UploadCloud className="mx-auto size-8 text-slate-400" />}
						<p className="mt-2 text-sm font-medium text-[#101828]">{file?.name ?? "Chọn hoặc kéo thả chứng từ"}</p>
						<p className="mt-1 text-xs text-slate-500">PDF, JPG hoặc PNG · tối đa 5 MB</p>
					</label>
				{existingCertificate && <a href={existingCertificate.duongDanFile} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-medium text-blue-600 hover:underline">Xem chứng từ trước</a>}
				</section>
			</div>

			<div className="mt-6 flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap gap-3">
					<button type="button" onClick={() => router.push("/deposit")} className="h-10 rounded-lg border border-slate-400 bg-white px-6 text-sm font-medium text-slate-700">Quay lại</button>
					<button type="button" disabled={isSubmitting} onClick={handleCancelRequest} className="h-10 rounded-lg border border-red-300 bg-white px-5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">Khách hàng hủy đặt cọc</button>
				</div>
				<button type="submit" disabled={isSubmitting} className="h-11 rounded-lg bg-[#155DFC] px-6 text-sm font-semibold text-white disabled:opacity-50">{isSubmitting ? "Đang cập nhật..." : "Cập nhật chứng từ"}</button>
			</div>
		</form>
	);
}

function SummaryRow({ label, value, valueClass = "", last = false }: { label: string; value: string; valueClass?: string; last?: boolean }) {
	return (
		<div className={`grid grid-cols-[minmax(130px,1fr)_auto] gap-4 py-2.5 text-[13px] ${last ? "" : "border-b border-slate-200"}`}>
			<span className="text-slate-500">{label}</span><span className={`text-right font-medium text-[#101828] ${valueClass}`}>{value}</span>
		</div>
	);
}
