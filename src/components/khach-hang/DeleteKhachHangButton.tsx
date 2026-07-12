"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Client-side delete action for a single KhachHang row — confirms, calls the API, then refreshes the list. */
export default function DeleteKhachHangButton({ id }: { id: number }) {
	const router = useRouter();
	const [isDeleting, setIsDeleting] = useState(false);

	async function handleDelete() {
		if (!window.confirm("Xóa khách hàng này?")) return;

		setIsDeleting(true);
		try {
			const response = await fetch(`/api/khach-hang/${id}`, { method: "DELETE" });
			if (!response.ok) {
				const result = await response.json();
				throw new Error(result.error ?? "Xóa thất bại");
			}
			router.refresh();
		} catch (error) {
			window.alert(error instanceof Error ? error.message : "Xóa thất bại");
		} finally {
			setIsDeleting(false);
		}
	}

	return (
		<button
			onClick={handleDelete}
			disabled={isDeleting}
			className="rounded-lg border border-red-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
		>
			{isDeleting ? "..." : "Xóa"}
		</button>
	);
}
