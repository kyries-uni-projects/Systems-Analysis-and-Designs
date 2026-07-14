"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

type HoSoDatCocDetail = {
	hoSoDatCocId: number;
	trangThai: string;
	hinhThucThue: string;
	khachHang: { hoTen: string };
	phong: { maPhong: string } | null;
	giuong: { maGiuongLocal: string } | null;
	chiTietDatCoc: { giaThueThoaThuan: number; soGiuongQuyDoi: number } | null;
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
	const [success, setSuccess] = useState("");

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
			setSuccess("Đã gửi yêu cầu thanh toán cọc cho khách hàng.");
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : "Không thể lập yêu cầu thanh toán.");
		} finally {
			setIsSubmitting(false);
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

	const { chiTietDatCoc } = hoSo;
	const tienCoc = chiTietDatCoc.giaThueThoaThuan * 2 * chiTietDatCoc.soGiuongQuyDoi;

	return (
		<div className="pb-10">
			<nav className="mb-3 text-[13px] text-slate-500" aria-label="Breadcrumb">
				Đặt cọc &amp; xác nhận thuê &nbsp;&gt;&nbsp; Lập yêu cầu thanh toán cọc
			</nav>
			<h1 className="text-2xl font-bold text-[#101828]">Lập yêu cầu thanh toán cọc</h1>
			{error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
			{success && (
				<p className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
					<CheckCircle2 className="size-5" aria-hidden="true" />
					{success}
				</p>
			)}

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
					<SummaryRow label="Số giường thuê" value={`${chiTietDatCoc.soGiuongQuyDoi} giường`} />
					<SummaryRow label="Trạng thái hồ sơ" value={hoSo.trangThai} valueClass="text-emerald-600" last />
				</section>
				<section className="rounded-lg border border-[#d7ece7] bg-[#f8fefd] p-5 shadow-[0_1px_1.5px_rgba(0,0,0,0.08)]">
					<h2 className="mb-3 text-base font-semibold text-[#101828]">Tính tiền cọc</h2>
					<div className="rounded-lg bg-blue-50 px-3 py-3 text-xs text-slate-500">
						Công thức tính:<p className="mt-1 font-semibold text-[#155DFC]">Tiền cọc = Tiền thuê 2 tháng x Số giường thuê</p>
					</div>
					<div className="mt-3">
						<SummaryRow label="Tiền thuê/tháng" value={formatCurrency(chiTietDatCoc.giaThueThoaThuan)} />
						<SummaryRow label="x 2 tháng" value={`= ${formatCurrency(chiTietDatCoc.giaThueThoaThuan * 2)}`} />
						<SummaryRow label={`x ${chiTietDatCoc.soGiuongQuyDoi} giường`} value={`= ${formatCurrency(tienCoc)}`} />
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
					onClick={() => router.push("/deposit/xac-nhan-thanh-toan")}
					className="h-10 rounded-lg border border-slate-500 bg-white px-6 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
				>
					Trả lại hồ sơ
				</button>
				<button
					type="button"
					onClick={() => void handleSubmit()}
					disabled={isSubmitting || Boolean(success)}
					className="h-11 rounded-lg bg-[#155DFC] px-6 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{isSubmitting ? "Đang gửi..." : success ? "Đã gửi yêu cầu" : "Gửi yêu cầu thanh toán"}
				</button>
			</div>
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
