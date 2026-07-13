"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
	{ href: "/", label: "Trang chủ" },
	{ href: "/khach-hang", label: "Khách hàng" },
	{ href: "/phong", label: "Phòng" },
];

export default function NavBar() {
	const pathname = usePathname();

	if (pathname === "/login") {
		return null;
	}

	return (
		<header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
			<nav className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4 text-sm font-medium">
				{links.map((link) => (
					<Link key={link.href} href={link.href} className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
						{link.label}
					</Link>
				))}
			</nav>
		</header>
	);
}
