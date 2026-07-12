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
		<div className="mx-auto w-full max-w-xl px-6 py-10">
			<h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Cập nhật phòng</h1>
			<PhongForm phong={phong} loaiPhongs={loaiPhongs} />
		</div>
	);
}
