"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, ChevronRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

type HoSoDatCocDetail = {
	hoSoDatCocId: number;
	maHoSoDatCoc: string;
	trangThai: string;
	hinhThucThue: string;
	lyDoTuChoi: string | null;
	nhanVien: { hoTen: string };
	khachHang: {
		hoTen: string;
		cccdPassport: string;
		gioiTinh: string | null;
		quocTich: string | null;
		soDienThoai: string;
		email: string | null;
	};
	yeuCauThue: { loaiThue: string; khuVucMongMuon: string | null; soNguoiDuKien: number; thoiGianDuKienVaoO: string | null };
	phong: { phongId: number; maPhong: string; khu: string | null; tang: number | null } | null;
	giuong: { giuongId: number; maGiuongLocal: string } | null;
	chiTietDatCoc: { giaThueThoaThuan: number; soGiuongQuyDoi: number } | null;
	ketQuaKiemTraDieuKiens: { quyDinhId: number; ketQua: string; quyDinh: { tenQuyDinh: string } }[];
};

type QuyDinhItem = { quyDinhId: number; tenQuyDinh: string; batBuoc: boolean };

type TinhTrangPhong = {
	tinhTrangPhong: string;
	datCocChoTuSaleKhac: boolean;
	phuHopGioiTinh: boolean;
	sucChuaConLai: string;
	coTheXacNhan: boolean;
};

type PhongKhaDung = {
	phongId: number;
	maPhong: string;
	khu: string | null;
	tang: number | null;
	sucChua: number;
	gioiTinhApDung: string | null;
	loaiPhong: string;
	donGia: number;
	giuongs: { giuongId: number; maGiuongLocal: string; trangThai: string; khaDung: boolean }[];
};

type DetailPayload = { hoSo: HoSoDatCocDetail; quyDinhList: QuyDinhItem[] | null; tinhTrangPhong: TinhTrangPhong | null };

const controlClass =
	"h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-[#101828] outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100";

function formatCurrency(value: number) {
	return new Intl.NumberFormat("vi-VN").format(value) + " VND";
}

export default function XacNhanDieuKienDatCocForm({ hoSoId }: { hoSoId: number }) {
	const router = useRouter();
	const { sessionUser, isLoading: isAuthLoading } = useAuth();
	const [data, setData] = useState<DetailPayload | null>(null);
	const [rooms, setRooms] = useState<PhongKhaDung[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [completion, setCompletion] = useState<{ title: string; description: string } | null>(null);
	const [checkedConditions, setCheckedConditions] = useState<Record<number, boolean>>({});
	const [ghiChuTuChoi, setGhiChuTuChoi] = useState("");
	const [phongId, setPhongId] = useState("");
	const [giuongId, setGiuongId] = useState("");
	const [giaThueThoaThuan, setGiaThueThoaThuan] = useState("");
	const [soGiuongQuyDoi, setSoGiuongQuyDoi] = useState("1");

	useEffect(() => {
		async function loadData() {
			try {
				const detailResponse = await fetch(`/api/ho-so-dat-coc/${hoSoId}`);
				const detailPayload = await detailResponse.json();
				if (!detailResponse.ok || !detailPayload.success) throw new Error(detailPayload.error || "Không thể tải dữ liệu hồ sơ.");

				const loadedData = detailPayload.data as DetailPayload;
				setData(loadedData);
				setPhongId(loadedData.hoSo.phong?.phongId ? String(loadedData.hoSo.phong.phongId) : "");
				setGiuongId(loadedData.hoSo.giuong?.giuongId ? String(loadedData.hoSo.giuong.giuongId) : "");
				setGiaThueThoaThuan(loadedData.hoSo.chiTietDatCoc ? String(loadedData.hoSo.chiTietDatCoc.giaThueThoaThuan) : "");
				setSoGiuongQuyDoi(String(loadedData.hoSo.chiTietDatCoc?.soGiuongQuyDoi ?? 1));
				setCheckedConditions(
					Object.fromEntries((loadedData.quyDinhList ?? []).map((quyDinh) => [quyDinh.quyDinhId, false])),
				);

				if (["Chờ xác nhận điều kiện", "Mới tạo"].includes(loadedData.hoSo.trangThai)) {
					const roomsResponse = await fetch("/api/ho-so-dat-coc/phong-kha-dung");
					const roomsPayload = await roomsResponse.json();
					if (!roomsResponse.ok || !roomsPayload.success) throw new Error(roomsPayload.error || "Không thể tải danh sách phòng.");
					setRooms(roomsPayload.data);
				}
			} catch (loadError) {
				setError(loadError instanceof Error ? loadError.message : "Không thể tải dữ liệu hồ sơ.");
			} finally {
				setIsLoading(false);
			}
		}

		void loadData();
	}, [hoSoId]);

	const selectedRoom = useMemo(() => rooms.find((room) => room.phongId === Number(phongId)) ?? null, [phongId, rooms]);
	const isBedRental = Boolean(data?.hoSo.hinhThucThue.toLocaleLowerCase("vi-VN").includes("giường"));
	const allMandatoryConditionsPassed = Boolean(
		data?.quyDinhList?.every((quyDinh) => !quyDinh.batBuoc || checkedConditions[quyDinh.quyDinhId]),
	);

	function handleRoomChange(value: string) {
		setPhongId(value);
		setGiuongId("");
		const room = rooms.find((item) => item.phongId === Number(value));
		setGiaThueThoaThuan(room ? String(room.donGia) : "");
	}

	async function handleSubmit(isRejected: boolean) {
		if (!data) return;
		if (isRejected && !ghiChuTuChoi.trim()) {
			setError("Vui lòng nhập lý do từ chối.");
			return;
		}

		setError("");
		setIsSubmitting(true);
		try {
			const isSaleStage = ["Chờ xác nhận điều kiện", "Mới tạo"].includes(data.hoSo.trangThai);
			const response = await fetch(`/api/ho-so-dat-coc/${hoSoId}/xac-nhan`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					ketQuaKiemTra: isSaleStage
						? (data.quyDinhList ?? []).map((quyDinh) => ({
								quyDinhId: quyDinh.quyDinhId,
								ketQua: checkedConditions[quyDinh.quyDinhId] ? "Đạt" : "Không đạt",
							}))
						: undefined,
					chiTietDatCoc:
						isSaleStage && !isRejected
							? {
									phongId: Number(phongId),
									giuongId: giuongId ? Number(giuongId) : undefined,
									giaThueThoaThuan: Number(giaThueThoaThuan),
									soGiuongQuyDoi: Number(soGiuongQuyDoi),
								}
							: undefined,
					lyDoTuChoi: isRejected ? ghiChuTuChoi : undefined,
				}),
			});
			const payload = await response.json();
			if (!response.ok || !payload.success) throw new Error(payload.error || "Không thể xử lý hồ sơ.");

			setCompletion(
				isRejected
					? { title: "Đã từ chối hồ sơ", description: "Lý do từ chối đã được lưu và hồ sơ đã dừng tại bước hiện tại." }
					: isSaleStage
						? { title: "Đã gửi yêu cầu kiểm tra", description: "Yêu cầu đặt cọc đã được chuyển đến Quản lý để xác nhận tình trạng phòng hoặc giường." }
						: { title: "Xác nhận thành công", description: "Hồ sơ đã đủ điều kiện và được chuyển đến Kế toán để lập yêu cầu thanh toán cọc." },
			);
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : "Không thể xử lý hồ sơ.");
		} finally {
			setIsSubmitting(false);
		}
	}

	if (isLoading || isAuthLoading) return <p className="py-12 text-center text-sm text-slate-500">Đang tải dữ liệu hồ sơ...</p>;
	if (error && !data)
		return (
			<div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
				<AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
				{error}
			</div>
		);
	if (!data || !sessionUser) return <p className="py-12 text-center text-sm text-red-600">Không thể xác định hồ sơ hoặc quyền truy cập.</p>;

	const { hoSo, quyDinhList, tinhTrangPhong } = data;
	const isSaleView = ["Chờ xác nhận điều kiện", "Mới tạo"].includes(hoSo.trangThai);
	const isManagerView = hoSo.trangThai === "Chờ xác nhận quản lý";
	const canHandle =
		sessionUser.role === "admin" || (isSaleView && sessionUser.role === "nhanvien") || (isManagerView && sessionUser.role === "quanly");

	if (completion) {
		return (
			<div className="mx-auto max-w-3xl py-10">
				<div className="rounded-xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
					<div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
						<CheckCircle2 className="size-9" aria-hidden="true" />
					</div>
					<h1 className="mt-5 text-2xl font-bold text-[#101828]">{completion.title}</h1>
					<p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">{completion.description}</p>
					<button
						type="button"
						onClick={() => router.push("/deposit")}
						className="mt-7 h-11 rounded-lg bg-[#0f766e] px-6 text-sm font-semibold text-white transition hover:bg-[#0b625b]"
					>
						Quay về danh sách
					</button>
				</div>
			</div>
		);
	}

	if (!isSaleView && !isManagerView) {
		return <WorkflowSummary hoSo={hoSo} onBack={() => router.push("/deposit")} />;
	}
	if (!canHandle) return <p className="py-12 text-center text-sm text-red-600">Tài khoản hiện tại không có quyền xử lý hồ sơ ở bước này.</p>;

	const title = isSaleView ? "Xác định yêu cầu đặt cọc" : "Xác nhận tình trạng giường/phòng";
	const canSubmitSale = Boolean(phongId && (!isBedRental || giuongId) && Number(giaThueThoaThuan) > 0 && allMandatoryConditionsPassed);

	return (
		<div className="pb-10">
			<nav className="mb-3 flex items-center gap-2 text-[13px] text-slate-500" aria-label="Breadcrumb">
				<span>Đặt cọc &amp; xác nhận thuê</span>
				<ChevronRight className="size-4" aria-hidden="true" />
				<span className="font-medium text-[#101828]">{title}</span>
			</nav>
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold text-[#101828]">{title}</h1>
					<p className="mt-1 text-sm text-slate-500">Hồ sơ {hoSo.maHoSoDatCoc}</p>
				</div>
				{isManagerView && <span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">Yêu cầu từ Sale: {hoSo.nhanVien.hoTen}</span>}
			</div>

			{error && (
				<p className="mt-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
					<AlertTriangle className="size-4 shrink-0" aria-hidden="true" /> {error}
				</p>
			)}

			<div className="mt-6 grid gap-5 lg:grid-cols-2">
				<section className="rounded-xl border border-[#d7ece7] bg-[#f8fefd] p-5 shadow-sm">
					<h2 className="mb-4 text-base font-semibold text-[#101828]">{isSaleView ? "Thông tin khách hàng" : "Thông tin yêu cầu kiểm tra"}</h2>
					<InfoRow label="Khách hàng" value={hoSo.khachHang.hoTen} />
					{isSaleView ? (
						<>
							<InfoRow label="Số CCCD" value={hoSo.khachHang.cccdPassport} />
							<InfoRow label="Giới tính" value={hoSo.khachHang.gioiTinh || "—"} />
							<InfoRow label="Quốc tịch" value={hoSo.khachHang.quocTich || "—"} />
							<InfoRow label="Số điện thoại" value={hoSo.khachHang.soDienThoai} />
							<InfoRow label="Email" value={hoSo.khachHang.email || "—"} />
							<InfoRow label="Số người dự kiến" value={`${hoSo.yeuCauThue.soNguoiDuKien} người`} />
							<InfoRow label="Hình thức thuê" value={hoSo.hinhThucThue} />
							<InfoRow label="Khu vực mong muốn" value={hoSo.yeuCauThue.khuVucMongMuon || "—"} last />
						</>
					) : (
						<>
							<InfoRow label="Phòng yêu cầu" value={hoSo.phong ? `${hoSo.phong.maPhong} – ${hoSo.phong.khu || "Khu chung"}` : "—"} />
							<InfoRow label="Giường yêu cầu" value={hoSo.giuong ? `Giường ${hoSo.giuong.maGiuongLocal}` : "Thuê nguyên phòng"} />
							<InfoRow label="Số giường quy đổi" value={`${hoSo.chiTietDatCoc?.soGiuongQuyDoi ?? 0}`} />
							<InfoRow label="Giá thuê thỏa thuận" value={formatCurrency(hoSo.chiTietDatCoc?.giaThueThoaThuan ?? 0)} />
							<InfoRow label="Thời gian vào ở" value={hoSo.yeuCauThue.thoiGianDuKienVaoO ? new Date(hoSo.yeuCauThue.thoiGianDuKienVaoO).toLocaleDateString("vi-VN") : "—"} last />
						</>
					)}
				</section>

				<div className="space-y-5">
					{isSaleView ? (
						<>
							<section className="rounded-xl border border-[#d7ece7] bg-white p-5 shadow-sm">
								<h2 className="mb-4 text-base font-semibold text-[#101828]">Thông tin phòng/giường đặt cọc</h2>
								<div className="grid gap-4 sm:grid-cols-2">
									<FormField label="Phòng" className="sm:col-span-2">
										<select value={phongId} onChange={(event) => handleRoomChange(event.target.value)} className={controlClass}>
											<option value="">Chọn phòng</option>
											{rooms.map((room) => (
												<option key={room.phongId} value={room.phongId}>
													{room.maPhong} – {room.khu || "Khu chung"} – {room.loaiPhong}
												</option>
											))}
										</select>
									</FormField>
									{isBedRental && (
										<FormField label="Giường">
											<select value={giuongId} onChange={(event) => setGiuongId(event.target.value)} disabled={!selectedRoom} className={controlClass}>
												<option value="">Chọn giường</option>
												{selectedRoom?.giuongs.filter((bed) => bed.khaDung).map((bed) => (
													<option key={bed.giuongId} value={bed.giuongId}>Giường {bed.maGiuongLocal}</option>
												))}
											</select>
										</FormField>
									)}
									<FormField label="Số giường quy đổi">
										<input type="number" min="1" value={soGiuongQuyDoi} onChange={(event) => setSoGiuongQuyDoi(event.target.value)} className={controlClass} />
									</FormField>
									<FormField label="Giá thuê thỏa thuận" className="sm:col-span-2">
										<input type="number" min="1" value={giaThueThoaThuan} onChange={(event) => setGiaThueThoaThuan(event.target.value)} className={controlClass} />
									</FormField>
								</div>
							</section>
							<section className="rounded-xl border border-[#d7ece7] bg-white p-5 shadow-sm">
								<h2 className="mb-4 text-base font-semibold text-[#101828]">Rà soát điều kiện lưu trú</h2>
								<div className="space-y-2.5">
									{(quyDinhList ?? []).map((quyDinh) => (
										<label key={quyDinh.quyDinhId} className="flex cursor-pointer items-center gap-3 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-[#101828]">
											<input
												type="checkbox"
												checked={checkedConditions[quyDinh.quyDinhId] || false}
												onChange={() => setCheckedConditions((current) => ({ ...current, [quyDinh.quyDinhId]: !current[quyDinh.quyDinhId] }))}
												className="size-4 rounded border-slate-300 accent-emerald-600"
											/>
											<span>{quyDinh.tenQuyDinh}</span>
											{quyDinh.batBuoc && <span className="ml-auto text-xs text-red-500">Bắt buộc</span>}
										</label>
									))}
								</div>
							</section>
						</>
					) : (
						<ManagerAvailabilityCard tinhTrang={tinhTrangPhong} conditions={hoSo.ketQuaKiemTraDieuKiens} />
					)}

					<section className="rounded-xl border border-[#d7ece7] bg-white p-5 shadow-sm">
						<label className="block text-sm font-medium text-[#364153]">
							Lý do từ chối (nếu có)
							<textarea
								rows={3}
								value={ghiChuTuChoi}
								onChange={(event) => setGhiChuTuChoi(event.target.value)}
								placeholder={isSaleView ? "Nhập lý do nếu yêu cầu không đáp ứng điều kiện..." : "Nhập lý do nếu phòng hoặc giường không khả dụng..."}
								className="mt-2 w-full resize-none rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-teal-100"
							/>
						</label>
					</section>
				</div>
			</div>

			<div className="mt-7 flex flex-wrap items-center justify-between gap-3">
				<button type="button" onClick={() => void handleSubmit(true)} disabled={isSubmitting || !ghiChuTuChoi.trim()} className="h-11 rounded-lg border border-red-300 bg-white px-6 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">
					Từ chối
				</button>
				<button
					type="button"
					onClick={() => void handleSubmit(false)}
					disabled={isSubmitting || (isSaleView ? !canSubmitSale : !tinhTrangPhong?.coTheXacNhan)}
					className="h-11 rounded-lg bg-[#155DFC] px-6 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isSubmitting ? "Đang xử lý..." : isSaleView ? "Gửi yêu cầu kiểm tra phòng" : "Xác nhận có thể nhận cọc"}
				</button>
			</div>
		</div>
	);
}

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
	return (
		<div className={`grid grid-cols-[145px_minmax(0,1fr)] gap-4 py-3 text-[13px] ${last ? "" : "border-b border-slate-200"}`}>
			<span className="text-slate-500">{label}</span>
			<span className="font-medium text-[#101828]">{value}</span>
		</div>
	);
}

function FormField({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
	return (
		<label className={`block ${className}`}>
			<span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
			{children}
		</label>
	);
}

function AvailabilityRow({ label, passed, value }: { label: string; passed: boolean; value: string }) {
	return (
		<div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 text-sm last:border-0">
			<span className="text-slate-500">{label}</span>
			<span className={`flex items-center gap-1.5 font-medium ${passed ? "text-emerald-600" : "text-red-600"}`}>
				{passed ? <Check className="size-4" aria-hidden="true" /> : <X className="size-4" aria-hidden="true" />} {value}
			</span>
		</div>
	);
}

function ManagerAvailabilityCard({
	tinhTrang,
	conditions,
}: {
	tinhTrang: TinhTrangPhong | null;
	conditions: HoSoDatCocDetail["ketQuaKiemTraDieuKiens"];
}) {
	const available = Boolean(tinhTrang?.coTheXacNhan);
	return (
		<section className="rounded-xl border border-[#d7ece7] bg-white p-5 shadow-sm">
			<h2 className="mb-4 text-base font-semibold text-[#101828]">Kết quả kiểm tra tình trạng</h2>
			<div className={`flex items-center gap-3 rounded-lg border p-4 ${available ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
				{available ? <CheckCircle2 className="size-7 text-emerald-600" aria-hidden="true" /> : <AlertTriangle className="size-7 text-red-600" aria-hidden="true" />}
				<div>
					<p className={`font-semibold ${available ? "text-emerald-700" : "text-red-700"}`}>{available ? "Phòng/giường có thể nhận cọc" : "Phòng/giường chưa thể nhận cọc"}</p>
					<p className="mt-0.5 text-xs text-slate-500">Kết quả được đối chiếu từ dữ liệu hiện tại trong hệ thống.</p>
				</div>
			</div>
			<div className="mt-3">
				<AvailabilityRow label="Tình trạng phòng/giường" passed={tinhTrang?.tinhTrangPhong === "Trống"} value={tinhTrang?.tinhTrangPhong ?? "Không xác định"} />
				<AvailabilityRow label="Đặt cọc từ Sale khác" passed={!tinhTrang?.datCocChoTuSaleKhac} value={tinhTrang?.datCocChoTuSaleKhac ? "Có xung đột" : "Không có"} />
				<AvailabilityRow label="Giới tính khu vực" passed={Boolean(tinhTrang?.phuHopGioiTinh)} value={tinhTrang?.phuHopGioiTinh ? "Phù hợp" : "Không phù hợp"} />
				<AvailabilityRow label="Sức chứa còn lại" passed={available} value={tinhTrang?.sucChuaConLai ?? "—"} />
			</div>
			{conditions.length > 0 && (
				<div className="mt-4 border-t border-slate-200 pt-4">
					<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Kết quả rà soát của Sale</p>
					{conditions.map((condition) => (
						<div key={condition.quyDinhId} className="flex items-center justify-between gap-3 py-1.5 text-xs">
							<span className="text-slate-600">{condition.quyDinh.tenQuyDinh}</span>
							<span className={condition.ketQua === "Đạt" ? "font-medium text-emerald-600" : "font-medium text-red-600"}>{condition.ketQua}</span>
						</div>
					))}
				</div>
			)}
		</section>
	);
}

function WorkflowSummary({ hoSo, onBack }: { hoSo: HoSoDatCocDetail; onBack: () => void }) {
	return (
		<div className="mx-auto max-w-3xl py-8">
			<div className="rounded-xl border border-[#d7ece7] bg-white p-7 shadow-sm">
				<div className="flex items-center gap-3">
					<CheckCircle2 className="size-9 text-emerald-600" aria-hidden="true" />
					<div>
						<h1 className="text-xl font-bold text-[#101828]">Hồ sơ đã hoàn tất bước xác nhận</h1>
						<p className="text-sm text-slate-500">Trạng thái hiện tại: {hoSo.trangThai}</p>
					</div>
				</div>
				<div className="mt-5 rounded-lg bg-slate-50 p-4">
					<InfoRow label="Mã hồ sơ" value={hoSo.maHoSoDatCoc} />
					<InfoRow label="Khách hàng" value={hoSo.khachHang.hoTen} />
					<InfoRow label="Phòng/Giường" value={`${hoSo.phong?.maPhong ?? "—"}${hoSo.giuong ? ` – Giường ${hoSo.giuong.maGiuongLocal}` : ""}`} last />
				</div>
				<button type="button" onClick={onBack} className="mt-6 h-10 rounded-lg bg-[#0f766e] px-5 text-sm font-semibold text-white">Quay về danh sách</button>
			</div>
		</div>
	);
}
