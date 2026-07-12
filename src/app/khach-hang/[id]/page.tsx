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
		<div className="mx-auto w-full max-w-xl px-6 py-10">
			<h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Cập nhật khách hàng</h1>
			<KhachHangForm khachHang={khachHang} />
		</div>
	);
}
