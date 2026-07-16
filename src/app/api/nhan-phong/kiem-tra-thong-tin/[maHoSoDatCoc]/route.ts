import { NextRequest } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { apiSuccess, withApiErrorHandling } from "@/lib/api-response";
import {
	chiTietKiemTraThongTin,
	luuVaChuyenKiemTraDieuKien,
} from "@/lib/services/kiemTraThongTinNhanPhong.service";
import type { LuuKiemTraThongTinInput } from "@/types/nhan-phong";

type RouteContext = {
	params: Promise<{ maHoSoDatCoc: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["nhanvien"]);
		if ("error" in auth) return auth.error;

		const { maHoSoDatCoc } = await context.params;
		return apiSuccess(await chiTietKiemTraThongTin(decodeURIComponent(maHoSoDatCoc)));
	});
}

export async function POST(request: NextRequest, context: RouteContext) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["nhanvien"]);
		if ("error" in auth) return auth.error;

		const { maHoSoDatCoc } = await context.params;
		const input = (await request.json()) as LuuKiemTraThongTinInput;
		const result = await luuVaChuyenKiemTraDieuKien(decodeURIComponent(maHoSoDatCoc), auth.user.userId, input);
		return apiSuccess(result);
	});
}
