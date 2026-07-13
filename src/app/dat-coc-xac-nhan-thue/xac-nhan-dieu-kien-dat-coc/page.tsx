import XacNhanDieuKienDatCocForm from "@/components/dat-coc/XacNhanDieuKienDatCocForm";

export default async function XacNhanDieuKienDatCocPage({
	searchParams,
}: {
	searchParams: Promise<{ id?: string }>;
}) {
	const params = await searchParams;
	const hoSoId = params.id ? parseInt(params.id, 10) : 1; // Default to 1 for demo

	return (
		<main className="min-h-screen bg-[#f4faf8] p-8">
			<div className="mx-auto max-w-[1024px]">
				<XacNhanDieuKienDatCocForm hoSoId={hoSoId} />
			</div>
		</main>
	);
}
