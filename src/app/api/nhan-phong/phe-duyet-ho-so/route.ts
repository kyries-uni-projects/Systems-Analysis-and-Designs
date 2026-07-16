import { NextRequest } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { apiSuccess, withApiErrorHandling } from "@/lib/api-response";
import { danhSachPheDuyetHoSo } from "@/lib/services/pheDuyetHoSoLuuTru.service";

export async function GET(request: NextRequest) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["quanly"]);
		if ("error" in auth) return auth.error;

		const keyword = request.nextUrl.searchParams.get("q") ?? undefined;
		return apiSuccess(await danhSachPheDuyetHoSo(keyword));
	});
}
