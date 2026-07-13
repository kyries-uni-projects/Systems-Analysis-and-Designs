import type { ReactNode } from "react";
import { TraPhongProvider } from "@/context/TraPhongDataContext";

export default function TraPhongLayout({ children }: { children: ReactNode }) {
	return <TraPhongProvider>{children}</TraPhongProvider>;
}
