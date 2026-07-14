import { notFound } from "next/navigation";
import LapYeuCauThanhToanCocForm from "@/components/dat-coc/LapYeuCauThanhToanCocForm";

export default async function LapYeuCauThanhToanPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const hoSoId = Number(id);
	if (!Number.isInteger(hoSoId) || hoSoId < 1) notFound();

	return (
		<main className="min-h-full bg-[#f4faf8] px-4 py-6 sm:px-8">
			<div className="mx-auto w-full max-w-5xl">
				<LapYeuCauThanhToanCocForm hoSoId={hoSoId} />
			</div>
		</main>
	);
}
