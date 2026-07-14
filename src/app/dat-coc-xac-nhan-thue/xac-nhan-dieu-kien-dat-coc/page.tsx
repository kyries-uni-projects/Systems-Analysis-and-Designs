import XacNhanDieuKienDatCocForm from "@/components/dat-coc/XacNhanDieuKienDatCocForm";
import DanhSachHoSoDatCoc from "@/components/dat-coc/DanhSachHoSoDatCoc";

export default async function XacNhanDieuKienDatCocPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
	const params = await searchParams;
	const hoSoId = params.id ? parseInt(params.id, 10) : null;
	if (!hoSoId || Number.isNaN(hoSoId)) return <DanhSachHoSoDatCoc />;

	return (
		<main className="min-h-screen bg-[#f4faf8] p-8">
			<div className="mx-auto max-w-[1024px]">
				<XacNhanDieuKienDatCocForm hoSoId={hoSoId} />
			</div>
		</main>
	);
}
