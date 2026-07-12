import Link from "next/link";
import { prisma } from "@/lib/prisma";

// Server Component — sample direct DB calls (Prisma counts) rendered on the dashboard.
export default async function Home() {
	const [khachHangCount, phongCount, hopDongCount] = await Promise.all([prisma.khachHang.count(), prisma.phong.count(), prisma.hopDong.count()]);

	const stats: { label: string; value: number; href?: string }[] = [
		{ label: "Khách hàng", value: khachHangCount, href: "/khach-hang" },
		{ label: "Phòng", value: phongCount, href: "/phong" },
		{ label: "Hợp đồng", value: hopDongCount },
	];

	return (
		<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-16">
			<div>
				<h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">HomeStay Dorm — Bảng điều khiển</h1>
				<p className="mt-2 text-zinc-600 dark:text-zinc-400">
					Boilerplate quản lý khách hàng &amp; phòng — ví dụ CRUD Backend/API/Frontend kết nối Prisma + SQLite.
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				{stats.map((stat) => {
					const cardClass = "rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950";
					const content = (
						<>
							<p className="text-sm text-zinc-500 dark:text-zinc-400">{stat.label}</p>
							<p className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">{stat.value}</p>
						</>
					);

					if (!stat.href) {
						return (
							<div key={stat.label} className={cardClass}>
								{content}
							</div>
						);
					}

					return (
						<Link key={stat.label} href={stat.href} className={`${cardClass} transition-colors hover:border-zinc-400 dark:hover:border-zinc-600`}>
							{content}
						</Link>
					);
				})}
			</div>
		</main>
	);
}
