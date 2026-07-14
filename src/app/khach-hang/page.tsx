import Link from "next/link";
import { listKhachHang } from "@/lib/services/khachHangService";
import DeleteKhachHangButton from "@/components/khach-hang/DeleteKhachHangButton";
import { cookies } from "next/headers";
import { getSessionFromCookieStore } from "@/lib/session";

interface PageProps {
	searchParams: Promise<{ search?: string; page?: string }>;
}

// Server Component — calls the service layer directly (no network round-trip needed for SSR).
export default async function KhachHangPage({ searchParams }: PageProps) {
	const { search, page } = await searchParams;
	const pageNumber = Number(page ?? "1");
	const { items, total, pageSize } = await listKhachHang({ search, page: pageNumber });
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const session = await getSessionFromCookieStore(await cookies());
	const canManage = session?.role === "admin" || session?.role === "nhanvien";

	return (
		<main className="min-h-full bg-[#f4faf8] px-4 py-6 sm:px-8"><div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
			<div className="flex items-center justify-between">
				<div><p className="text-[13px] text-slate-500">Quản lý danh mục</p><h1 className="mt-1 text-2xl font-bold text-[#101828]">Khách hàng</h1></div>
				{canManage && <Link
					href="/khach-hang/new"
					className="rounded-lg bg-[#0f766e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b625b]"
				>
					+ Thêm khách hàng
				</Link>}
			</div>

			<form className="flex gap-2">
				<input
					type="text"
					name="search"
					defaultValue={search}
					placeholder="Tìm theo tên, CCCD, số điện thoại..."
					className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
				/>
				<button className="rounded-lg bg-[#0f766e] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0b625b]">Tìm kiếm</button>
			</form>

			<div className="overflow-x-auto rounded-xl border border-[#d7ece7] bg-white shadow-sm">
				<table className="w-full text-left text-sm">
					<thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
						<tr>
							<th className="px-4 py-2">Họ tên</th>
							<th className="px-4 py-2">CCCD/Passport</th>
							<th className="px-4 py-2">SĐT</th>
							<th className="px-4 py-2">Email</th>
							<th className="px-4 py-2 text-right">Hành động</th>
						</tr>
					</thead>
					<tbody>
						{items.map((khachHang) => (
							<tr key={khachHang.khachHangId} className="border-t border-slate-100 text-slate-700 hover:bg-slate-50/70">
								<td className="px-4 py-2">
									{canManage ? <Link href={`/khach-hang/${khachHang.khachHangId}`} className="font-medium text-[#101828] hover:text-teal-700 hover:underline">
										{khachHang.hoTen}
									</Link> : <span className="font-medium text-[#101828]">{khachHang.hoTen}</span>}
								</td>
								<td className="px-4 py-2">{khachHang.cccdPassport}</td>
								<td className="px-4 py-2">{khachHang.soDienThoai}</td>
								<td className="px-4 py-2">{khachHang.email ?? "-"}</td>
								<td className="px-4 py-2 text-right">
									{canManage ? <DeleteKhachHangButton id={khachHang.khachHangId} /> : <span className="text-xs text-slate-400">Chỉ xem</span>}
								</td>
							</tr>
						))}
						{items.length === 0 && (
							<tr>
								<td colSpan={5} className="px-4 py-6 text-center text-slate-500">
									Không có dữ liệu
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			<p className="text-sm text-slate-500">
				Trang {pageNumber} / {totalPages} — {total} khách hàng
			</p>
		</div></main>
	);
}
