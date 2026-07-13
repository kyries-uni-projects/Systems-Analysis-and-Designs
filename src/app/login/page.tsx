"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { demoAccounts, roleLabels } from "@/lib/auth";
import { HomeStayLogo } from "@/components/branding/HomeStayLogo";
import { useAuth } from "@/components/providers/AuthProvider";

export default function LoginPage() {
	const router = useRouter();
	const { refreshSession } = useAuth();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");

		if (!username.trim() || !password) {
			setError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
			return;
		}

		setIsSubmitting(true);
		const response = await fetch("/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password }),
		});

		if (!response.ok) {
			const result: { error?: string } = await response.json().catch(() => ({}));
			setError(result.error ?? "Không thể đăng nhập. Vui lòng thử lại.");
			setIsSubmitting(false);
			return;
		}

		await refreshSession();
		const nextPath = new URLSearchParams(window.location.search).get("next");
		router.replace(nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/");
	}

	function chooseDemoAccount(accountUsername: string) {
		const account = demoAccounts[accountUsername];
		setUsername(accountUsername);
		setPassword(account.password);
		setError("");
	}

	return (
		<main className="flex min-h-screen font-sans">
			<aside className="hidden w-105 shrink-0 flex-col justify-between bg-[linear-gradient(160deg,#1b2b4b_60%,#162240_100%)] px-12 py-14 lg:flex">
				<div>
					<HomeStayLogo variant="sidebar" size={52} />

					<div className="mt-8 h-px w-10 bg-teal-400/40" />

					<section className="mt-7">
						<h1 className="text-3xl font-bold leading-snug text-white">
							Hệ thống quản lý
							<br />
							<span className="text-teal-400">tập trung</span>
						</h1>
						<p className="mt-3 text-sm leading-6 text-white/60">
							Quản lý toàn bộ quy trình đăng ký thuê phòng, đặt cọc, nhận phòng và trả phòng trên một nền tảng thống nhất.
						</p>
					</section>

					<ul className="mt-8 space-y-3">
						{[
							"Đăng ký & xem phòng trực tuyến",
							"Đặt cọc & xác nhận thuê nhanh chóng",
							"Quản lý hợp đồng & thanh toán",
							"Phân quyền theo vai trò rõ ràng",
						].map((benefit) => (
							<li key={benefit} className="flex items-center gap-3 text-sm text-white/70">
								<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-400/20 text-teal-400">
									<Check className="size-3" strokeWidth={3} aria-hidden="true" />
								</span>
								{benefit}
							</li>
						))}
					</ul>
				</div>
				<p className="text-xs text-white/25">© 2025 HomeStay Dorm. All rights reserved.</p>
			</aside>

			<section className="flex flex-1 items-center justify-center bg-[#f0f4f8] px-6 py-12">
				<div className="w-full max-w-md">
					<div className="mb-10 lg:hidden">
						<HomeStayLogo size={40} />
					</div>

					<div className="rounded-2xl bg-white px-8 py-10 shadow-[0_12px_30px_rgba(27,43,75,0.12)] sm:px-10">
						<div>
							<h2 className="text-2xl font-bold text-[#1b2b4b]">Đăng nhập</h2>
							<p className="mt-1 text-sm leading-5 text-slate-400">Nhập thông tin tài khoản được cấp bởi quản trị viên</p>
						</div>

						{error && (
							<div className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3" role="alert">
								<AlertCircle className="mt-0.5 size-4 shrink-0 text-red-500" aria-hidden="true" />
								<p className="text-sm text-red-600">{error}</p>
							</div>
						)}

						<form className="mt-6 space-y-5" onSubmit={handleSubmit}>
							<div>
								<label htmlFor="username" className="mb-2 block text-sm font-medium text-[#1b2b4b]">
									Tên đăng nhập
								</label>
								<div className="relative">
									<UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
									<input
										id="username"
										value={username}
										onChange={(event) => setUsername(event.target.value)}
										placeholder="Nhập tên đăng nhập"
										disabled={isSubmitting}
										autoComplete="username"
										className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50"
									/>
								</div>
							</div>

							<div>
								<label htmlFor="password" className="mb-2 block text-sm font-medium text-[#1b2b4b]">
									Mật khẩu
								</label>
								<div className="relative">
									<LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
									<input
										id="password"
										type={showPassword ? "text" : "password"}
										value={password}
										onChange={(event) => setPassword(event.target.value)}
										placeholder="Nhập mật khẩu"
										disabled={isSubmitting}
										autoComplete="current-password"
										className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50"
									/>
									<button
										type="button"
										onClick={() => setShowPassword((visible) => !visible)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#1b2b4b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
										aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
									>
										{showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
									</button>
								</div>
							</div>

							<button
								type="submit"
								disabled={isSubmitting}
								className="flex h-11 w-full items-center justify-center rounded-lg bg-[linear-gradient(135deg,#1b2b4b_0%,#243860_100%)] px-4 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b2b4b] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:bg-none"
							>
								{isSubmitting ? (
									<>
										<span className="mr-2 size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
										Đang xác thực...
									</>
								) : (
									"Đăng nhập"
								)}
							</button>
						</form>

						<div className="mt-7">
							<div className="flex items-center gap-3">
								<span className="h-px flex-1 bg-slate-100" />
								<span className="text-xs text-slate-400">Tài khoản demo</span>
								<span className="h-px flex-1 bg-slate-100" />
							</div>
							<div className="mt-3 grid grid-cols-2 gap-2">
								{Object.entries(demoAccounts).map(([accountUsername, account]) => (
									<button
										key={accountUsername}
										type="button"
										onClick={() => chooseDemoAccount(accountUsername)}
										disabled={isSubmitting}
										className="rounded-lg border border-slate-100 px-3 py-2 text-left transition hover:border-teal-300 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed"
									>
										<p className="font-mono text-xs font-medium text-[#1b2b4b]">{accountUsername}</p>
										<p className="mt-0.5 text-[10px] text-slate-400">{roleLabels[account.role]}</p>
									</button>
								))}
							</div>
						</div>
					</div>
					<p className="mt-6 text-center text-xs text-slate-400">Liên hệ quản trị viên nếu quên mật khẩu hoặc chưa có tài khoản</p>
				</div>
			</section>
		</main>
	);
}
