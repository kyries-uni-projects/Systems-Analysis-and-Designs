"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

type InitialData = {
	hoSoId: number;
	trangThai: string;
	lyDoTuChoi: string | null;
	ngayBatDauDuKien: string;
	ngayKetThucDuKien: string;
	khachHang: {
		hoTen: string;
		cccdPassport: string;
		gioiTinh: string | null;
		quocTich: string | null;
		soDienThoai: string;
		email: string | null;
	};
	yeuCauThue: {
		soNguoiDuKien: number;
		loaiThue: string;
		khuVucMongMuon: string | null;
	};
	dieuKien: { quyDinhId: number; tenQuyDinh: string; ketQua: string }[];
};

type DieuKien = InitialData["dieuKien"][number];

const inputClass =
	"h-11 w-full min-w-0 border-0 bg-transparent px-0 text-[13px] font-medium text-[#101828] outline-none placeholder:text-[#a0a4a8] focus-visible:ring-0";

export default function CapNhatThongTinHoSoForm({ initialData, dieuKien = [] }: { initialData?: InitialData; dieuKien?: DieuKien[] }) {
	const router = useRouter();
	const { sessionUser, isLoading } = useAuth();
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const isCreate = !initialData;
	const today = new Date().toISOString().slice(0, 10);
	const defaultEndDate = new Date(new Date(`${today}T00:00:00`).setMonth(new Date(`${today}T00:00:00`).getMonth() + 6)).toISOString().slice(0, 10);
	const displayedConditions = initialData?.dieuKien ?? dieuKien;

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		setSuccess("");
		setIsSubmitting(true);

		const formData = new FormData(event.currentTarget);
		const response = await fetch(isCreate ? "/api/ho-so-dat-coc" : `/api/ho-so-dat-coc/${initialData.hoSoId}/cap-nhat-thong-tin`, {
			method: isCreate ? "POST" : "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				khachHang: {
					hoTen: formData.get("hoTen"),
					cccdPassport: formData.get("cccdPassport"),
					gioiTinh: formData.get("gioiTinh"),
					quocTich: formData.get("quocTich"),
					soDienThoai: formData.get("soDienThoai"),
					email: formData.get("email"),
				},
				yeuCauThue: {
					soNguoiDuKien: formData.get("soNguoiDuKien"),
					loaiThue: formData.get("loaiThue"),
					khuVucMongMuon: formData.get("khuVucMongMuon"),
				},
				ngayBatDauDuKien: formData.get("ngayBatDauDuKien"),
				ngayKetThucDuKien: formData.get("ngayKetThucDuKien"),
				lyDoTuChoi: formData.get("lyDoTuChoi"),
			}),
		});
		const result: { success?: boolean; error?: string } = await response.json().catch(() => ({}));
		if (!response.ok || !result.success) {
			setError(result.error ?? "Không thể lưu cập nhật hồ sơ.");
			setIsSubmitting(false);
			return;
		}

		setSuccess(isCreate ? "Đã tạo hồ sơ đặt cọc." : "Đã lưu cập nhật hồ sơ.");
		setIsSubmitting(false);
		if (isCreate) {
			router.push("/deposit");
		} else {
			router.refresh();
		}
	}

	if (isLoading) {
		return <p className="py-12 text-center text-sm text-slate-500">Đang tải quyền truy cập...</p>;
	}

	if (sessionUser?.role !== "nhanvien" && sessionUser?.role !== "admin") {
		return <p className="py-12 text-center text-sm text-red-600">Tài khoản hiện tại không có quyền lập hoặc cập nhật hồ sơ đặt cọc.</p>;
	}

	const currentStatus = initialData?.trangThai ?? "Mới tạo";
	const statusStyle =
		currentStatus === "Từ chối"
			? "bg-red-50 text-red-600"
			: currentStatus === "Đã xác nhận điều kiện"
				? "bg-emerald-50 text-[#27ad60]"
				: "bg-[#fff7ed] text-[#f39c12]";

	return (
		<form onSubmit={handleSubmit} className="mx-auto w-full max-w-[960px]">
			<div className="mb-6">
				<nav className="mb-6 text-[13px] text-[#6a7282]" aria-label="Breadcrumb">
					Đặt cọc &amp; xác nhận thuê&nbsp;&nbsp;&gt;&nbsp;&nbsp; {isCreate ? "Lập phiếu đặt cọc" : "Cập nhật thông tin hồ sơ đặt cọc"}
				</nav>
				<h1 className="text-2xl font-bold text-[#101828]">{isCreate ? "Lập phiếu đặt cọc" : "Cập nhật thông tin hồ sơ đặt cọc"}</h1>
				<p className="mt-1 text-[13px] text-[#6a7282]">
					{isCreate ? "Nhập thông tin để tạo hồ sơ đặt cọc mới." : "Chỉnh sửa thông tin của hồ sơ đặt cọc đã chọn."}
				</p>
			</div>

			{error && (
				<p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
					{error}
				</p>
			)}
			{success && <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}

			<div className="grid gap-5 lg:grid-cols-2">
				<section className="min-h-[480px] rounded-[10px] border border-[#d7ece7] bg-[#f8fefd] p-[19px] shadow-[0_1px_1.5px_rgba(0,0,0,0.08)]">
					<h2 className="mb-4 text-base font-semibold text-[#101828]">{isCreate ? "Thông tin khách hàng" : "Thông tin khách hàng đang cập nhật"}</h2>
					<div className="divide-y divide-[#edeef0]">
						<Field label="Họ và tên">
							<input name="hoTen" required defaultValue={initialData?.khachHang.hoTen ?? ""} className={inputClass} />
						</Field>
						<Field label="Số CCCD">
							<input name="cccdPassport" required defaultValue={initialData?.khachHang.cccdPassport ?? ""} className={inputClass} />
						</Field>
						<Field label="Giới tính">
							<input name="gioiTinh" defaultValue={initialData?.khachHang.gioiTinh ?? ""} className={inputClass} />
						</Field>
						<Field label="Quốc tịch">
							<input name="quocTich" defaultValue={initialData?.khachHang.quocTich ?? ""} className={inputClass} />
						</Field>
						<Field label="Số điện thoại">
							<input name="soDienThoai" required defaultValue={initialData?.khachHang.soDienThoai ?? ""} className={inputClass} />
						</Field>
						<Field label="Email">
							<input name="email" type="email" defaultValue={initialData?.khachHang.email ?? ""} className={inputClass} />
						</Field>
						<Field label="Số người dự kiến">
							<input name="soNguoiDuKien" required min="1" type="number" defaultValue={initialData?.yeuCauThue.soNguoiDuKien ?? 1} className={inputClass} />
						</Field>
						<Field label="Loại thuê">
							<input name="loaiThue" required defaultValue={initialData?.yeuCauThue.loaiThue ?? ""} className={inputClass} />
						</Field>
						<Field label="Khu vực mong muốn">
							<input name="khuVucMongMuon" defaultValue={initialData?.yeuCauThue.khuVucMongMuon ?? ""} className={inputClass} />
						</Field>
						<Field label="Ngày bắt đầu dự kiến">
							<input name="ngayBatDauDuKien" required type="date" defaultValue={initialData?.ngayBatDauDuKien ?? today} className={inputClass} />
						</Field>
						<Field label="Ngày kết thúc dự kiến">
							<input name="ngayKetThucDuKien" required type="date" defaultValue={initialData?.ngayKetThucDuKien ?? defaultEndDate} className={inputClass} />
						</Field>
					</div>
				</section>

				<section className="min-h-[480px] rounded-[10px] border border-[#d7ece7] bg-[#f8fefd] p-[19px] shadow-[0_1px_1.5px_rgba(0,0,0,0.08)]">
					<h2 className="mb-5 text-base font-semibold text-[#101828]">Rà soát điều kiện lưu trú</h2>
					<div className="space-y-3">
						{displayedConditions.map((dieuKien) => {
							const daDat = dieuKien.ketQua === "Đạt";
							const daKhongDat = dieuKien.ketQua === "Không đạt";
							const conditionStyle = daDat ? "bg-[#f0fcf5] text-[#101828]" : daKhongDat ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800";

							return (
								<div key={dieuKien.quyDinhId} className={`flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] ${conditionStyle}`}>
									<span
										className={`text-sm font-bold ${daDat ? "text-[#27ad60]" : daKhongDat ? "text-red-600" : "text-amber-600"}`}
										aria-hidden="true"
									>
										{daDat ? "✓" : daKhongDat ? "×" : "•"}
									</span>
									<span className="min-w-0 flex-1 truncate">{dieuKien.tenQuyDinh}</span>
									<span className="text-[11px] font-medium">{dieuKien.ketQua}</span>
								</div>
							);
						})}
					</div>
					<label className="mt-5 block text-[13px] font-medium text-[#364153]">
						Ghi chú từ chối (nếu có)
						<textarea
							name="lyDoTuChoi"
							rows={3}
							defaultValue={initialData?.lyDoTuChoi ?? ""}
							placeholder="Nhập lý do từ chối (nếu không đáp ứng điều kiện)..."
							className="mt-3 h-20 w-full resize-none rounded-lg border border-[#d1d5dc] bg-white p-3 text-[13px] text-[#101828] outline-none placeholder:text-[#a0a4a8] focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e]"
						/>
					</label>
					<div className="mt-3 flex items-center justify-between text-[13px]">
						<span className="font-medium text-[#364153]">Trạng thái phòng/giường</span>
						<span className={`rounded-full px-[10px] py-[7px] text-[11px] font-medium ${statusStyle}`}>{currentStatus}</span>
					</div>
				</section>
			</div>

			<div className="mt-6 flex items-center justify-between">
				<button
					type="button"
					onClick={() => router.push("/deposit")}
					className="h-10 w-[151px] rounded-[10px] border border-[#364153] bg-white text-sm font-medium text-[#364153] transition hover:bg-slate-50"
				>
					{isCreate ? "Hủy" : "Hủy chỉnh sửa"}
				</button>
				<button
					type="submit"
					disabled={isSubmitting}
					className="h-11 rounded-lg border border-[#0f766e] bg-[#0f766e] px-4 text-sm font-medium text-white transition hover:bg-[#0b625b] disabled:cursor-not-allowed disabled:opacity-60"
				>
					{isSubmitting ? "Đang lưu..." : isCreate ? "Lưu hồ sơ" : "Lưu cập nhật hồ sơ"}
				</button>
			</div>
		</form>
	);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<label className="grid h-11 grid-cols-[180px_minmax(0,1fr)] items-center gap-5">
			<span className="text-[13px] text-[#6a7282]">{label}</span>
			{children}
		</label>
	);
}
