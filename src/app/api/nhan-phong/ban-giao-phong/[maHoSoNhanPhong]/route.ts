import { NextRequest } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { apiSuccess, withApiErrorHandling } from "@/lib/api-response";
import { chiTietBanGiaoPhong, luuBienBanBanGiao } from "@/lib/services/banGiaoPhong.service";
import type { LuuBienBanBanGiaoInput } from "@/types/nhan-phong";

type RouteContext = { params: Promise<{ maHoSoNhanPhong: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["quanly"]);
		if ("error" in auth) return auth.error;
		const { maHoSoNhanPhong } = await context.params;
		return apiSuccess(await chiTietBanGiaoPhong(decodeURIComponent(maHoSoNhanPhong)));
	});
}

export async function POST(request: NextRequest, context: RouteContext) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["quanly"]);
		if ("error" in auth) return auth.error;
		const { maHoSoNhanPhong } = await context.params;
		const input = (await request.json()) as LuuBienBanBanGiaoInput;
		return apiSuccess(await luuBienBanBanGiao(decodeURIComponent(maHoSoNhanPhong), auth.user.userId, input));
	});
}
