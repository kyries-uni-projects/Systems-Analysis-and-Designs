import KhachHangForm from "@/components/khach-hang/KhachHangForm";

export default function NewKhachHangPage() {
	return (
		<main className="min-h-full bg-[#f4faf8] px-4 py-6 sm:px-8"><div className="mx-auto w-full max-w-2xl">
			<p className="text-[13px] text-slate-500">Khách hàng &gt; Thêm mới</p>
			<h1 className="mb-6 mt-2 text-2xl font-bold text-[#101828]">Thêm khách hàng</h1>
			<KhachHangForm />
		</div></main>
	);
}
