import Link from "next/link";
import { listPhong } from "@/lib/services/phongService";
import { cookies } from "next/headers";
import { getSessionFromCookieStore } from "@/lib/session";

interface PageProps {
	searchParams: Promise<{ search?: string; page?: string }>;
}

// Server Component — calls the service layer directly (no network round-trip needed for SSR).
export default async function PhongPage({ searchParams }: PageProps) {
	const { search, page } = await searchParams;
	const pageNumber = Number(page ?? "1");
	const { items, total, pageSize } = await listPhong({ search, page: pageNumber });
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const session = await getSessionFromCookieStore(await cookies());
	const canManage = session?.role === "admin";

	return (
		<main className="min-h-full bg-[#f4faf8] px-4 py-6 sm:px-8"><div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
			<div className="flex items-center justify-between">
				<div><p className="text-[13px] text-slate-500">Quản lý danh mục</p><h1 className="mt-1 text-2xl font-bold text-[#101828]">Phòng</h1></div>
				{canManage && <Link
					href="/phong/new"
					className="rounded-lg bg-[#0f766e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b625b]"
				>
					+ Thêm phòng
				</Link>}
			</div>

			<form className="flex gap-2">
				<input
					type="text"
					name="search"
					defaultValue={search}
					placeholder="Tìm theo mã phòng, khu..."
					className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
				/>
				<button className="rounded-lg bg-[#0f766e] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0b625b]">Tìm kiếm</button>
			</form>

			<div className="overflow-x-auto rounded-xl border border-[#d7ece7] bg-white shadow-sm">
				<table className="w-full text-left text-sm">
					<thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
						<tr>
							<th className="px-4 py-2">Mã phòng</th>
							<th className="px-4 py-2">Loại phòng</th>
							<th className="px-4 py-2">Khu / Tầng</th>
							<th className="px-4 py-2">Sức chứa</th>
							<th className="px-4 py-2">Trạng thái</th>
							<th className="px-4 py-2 text-right">Hành động</th>
						</tr>
					</thead>
					<tbody>
						{items.map((phong) => (
							<tr key={phong.phongId} className="border-t border-slate-100 text-slate-700 hover:bg-slate-50/70">
								<td className="px-4 py-2">
									{canManage ? <Link href={`/phong/${phong.phongId}`} className="font-medium text-[#101828] hover:text-teal-700 hover:underline">
										{phong.maPhong}
									</Link> : <span className="font-medium text-[#101828]">{phong.maPhong}</span>}
								</td>
								<td className="px-4 py-2">{phong.loaiPhong.tenLoaiPhong}</td>
								<td className="px-4 py-2">
									{phong.khu ?? "-"} {phong.tang ? `/ Tầng ${phong.tang}` : ""}
								</td>
								<td className="px-4 py-2">{phong.sucChua}</td>
								<td className="px-4 py-2">{phong.trangThai}</td>
								<td className="px-4 py-2 text-right">
									{canManage ? (
										<Link href={`/phong/${phong.phongId}`} className="text-xs font-semibold text-teal-700 hover:underline">Cập nhật</Link>
									) : <span className="text-xs text-slate-400">Chỉ xem</span>}
								</td>
							</tr>
						))}
						{items.length === 0 && (
							<tr>
								<td colSpan={6} className="px-4 py-6 text-center text-slate-500">
									Không có dữ liệu
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			<p className="text-sm text-slate-500">
				Trang {pageNumber} / {totalPages} — {total} phòng
			</p>
		</div></main>
	);
}
