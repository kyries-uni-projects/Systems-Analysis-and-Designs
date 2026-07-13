"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BedDouble, Bell, ChevronDown, ChevronUp, LogOut, Menu, Search, UserRound, UsersRound, X } from "lucide-react";
import { HomeStayLogo } from "@/components/branding/HomeStayLogo";
import { useAuth } from "@/components/providers/AuthProvider";
import { canAccessWorkflowAction, getWorkflowActionHref, workflowGroups } from "@/lib/workflow-navigation";

const fixedNavigation = [
	{ href: "/", label: "Tổng quan", iconPath: "/icons/tong-quan.svg" },
	{ href: "/khach-hang", label: "Khách hàng", icon: UsersRound },
	{ href: "/phong", label: "Phòng", icon: BedDouble },
	{ href: "/help", label: "Trợ giúp", iconPath: "/icons/tro-giup.svg" },
];

export default function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
	const pathname = usePathname();
	const router = useRouter();
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const { sessionUser, clearSession } = useAuth();
	const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

	useEffect(() => {
		const activeGroup = workflowGroups.find((group) =>
			group.actions.some((action) => {
				const href = getWorkflowActionHref(group, action);
				return pathname === href || pathname.startsWith(`${href}/`);
			}),
		);
		if (activeGroup) {
			const expandTimer = window.setTimeout(() => setExpandedGroup(activeGroup.slug));
			return () => window.clearTimeout(expandTimer);
		}
	}, [pathname]);

	if (pathname === "/login") {
		return children;
	}

	async function handleLogout() {
		await fetch("/api/auth/logout", { method: "POST" });
		clearSession();
		router.replace("/login");
		router.refresh();
	}

	function isActive(href: string) {
		return href === "/" ? pathname === "/" : pathname.startsWith(href);
	}

	function toggleGroup(groupSlug: string) {
		setExpandedGroup((current) => (current === groupSlug ? null : groupSlug));
	}

	const sidebar = (
		<aside className="flex h-full w-64 shrink-0 flex-col bg-[#1e3a5f] text-white shadow-xl lg:shadow-none">
			<div className="flex items-center justify-between border-b border-[#2d4f7a] px-5 py-4">
				<HomeStayLogo variant="sidebar" size={40} />
				<button
					type="button"
					aria-label="Đóng menu"
					onClick={() => setIsSidebarOpen(false)}
					className="rounded-md p-1 text-blue-100 hover:bg-[#2d4f7a] lg:hidden"
				>
					<X className="size-5" aria-hidden="true" />
				</button>
			</div>

			<nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Điều hướng chính">
				{fixedNavigation.slice(0, 3).map(({ href, label, iconPath, icon: Icon }) => (
					<Link
						key={href}
						href={href}
						onClick={() => setIsSidebarOpen(false)}
						className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition ${isActive(href) ? "bg-[#155DFC] text-white shadow-sm" : "text-blue-50 hover:bg-[#2d4f7a]"}`}
					>
						{iconPath && <Image src={iconPath} alt="" width={20} height={20} className="shrink-0" aria-hidden="true" />}
						{Icon && <Icon className="size-5 shrink-0" aria-hidden="true" />}
						{label}
					</Link>
				))}

				{sessionUser &&
					workflowGroups.map((group) => {
						const visibleActions = group.actions.filter((action) => canAccessWorkflowAction(sessionUser.role, action));
						if (visibleActions.length === 0) {
							return null;
						}

						const isGroupActive = visibleActions.some((action) => isActive(getWorkflowActionHref(group, action)));
						const isExpanded = expandedGroup === group.slug;

						return (
							<section key={group.slug} className="pt-2">
								<button
									type="button"
									onClick={() => toggleGroup(group.slug)}
									aria-expanded={isExpanded}
									className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition ${isGroupActive || isExpanded ? "bg-[#155DFC] text-white" : "text-blue-50 hover:bg-[#2d4f7a]"}`}
								>
									<span className="flex min-w-0 flex-1 items-center gap-3">
										{group.iconPath ? (
											<Image src={group.iconPath} alt="" width={20} height={20} className="shrink-0" aria-hidden="true" />
										) : (
											<span className="size-2.5 shrink-0 rounded-full bg-current opacity-80" />
										)}
										<span className="truncate">{group.label}</span>
									</span>
									{isExpanded ? (
										<ChevronUp className="size-4 shrink-0" aria-hidden="true" />
									) : (
										<ChevronDown className="size-4 shrink-0" aria-hidden="true" />
									)}
								</button>
								{isExpanded && (
									<div className="ml-6 border-l border-white/15 py-1">
										{visibleActions.map((action) => {
											const href = getWorkflowActionHref(group, action);
											const isActionActive = isActive(href);
											return (
												<Link
													key={action.slug}
													href={href}
													onClick={() => setIsSidebarOpen(false)}
													className={`flex items-center gap-3 px-4 py-2.5 text-sm transition ${isActionActive ? "font-semibold text-white" : "text-blue-100/75 hover:text-white"}`}
												>
													<span className={`size-2 shrink-0 rounded-full ${isActionActive ? "bg-[#155DFC] ring-2 ring-white/25" : "bg-white/30"}`} />
													<span className="truncate">{action.label}</span>
												</Link>
											);
										})}
									</div>
								)}
							</section>
						);
					})}

				{fixedNavigation.slice(3).map(({ href, label, iconPath, icon: Icon }) => (
					<Link
						key={href}
						href={href}
						onClick={() => setIsSidebarOpen(false)}
						className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition ${isActive(href) ? "bg-[#155DFC] text-white shadow-sm" : "text-blue-50 hover:bg-[#2d4f7a]"}`}
					>
						{iconPath && <Image src={iconPath} alt="" width={20} height={20} className="shrink-0" aria-hidden="true" />}
						{Icon && <Icon className="size-5 shrink-0" aria-hidden="true" />}
						{label}
					</Link>
				))}
			</nav>
		</aside>
	);

	return (
		<div className="min-h-screen bg-[#f7fafc]">
			<div className="mx-auto flex min-h-screen w-full overflow-hidden bg-[#f7fafc]">
				<div className="hidden lg:block">{sidebar}</div>

				{isSidebarOpen && (
					<div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true" aria-label="Menu điều hướng">
						<button type="button" aria-label="Đóng menu" onClick={() => setIsSidebarOpen(false)} className="flex-1 bg-slate-950/40" />
						<div className="h-full">{sidebar}</div>
					</div>
				)}

				<div className="flex min-w-0 flex-1 flex-col">
					<header className="sticky top-0 z-30 flex h-17 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
						<button
							type="button"
							aria-label="Mở menu"
							onClick={() => setIsSidebarOpen(true)}
							className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
						>
							<Menu className="size-5" aria-hidden="true" />
						</button>
						<div className="relative hidden max-w-xl flex-1 sm:block">
							<Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
							<input
								type="search"
								placeholder="Tìm kiếm khách hàng, phòng, hợp đồng..."
								className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
							/>
						</div>
						<div className="ml-auto flex items-center gap-2 sm:gap-4">
							<button type="button" aria-label="Thông báo" className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100">
								<Bell className="size-5" aria-hidden="true" />
								<span className="absolute right-2 top-2 size-2 rounded-full bg-red-500 ring-2 ring-white" />
							</button>
							<div className="hidden items-center gap-3 sm:flex">
								<div className="flex size-9 items-center justify-center rounded-full bg-teal-500 text-white">
									<UserRound className="size-4.5" aria-hidden="true" />
								</div>
								<div className="leading-tight">
									<p className="max-w-36 truncate text-sm font-semibold text-slate-800">{sessionUser?.name ?? "Tài khoản"}</p>
									<p className="max-w-36 truncate text-xs text-slate-400">{sessionUser?.position ?? "Đang tải..."}</p>
								</div>
							</div>
							<button
								type="button"
								onClick={handleLogout}
								title="Đăng xuất"
								className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 sm:px-3"
							>
								<LogOut className="size-4" aria-hidden="true" />
								<span className="hidden sm:inline">Đăng xuất</span>
							</button>
						</div>
					</header>

					<div className="min-w-0 flex-1">{children}</div>
				</div>
			</div>
		</div>
	);
}
