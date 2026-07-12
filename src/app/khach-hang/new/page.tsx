import KhachHangForm from "@/components/khach-hang/KhachHangForm";

export default function NewKhachHangPage() {
	return (
		<div className="mx-auto w-full max-w-xl px-6 py-10">
			<h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Thêm khách hàng</h1>
			<KhachHangForm />
		</div>
	);
}
