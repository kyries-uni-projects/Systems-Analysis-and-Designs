"use client";

import { useState, useEffect } from "react";
import { Search, ChevronRight, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import type { Role } from "@/lib/auth";

type HoSoItem = {
	hoSoDatCocId: number;
	maHoSoDatCoc: string;
	khachHang: string;
	phongGiuong: string;
	hinhThucThue: string;
	soGiuong: number;
	trangThai: string;
};

const roleConfig: Record<
	string,
	{
		pageTitle: string;
		cardTitle: string;
		actionMap: Record<string, { label: string; href: (id: number) => string }>;
	}
> = {
	nhanvien: {
		pageTitle: "Danh sách hồ sơ đặt cọc",
		cardTitle: "Danh sách hồ sơ đặt cọc",
		actionMap: {
			"Chờ xác nhận điều kiện": {
				label: "Kiểm tra",
				href: (id) => `/dat-coc-xac-nhan-thue/xac-nhan-dieu-kien-dat-coc?id=${id}`,
			},
			"Chờ thanh toán": {
				label: "Cập nhật",
				href: (id) => `/dat-coc-xac-nhan-thue/cap-nhat-thong-tin-ho-so?id=${id}`,
			},
			"Đã xác nhận thanh toán": {
				label: "Ghi nhận",
				href: (id) => `/dat-coc-xac-nhan-thue/xac-nhan-dieu-kien-dat-coc?id=${id}`,
			},
		},
	},
	quanly: {
		pageTitle: "Danh sách hồ sơ cần xác nhận",
		cardTitle: "Hồ sơ chờ Quản lý xử lý",
		actionMap: {
			"Chờ xác nhận quản lý": {
				label: "Kiểm tra",
				href: (id) => `/dat-coc-xac-nhan-thue/xac-nhan-tinh-trang-phong?id=${id}`,
			},
			"Chờ xác nhận thanh toán": {
				label: "Đối chiếu",
				href: (id) => `/dat-coc-xac-nhan-thue/xac-nhan-tinh-trang-phong?id=${id}`,
			},
		},
	},
	ketoan: {
		pageTitle: "Danh sách hồ sơ chờ lập yêu cầu thanh toán",
		cardTitle: "Hồ sơ đã xác nhận điều kiện",
		actionMap: {
			"Đã xác nhận điều kiện": {
				label: "Lập yêu cầu",
				href: (id) => `/dat-coc-xac-nhan-thue/lap-yeu-cau-thanh-toan?id=${id}`,
			},
		},
	},
};

const statusBadge: Record<string, { bg: string; text: string }> = {
	"Chờ xác nhận điều kiện": { bg: "bg-amber-50", text: "text-amber-700" },
	"Chờ xác nhận quản lý": { bg: "bg-amber-50", text: "text-amber-700" },
	"Chờ xác nhận": { bg: "bg-amber-50", text: "text-amber-700" },
	"Chờ thanh toán": { bg: "bg-blue-50", text: "text-blue-700" },
	"Chờ xác nhận thanh toán": { bg: "bg-blue-50", text: "text-blue-700" },
	"Đã xác nhận thanh toán": { bg: "bg-emerald-50", text: "text-emerald-700" },
	"Đã xác nhận điều kiện": { bg: "bg-emerald-50", text: "text-emerald-700" },
};

export default function DanhSachHoSoDatCoc() {
	const { sessionUser, isLoading: isAuthLoading } = useAuth();
	const router = useRouter();
	const [data, setData] = useState<HoSoItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	const role: Role = sessionUser?.role ?? "nhanvien";
	const config = roleConfig[role] ?? roleConfig.nhanvien;

	const fetchData = async (search?: string, trangThai?: string) => {
		setIsLoading(true);
		try {
			const params = new URLSearchParams({ role });
			if (search) params.set("search", search);
			if (trangThai && trangThai !== "all") params.set("trangThai", trangThai);

			const res = await fetch(`/api/ho-so-dat-coc?${params}`);
			const json = await res.json();
			if (!json.success) throw new Error(json.error);
			setData(json.data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (!isAuthLoading) void fetchData();
	}, [isAuthLoading, role]);

	const handleSearch = () => {
		void fetchData(searchTerm, statusFilter);
	};

	if (isAuthLoading) {
		return <div className="py-12 text-center text-sm text-slate-500">Đang tải...</div>;
	}

	return (
		<div className="min-h-screen bg-[#f4faf8] p-8">
			<div className="mx-auto max-w-[1024px]">
				{/* Breadcrumb */}
				<div className="mb-1 flex items-center gap-1 text-xs text-gray-500">
					<span>Đặt cọc &amp; xác nhận thuê</span>
					<ChevronRight className="size-3" />
					<span>Danh sách hồ sơ đặt cọc</span>
				</div>

				{/* Title */}
				<h1 className="mb-6 text-2xl font-bold text-gray-900">{config.pageTitle}</h1>

				{/* Search & Filter Bar */}
				<div className="mb-6 flex gap-4">
					<input
						type="text"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleSearch()}
						placeholder="Tìm theo mã hồ sơ, tên khách hàng hoặc phòng..."
						className="h-11 flex-1 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
					/>
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						className="h-11 w-[270px] rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
					>
						<option value="all">Tất cả trạng thái</option>
						{Object.keys(config.actionMap).map((s) => (
							<option key={s} value={s}>
								{s}
							</option>
						))}
					</select>
					<button
						type="button"
						onClick={handleSearch}
						className="h-11 rounded-lg bg-teal-700 px-6 text-sm font-semibold text-white transition hover:bg-teal-800"
					>
						Tìm kiếm
					</button>
				</div>

				{/* Error */}
				{error && (
					<div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600">
						<AlertTriangle className="size-4" />
						{error}
					</div>
				)}

				{/* Table Card */}
				<div className="rounded-lg border border-gray-200 bg-white shadow-sm">
					{/* Card Header */}
					<div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
						<h2 className="text-base font-semibold text-gray-800">{config.cardTitle}</h2>
						<span className="text-xs font-medium text-slate-500">{data.length} hồ sơ</span>
					</div>

					{/* Table Header */}
					<div className="grid grid-cols-[100px_160px_160px_110px_80px_150px_100px] gap-2 border-b border-gray-200 px-5 py-3">
						{["Mã hồ sơ", "Khách hàng", "Phòng/Giường", "Hình thức thuê", "Số giường", "Trạng thái", "Thao tác"].map(
							(h) => (
								<span key={h} className="text-xs font-semibold text-slate-500">
									{h}
								</span>
							),
						)}
					</div>

					{/* Loading */}
					{isLoading && <div className="py-8 text-center text-sm text-slate-400">Đang tải dữ liệu...</div>}

					{/* Empty */}
					{!isLoading && data.length === 0 && (
						<div className="py-8 text-center text-sm text-slate-400">Không có hồ sơ nào</div>
					)}

					{/* Rows */}
					{!isLoading &&
						data.map((item) => {
							const badge = statusBadge[item.trangThai] ?? { bg: "bg-gray-100", text: "text-gray-600" };
							const action = config.actionMap[item.trangThai];

							return (
								<div
									key={item.hoSoDatCocId}
									className="grid grid-cols-[100px_160px_160px_110px_80px_150px_100px] items-center gap-2 border-b border-gray-100 px-5 py-3 last:border-b-0"
								>
									<span className="text-sm font-medium text-gray-800">{item.maHoSoDatCoc}</span>
									<span className="text-sm text-gray-800">{item.khachHang}</span>
									<span className="text-sm text-gray-800">{item.phongGiuong}</span>
									<span className="text-sm text-gray-800">{item.hinhThucThue}</span>
									<span className="text-sm text-gray-800">{item.soGiuong}</span>
									<span
										className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold ${badge.bg} ${badge.text}`}
									>
										{item.trangThai}
									</span>
									{action ? (
										<button
											type="button"
											onClick={() => router.push(action.href(item.hoSoDatCocId))}
											className="h-10 rounded-lg bg-teal-700 text-sm font-semibold text-white transition hover:bg-teal-800"
										>
											{action.label}
										</button>
									) : (
										<span className="text-xs text-slate-400">—</span>
									)}
								</div>
							);
						})}
				</div>
			</div>
		</div>
	);
}
