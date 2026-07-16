import { NextRequest } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { apiSuccess, withApiErrorHandling } from "@/lib/api-response";
import { danhSachBanGiaoPhong } from "@/lib/services/banGiaoPhong.service";

export async function GET(request: NextRequest) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["quanly"]);
		if ("error" in auth) return auth.error;
		return apiSuccess(await danhSachBanGiaoPhong(request.nextUrl.searchParams.get("q") ?? undefined));
	});
}
