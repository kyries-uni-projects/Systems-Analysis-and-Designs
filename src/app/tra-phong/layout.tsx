import type { ReactNode } from "react";
import { TraPhongProvider } from "@/context/TraPhongDataContext";

export default function TraPhongLayout({ children }: { children: ReactNode }) {
	return (
		<TraPhongProvider>
			<main className="min-h-full bg-[#f4faf8] px-4 py-6 sm:px-8">
				<div className="mx-auto w-full max-w-6xl">{children}</div>
			</main>
		</TraPhongProvider>
	);
}
