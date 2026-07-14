import { notFound } from "next/navigation";
import KhachHangForm from "@/components/khach-hang/KhachHangForm";
import { findKhachHangById } from "@/lib/services/khachHangService";

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function KhachHangDetailPage({ params }: PageProps) {
	const { id } = await params;
	const khachHang = await findKhachHangById(Number(id));
	if (!khachHang) notFound();

	return (
		<main className="min-h-full bg-[#f4faf8] px-4 py-6 sm:px-8"><div className="mx-auto w-full max-w-2xl">
			<p className="text-[13px] text-slate-500">Khách hàng &gt; Cập nhật</p>
			<h1 className="mb-6 mt-2 text-2xl font-bold text-[#101828]">Cập nhật khách hàng</h1>
			<KhachHangForm khachHang={khachHang} />
		</div></main>
	);
}
