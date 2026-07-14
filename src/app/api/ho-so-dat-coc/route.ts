import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, withApiErrorHandling } from "@/lib/api-response";
import { requireApiSession } from "@/lib/api-auth";
import { parseHoSoDatCocInput } from "@/lib/hoSoDatCocInput";
import { layDanhSachHoSoDatCoc, taoHoSoDatCoc } from "@/lib/services/hoSoDatCocService";

export async function GET(request: NextRequest) {
	const auth = await requireApiSession(request);
	if ("error" in auth) return auth.error;

	return NextResponse.json({ success: true, data: await layDanhSachHoSoDatCoc(auth.user.role) });
}

export async function POST(request: NextRequest) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["nhanvien"]);
		if ("error" in auth) return auth.error;

		const hoSo = await taoHoSoDatCoc(parseHoSoDatCocInput(await request.json()), auth.user);
		return apiSuccess(hoSo, 201);
	});
}
