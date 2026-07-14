import type { NextRequest } from "next/server";
import { apiSuccess, withApiErrorHandling } from "@/lib/api-response";
import { requireApiSession } from "@/lib/api-auth";
import { createYeuCauThue } from "@/lib/services/yeuCauThueService";
import { parseCreateYeuCauThueInput } from "@/types/yeu-cau-thue";

export async function POST(request: NextRequest) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["nhanvien"]);
		if ("error" in auth) return auth.error;

		const input = parseCreateYeuCauThueInput(await request.json());
		const result = await createYeuCauThue(input, auth.user);
		return apiSuccess(result, 201);
	});
}
