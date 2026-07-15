"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, ChevronRight, Info, Mail, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

type DepositDetail = {
	hoSoDatCocId: number;
	maHoSoDatCoc: string;
	trangThai: string;
	hinhThucThue: string;
	ngayHenNhanPhong: string | null;
	gioHenNhanPhong: string | null;
	ghiChuHenNhanPhong: string | null;
	khachHang: { hoTen: string; cccdPassport: string; soDienThoai: string; email: string | null };
	phong: { maPhong: string; khu: string; gioiTinhApDung: string | null } | null;
	giuong: { maGiuongLocal: string } | null;
	chiTietDatCoc: { soGiuongQuyDoi: number; tienCocPhanBo: number } | null;
	yeuCauThanhToanCoc: { soTienCoc: number } | null;
	chungTuThanhToan: { soTienThucNhan: number; thoiDiemNhan: string; trangThaiXacNhan: string } | null;
};

type Step = "review" | "appointment" | "complete";

function formatCurrency(value: number) {
	return `${new Intl.NumberFormat("vi-VN").format(value)} VNĐ`;
}

function formatPaymentTime(value: string) {
	return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" })
		.format(new Date(value))
		.replace(",", " –");
}

function dateInputValue(value: string | null) {
	if (!value) return "";
	const date = new Date(value);
	const offset = date.getTimezoneOffset();
	return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export default function GhiNhanThongTinDatCocForm({ hoSoId }: { hoSoId: number }) {
	const router = useRouter();
	const { sessionUser, isLoading: isAuthLoading } = useAuth();
	const [hoSo, setHoSo] = useState<DepositDetail | null>(null);
	const [step, setStep] = useState<Step>("review");
	const [ngayNhanPhong, setNgayNhanPhong] = useState("");
	const [gioNhanPhong, setGioNhanPhong] = useState("");
	const [ghiChu, setGhiChu] = useState("");
	const [notification, setNotification] = useState<{ success: boolean; message: string } | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		async function loadDetail() {
			try {
				const response = await fetch(`/api/ho-so-dat-coc/${hoSoId}`);
				const payload = await response.json();
				if (!response.ok || !payload.success) throw new Error(payload.error || "Không thể tải hồ sơ đặt cọc.");
				const detail = payload.data.hoSo as DepositDetail;
				setHoSo(detail);
				if (detail.trangThai === "Chờ nhập lịch nhận phòng") setStep("appointment");
				else if (detail.trangThai === "Đã đặt cọc") setStep("complete");
				else if (detail.trangThai !== "Đã xác nhận thanh toán") throw new Error("Hồ sơ không ở bước ghi nhận thông tin đặt cọc.");
				setNgayNhanPhong(dateInputValue(detail.ngayHenNhanPhong));
				setGioNhanPhong(detail.gioHenNhanPhong ?? "");
				setGhiChu(detail.ghiChuHenNhanPhong ?? "");
			} catch (loadError) {
				setError(loadError instanceof Error ? loadError.message : "Không thể tải hồ sơ đặt cọc.");
			} finally {
				setIsLoading(false);
			}
		}
		void loadDetail();
	}, [hoSoId]);

	async function confirmDeposit() {
		setError("");
		setIsSubmitting(true);
		try {
			const response = await fetch(`/api/ho-so-dat-coc/${hoSoId}/ghi-nhan-dat-coc`, { method: "POST" });
			const payload = await response.json();
			if (!response.ok || !payload.success) throw new Error(payload.error || "Không thể ghi nhận đặt cọc.");
			setStep("appointment");
			setHoSo((current) => current ? { ...current, trangThai: "Chờ nhập lịch nhận phòng" } : current);
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : "Không thể ghi nhận đặt cọc.");
		} finally {
			setIsSubmitting(false);
		}
	}

	async function saveAppointment(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		setIsSubmitting(true);
		try {
			const response = await fetch(`/api/ho-so-dat-coc/${hoSoId}/ghi-nhan-dat-coc`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ngayNhanPhong, gioNhanPhong, ghiChu }),
			});
			const payload = await response.json();
			if (!response.ok || !payload.success) throw new Error(payload.error || "Không thể lưu lịch hẹn nhận phòng.");
			setNotification(payload.data.thongBao);
			setStep("complete");
			setHoSo((current) => current ? { ...current, trangThai: "Đã đặt cọc", ngayHenNhanPhong: ngayNhanPhong, gioHenNhanPhong: gioNhanPhong, ghiChuHenNhanPhong: ghiChu } : current);
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : "Không thể lưu lịch hẹn nhận phòng.");
		} finally {
			setIsSubmitting(false);
		}
	}

	if (isAuthLoading || isLoading) return <p className="py-12 text-center text-sm text-slate-500">Đang tải thông tin đặt cọc...</p>;
	if (!sessionUser || (sessionUser.role !== "nhanvien" && sessionUser.role !== "admin")) {
		return <ErrorState message="Tài khoản hiện tại không có quyền ghi nhận thông tin đặt cọc." />;
	}
	if (!hoSo) return <ErrorState message={error || "Không tìm thấy hồ sơ đặt cọc."} />;

	return (
		<div className="pb-10">
			{error && (
				<p className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					<AlertTriangle className="size-4 shrink-0" aria-hidden="true" />{error}
				</p>
			)}
			{step === "review" && <ReviewStep hoSo={hoSo} isSubmitting={isSubmitting} onCancel={() => router.push("/deposit/ghi-nhan-dat-coc")} onConfirm={() => void confirmDeposit()} />}
			{step === "appointment" && (
				<AppointmentStep
					hoSo={hoSo}
					ngayNhanPhong={ngayNhanPhong}
					gioNhanPhong={gioNhanPhong}
					ghiChu={ghiChu}
					isSubmitting={isSubmitting}
					onNgayChange={setNgayNhanPhong}
					onGioChange={setGioNhanPhong}
					onGhiChuChange={setGhiChu}
					onSubmit={saveAppointment}
				/>
			)}
			{step === "complete" && <CompleteStep hoSo={hoSo} notification={notification} onBack={() => router.push("/deposit/ghi-nhan-dat-coc")} />}
		</div>
	);
}

function ReviewStep({ hoSo, isSubmitting, onCancel, onConfirm }: { hoSo: DepositDetail; isSubmitting: boolean; onCancel: () => void; onConfirm: () => void }) {
	const roomLabel = `${hoSo.phong?.maPhong ?? "—"}${hoSo.phong?.khu ? ` – ${hoSo.phong.khu}` : ""}${hoSo.phong?.gioiTinhApDung ? ` (${hoSo.phong.gioiTinhApDung})` : ""}`;
	const depositAmount = hoSo.chungTuThanhToan?.soTienThucNhan ?? hoSo.yeuCauThanhToanCoc?.soTienCoc ?? 0;
	return (
		<>
			<Breadcrumb current="Ghi nhận thông tin đặt cọc" />
			<h1 className="text-2xl font-bold text-[#101828]">Ghi nhận thông tin đặt cọc</h1>
			<div className="mt-5 flex max-w-150 items-center gap-2 rounded-lg bg-[#edf5ff] px-3 py-2.5 text-[13px] text-[#155cfc]">
				<Info className="size-4 shrink-0" aria-hidden="true" />Hệ thống đã xác nhận thanh toán. Vui lòng kiểm tra và ghi nhận đặt cọc.
			</div>

			<section className="mt-4 rounded-xl border border-[#d7ece7] bg-[#f8fefd] p-5 shadow-sm sm:p-6">
				<h2 className="mb-3 text-base font-semibold text-[#101828]">Kiểm tra thông tin đặt cọc lần cuối</h2>
				<div className="grid gap-x-14 lg:grid-cols-2">
					<div><SummaryRow label="Khách hàng" value={hoSo.khachHang.hoTen} /><SummaryRow label="Số CCCD" value={hoSo.khachHang.cccdPassport} /><SummaryRow label="Phòng" value={roomLabel} /><SummaryRow label="Giường số" value={hoSo.giuong ? `Giường ${hoSo.giuong.maGiuongLocal}` : "Thuê nguyên phòng"} last /></div>
					<div><SummaryRow label="Số giường thuê" value={`${hoSo.chiTietDatCoc?.soGiuongQuyDoi ?? 0} giường`} /><SummaryRow label="Tiền cọc đã thu" value={formatCurrency(depositAmount)} valueClass="text-[#155cfc]" /><SummaryRow label="Thời điểm cọc" value={hoSo.chungTuThanhToan ? formatPaymentTime(hoSo.chungTuThanhToan.thoiDiemNhan) : "—"} /><SummaryRow label="Khu vực" value={hoSo.phong?.khu ?? "—"} last /></div>
				</div>
			</section>

			<section className="mt-5 rounded-xl border border-[#d7ece7] bg-[#f8fefd] px-6 py-5 text-[13px] shadow-sm">
				<p className="text-slate-500">Sau khi xác nhận:</p>
				<p className="mt-2 text-slate-700">Phòng/giường sẽ chuyển sang trạng thái &apos;Đã cọc&apos; và không hiển thị là lựa chọn còn trống cho Sale khác.</p>
			</section>
			<div className="mt-10 flex flex-col-reverse justify-between gap-3 sm:flex-row">
				<button type="button" onClick={onCancel} disabled={isSubmitting} className="h-11 rounded-xl border border-slate-700 bg-white px-10 text-sm font-medium text-slate-700 disabled:opacity-50">Hủy thao tác</button>
				<button type="button" onClick={onConfirm} disabled={isSubmitting} className="h-11 rounded-xl bg-[#155cfc] px-12 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">{isSubmitting ? "Đang ghi nhận..." : "Xác nhận và nhập lịch hẹn"}</button>
			</div>
		</>
	);
}

function AppointmentStep({ hoSo, ngayNhanPhong, gioNhanPhong, ghiChu, isSubmitting, onNgayChange, onGioChange, onGhiChuChange, onSubmit }: { hoSo: DepositDetail; ngayNhanPhong: string; gioNhanPhong: string; ghiChu: string; isSubmitting: boolean; onNgayChange: (value: string) => void; onGioChange: (value: string) => void; onGhiChuChange: (value: string) => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
	const today = new Date();
	const minDate = new Date(today.getTime() - today.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
	return (
		<>
			<Breadcrumb current="Lịch hẹn nhận phòng" />
			<h1 className="text-2xl font-bold text-[#101828]">Nhập lịch hẹn nhận phòng</h1>
			<div className="mt-5 flex items-center gap-2 rounded-lg border border-emerald-500 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-600">
				<Check className="size-4 shrink-0" aria-hidden="true" />Đặt cọc đã được ghi nhận thành công! Mã đặt cọc: {hoSo.maHoSoDatCoc}
			</div>
			<form onSubmit={onSubmit}>
				<section className="mt-5 rounded-xl border border-[#d7ece7] bg-[#f8fefd] p-5 shadow-sm sm:p-6">
					<h2 className="text-base font-semibold text-[#101828]">Thống nhất lịch hẹn nhận phòng với khách hàng</h2>
					<div className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,420px)_200px]">
						<label className="text-sm font-medium text-slate-700">Ngày nhận phòng *<input required type="date" min={minDate} value={ngayNhanPhong} onChange={(event) => onNgayChange(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#155cfc] focus:ring-2 focus:ring-blue-100" /></label>
						<label className="text-sm font-medium text-slate-700">Giờ nhận phòng *<input required type="time" value={gioNhanPhong} onChange={(event) => onGioChange(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#155cfc] focus:ring-2 focus:ring-blue-100" /></label>
					</div>
					<label className="mt-5 block text-sm font-medium text-slate-700">Ghi chú cho khách hàng<textarea maxLength={500} rows={4} value={ghiChu} onChange={(event) => onGhiChuChange(event.target.value)} placeholder="Ví dụ: Mang theo CCCD gốc, đặt cọc sẽ được khấu trừ vào tiền thuê..." className="mt-2 w-full resize-none rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none placeholder:text-slate-400 focus:border-[#155cfc] focus:ring-2 focus:ring-blue-100" /></label>
				</section>
				<section className="mt-5 rounded-xl border border-[#d7ece7] bg-[#f8fefd] px-6 py-5 shadow-sm">
					<h2 className="text-sm font-semibold text-[#101828]">Thông báo sẽ được gửi tới khách hàng qua:</h2>
					<div className="mt-4 flex flex-wrap gap-x-20 gap-y-3 text-[13px] text-slate-600">
						{hoSo.khachHang.email && <span className="flex items-center gap-2"><Mail className="size-4 text-blue-500" />Email: {hoSo.khachHang.email}</span>}
						<span className="flex items-center gap-2"><Smartphone className="size-4 text-slate-700" />SMS: {hoSo.khachHang.soDienThoai}</span>
					</div>
				</section>
				<div className="mt-9 flex justify-end"><button disabled={isSubmitting} className="h-11 rounded-xl bg-[#155cfc] px-12 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">{isSubmitting ? "Đang lưu lịch hẹn..." : "Lưu lịch hẹn & gửi thông báo"}</button></div>
			</form>
		</>
	);
}

function CompleteStep({ hoSo, notification, onBack }: { hoSo: DepositDetail; notification: { success: boolean; message: string } | null; onBack: () => void }) {
	return (
		<>
			<Breadcrumb current="Hoàn tất" />
			<section className="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm">
				<div className="bg-emerald-50 px-6 py-9 text-center">
					<div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-600 text-white"><CheckCircle2 className="size-9" /></div>
					<h1 className="mt-4 text-2xl font-bold text-[#101828]">Hoàn tất ghi nhận đặt cọc</h1>
					<p className="mt-2 text-sm text-slate-600">Hồ sơ {hoSo.maHoSoDatCoc} và lịch hẹn nhận phòng đã được lưu thành công.</p>
				</div>
				<div className="mx-auto max-w-3xl p-6">
					<SummaryRow label="Khách hàng" value={hoSo.khachHang.hoTen} />
					<SummaryRow label="Phòng/Giường" value={`${hoSo.phong?.maPhong ?? "—"}${hoSo.giuong ? ` - Giường ${hoSo.giuong.maGiuongLocal}` : ""}`} />
					<SummaryRow label="Lịch nhận phòng" value={hoSo.ngayHenNhanPhong && hoSo.gioHenNhanPhong ? `${hoSo.gioHenNhanPhong} - ${new Date(hoSo.ngayHenNhanPhong).toLocaleDateString("vi-VN")}` : "Đã lưu"} />
					<SummaryRow label="Trạng thái" value="Đã đặt cọc" valueClass="text-emerald-600" last />
					{notification && <p className={`mt-5 rounded-lg px-4 py-3 text-sm ${notification.success ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>{notification.message}</p>}
				</div>
				<div className="flex justify-end border-t border-slate-100 p-6"><button type="button" onClick={onBack} className="h-11 rounded-lg bg-[#155cfc] px-6 text-sm font-semibold text-white">Về danh sách đặt cọc</button></div>
			</section>
		</>
	);
}

function Breadcrumb({ current }: { current: string }) {
	return <nav className="mb-3 flex items-center gap-1 text-[13px] text-slate-500" aria-label="Breadcrumb"><span>Đặt cọc &amp; xác nhận thuê</span><ChevronRight className="size-4" /><span className="font-medium text-slate-600">{current}</span></nav>;
}

function SummaryRow({ label, value, valueClass = "", last = false }: { label: string; value: string; valueClass?: string; last?: boolean }) {
	return <div className={`grid grid-cols-[minmax(120px,0.75fr)_minmax(0,1.25fr)] gap-4 py-3 text-[13px] ${last ? "" : "border-b border-slate-200"}`}><span className="text-slate-500">{label}</span><span className={`font-medium text-[#101828] ${valueClass}`}>{value}</span></div>;
}

function ErrorState({ message }: { message: string }) {
	return <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertTriangle className="size-5 shrink-0" />{message}</div>;
}
