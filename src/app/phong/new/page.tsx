import PhongForm from "@/components/phong/PhongForm";
import { listLoaiPhong } from "@/lib/services/loaiPhongService";

export default async function NewPhongPage() {
	const loaiPhongs = await listLoaiPhong();

	return (
		<main className="min-h-full bg-[#f4faf8] px-4 py-6 sm:px-8"><div className="mx-auto w-full max-w-2xl">
			<p className="text-[13px] text-slate-500">Phòng &gt; Thêm mới</p>
			<h1 className="mb-6 mt-2 text-2xl font-bold text-[#101828]">Thêm phòng</h1>
			{loaiPhongs.length === 0 && (
				<p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
					Chưa có loại phòng nào — tạo loại phòng trước qua POST /api/loai-phong.
				</p>
			)}
			<PhongForm loaiPhongs={loaiPhongs} />
		</div></main>
	);
}
