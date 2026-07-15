import LichHenXemPhongForm from "@/components/thue-phong/LichHenXemPhongForm";

export default async function LapLichXemPhongPage({ searchParams }: { searchParams: Promise<{ yeuCauId?: string }> }) {
	const { yeuCauId } = await searchParams;
	const parsedId = Number(yeuCauId);
	return (
		<main className="mx-auto w-full max-w-5xl px-6 py-8 lg:px-8">
			<LichHenXemPhongForm initialYeuCauId={Number.isInteger(parsedId) && parsedId > 0 ? parsedId : undefined} />
		</main>
	);
}
