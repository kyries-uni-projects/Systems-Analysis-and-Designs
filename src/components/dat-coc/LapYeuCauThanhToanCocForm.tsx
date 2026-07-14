"use client";

import { useState, useEffect } from "react";
import { ChevronRight, AlertTriangle, Check } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";

type HoSoData = {
	hoSo: {
		hoSoDatCocId: number;
		trangThai: string;
		hinhThucThue: string;
		khachHang: { hoTen: string };
		chiTietDatCocs: Array<{
			giaThueThoaThuan: number;
			soGiuongQuyDoi: number;
			phong: { maPhong: string } | null;
			giuong: { maGiuongLocal: string } | null;
		}>;
	};
};

function formatVND(n: number) {
	return n.toLocaleString("vi-VN") + " VNĐ";
}

export default function LapYeuCauThanhToanCocForm({ hoSoId }: { hoSoId: number }) {
	const { isLoading: isAuthLoading } = useAuth();
	const router = useRouter();
	const [data, setData] = useState<HoSoData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [successMsg, setSuccessMsg] = useState("");

	useEffect(() => {
		async function load() {
			try {
				const res = await fetch(`/api/ho-so-dat-coc/${hoSoId}`);
				const json = await res.json();
				if (!json.success) throw new Error(json.error);
				setData(json.data);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
			} finally {
				setIsLoading(false);
			}
		}
		void load();
	}, [hoSoId]);

	const handleSubmit = async () => {
		setIsSubmitting(true);
		setError("");
		try {
			const res = await fetch(`/api/ho-so-dat-coc/${hoSoId}/lap-yeu-cau-thanh-toan`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ keToanId: 1 }),
			});
			const json = await res.json();
			if (!json.success) throw new Error(json.error);
			setSuccessMsg("Đã gửi yêu cầu thanh toán thành công");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Lỗi xử lý");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading || isAuthLoading) {
		return <div className="py-12 text-center text-sm text-slate-500">Đang tải...</div>;
	}

	if (error && !data) {
		return (
			<div className="py-12 text-center text-red-600">
				<AlertTriangle className="mx-auto mb-2 size-8" />
				{error}
			</div>
		);
	}

	if (successMsg) {
		return (
			<div className="min-h-screen bg-[#f4faf8] p-8">
				<div className="mx-auto max-w-[1024px]">
					<div className="mt-8 flex items-center gap-4 rounded-xl border border-[#d7ece7] bg-[#f8fefd] p-6 shadow-sm">
						<div className="flex size-14 items-center justify-center rounded-full bg-[#27ad60]">
							<Check className="size-8 text-white" />
						</div>
						<div>
							<h2 className="text-xl font-bold text-[#27ad60]">{successMsg}</h2>
							<p className="text-sm text-slate-500">Khách hàng sẽ nhận được thông tin thanh toán.</p>
						</div>
					</div>
					<button
						type="button"
						onClick={() => router.push("/dat-coc-xac-nhan-thue/danh-sach-ho-so")}
						className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
					>
						← Quay lại danh sách
					</button>
				</div>
			</div>
		);
	}

	if (!data) return null;
	const { hoSo } = data;
	const ct = hoSo.chiTietDatCocs?.[0];
	const giaThue = ct?.giaThueThoaThuan ?? 0;
	const soGiuong = ct?.soGiuongQuyDoi ?? 1;
	const tien2Thang = giaThue * 2;
	const tongCoc = tien2Thang * soGiuong;
	const phongGiuong = ct ? `${ct.phong?.maPhong ?? "—"} – ${ct.giuong ? `Giường ${ct.giuong.maGiuongLocal}` : ""}` : "—";

	return (
		<div className="pb-10">
			{/* Breadcrumb */}
			<div className="mb-1 flex items-center gap-1 text-[13px] text-[#6a7282]">
				<span>Đặt cọc &amp; xác nhận thuê</span>
				<ChevronRight className="size-3" />
				<span>Lập yêu cầu thanh toán cọc</span>
			</div>

			<h1 className="mb-6 text-2xl font-bold text-[#101828]">Lập yêu cầu thanh toán cọc</h1>

			{error && (
				<div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
			)}

			<div className="grid grid-cols-2 gap-5">
				{/* Left: Thông tin hồ sơ */}
				<div className="rounded-xl border border-[#d7ece7] bg-[#f8fefd] p-5 shadow-sm">
					<h2 className="mb-4 text-base font-semibold text-[#101828]">Thông tin hồ sơ</h2>
					<InfoRow label="Khách hàng" value={hoSo.khachHang.hoTen} />
					<InfoRow label="Phòng/Giường" value={phongGiuong} />
					<InfoRow label="Hình thức thuê" value={hoSo.hinhThucThue} />
					<InfoRow label="Giá thuê/tháng" value={formatVND(giaThue)} />
					<InfoRow label="Số giường thuê" value={`${soGiuong} giường`} />
					<InfoRow label="Trạng thái hồ sơ" value={hoSo.trangThai} valueColor="text-[#27ad60]" last />
				</div>

				{/* Right: Tính tiền cọc */}
				<div className="rounded-xl border border-[#d7ece7] bg-[#f8fefd] p-5 shadow-sm">
					<h2 className="mb-4 text-base font-semibold text-[#101828]">Tính tiền cọc</h2>

					{/* Formula box */}
					<div className="mb-5 rounded-lg bg-blue-50 p-4">
						<p className="text-xs text-[#6a7282]">Công thức tính:</p>
						<p className="mt-1 text-[13px] font-medium text-[#155cfc]">
							Tiền cọc = Tiền thuê 2 tháng × Số giường thuê
						</p>
					</div>

					<InfoRow label="Tiền thuê/tháng" value={formatVND(giaThue)} />
					<InfoRow label="× 2 tháng" value={`= ${formatVND(tien2Thang)}`} />
					<InfoRow label={`× ${soGiuong} giường`} value={`= ${formatVND(tongCoc)}`} />

					{/* Total box */}
					<div className="mt-3 flex items-center justify-between rounded-lg bg-blue-500/8 p-4">
						<span className="text-sm font-semibold text-[#101828]">TỔNG TIỀN CỌC:</span>
						<span className="text-lg font-bold text-[#155cfc]">{formatVND(tongCoc)}</span>
					</div>
				</div>
			</div>

			{/* Bottom: Thông tin thanh toán */}
			<div className="mt-5 rounded-xl border border-[#d7ece7] bg-[#f8fefd] p-5 shadow-sm">
				<h2 className="mb-4 text-base font-semibold text-[#101828]">Thông tin thanh toán</h2>
				<div className="grid grid-cols-2 gap-x-16 gap-y-3">
					<InfoRow label="Ngân hàng" value="Vietcombank – Chi nhánh Quận 5" />
					<InfoRow label="Chủ tài khoản" value="HOMESTAY DORM CO., LTD" />
					<InfoRow label="Số tài khoản" value="1234567890" />
					<InfoRow label="Thời hạn thanh toán" value="24 giờ kể từ khi gửi yêu cầu" valueColor="text-[#f39c12]" last />
				</div>
			</div>

			{/* Actions */}
			<div className="mt-6 flex items-center justify-between">
				<button
					type="button"
					onClick={() => router.push("/dat-coc-xac-nhan-thue/danh-sach-ho-so")}
					className="h-11 rounded-xl border border-[#364153] px-8 text-sm font-medium text-[#364153] transition hover:bg-gray-50"
				>
					Trả lại hồ sơ
				</button>
				<button
					type="button"
					onClick={handleSubmit}
					disabled={isSubmitting}
					className="h-11 rounded-xl bg-[#155cfc] px-10 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
				>
					Gửi yêu cầu thanh toán →
				</button>
			</div>
		</div>
	);
}

function InfoRow({ label, value, valueColor, last }: { label: string; value: string; valueColor?: string; last?: boolean }) {
	return (
		<>
			<div className="flex py-2">
				<span className="w-[180px] text-[13px] text-[#6a7282]">{label}</span>
				<span className={`text-[13px] font-medium ${valueColor ?? "text-[#101828]"}`}>{value}</span>
			</div>
			{!last && <div className="h-px bg-[#edeef0]" />}
		</>
	);
}
