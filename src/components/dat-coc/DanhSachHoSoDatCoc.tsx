"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, Plus, Search } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import type { Role } from "@/lib/auth";

type HoSoDatCoc = {
	hoSoDatCocId: number;
	maHoSoDatCoc: string;
	trangThai: string;
	hinhThucThue: string;
	khachHang: { hoTen: string };
	phong: { maPhong: string } | null;
	giuong: { maGiuongLocal: string } | null;
	chiTietDatCoc: { soGiuongQuyDoi: number } | null;
};

const pageCopy: Record<Role, { title: string; sectionTitle: string }> = {
	admin: { title: "Danh sách hồ sơ đặt cọc", sectionTitle: "Danh sách hồ sơ đặt cọc" },
	nhanvien: { title: "Danh sách hồ sơ đặt cọc", sectionTitle: "Danh sách hồ sơ đặt cọc" },
	quanly: { title: "Danh sách hồ sơ cần xác nhận", sectionTitle: "Hồ sơ chờ Quản lý xử lý" },
	ketoan: { title: "Danh sách hồ sơ chờ lập yêu cầu thanh toán", sectionTitle: "Hồ sơ đã xác nhận điều kiện" },
};

function statusClass(status: string) {
	if (status === "Đã xác nhận điều kiện" || status === "Đã xác nhận thanh toán") return "bg-emerald-50 text-emerald-700";
	if (status === "Chờ thanh toán") return "bg-blue-50 text-blue-700";
	if (status.includes("Chờ")) return "bg-amber-50 text-amber-700";
	if (status === "Từ chối") return "bg-red-50 text-red-700";
	return "bg-slate-100 text-slate-600";
}

function actionFor(role: Role, hoSo: HoSoDatCoc) {
	if (role === "ketoan") {
		return { href: `/deposit/lap-yeu-cau-thanh-toan/${hoSo.hoSoDatCocId}`, label: "Lập yêu cầu" };
	}
	if (role === "quanly") {
		return { href: `/dat-coc-xac-nhan-thue/xac-nhan-dieu-kien-dat-coc?id=${hoSo.hoSoDatCocId}`, label: "Đối chiếu" };
	}
	return { href: `/deposit/lap-phieu-dat-coc?id=${hoSo.hoSoDatCocId}`, label: "Cập nhật" };
}

export default function DanhSachHoSoDatCoc() {
	const { sessionUser, isLoading: isAuthLoading } = useAuth();
	const [danhSach, setDanhSach] = useState<HoSoDatCoc[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		if (!sessionUser) return;

		async function loadDanhSach() {
			try {
				setError("");
				const response = await fetch("/api/ho-so-dat-coc");
				const payload = await response.json();
				if (!response.ok || !payload.success) throw new Error(payload.error || "Không thể tải danh sách hồ sơ.");
				setDanhSach(payload.data);
			} catch (loadError) {
				setError(loadError instanceof Error ? loadError.message : "Không thể tải danh sách hồ sơ.");
			} finally {
				setIsLoading(false);
			}
		}

		void loadDanhSach();
	}, [sessionUser]);

	if (isAuthLoading || isLoading) {
		return (
			<main className="min-h-full bg-[#f4faf8] px-4 py-8 sm:px-8">
				<p className="mx-auto max-w-5xl text-sm text-slate-500">Đang tải danh sách hồ sơ...</p>
			</main>
		);
	}

	if (!sessionUser || error) {
		return (
			<main className="min-h-full bg-[#f4faf8] px-4 py-8 sm:px-8">
				<div className="mx-auto flex max-w-5xl items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
					<AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
					{error || "Không thể xác định quyền truy cập."}
				</div>
			</main>
		);
	}

	const role = sessionUser.role;
	const copy = pageCopy[role];
	const statuses = [...new Set(danhSach.map((hoSo) => hoSo.trangThai))];
	const normalizedSearch = searchTerm.trim().toLocaleLowerCase("vi-VN");
	const filteredDanhSach = danhSach.filter((hoSo) => {
		const matchesSearch =
			!normalizedSearch ||
			[hoSo.maHoSoDatCoc, hoSo.khachHang.hoTen, hoSo.phong?.maPhong ?? ""].some((value) =>
				value.toLocaleLowerCase("vi-VN").includes(normalizedSearch),
			);
		return matchesSearch && (statusFilter === "all" || hoSo.trangThai === statusFilter);
	});

	return (
		<main className="min-h-full bg-[#f4faf8] px-4 py-6 sm:px-8">
			<div className="mx-auto w-full max-w-5xl">
				<nav className="mb-3 text-[13px] text-slate-500" aria-label="Breadcrumb">
					Đặt cọc &amp; xác nhận thuê &nbsp;&gt;&nbsp; Danh sách hồ sơ đặt cọc
				</nav>
				<div className="flex flex-wrap items-center justify-between gap-3">
					<h1 className="text-2xl font-bold text-[#101828]">{copy.title}</h1>
					{(role === "nhanvien" || role === "admin") && (
						<Link
							href="/deposit/lap-phieu-dat-coc"
							className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0f766e] px-4 text-sm font-semibold text-white transition hover:bg-[#0b625b]"
						>
							<Plus className="size-4" aria-hidden="true" />
							Lập phiếu
						</Link>
					)}
				</div>

				<div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_216px_135px]">
					<label className="relative block">
						<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
						<input
							value={searchTerm}
							onChange={(event) => setSearchTerm(event.target.value)}
							className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
							placeholder="Tìm theo mã hồ sơ, tên khách hàng hoặc phòng..."
						/>
					</label>
					<select
						value={statusFilter}
						onChange={(event) => setStatusFilter(event.target.value)}
						className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-600 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
					>
						<option value="all">Tất cả trạng thái</option>
						{statuses.map((status) => (
							<option key={status} value={status}>
								{status}
							</option>
						))}
					</select>
					<button
						type="button"
						onClick={() => setSearchTerm("")}
						className="h-10 rounded-lg bg-[#0f766e] px-4 text-sm font-semibold text-white transition hover:bg-[#0b625b]"
					>
						Tìm kiếm
					</button>
				</div>

				<section className="mt-5 overflow-hidden rounded-lg border border-[#d7ece7] bg-white shadow-[0_1px_1.5px_rgba(0,0,0,0.06)]">
					<div className="flex items-center justify-between px-4 py-4 sm:px-5">
						<h2 className="text-base font-semibold text-[#101828]">{copy.sectionTitle}</h2>
						<span className="text-xs text-slate-500">{filteredDanhSach.length} hồ sơ</span>
					</div>
					<div className="overflow-x-auto">
						<table className="min-w-190 w-full table-fixed text-left text-[13px]">
							<thead className="border-b border-slate-200 text-xs font-medium text-slate-500">
								<tr>
									<th className="px-4 py-3 font-medium sm:px-5">Mã hồ sơ</th>
									<th className="px-3 py-3 font-medium">Khách hàng</th>
									<th className="px-3 py-3 font-medium">Phòng/Giường</th>
									<th className="hidden px-3 py-3 font-medium lg:table-cell">Hình thức thuê</th>
									<th className="hidden px-3 py-3 font-medium lg:table-cell">Số giường</th>
									<th className="px-3 py-3 font-medium">Trạng thái</th>
									<th className="px-3 py-3 text-right font-medium">Thao tác</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-200 text-slate-700">
								{filteredDanhSach.map((hoSo) => {
									const action = actionFor(role, hoSo);
									return (
										<tr key={hoSo.hoSoDatCocId}>
											<td className="px-4 py-3.5 font-medium sm:px-5">
												<span className="block truncate" title={hoSo.maHoSoDatCoc}>
													{hoSo.maHoSoDatCoc}
												</span>
											</td>
											<td className="px-3 py-3.5">
												<span className="block truncate" title={hoSo.khachHang.hoTen}>
													{hoSo.khachHang.hoTen}
												</span>
											</td>
											<td className="px-3 py-3.5">
												<span
													className="block truncate"
													title={`${hoSo.phong?.maPhong ?? "Chưa phân phòng"}${hoSo.giuong ? ` - Giường ${hoSo.giuong.maGiuongLocal}` : ""}`}
												>
													{hoSo.phong?.maPhong ?? "Chưa phân phòng"}
													{hoSo.giuong ? ` - Giường ${hoSo.giuong.maGiuongLocal}` : ""}
												</span>
											</td>
											<td className="hidden px-3 py-3.5 lg:table-cell">
												<span className="block truncate" title={hoSo.hinhThucThue}>
													{hoSo.hinhThucThue}
												</span>
											</td>
											<td className="hidden whitespace-nowrap px-3 py-3.5 lg:table-cell">{hoSo.chiTietDatCoc?.soGiuongQuyDoi ?? 0}</td>
											<td className="px-3 py-3.5">
												<span
													className={`inline-flex max-w-full truncate whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium ${statusClass(hoSo.trangThai)}`}
													title={hoSo.trangThai}
												>
													{hoSo.trangThai}
												</span>
											</td>
											<td className="px-3 py-3.5 text-right">
												<Link
													href={action.href}
													className="inline-flex h-8 items-center rounded-md bg-[#0f766e] px-3 text-xs font-semibold text-white transition hover:bg-[#0b625b]"
												>
													{action.label}
												</Link>
											</td>
										</tr>
									);
								})}
								{filteredDanhSach.length === 0 && (
									<tr>
										<td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500">
											Không có hồ sơ phù hợp.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</section>
			</div>
		</main>
	);
}
