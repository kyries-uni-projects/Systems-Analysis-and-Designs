import type { NextRequest } from "next/server";
import { apiSuccess, withApiErrorHandling } from "@/lib/api-response";
import { requireApiSession } from "@/lib/api-auth";
import { layDanhSachNguoiDung, taoNguoiDung } from "@/lib/services/nguoiDung.service";
import { parseUserManagementInput } from "@/lib/user-management-input";

export async function GET(request: NextRequest) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["admin"]);
		if ("error" in auth) return auth.error;
		return apiSuccess(await layDanhSachNguoiDung());
	});
}

export async function POST(request: NextRequest) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["admin"]);
		if ("error" in auth) return auth.error;
		const input = parseUserManagementInput((await request.json()) as Record<string, unknown>, "create");
		return apiSuccess(await taoNguoiDung(input), 201);
	});
}
