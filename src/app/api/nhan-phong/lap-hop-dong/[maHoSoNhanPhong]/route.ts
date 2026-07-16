import { NextRequest } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { apiSuccess, withApiErrorHandling } from "@/lib/api-response";
import {
	chiTietLapHopDong,
	luuHopDong,
} from "@/lib/services/lapHopDong.service";
import type { LuuHopDongInput } from "@/types/nhan-phong";

type RouteContext = {
	params: Promise<{ maHoSoNhanPhong: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["nhanvien"]);
		if ("error" in auth) return auth.error;

		const { maHoSoNhanPhong } = await context.params;
		return apiSuccess(await chiTietLapHopDong(decodeURIComponent(maHoSoNhanPhong)));
	});
}

export async function POST(request: NextRequest, context: RouteContext) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["nhanvien"]);
		if ("error" in auth) return auth.error;

		const { maHoSoNhanPhong } = await context.params;
		const input = (await request.json()) as LuuHopDongInput;
		return apiSuccess(await luuHopDong(decodeURIComponent(maHoSoNhanPhong), auth.user.userId, input));
	});
}
