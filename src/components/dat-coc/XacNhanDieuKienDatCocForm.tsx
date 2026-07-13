"use client";

import { useState, useEffect, FormEvent } from "react";
import { Check, ChevronRight, XCircle, AlertTriangle } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

// ============================================================
// Types
// ============================================================

type HoSoDatCocDetail = {
	hoSoDatCocId: number;
	trangThai: string;
	lyDoTuChoi: string | null;
	khachHang: { hoTen: string; cccdPassport: string; gioiTinh: string | null; quocTich: string | null; soDienThoai: string; email: string | null };
	yeuCauThue: { loaiThue: string; khuVucMongMuon: string | null; soNguoiDuKien: number; thoiGianDuKienVaoO: string | null };
	phong: { maPhong: string; khu: string | null; tang: number | null };
	giuong: { maGiuongLocal: string } | null;
};

type QuyDinhItem = {
	quyDinhId: number;
	tenQuyDinh: string;
};

type TinhTrangPhong = {
	tinhTrangPhong: string;
	datCocChoTuSaleKhac: boolean;
	phuHopGioiTinh: boolean;
	sucChuaConLai: string;
};

export default function XacNhanDieuKienDatCocForm({ hoSoId }: { hoSoId: number }) {
	const { sessionUser, isLoading: isAuthLoading } = useAuth();
	const role = sessionUser?.role === "quanly" ? "quan_ly" : "sale";
	const [data, setData] = useState<{
		hoSo: HoSoDatCocDetail;
		quyDinhList: QuyDinhItem[] | null;
		tinhTrangPhong: TinhTrangPhong | null;
	} | null>(null);

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Form states
	const [checkedConditions, setCheckedConditions] = useState<Record<number, boolean>>({});
	const [ghiChuTuChoi, setGhiChuTuChoi] = useState("");

	useEffect(() => {
		async function fetchHoSo() {
			try {
				const response = await fetch(`/api/ho-so-dat-coc/${hoSoId}`);
				const payload = await response.json();
				if (!response.ok || !payload.success) {
					throw new Error(payload.error || "Không thể tải dữ liệu hồ sơ");
				}
				setData(payload.data);

				// Khởi tạo state cho checkbox nếu là Sale
				if (payload.data.quyDinhList) {
					const initialChecks: Record<number, boolean> = {};
					payload.data.quyDinhList.forEach((q: QuyDinhItem) => {
						initialChecks[q.quyDinhId] = false;
					});
					setCheckedConditions(initialChecks);
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
			} finally {
				setIsLoading(false);
			}
		}

		void fetchHoSo();
	}, [hoSoId]);

	const handleCheck = (quyDinhId: number) => {
		setCheckedConditions((prev) => ({
			...prev,
			[quyDinhId]: !prev[quyDinhId],
		}));
	};

	const handleSubmit = async (isTuChoi: boolean) => {
		if (!data?.hoSo) return;
		setError("");
		setIsSubmitting(true);

		try {
			// Chuẩn bị payload
			const ketQuaKiemTra = data.quyDinhList?.map((q) => ({
				quyDinhId: q.quyDinhId,
				ketQua: checkedConditions[q.quyDinhId] ? "Đạt" : "Không đạt",
			})) || [];

			const payload = {
				ketQuaKiemTra,
				lyDoTuChoi: isTuChoi ? ghiChuTuChoi : undefined,
			};

			const response = await fetch(`/api/ho-so-dat-coc/${hoSoId}/xac-nhan`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const resData = await response.json();
			if (!response.ok || !resData.success) {
				throw new Error(resData.error || "Không thể xác nhận hồ sơ");
			}

			// Thành công, load lại data
			const res = await fetch(`/api/ho-so-dat-coc/${hoSoId}`);
			const newData = await res.json();
			if (newData.success) {
				setData(newData.data);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading || isAuthLoading) {
		return <div className="py-12 text-center text-sm text-slate-500">Đang tải dữ liệu...</div>;
	}

	if (error || !data) {
		return (
			<div className="py-12 text-center text-red-600">
				<AlertTriangle className="mx-auto mb-2 size-8 text-red-500" />
				{error || "Không tìm thấy dữ liệu hồ sơ"}
			</div>
		);
	}

	const { hoSo, quyDinhList, tinhTrangPhong } = data;

	// View 3: Success (Đã xác nhận điều kiện)
	if (hoSo.trangThai === "Đã xác nhận điều kiện" || hoSo.trangThai === "Chờ thanh toán") {
		return (
			<div className="pb-10">
				{/* Breadcrumb */}
				<div className="mb-2 flex items-center gap-2 text-sm text-[#4a5565]">
					<span>Đặt cọc & xác nhận thuê</span>
					<ChevronRight className="size-4" aria-hidden="true" />
					<span>Xác nhận điều kiện đặt cọc</span>
					<ChevronRight className="size-4" aria-hidden="true" />
					<span className="font-medium text-[#101828]">Kết quả</span>
				</div>

				{/* Success Banner */}
				<div className="mt-8 flex items-center gap-4 rounded-[10px] border border-[#d7ece7] bg-[#f8fefd] p-6 shadow-sm">
					<div className="flex size-14 items-center justify-center rounded-full bg-[#27ad60]">
						<Check className="size-8 text-white" />
					</div>
					<div>
						<h2 className="text-xl font-bold text-[#27ad60]">Xác nhận điều kiện thành công!</h2>
						<p className="mt-1 text-sm text-[#4a5565]">
							Hồ sơ khách hàng đã được cập nhật trạng thái '{hoSo.trangThai}'. Sẵn sàng chuyển sang bước lập yêu cầu thanh toán cọc.
						</p>
					</div>
				</div>

				{/* Info summary */}
				<div className="mt-6 rounded-[10px] border border-[#e5e7eb] bg-white p-6 shadow-sm">
					<h3 className="mb-4 text-base font-bold text-[#101828]">Tóm tắt thông tin hồ sơ</h3>
					<div className="grid grid-cols-2 gap-y-6">
						<div className="grid grid-cols-[160px_1fr] items-center gap-4 border-b pb-4">
							<span className="text-sm text-[#6a7282]">Khách hàng</span>
							<span className="text-sm font-medium text-[#101828]">{hoSo.khachHang.hoTen}</span>
						</div>
						<div className="grid grid-cols-[160px_1fr] items-center gap-4 border-b pb-4">
							<span className="text-sm text-[#6a7282]">Phòng/Giường</span>
							<span className="text-sm font-medium text-[#101828]">
								{hoSo.phong.maPhong} {hoSo.giuong ? `– Giường ${hoSo.giuong.maGiuongLocal}` : ""}
							</span>
						</div>
						<div className="grid grid-cols-[160px_1fr] items-center gap-4 border-b pb-4">
							<span className="text-sm text-[#6a7282]">Loại thuê</span>
							<span className="text-sm font-medium text-[#101828]">{hoSo.yeuCauThue.loaiThue}</span>
						</div>
						<div className="grid grid-cols-[160px_1fr] items-center gap-4 border-b pb-4">
							<span className="text-sm text-[#6a7282]">Khu vực</span>
							<span className="text-sm font-medium text-[#101828]">{hoSo.phong.khu || "Khu chung"}</span>
						</div>
						<div className="grid grid-cols-[160px_1fr] items-center gap-4 border-b pb-4">
							<span className="text-sm text-[#6a7282]">Thời gian vào ở</span>
							<span className="text-sm font-medium text-[#101828]">
								{hoSo.yeuCauThue.thoiGianDuKienVaoO ? new Date(hoSo.yeuCauThue.thoiGianDuKienVaoO).toLocaleDateString("vi-VN") : "—"}
							</span>
						</div>
						<div className="grid grid-cols-[160px_1fr] items-center gap-4 border-b pb-4">
							<span className="text-sm text-[#6a7282]">Trạng thái hồ sơ</span>
							<span className="text-sm font-medium text-[#27ad60]">{hoSo.trangThai}</span>
						</div>
					</div>

					<div className="mt-6 flex items-center gap-4 rounded-lg bg-[#f0f5ff] p-4 text-sm text-[#155DFC]">
						<span className="font-medium">→ Bước tiếp theo:</span> Kế toán sẽ tiếp nhận hồ sơ và tiến hành lập yêu cầu thanh toán cọc cho khách hàng.
					</div>

					<div className="mt-8 flex justify-end gap-4">
						<button className="rounded-[10px] border border-[#d1d5dc] bg-white px-6 py-2.5 text-sm font-medium text-[#364153]">
							Quay về danh sách
						</button>
						<button className="rounded-[10px] bg-[#155DFC] px-6 py-2.5 text-sm font-medium text-white">
							Chuyển sang lập yêu cầu cọc
						</button>
					</div>
				</div>
			</div>
		);
	}

	// ==========================================
	// Xác định View hiện tại: Sale hay Quản lý
	// ==========================================
	const isSaleView = hoSo.trangThai === "Chờ xác nhận điều kiện" || hoSo.trangThai === "Mới tạo";
	const isManagerView = hoSo.trangThai === "Chờ xác nhận quản lý";

	return (
		<div className="pb-10">
			{/* Breadcrumb */}
			<div className="mb-2 flex items-center gap-2 text-sm text-[#4a5565]">
				<span>Đặt cọc & xác nhận thuê</span>
				<ChevronRight className="size-4" aria-hidden="true" />
				<span className="font-medium text-[#101828]">
					{isSaleView ? "Xác nhận điều kiện đặt cọc" : "Xác nhận tình trạng phòng/giường"}
				</span>
			</div>
			<h1 className="text-2xl font-bold text-[#101828]">
				{isSaleView ? "Xác nhận điều kiện đặt cọc" : "Xác nhận tình trạng phòng/giường"}
			</h1>

			{isManagerView && (
				<div className="mt-4 flex items-center gap-2">
					<span className="rounded-[6px] bg-[#f0f5ff] px-3 py-1.5 text-sm font-medium text-[#155DFC]">
						Yêu cầu từ NV Sale: Nhân viên Test
					</span>
				</div>
			)}

			<div className="mt-8 grid gap-6 lg:grid-cols-2">
				{/* Cột trái: Thông tin */}
				<div className="rounded-[10px] border border-[#d7ece7] bg-[#f8fefd] p-5 shadow-[0_1px_1.5px_rgba(0,0,0,0.08)]">
					<div className="mb-6 flex items-center justify-between">
						<h2 className="text-base font-semibold text-[#101828]">
							{isSaleView ? "Thông tin khách hàng" : "Thông tin yêu cầu kiểm tra"}
						</h2>
						{isSaleView && (
							<button className="rounded-md border border-[#a7f3d0] bg-[#ecfdf5] px-2.5 py-1 text-xs font-medium text-[#047857]">
								Chỉnh sửa
							</button>
						)}
					</div>

					<div className="space-y-4">
						<div className="grid grid-cols-[140px_1fr] items-center border-b border-slate-200 pb-3">
							<span className="text-sm text-[#6a7282]">{isSaleView ? "Họ và tên" : "Khách hàng"}</span>
							<span className="text-sm font-medium text-[#101828]">{hoSo.khachHang.hoTen}</span>
						</div>
						{isSaleView && (
							<>
								<div className="grid grid-cols-[140px_1fr] items-center border-b border-slate-200 pb-3">
									<span className="text-sm text-[#6a7282]">Số CCCD</span>
									<span className="text-sm font-medium text-[#101828]">{hoSo.khachHang.cccdPassport}</span>
								</div>
								<div className="grid grid-cols-[140px_1fr] items-center border-b border-slate-200 pb-3">
									<span className="text-sm text-[#6a7282]">Giới tính</span>
									<span className="text-sm font-medium text-[#101828]">{hoSo.khachHang.gioiTinh || "—"}</span>
								</div>
								<div className="grid grid-cols-[140px_1fr] items-center border-b border-slate-200 pb-3">
									<span className="text-sm text-[#6a7282]">Quốc tịch</span>
									<span className="text-sm font-medium text-[#101828]">{hoSo.khachHang.quocTich || "—"}</span>
								</div>
								<div className="grid grid-cols-[140px_1fr] items-center border-b border-slate-200 pb-3">
									<span className="text-sm text-[#6a7282]">Số điện thoại</span>
									<span className="text-sm font-medium text-[#101828]">{hoSo.khachHang.soDienThoai}</span>
								</div>
								<div className="grid grid-cols-[140px_1fr] items-center border-b border-slate-200 pb-3">
									<span className="text-sm text-[#6a7282]">Email</span>
									<span className="text-sm font-medium text-[#101828]">{hoSo.khachHang.email || "—"}</span>
								</div>
							</>
						)}
						{!isSaleView && (
							<>
								<div className="grid grid-cols-[140px_1fr] items-center border-b border-slate-200 pb-3">
									<span className="text-sm text-[#6a7282]">Phòng yêu cầu</span>
									<span className="text-sm font-medium text-[#101828]">Phòng {hoSo.phong.maPhong} – Khu {hoSo.phong.khu || "chung"}</span>
								</div>
								<div className="grid grid-cols-[140px_1fr] items-center border-b border-slate-200 pb-3">
									<span className="text-sm text-[#6a7282]">Giường yêu cầu</span>
									<span className="text-sm font-medium text-[#101828]">{hoSo.giuong ? `Giường số ${hoSo.giuong.maGiuongLocal}` : "—"}</span>
								</div>
							</>
						)}

						<div className="grid grid-cols-[140px_1fr] items-center border-b border-slate-200 pb-3">
							<span className="text-sm text-[#6a7282]">{isSaleView ? "Số người dự kiến" : "Số giường thuê"}</span>
							<span className="text-sm font-medium text-[#101828]">{hoSo.yeuCauThue.soNguoiDuKien} người</span>
						</div>
						<div className="grid grid-cols-[140px_1fr] items-center border-b border-slate-200 pb-3">
							<span className="text-sm text-[#6a7282]">{isSaleView ? "Loại thuê" : "Khu vực"}</span>
							<span className="text-sm font-medium text-[#101828]">{isSaleView ? hoSo.yeuCauThue.loaiThue : (hoSo.phong.khu || "Khu chung")}</span>
						</div>
						<div className="grid grid-cols-[140px_1fr] items-center border-b border-slate-200 pb-3">
							<span className="text-sm text-[#6a7282]">{isSaleView ? "Khu vực mong muốn" : "Thời gian vào ở"}</span>
							<span className="text-sm font-medium text-[#101828]">
								{isSaleView 
									? (hoSo.yeuCauThue.khuVucMongMuon || "—")
									: (hoSo.yeuCauThue.thoiGianDuKienVaoO ? new Date(hoSo.yeuCauThue.thoiGianDuKienVaoO).toLocaleDateString("vi-VN") : "—")
								}
							</span>
						</div>
					</div>
				</div>

				{/* Cột phải: Rà soát & Quyết định */}
				<div className="flex flex-col gap-6">
					{isSaleView ? (
						// --- SALE VIEW ---
						<div className="rounded-[10px] border border-[#d7ece7] bg-[#f8fefd] p-5 shadow-[0_1px_1.5px_rgba(0,0,0,0.08)]">
							<h2 className="mb-4 text-base font-semibold text-[#101828]">Rà soát điều kiện lưu trú</h2>
							<div className="space-y-3">
								{quyDinhList && quyDinhList.length > 0 ? (
									quyDinhList.map((q) => (
										<label
											key={q.quyDinhId}
											className="flex cursor-pointer items-center gap-3 rounded-lg bg-[#f0fcf5] px-3 py-2.5 transition hover:bg-[#e0f5ea]"
										>
											<input
												type="checkbox"
												checked={checkedConditions[q.quyDinhId] || false}
												onChange={() => handleCheck(q.quyDinhId)}
												className="size-4 cursor-pointer rounded border-gray-300 text-[#27ad60] focus:ring-[#27ad60]"
											/>
											<span className="text-sm text-[#101828]">{q.tenQuyDinh}</span>
										</label>
									))
								) : (
									<p className="text-sm text-slate-500">Chưa cấu hình quy định kiểm tra</p>
								)}
							</div>

							<div className="mt-6">
								<label className="mb-2 block text-sm font-medium text-[#364153]">Ghi chú từ chối (nếu có)</label>
								<textarea
									rows={3}
									value={ghiChuTuChoi}
									onChange={(e) => setGhiChuTuChoi(e.target.value)}
									className="w-full rounded-lg border border-[#d1d5dc] bg-white p-3 text-sm outline-none placeholder:text-[#a0a4a8] focus:border-[#155DFC] focus:ring-1 focus:ring-[#155DFC]"
									placeholder="Nhập lý do từ chối (nếu không đáp ứng điều kiện)..."
								/>
							</div>

							<div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
								<span className="text-sm font-medium text-[#364153]">Trạng thái phòng/giường</span>
								<span className="rounded-full bg-[#fff7ed] px-3 py-1 text-xs font-medium text-[#f39c12]">
									Chờ xác nhận quản lý
								</span>
							</div>
						</div>
					) : (
						// --- MANAGER VIEW ---
						<>
							<div className="rounded-[10px] border border-[#d7ece7] bg-white p-5 shadow-[0_1px_1.5px_rgba(0,0,0,0.08)]">
								<h2 className="mb-4 text-base font-semibold text-[#101828]">Kết quả kiểm tra tình trạng</h2>
								
								<div className="mb-6 rounded-lg border border-[#27ad60] bg-[#f0fcf5] p-4 flex items-center gap-3">
									<Check className="size-6 text-[#27ad60]" />
									<div>
										<h3 className="font-bold text-[#27ad60]">Phòng/giường còn trống</h3>
										<p className="text-xs text-[#6a7282]">Chưa có giao dịch đặt cọc đang chờ xử lý</p>
									</div>
								</div>

								{tinhTrangPhong && (
									<div className="space-y-4">
										<div className="flex items-center justify-between border-b border-slate-100 pb-2">
											<span className="text-sm text-[#6a7282]">Tình trạng phòng</span>
											<span className={`text-sm font-medium flex items-center gap-1 ${tinhTrangPhong.tinhTrangPhong === "Trống" ? "text-[#27ad60]" : "text-[#f39c12]"}`}>
												{tinhTrangPhong.tinhTrangPhong === "Trống" && <Check className="size-4" />}
												{tinhTrangPhong.tinhTrangPhong}
											</span>
										</div>
										<div className="flex items-center justify-between border-b border-slate-100 pb-2">
											<span className="text-sm text-[#6a7282]">Đặt cọc đang chờ từ sale khác</span>
											<span className={`text-sm font-medium flex items-center gap-1 ${!tinhTrangPhong.datCocChoTuSaleKhac ? "text-[#27ad60]" : "text-red-600"}`}>
												{!tinhTrangPhong.datCocChoTuSaleKhac && <Check className="size-4" />}
												{tinhTrangPhong.datCocChoTuSaleKhac ? "Có" : "Không có"}
											</span>
										</div>
										<div className="flex items-center justify-between border-b border-slate-100 pb-2">
											<span className="text-sm text-[#6a7282]">Phù hợp giới tính khu vực</span>
											<span className={`text-sm font-medium flex items-center gap-1 ${tinhTrangPhong.phuHopGioiTinh ? "text-[#27ad60]" : "text-red-600"}`}>
												{tinhTrangPhong.phuHopGioiTinh && <Check className="size-4" />}
												Phù hợp
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm text-[#6a7282]">Sức chứa còn lại</span>
											<span className="text-sm font-medium text-[#27ad60] flex items-center gap-1">
												<Check className="size-4" />
												{tinhTrangPhong.sucChuaConLai}
											</span>
										</div>
									</div>
								)}
							</div>
							
							{/* Thêm Card Quyết định của quản lý */}
							<div className="rounded-[10px] border border-[#d7ece7] bg-white p-5 shadow-[0_1px_1.5px_rgba(0,0,0,0.08)]">
								<h2 className="mb-4 text-base font-semibold text-[#101828]">Quyết định của quản lý</h2>
								<textarea
									rows={3}
									value={ghiChuTuChoi}
									onChange={(e) => setGhiChuTuChoi(e.target.value)}
									className="w-full rounded-lg border border-[#d1d5dc] bg-white p-3 text-sm outline-none placeholder:text-[#a0a4a8] focus:border-[#155DFC] focus:ring-1 focus:ring-[#155DFC]"
									placeholder="Nhập lý do từ chối (nếu phòng không khả dụng)..."
								/>
							</div>
						</>
					)}
				</div>
			</div>

			{/* Buttons */}
			<div className="mt-8 flex items-center justify-between">
				<button
					type="button"
					onClick={() => handleSubmit(true)}
					disabled={isSubmitting || !ghiChuTuChoi}
					className="h-11 rounded-[10px] border border-[#364153] bg-white px-6 text-sm font-medium text-[#364153] transition hover:bg-slate-50 disabled:opacity-50"
				>
					Từ chối
				</button>
				<button
					type="button"
					onClick={() => handleSubmit(false)}
					disabled={isSubmitting}
					className="h-11 rounded-[10px] bg-[#155cfc] px-6 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
				>
					{isSubmitting
						? "Đang xử lý..."
						: isSaleView
							? "Gửi yêu cầu kiểm tra phòng"
							: "Xác nhận có thể nhận cọc"}
				</button>
			</div>
		</div>
	);
}
