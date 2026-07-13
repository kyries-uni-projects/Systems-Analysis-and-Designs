"use client";
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import type { Role } from "@/lib/auth";

/**
 * (Nhóm 4) `proxy.ts` (middleware chung) chặn quyền theo vai trò dựa trên khớp CHÍNH XÁC
 * URL với `workflowGroups` — chỉ bao phủ 5 URL cấp 1 (màn danh sách chờ của mỗi UC), CHƯA
 * bao phủ route con dạng `/tra-phong/kiem-tra-tinh-trang/[maHoSo]` (màn xử lý 1 hồ sơ cụ
 * thể). Component này bù đắp đúng chỗ đó cho riêng route con của Nhóm 4 — không đụng
 * `proxy.ts` chung.
 */
export function TraPhongRoleGuard({ roles, children }: { roles: Role[]; children: ReactNode }) {
	const { sessionUser, isLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && !sessionUser) router.replace("/login");
	}, [isLoading, sessionUser, router]);

	if (isLoading) return null;
	if (!sessionUser) return null;
	if (sessionUser.role === "admin") return <>{children}</>;

	if (!roles.includes(sessionUser.role)) {
		return (
			<div className="mx-auto mt-24 max-w-lg rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
				<h2 className="mb-2 text-xl font-bold text-slate-800">Không có quyền truy cập</h2>
				<p className="text-sm text-slate-500">
					Tài khoản <strong>{sessionUser.name}</strong> (vai trò: {sessionUser.position}) không có quyền sử dụng chức
					năng này.
				</p>
			</div>
		);
	}

	return <>{children}</>;
}
