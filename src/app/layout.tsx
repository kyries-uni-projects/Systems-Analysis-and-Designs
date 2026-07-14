import type { Metadata } from "next";
import AppShell from "@/components/layout/AppShell";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
	title: "HomeStay Dorm",
	description: "Hệ thống quản lý ký túc xá HomeStay Dorm",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="vi" className="h-full antialiased">
			<body className="min-h-full">
				<AuthProvider>
					<AppShell>{children}</AppShell>
				</AuthProvider>
			</body>
		</html>
	);
}
