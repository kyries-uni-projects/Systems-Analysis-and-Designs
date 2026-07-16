"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ActionModal from "@/components/ui/ActionModal";

/** Client-side delete action for a single Phong row — confirms, calls the API, then refreshes the list. */
export default function DeletePhongButton({ id }: { id: number }) {
	const router = useRouter();
	const [isDeleting, setIsDeleting] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [error, setError] = useState("");

	async function handleDelete() {
		setError("");
		setIsDeleting(true);
		try {
			const response = await fetch(`/api/phong/${id}`, { method: "DELETE" });
			if (!response.ok) {
				const result = await response.json();
				throw new Error(result.error ?? "Xóa thất bại");
			}
			setIsOpen(false);
			router.refresh();
		} catch (error) {
			setError(error instanceof Error ? error.message : "Xóa thất bại");
		} finally {
			setIsDeleting(false);
		}
	}

	return <>
		<button
			onClick={() => { setError(""); setIsOpen(true); }}
			disabled={isDeleting}
			className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
		>
			{isDeleting ? "..." : "Xóa"}
		</button>
		<ActionModal open={isOpen} title="Xóa phòng?" description="Phòng chỉ có thể bị xóa khi chưa có giường, lịch hẹn, đặt cọc hoặc hợp đồng liên quan." confirmLabel="Xóa phòng" tone="danger" isLoading={isDeleting} error={error} onClose={() => { setIsOpen(false); setError(""); }} onConfirm={() => void handleDelete()} />
	</>;
}
