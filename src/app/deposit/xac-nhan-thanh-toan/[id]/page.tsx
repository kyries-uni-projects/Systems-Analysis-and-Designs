import { notFound } from "next/navigation";
import XacNhanThanhToanCocForm from "@/components/dat-coc/XacNhanThanhToanCocForm";

export default async function XacNhanThanhToanPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const hoSoId = Number(id);
	if (!Number.isInteger(hoSoId) || hoSoId < 1) notFound();

	return (
		<main className="min-h-full bg-[#f4faf8] px-4 py-6 sm:px-8">
			<div className="mx-auto w-full max-w-5xl"><XacNhanThanhToanCocForm hoSoId={hoSoId} /></div>
		</main>
	);
}
