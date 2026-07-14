"use client";

import { useState, useEffect } from "react";
import { ChevronRight, AlertTriangle, Check } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";

type HoSoData = {
	hoSo: {
		hoSoDatCocId: number;
		trangThai: string;
		khachHang: { hoTen: string };
		yeuCauThue: { loaiThue: string; khuVucMongMuon: string | null; soNguoiDuKien: number; thoiGianDuKienVaoO: string | null };
		phong: { maPhong: string; khu: string | null; gioiTinhApDung: string | null; sucChua: number | null } | null;
		giuong: { maGiuongLocal: string } | null;
		nhanVien: { hoTen: string };
	};
	tinhTrangPhong: {
		tinhTrangPhong: string;
		datCocChoTuSaleKhac: boolean;
		phuHopGioiTinh: boolean;
		sucChuaConLai: string;
	} | null;
};

export default function XacNhanTinhTrangPhongForm({ hoSoId }: { hoSoId: number }) {
	const { sessionUser, isLoading: isAuthLoading } = useAuth();
	const router = useRouter();
	const [data, setData] = useState<HoSoData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");
	const [ghiChu, setGhiChu] = useState("");
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

	const handleSubmit = async (tuChoi: boolean) => {
		setIsSubmitting(true);
		setError("");
		try {
			const res = await fetch(`/api/ho-so-dat-coc/${hoSoId}/xac-nhan-quan-ly`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					lyDoTuChoi: tuChoi ? ghiChu : undefined,
					quanLyId: 1, // Demo
				}),
			});
			const json = await res.json();
			if (!json.success) throw new Error(json.error);
			setSuccessMsg(tuChoi ? "Đã từ chối hồ sơ" : "Đã xác nhận có thể nhận cọc");
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
							<p className="text-sm text-slate-500">Hồ sơ đã được xử lý thành công.</p>
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
	const { hoSo, tinhTrangPhong } = data;

	const phongInfo = hoSo.phong;
	const giuongInfo = hoSo.giuong;
	const yeuCau = hoSo.yeuCauThue;

	const roomAvailable = tinhTrangPhong?.tinhTrangPhong === "Trống";
	const noOtherDeposit = !tinhTrangPhong?.datCocChoTuSaleKhac;
	const genderOk = tinhTrangPhong?.phuHopGioiTinh;

	return (
		<div className="pb-10">
			{/* Breadcrumb */}
			<div className="mb-1 flex items-center gap-1 text-[13px] text-[#6a7282]">
				<span>Đặt cọc &amp; xác nhận thuê</span>
				<ChevronRight className="size-3" />
				<span>Xác nhận tình trạng phòng/giường</span>
			</div>

			<h1 className="mb-4 text-2xl font-bold text-[#101828]">Xác nhận tình trạng phòng/giường</h1>

			{/* Badge */}
			<div className="mb-6 inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-[13px] font-medium text-blue-600">
				📋 Yêu cầu từ NV Sale: {hoSo.nhanVien.hoTen}
			</div>

			{error && (
				<div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
			)}

			<div className="grid grid-cols-2 gap-5">
				{/* Left: Thông tin yêu cầu */}
				<div className="rounded-xl border border-[#d7ece7] bg-[#f8fefd] p-5 shadow-sm">
					<h2 className="mb-4 text-base font-semibold text-[#101828]">Thông tin yêu cầu kiểm tra</h2>
					<InfoRow label="Khách hàng" value={hoSo.khachHang.hoTen} />
					<InfoRow label="Phòng yêu cầu" value={phongInfo ? `Phòng ${phongInfo.maPhong} – ${phongInfo.khu ?? ""} (${phongInfo.gioiTinhApDung ?? ""})` : "—"} />
					<InfoRow label="Giường yêu cầu" value={giuongInfo ? `Giường số ${giuongInfo.maGiuongLocal}` : "—"} />
					<InfoRow label="Số giường thuê" value={`1 giường`} />
					<InfoRow label="Khu vực" value={phongInfo?.khu ?? "—"} />
					<InfoRow label="Thời gian vào ở dự kiến" value={yeuCau.thoiGianDuKienVaoO ? new Date(yeuCau.thoiGianDuKienVaoO).toLocaleDateString("vi-VN") : "—"} last />
				</div>

				{/* Right: Kết quả kiểm tra */}
				<div className="rounded-xl border border-[#d7ece7] bg-[#f8fefd] p-5 shadow-sm">
					<h2 className="mb-4 text-base font-semibold text-[#101828]">Kết quả kiểm tra tình trạng</h2>

					{/* Status Box */}
					<div className={`mb-5 flex items-start gap-4 rounded-xl border p-5 ${roomAvailable && noOtherDeposit ? "border-[#27ad60] bg-[#f0fcf5]" : "border-red-300 bg-red-50"}`}>
						<span className={`text-2xl font-bold ${roomAvailable && noOtherDeposit ? "text-[#27ad60]" : "text-red-500"}`}>
							{roomAvailable && noOtherDeposit ? "✓" : "✗"}
						</span>
						<div>
							<p className={`text-[15px] font-semibold ${roomAvailable && noOtherDeposit ? "text-[#27ad60]" : "text-red-600"}`}>
								{roomAvailable && noOtherDeposit ? "Phòng/giường còn trống" : "Phòng/giường không khả dụng"}
							</p>
							<p className="text-xs text-[#6a7282]">
								{noOtherDeposit ? "Chưa có giao dịch đặt cọc đang chờ xử lý" : "Đã có giao dịch đặt cọc khác"}
							</p>
						</div>
					</div>

					<CheckRow label="Tình trạng phòng" value={roomAvailable ? "Còn trống" : (tinhTrangPhong?.tinhTrangPhong ?? "—")} ok={roomAvailable} />
					<CheckRow label="Đặt cọc đang chờ từ sale khác" value={noOtherDeposit ? "Không có" : "Có"} ok={noOtherDeposit} />
					<CheckRow label="Phù hợp giới tính khu vực" value={genderOk ? `Phù hợp (${phongInfo?.gioiTinhApDung ? `Khu ${phongInfo.gioiTinhApDung}` : ""})` : "Không phù hợp"} ok={genderOk} />
					<CheckRow label="Sức chứa còn lại" value={tinhTrangPhong?.sucChuaConLai ?? "—"} ok={true} last />

					<p className="mt-3 text-[13px] font-medium text-[#364153]">Ghi chú của quản lý</p>
				</div>
			</div>

			{/* Bottom: Quyết định */}
			<div className="mt-5 rounded-xl border border-[#d7ece7] bg-[#f8fefd] p-5 shadow-sm">
				<h2 className="mb-3 text-[15px] font-semibold text-[#101828]">Quyết định của quản lý</h2>
				<textarea
					value={ghiChu}
					onChange={(e) => setGhiChu(e.target.value)}
					placeholder="Nhập lý do từ chối (nếu phòng không khả dụng)..."
					className="mb-4 h-16 w-[620px] rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
				/>

				<div className="flex items-center justify-between">
					<button
						type="button"
						onClick={() => handleSubmit(true)}
						disabled={isSubmitting}
						className="h-11 rounded-xl border border-[#364153] px-8 text-sm font-medium text-[#364153] transition hover:bg-gray-50 disabled:opacity-50"
					>
						Từ chối
					</button>
					<button
						type="button"
						onClick={() => handleSubmit(false)}
						disabled={isSubmitting}
						className="h-11 rounded-xl bg-[#155cfc] px-8 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
					>
						Xác nhận có thể nhận cọc ✓
					</button>
				</div>
			</div>
		</div>
	);
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
	return (
		<>
			<div className="flex py-2">
				<span className="w-[200px] text-[13px] text-[#6a7282]">{label}</span>
				<span className="text-[13px] font-medium text-[#101828]">{value}</span>
			</div>
			{!last && <div className="h-px bg-[#edeef0]" />}
		</>
	);
}

function CheckRow({ label, value, ok, last }: { label: string; value: string; ok?: boolean; last?: boolean }) {
	return (
		<>
			<div className="flex py-2">
				<span className="w-[220px] text-[13px] text-[#6a7282]">{label}</span>
				<span className={`text-[13px] font-medium ${ok ? "text-[#27ad60]" : "text-red-500"}`}>
					{ok ? "✓" : "✗"} {value}
				</span>
			</div>
			{!last && <div className="h-px bg-transparent" />}
		</>
	);
}
