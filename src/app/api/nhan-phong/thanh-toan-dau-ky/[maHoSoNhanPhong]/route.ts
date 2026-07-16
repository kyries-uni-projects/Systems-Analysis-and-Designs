import { NextRequest } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { apiSuccess, withApiErrorHandling } from "@/lib/api-response";
import {
	chiTietThanhToanDauKy,
	hoanTatThanhToanDauKy,
} from "@/lib/services/thanhToanDauKy.service";
import type { LuuThanhToanDauKyInput } from "@/types/nhan-phong";

type RouteContext = {
	params: Promise<{ maHoSoNhanPhong: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["ketoan"]);
		if ("error" in auth) return auth.error;

		const { maHoSoNhanPhong } = await context.params;
		return apiSuccess(await chiTietThanhToanDauKy(decodeURIComponent(maHoSoNhanPhong)));
	});
}

export async function POST(request: NextRequest, context: RouteContext) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["ketoan"]);
		if ("error" in auth) return auth.error;

		const { maHoSoNhanPhong } = await context.params;
		const input = (await request.json()) as LuuThanhToanDauKyInput;
		return apiSuccess(await hoanTatThanhToanDauKy(decodeURIComponent(maHoSoNhanPhong), auth.user.userId, input));
	});
}
