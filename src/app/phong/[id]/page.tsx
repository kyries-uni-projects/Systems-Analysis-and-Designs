import { notFound } from "next/navigation";
import PhongForm from "@/components/phong/PhongForm";
import { findPhongById } from "@/lib/services/phongService";
import { listLoaiPhong } from "@/lib/services/loaiPhongService";

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function PhongDetailPage({ params }: PageProps) {
	const { id } = await params;
	const [phong, loaiPhongs] = await Promise.all([findPhongById(Number(id)), listLoaiPhong()]);
	if (!phong) notFound();

	return (
		<main className="min-h-full bg-[#f4faf8] px-4 py-6 sm:px-8"><div className="mx-auto w-full max-w-2xl">
			<p className="text-[13px] text-slate-500">Phòng &gt; Cập nhật</p>
			<h1 className="mb-6 mt-2 text-2xl font-bold text-[#101828]">Cập nhật phòng</h1>
			<PhongForm phong={phong} loaiPhongs={loaiPhongs} />
		</div></main>
	);
}
