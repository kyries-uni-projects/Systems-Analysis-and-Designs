import type { NextRequest } from "next/server";
import { apiSuccess, withApiErrorHandling } from "@/lib/api-response";
import { requireApiSession } from "@/lib/api-auth";
import { layDanhSachPhongGiuongKhaDung } from "@/lib/services/hoSoDatCocService";

export async function GET(request: NextRequest) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["nhanvien"]);
		if ("error" in auth) return auth.error;

		return apiSuccess(await layDanhSachPhongGiuongKhaDung());
	});
}
