import PhongForm from "@/components/phong/PhongForm";
import { listLoaiPhong } from "@/lib/services/loaiPhongService";

export default async function NewPhongPage() {
	const loaiPhongs = await listLoaiPhong();

	return (
		<div className="mx-auto w-full max-w-xl px-6 py-10">
			<h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Thêm phòng</h1>
			{loaiPhongs.length === 0 && (
				<p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
					Chưa có loại phòng nào — tạo loại phòng trước qua POST /api/loai-phong.
				</p>
			)}
			<PhongForm loaiPhongs={loaiPhongs} />
		</div>
	);
}
