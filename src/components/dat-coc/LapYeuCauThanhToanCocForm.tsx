"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import ActionModal from "@/components/ui/ActionModal";

type HoSoDatCocDetail = {
	hoSoDatCocId: number;
	trangThai: string;
	hinhThucThue: string;
	khachHang: { hoTen: string };
	phong: { maPhong: string; sucChua: number } | null;
	giuong: { maGiuongLocal: string } | null;
	chiTietDatCoc: { giaThueThoaThuan: number; soGiuongQuyDoi: number } | null;
};

type YeuCauThanhToan = {
	yeuCauThanhToanId: number;
	soTienCoc: number;
	thoiDiemPhatHanh: string;
	hanThanhToan: string;
	soTaiKhoanNhan: string | null;
	trangThai: string;
};

type HoSoTraLai = {
	trangThai: string;
	lyDoCanCapNhat: string;
	thongBao: string;
};

function formatCurrency(value: number) {
	return new Intl.NumberFormat("vi-VN").format(value) + " VND";
}

export default function LapYeuCauThanhToanCocForm({ hoSoId }: { hoSoId: number }) {
	const router = useRouter();
	const { sessionUser, isLoading: isAuthLoading } = useAuth();
	const [hoSo, setHoSo] = useState<HoSoDatCocDetail | null>(null);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [success, setSuccess] = useState<YeuCauThanhToan | null>(null);
	const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
	const [isReturning, setIsReturning] = useState(false);
	const [returnReason, setReturnReason] = useState("");
	const [returnError, setReturnError] = useState("");
	const [returnedProfile, setReturnedProfile] = useState<HoSoTraLai | null>(null);

	useEffect(() => {
		async function loadHoSo() {
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

		void loadHoSo();
	}, [hoSoId]);

	async function handleSubmit() {
		setError("");
		setIsSubmitting(true);
		try {
			const response = await fetch(`/api/ho-so-dat-coc/${hoSoId}/yeu-cau-thanh-toan`, { method: "POST" });
			const payload = await response.json();
			if (!response.ok || !payload.success) throw new Error(payload.error || "Không thể lập yêu cầu thanh toán.");
			setSuccess(payload.data);
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : "Không thể lập yêu cầu thanh toán.");
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleReturnProfile() {
		if (!returnReason.trim()) {
			setReturnError("Vui lòng nhập thông tin tài chính cần Sale bổ sung.");
			return;
		}

		setReturnError("");
		setIsReturning(true);
		try {
			const response = await fetch(`/api/ho-so-dat-coc/${hoSoId}/yeu-cau-thanh-toan`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ lyDoCanCapNhat: returnReason }),
			});
			const payload = await response.json();
			if (!response.ok || !payload.success) throw new Error(payload.error || "Không thể trả hồ sơ cho Sale cập nhật.");
			setReturnedProfile(payload.data);
			setIsReturnDialogOpen(false);
		} catch (returnProfileError) {
			setReturnError(returnProfileError instanceof Error ? returnProfileError.message : "Không thể trả hồ sơ cho Sale cập nhật.");
		} finally {
			setIsReturning(false);
		}
	}

	if (isAuthLoading || isLoading) return <p className="py-12 text-center text-sm text-slate-500">Đang tải dữ liệu hồ sơ...</p>;
	if (!sessionUser || (sessionUser.role !== "ketoan" && sessionUser.role !== "admin"))
		return <p className="py-12 text-center text-sm text-red-600">Tài khoản hiện tại không có quyền lập yêu cầu thanh toán.</p>;
	if (error && !hoSo)
		return (
			<div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
				<AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
				{error}
			</div>
		);
	if (!hoSo || !hoSo.chiTietDatCoc)
		return <p className="py-12 text-center text-sm text-slate-500">Hồ sơ chưa có thông tin phòng hoặc giường để tính tiền cọc.</p>;
	if (returnedProfile) {
		return (
			<div className="mx-auto max-w-3xl pb-10 pt-6">
				<section className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm">
					<div className="bg-amber-50 px-6 py-8 text-center">
						<div className="mx-auto flex size-16 items-center justify-center rounded-full bg-amber-500 text-white">
							<CheckCircle2 className="size-9" aria-hidden="true" />
						</div>
						<h1 className="mt-4 text-2xl font-bold text-[#101828]">Đã trả hồ sơ cho Sale cập nhật</h1>
						<p className="mt-2 text-sm text-slate-600">Hồ sơ đã chuyển sang trạng thái <strong>{returnedProfile.trangThai}</strong> và không còn trong danh sách chờ Kế toán.</p>
					</div>
					<div className="p-6">
						<p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Thông tin cần bổ sung</p>
						<p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">{returnedProfile.lyDoCanCapNhat}</p>
						<p className="mt-3 text-sm text-slate-500">{returnedProfile.thongBao}</p>
						<div className="mt-6 flex justify-end">
							<button type="button" onClick={() => router.push("/deposit")} className="h-11 rounded-lg bg-[#0f766e] px-6 text-sm font-semibold text-white transition hover:bg-[#0b625b]">
								Quay về danh sách
							</button>
						</div>
					</div>
				</section>
			</div>
		);
	}
	if (success) {
		return (
			<div className="pb-10">
				<nav className="mb-3 flex items-center gap-2 text-[13px] text-slate-500" aria-label="Breadcrumb">
					<span>Đặt cọc &amp; xác nhận thuê</span>
					<ChevronRight className="size-4" aria-hidden="true" />
					<span>Lập yêu cầu thanh toán cọc</span>
					<ChevronRight className="size-4" aria-hidden="true" />
					<span className="font-medium text-[#101828]">Thành công</span>
				</nav>
				<section className="mt-6 overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm">
					<div className="bg-emerald-50 px-6 py-8 text-center">
						<div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-600 text-white">
							<CheckCircle2 className="size-9" aria-hidden="true" />
						</div>
						<h1 className="mt-4 text-2xl font-bold text-[#101828]">Lập yêu cầu thanh toán cọc thành công!</h1>
						<p className="mt-2 text-sm text-slate-600">Yêu cầu đã được phát hành và hồ sơ chuyển sang trạng thái Chờ thanh toán.</p>
					</div>
					<div className="grid gap-6 p-6 lg:grid-cols-2">
						<div>
							<h2 className="mb-3 text-sm font-semibold text-[#101828]">Thông tin yêu cầu</h2>
							<SummaryRow label="Mã yêu cầu" value={`YCTT-${String(success.yeuCauThanhToanId).padStart(6, "0")}`} />
							<SummaryRow label="Khách hàng" value={hoSo.khachHang.hoTen} />
							<SummaryRow label="Phòng/Giường" value={`${hoSo.phong?.maPhong ?? "—"}${hoSo.giuong ? ` - Giường ${hoSo.giuong.maGiuongLocal}` : ""}`} />
							<SummaryRow label="Trạng thái" value={success.trangThai} valueClass="text-blue-600" last />
						</div>
						<div>
							<h2 className="mb-3 text-sm font-semibold text-[#101828]">Thông tin thanh toán</h2>
							<SummaryRow label="Số tiền cọc" value={formatCurrency(success.soTienCoc)} valueClass="text-[#155DFC]" />
							<SummaryRow label="Số tài khoản" value={success.soTaiKhoanNhan || "1234567890"} />
							<SummaryRow label="Phát hành lúc" value={new Date(success.thoiDiemPhatHanh).toLocaleString("vi-VN")} />
							<SummaryRow label="Hạn thanh toán" value={new Date(success.hanThanhToan).toLocaleString("vi-VN")} valueClass="text-amber-600" last />
						</div>
					</div>
					<div className="mx-6 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
						<Check className="size-4 shrink-0" aria-hidden="true" /> Thông tin thanh toán đã sẵn sàng để gửi đến khách hàng.
					</div>
					<div className="flex justify-end p-6">
						<button type="button" onClick={() => router.push("/deposit")} className="h-11 rounded-lg bg-[#0f766e] px-6 text-sm font-semibold text-white transition hover:bg-[#0b625b]">
							Quay về danh sách
						</button>
					</div>
				</section>
			</div>
		);
	}

	const { chiTietDatCoc } = hoSo;
	const isWholeRoomRental = hoSo.hinhThucThue === "Thuê nguyên phòng";
	const soGiuongTinhCoc = isWholeRoomRental ? (hoSo.phong?.sucChua ?? chiTietDatCoc.soGiuongQuyDoi) : chiTietDatCoc.soGiuongQuyDoi;
	const tienCoc = chiTietDatCoc.giaThueThoaThuan * 2 * soGiuongTinhCoc;

	return (
		<div className="pb-10">
			<nav className="mb-3 text-[13px] text-slate-500" aria-label="Breadcrumb">
				Đặt cọc &amp; xác nhận thuê &nbsp;&gt;&nbsp; Lập yêu cầu thanh toán cọc
			</nav>
			<h1 className="text-2xl font-bold text-[#101828]">Lập yêu cầu thanh toán cọc</h1>
			{error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

			<div className="mt-6 grid gap-5 lg:grid-cols-2">
				<section className="rounded-lg border border-[#d7ece7] bg-[#f8fefd] p-5 shadow-[0_1px_1.5px_rgba(0,0,0,0.08)]">
					<h2 className="mb-3 text-base font-semibold text-[#101828]">Thông tin hồ sơ</h2>
					<SummaryRow label="Khách hàng" value={hoSo.khachHang.hoTen} />
					<SummaryRow
						label="Phòng/Giường"
						value={`${hoSo.phong?.maPhong ?? "Chưa phân phòng"}${hoSo.giuong ? ` - Giường ${hoSo.giuong.maGiuongLocal}` : ""}`}
					/>
					<SummaryRow label="Hình thức thuê" value={hoSo.hinhThucThue} />
					<SummaryRow label="Giá thuê/tháng" value={formatCurrency(chiTietDatCoc.giaThueThoaThuan)} />
					<SummaryRow label="Số giường thuê" value={`${soGiuongTinhCoc} giường`} />
					<SummaryRow label="Trạng thái hồ sơ" value={hoSo.trangThai} valueClass="text-emerald-600" last />
				</section>
				<section className="rounded-lg border border-[#d7ece7] bg-[#f8fefd] p-5 shadow-[0_1px_1.5px_rgba(0,0,0,0.08)]">
					<h2 className="mb-3 text-base font-semibold text-[#101828]">Tính tiền cọc</h2>
					<div className="rounded-lg bg-blue-50 px-3 py-3 text-xs text-slate-500">
						Công thức tính:<p className="mt-1 font-semibold text-[#155DFC]">Tiền cọc = Tiền thuê 2 tháng x Số giường thuê</p>
						{isWholeRoomRental && <p className="mt-1 text-blue-700">Thuê nguyên phòng: số giường thuê bằng sức chứa tối đa của phòng.</p>}
					</div>
					<div className="mt-3">
						<SummaryRow label="Tiền thuê/tháng" value={formatCurrency(chiTietDatCoc.giaThueThoaThuan)} />
						<SummaryRow label="x 2 tháng" value={`= ${formatCurrency(chiTietDatCoc.giaThueThoaThuan * 2)}`} />
						<SummaryRow label={`x ${soGiuongTinhCoc} giường`} value={`= ${formatCurrency(tienCoc)}`} />
						<div className="mt-3 flex items-center justify-between rounded-lg bg-blue-100 px-4 py-3 text-sm font-bold text-[#101828]">
							<span>TỔNG TIỀN CỌC:</span>
							<span className="text-base text-[#155DFC]">{formatCurrency(tienCoc)}</span>
						</div>
					</div>
				</section>
			</div>
			<section className="mt-5 rounded-lg border border-[#d7ece7] bg-[#f8fefd] p-5 shadow-[0_1px_1.5px_rgba(0,0,0,0.08)]">
				<h2 className="mb-3 text-base font-semibold text-[#101828]">Thông tin thanh toán</h2>
				<div className="grid gap-x-12 sm:grid-cols-2">
					<SummaryRow label="Ngân hàng" value="Vietcombank - Chi nhánh Quận 5" />
					<SummaryRow label="Chủ tài khoản" value="HOMESTAY DORM CO., LTD" last />
					<SummaryRow label="Số tài khoản" value="1234567890" last />
					<SummaryRow label="Thời hạn thanh toán" value="24 giờ kể từ khi gửi yêu cầu" valueClass="text-amber-600" last />
				</div>
			</section>
			<div className="mt-6 flex items-center justify-between">
				<button
					type="button"
					onClick={() => {
						setReturnError("");
						setIsReturnDialogOpen(true);
					}}
					disabled={isSubmitting || isReturning}
					className="h-10 rounded-lg border border-slate-500 bg-white px-6 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
				>
					Trả lại hồ sơ
				</button>
				<button
					type="button"
					onClick={() => void handleSubmit()}
					disabled={isSubmitting || isReturning}
					className="h-11 rounded-lg bg-[#155DFC] px-6 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{isSubmitting ? "Đang gửi..." : "Gửi yêu cầu thanh toán"}
				</button>
			</div>
			<ActionModal
				open={isReturnDialogOpen}
				title="Trả hồ sơ cho Sale cập nhật"
				description="Hồ sơ sẽ chuyển sang trạng thái Cần cập nhật. Sale sẽ thấy nội dung bên dưới, bổ sung thông tin và gửi lại cho Kế toán."
				confirmLabel="Trả hồ sơ"
				tone="warning"
				isLoading={isReturning}
				confirmDisabled={!returnReason.trim()}
				error={returnError}
				onClose={() => {
					setIsReturnDialogOpen(false);
					setReturnError("");
				}}
				onConfirm={() => void handleReturnProfile()}
			>
				<label className="mt-4 block text-sm font-medium text-[#364153]">
					Thông tin tài chính cần bổ sung
					<textarea
						rows={4}
						value={returnReason}
						onChange={(event) => setReturnReason(event.target.value)}
						placeholder="Ví dụ: Bổ sung giá thuê thỏa thuận và số giường thuê chính xác..."
						disabled={isReturning}
						className="mt-2 w-full resize-none rounded-lg border border-slate-300 bg-white p-3 text-sm text-[#101828] outline-none placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50"
					/>
				</label>
			</ActionModal>
		</div>
	);
}

function SummaryRow({ label, value, valueClass = "", last = false }: { label: string; value: string; valueClass?: string; last?: boolean }) {
	return (
		<div className={`grid grid-cols-[minmax(120px,1fr)_auto] gap-4 py-2.5 text-[13px] ${last ? "" : "border-b border-slate-200"}`}>
			<span className="text-slate-500">{label}</span>
			<span className={`text-right font-medium text-[#101828] ${valueClass}`}>{value}</span>
		</div>
	);
}
