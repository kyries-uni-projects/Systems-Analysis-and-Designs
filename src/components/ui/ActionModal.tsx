"use client";

import { useEffect, useId } from "react";
import { AlertTriangle, Info, X } from "lucide-react";

interface ActionModalProps {
	open: boolean;
	title: string;
	description: string;
	confirmLabel: string;
	onConfirm: () => void;
	onClose: () => void;
	cancelLabel?: string;
	tone?: "danger" | "warning" | "info";
	isLoading?: boolean;
	error?: string;
}

const toneStyles = {
	danger: { icon: "bg-red-50 text-red-600", button: "bg-red-600 hover:bg-red-700" },
	warning: { icon: "bg-amber-50 text-amber-600", button: "bg-amber-600 hover:bg-amber-700" },
	info: { icon: "bg-blue-50 text-blue-600", button: "bg-[#20365f] hover:bg-[#182b4e]" },
};

export default function ActionModal({
	open,
	title,
	description,
	confirmLabel,
	onConfirm,
	onClose,
	cancelLabel = "Hủy",
	tone = "danger",
	isLoading = false,
	error,
}: ActionModalProps) {
	const titleId = useId();
	const descriptionId = useId();
	const styles = toneStyles[tone];

	useEffect(() => {
		if (!open) return;
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape" && !isLoading) onClose();
		}
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isLoading, onClose, open]);

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-[100] flex items-center justify-center bg-[#10213a]/55 p-4 backdrop-blur-[2px]"
			role="presentation"
			onMouseDown={(event) => {
				if (event.target === event.currentTarget && !isLoading) onClose();
			}}
		>
			<section role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
				<div className="flex items-start justify-between gap-4">
					<div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}>
						{tone === "info" ? <Info className="size-5" aria-hidden="true" /> : <AlertTriangle className="size-5" aria-hidden="true" />}
					</div>
					<button type="button" onClick={onClose} disabled={isLoading} aria-label="Đóng" className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50">
						<X className="size-5" aria-hidden="true" />
					</button>
				</div>
				<h2 id={titleId} className="mt-4 text-lg font-bold text-[#1b2b4b]">{title}</h2>
				<p id={descriptionId} className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
				{error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600" role="alert">{error}</p>}
				<div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
					<button type="button" onClick={onClose} disabled={isLoading} className="h-11 rounded-lg bg-slate-100 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50">{cancelLabel}</button>
					<button type="button" onClick={onConfirm} disabled={isLoading} className={`h-11 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50 ${styles.button}`}>{isLoading ? "Đang xử lý..." : confirmLabel}</button>
				</div>
			</section>
		</div>
	);
}
