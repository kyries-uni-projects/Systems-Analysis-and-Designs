"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, ChevronRight, ExternalLink, FileCheck2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

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
		thoiDiemPhatHanh: string;
		hanThanhToan: string;
		trangThai: string;
	} | null;
	chungTuThanhToan: {
		chungTuId: number;
		duongDanFile: string;
		soTienThucNhan: number;
		kenhThanhToan: string | null;
		thoiDiemNhan: string;
		trangThaiXacNhan: string;
		lyDoTuChoi: string | null;
	} | null;
};

function formatCurrency(value: number) {
	return new Intl.NumberFormat("vi-VN").format(value) + " VND";
}

export default function XacNhanThanhToanCocForm({ hoSoId }: { hoSoId: number }) {
	const router = useRouter();
	const { sessionUser, isLoading: isAuthLoading } = useAuth();
	const [hoSo, setHoSo] = useState<DepositDetail | null>(null);
	const [lyDoTuChoi, setLyDoTuChoi] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
	const [error, setError] = useState("");

	useEffect(() => {
		async function loadDetail() {
			try {
				const response = await fetch(`/api/ho-so-dat-coc/${hoSoId}`);
				const payload = await response.json();
				if (!response.ok || !payload.success) throw new Error(payload.error || "Không thể tải hồ sơ đặt cọc.");
				setHoSo(payload.data.hoSo);
			} catch (loadError) {
				setError(loadError instanceof Error ? loadError.message : "Không thể tải hồ sơ đặt cọc.");
			} finally {
				setIsLoading(false);
			}
		}

		void loadDetail();
	}, [hoSoId]);

	async function handleDecision(approved: boolean) {
		if (!approved && !lyDoTuChoi.trim()) {
			setError("Vui lòng nhập lý do từ chối chứng từ.");
			return;
		}
		setError("");
		setIsSubmitting(true);
		try {
			const response = await fetch(`/api/ho-so-dat-coc/${hoSoId}/xac-nhan-thanh-toan`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ xacNhan: approved, lyDoTuChoi: approved ? undefined : lyDoTuChoi }),
			});
			const payload = await response.json();
			if (!response.ok || !payload.success) throw new Error(payload.error || "Không thể xác nhận thanh toán cọc.");
			setDecision(approved ? "approved" : "rejected");
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : "Không thể xác nhận thanh toán cọc.");
		} finally {
			setIsSubmitting(false);
		}
	}

	if (isAuthLoading || isLoading) return <p className="py-12 text-center text-sm text-slate-500">Đang tải chứng từ thanh toán...</p>;
	if (!hoSo || !hoSo.yeuCauThanhToanCoc || !hoSo.chungTuThanhToan) {
		return <p className="py-12 text-center text-sm text-red-600">{error || "Hồ sơ chưa có chứng từ thanh toán cần xác nhận."}</p>;
	}

	const isConfirmed = hoSo.trangThai === "Đã xác nhận thanh toán" || decision === "approved";
	if (isConfirmed) return <PaymentConfirmationSuccess hoSo={hoSo} onBack={() => router.push("/deposit")} />;
	if (decision === "rejected") {
		return (
			<div className="mx-auto max-w-3xl py-10">
				<section className="rounded-xl border border-amber-200 bg-white p-8 text-center shadow-sm">
					<div className="mx-auto flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-600"><X className="size-9" /></div>
					<h1 className="mt-5 text-2xl font-bold text-[#101828]">Đã trả lại chứng từ cho Sale</h1>
					<p className="mt-2 text-sm text-slate-500">Hồ sơ đã trở về trạng thái Chờ thanh toán để Sale cập nhật chứng từ mới.</p>
					<button type="button" onClick={() => router.push("/deposit")} className="mt-7 h-11 rounded-lg bg-[#0f766e] px-6 text-sm font-semibold text-white">Quay về danh sách</button>
				</section>
			</div>
		);
	}

	if (!sessionUser || (sessionUser.role !== "quanly" && sessionUser.role !== "admin")) {
		return <p className="py-12 text-center text-sm text-red-600">Tài khoản hiện tại không có quyền xác nhận thanh toán cọc.</p>;
	}
	if (hoSo.trangThai !== "Chờ xác nhận thanh toán") {
		return <p className="py-12 text-center text-sm text-red-600">Hồ sơ không ở bước xác nhận thanh toán cọc.</p>;
	}

	const payment = hoSo.yeuCauThanhToanCoc;
	const certificate = hoSo.chungTuThanhToan;
	const amountMatches = Math.abs(payment.soTienCoc - certificate.soTienThucNhan) < 0.01;

	return (
		<div className="pb-10">
			<nav className="mb-3 flex items-center gap-2 text-[13px] text-slate-500" aria-label="Breadcrumb">
				<span>Đặt cọc &amp; xác nhận thuê</span><ChevronRight className="size-4" /><span className="font-medium text-[#101828]">Xác nhận thanh toán cọc</span>
			</nav>
			<h1 className="text-2xl font-bold text-[#101828]">Xác nhận thanh toán cọc</h1>
			<p className="mt-1 text-sm text-slate-500">Đối chiếu chứng từ thanh toán cho hồ sơ {hoSo.maHoSoDatCoc}.</p>

			{error && <p className="mt-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertTriangle className="size-4" />{error}</p>}
			<div className="mt-6 grid gap-5 lg:grid-cols-2">
				<section className="rounded-xl border border-[#d7ece7] bg-[#f8fefd] p-5 shadow-sm">
					<h2 className="mb-4 text-base font-semibold text-[#101828]">Thông tin hồ sơ và yêu cầu</h2>
					<SummaryRow label="Khách hàng" value={hoSo.khachHang.hoTen} />
					<SummaryRow label="Phòng/Giường" value={`${hoSo.phong?.maPhong ?? "—"}${hoSo.giuong ? ` - Giường ${hoSo.giuong.maGiuongLocal}` : ""}`} />
					<SummaryRow label="Số tiền phải thu" value={formatCurrency(payment.soTienCoc)} />
					<SummaryRow label="Hạn thanh toán" value={new Date(payment.hanThanhToan).toLocaleString("vi-VN")} />
					<SummaryRow label="Trạng thái" value={hoSo.trangThai} valueClass="text-amber-600" last />
				</section>

				<section className="rounded-xl border border-[#d7ece7] bg-white p-5 shadow-sm">
					<div className="flex items-center justify-between gap-3">
						<h2 className="text-base font-semibold text-[#101828]">Chứng từ Sale cập nhật</h2>
						<a href={certificate.duongDanFile} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">Xem chứng từ <ExternalLink className="size-3.5" /></a>
					</div>
					<div className="mt-4 flex items-center gap-3 rounded-lg bg-blue-50 p-4">
						<FileCheck2 className="size-8 text-blue-600" /><div><p className="text-sm font-semibold text-[#101828]">Chứng từ thanh toán #{certificate.chungTuId}</p><p className="text-xs text-slate-500">Đang chờ Quản lý xác nhận</p></div>
					</div>
					<div className="mt-3">
						<SummaryRow label="Số tiền thực nhận" value={formatCurrency(certificate.soTienThucNhan)} valueClass={amountMatches ? "text-emerald-600" : "text-red-600"} />
						<SummaryRow label="Kênh thanh toán" value={certificate.kenhThanhToan || "—"} />
						<SummaryRow label="Thời điểm nhận" value={new Date(certificate.thoiDiemNhan).toLocaleString("vi-VN")} last />
					</div>
					<div className={`mt-4 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${amountMatches ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
						{amountMatches ? <Check className="size-4" /> : <AlertTriangle className="size-4" />}{amountMatches ? "Số tiền chứng từ khớp yêu cầu" : "Số tiền chứng từ không khớp yêu cầu"}
					</div>
				</section>
			</div>

			<section className="mt-5 rounded-xl border border-[#d7ece7] bg-white p-5 shadow-sm">
				<label className="block text-sm font-medium text-slate-700">Lý do từ chối (nếu có)
					<textarea rows={3} value={lyDoTuChoi} onChange={(event) => setLyDoTuChoi(event.target.value)} placeholder="Nhập lý do nếu chứng từ không hợp lệ..." className="mt-2 w-full resize-none rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-teal-100" />
				</label>
			</section>
			<div className="mt-6 flex items-center justify-between gap-3">
				<button type="button" onClick={() => void handleDecision(false)} disabled={isSubmitting || !lyDoTuChoi.trim()} className="h-11 rounded-lg border border-red-300 bg-white px-6 text-sm font-semibold text-red-600 disabled:opacity-50">Từ chối chứng từ</button>
				<button type="button" onClick={() => void handleDecision(true)} disabled={isSubmitting || !amountMatches} className="h-11 rounded-lg bg-[#155DFC] px-6 text-sm font-semibold text-white disabled:opacity-50">{isSubmitting ? "Đang xử lý..." : "Xác nhận thanh toán"}</button>
			</div>
		</div>
	);
}

function PaymentConfirmationSuccess({ hoSo, onBack }: { hoSo: DepositDetail; onBack: () => void }) {
	const certificate = hoSo.chungTuThanhToan!;
	return (
		<div className="pb-10">
			<nav className="mb-6 flex items-center gap-2 text-[13px] text-slate-500"><span>Đặt cọc &amp; xác nhận thuê</span><ChevronRight className="size-4" /><span>Xác nhận thanh toán cọc</span><ChevronRight className="size-4" /><span className="font-medium text-[#101828]">Thành công</span></nav>
			<section className="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm">
				<div className="bg-emerald-50 px-6 py-8 text-center">
					<div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-600 text-white"><CheckCircle2 className="size-9" /></div>
					<h1 className="mt-4 text-2xl font-bold text-[#101828]">Xác nhận thanh toán thành công!</h1>
					<p className="mt-2 text-sm text-slate-600">Khoản đặt cọc đã được xác nhận và hồ sơ sẵn sàng chuyển sang quy trình nhận phòng.</p>
				</div>
				<div className="mx-auto grid max-w-4xl gap-6 p-6 lg:grid-cols-2">
					<div><h2 className="mb-3 text-sm font-semibold text-[#101828]">Thông tin hồ sơ</h2><SummaryRow label="Mã hồ sơ" value={hoSo.maHoSoDatCoc} /><SummaryRow label="Khách hàng" value={hoSo.khachHang.hoTen} /><SummaryRow label="Phòng/Giường" value={`${hoSo.phong?.maPhong ?? "—"}${hoSo.giuong ? ` - Giường ${hoSo.giuong.maGiuongLocal}` : ""}`} last /></div>
					<div><h2 className="mb-3 text-sm font-semibold text-[#101828]">Kết quả thanh toán</h2><SummaryRow label="Số tiền đã xác nhận" value={formatCurrency(certificate.soTienThucNhan)} valueClass="text-emerald-600" /><SummaryRow label="Kênh thanh toán" value={certificate.kenhThanhToan || "—"} /><SummaryRow label="Trạng thái" value="Đã xác nhận thanh toán" valueClass="text-emerald-600" last /></div>
				</div>
				<div className="mx-6 mb-6 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">Bước tiếp theo: nhân viên có thể sử dụng hồ sơ này để chuẩn bị thủ tục nhận phòng.</div>
				<div className="flex justify-end border-t border-slate-100 p-6"><button type="button" onClick={onBack} className="h-11 rounded-lg bg-[#0f766e] px-6 text-sm font-semibold text-white">Quay về danh sách</button></div>
			</section>
		</div>
	);
}

function SummaryRow({ label, value, valueClass = "", last = false }: { label: string; value: string; valueClass?: string; last?: boolean }) {
	return <div className={`grid grid-cols-[minmax(125px,1fr)_auto] gap-4 py-2.5 text-[13px] ${last ? "" : "border-b border-slate-200"}`}><span className="text-slate-500">{label}</span><span className={`text-right font-medium text-[#101828] ${valueClass}`}>{value}</span></div>;
}
