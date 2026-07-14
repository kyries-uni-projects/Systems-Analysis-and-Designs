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
		<main className="min-h-full bg-[#f4faf8] px-4 py-8 sm:px-8">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
			<div>
				<p className="text-[13px] text-slate-500">Tổng quan hệ thống</p>
				<h1 className="mt-2 text-2xl font-bold text-[#101828]">HomeStay Dorm</h1>
				<p className="mt-2 text-sm text-slate-500">
					Theo dõi nhanh dữ liệu vận hành ký túc xá và truy cập các phân hệ quản lý.
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				{stats.map((stat) => {
					const cardClass = "rounded-xl border border-[#d7ece7] bg-white p-6 shadow-sm";
					const content = (
						<>
							<p className="text-sm text-slate-500">{stat.label}</p>
							<p className="mt-2 text-3xl font-bold text-[#101828]">{stat.value}</p>
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
						<Link key={stat.label} href={stat.href} className={`${cardClass} transition hover:border-teal-300 hover:shadow-md`}>
							{content}
						</Link>
					);
				})}
			</div>
			</div>
		</main>
	);
}
