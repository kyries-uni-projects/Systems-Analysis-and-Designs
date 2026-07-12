import Link from "next/link";
import { listPhong } from "@/lib/services/phongService";
import DeletePhongButton from "@/components/phong/DeletePhongButton";

interface PageProps {
	searchParams: Promise<{ search?: string; page?: string }>;
}

// Server Component — calls the service layer directly (no network round-trip needed for SSR).
export default async function PhongPage({ searchParams }: PageProps) {
	const { search, page } = await searchParams;
	const pageNumber = Number(page ?? "1");
	const { items, total, pageSize } = await listPhong({ search, page: pageNumber });
	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Phòng</h1>
				<Link
					href="/phong/new"
					className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
				>
					+ Thêm phòng
				</Link>
			</div>

			<form className="flex gap-2">
				<input
					type="text"
					name="search"
					defaultValue={search}
					placeholder="Tìm theo mã phòng, khu..."
					className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
				/>
				<button className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700">Tìm</button>
			</form>

			<div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
				<table className="w-full text-left text-sm">
					<thead className="bg-zinc-100 dark:bg-zinc-900">
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
							<tr key={phong.phongId} className="border-t border-zinc-200 dark:border-zinc-800">
								<td className="px-4 py-2">
									<Link href={`/phong/${phong.phongId}`} className="hover:underline">
										{phong.maPhong}
									</Link>
								</td>
								<td className="px-4 py-2">{phong.loaiPhong.tenLoaiPhong}</td>
								<td className="px-4 py-2">
									{phong.khu ?? "-"} {phong.tang ? `/ Tầng ${phong.tang}` : ""}
								</td>
								<td className="px-4 py-2">{phong.sucChua}</td>
								<td className="px-4 py-2">{phong.trangThai}</td>
								<td className="px-4 py-2 text-right">
									<DeletePhongButton id={phong.phongId} />
								</td>
							</tr>
						))}
						{items.length === 0 && (
							<tr>
								<td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
									Không có dữ liệu
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			<p className="text-sm text-zinc-500">
				Trang {pageNumber} / {totalPages} — {total} phòng
			</p>
		</div>
	);
}
