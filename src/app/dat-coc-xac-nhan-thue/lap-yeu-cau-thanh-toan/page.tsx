import LapYeuCauThanhToanCocForm from "@/components/dat-coc/LapYeuCauThanhToanCocForm";

export default async function LapYeuCauThanhToanPage({
	searchParams,
}: {
	searchParams: Promise<{ id?: string }>;
}) {
	const params = await searchParams;
	const hoSoId = params.id ? parseInt(params.id, 10) : 1;

	return (
		<main className="min-h-screen bg-[#f4faf8] p-8">
			<div className="mx-auto max-w-[1024px]">
				<LapYeuCauThanhToanCocForm hoSoId={hoSoId} />
			</div>
		</main>
	);
}
