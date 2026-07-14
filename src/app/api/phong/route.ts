import type { NextRequest } from "next/server";
import { apiSuccess, withApiErrorHandling } from "@/lib/api-response";
import { listPhong, createPhong } from "@/lib/services/phongService";
import { parseCreatePhongInput } from "@/types/phong";
import { requireApiSession } from "@/lib/api-auth";

// GET /api/phong?search=&page=&pageSize=
export async function GET(request: NextRequest) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request);
		if ("error" in auth) return auth.error;
		const searchParams = request.nextUrl.searchParams;
		const search = searchParams.get("search") ?? undefined;
		const page = Number(searchParams.get("page") ?? "1");
		const pageSize = Number(searchParams.get("pageSize") ?? "10");

		const result = await listPhong({ search, page, pageSize });
		return apiSuccess(result);
	});
}

// POST /api/phong
export async function POST(request: NextRequest) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["quanly"]);
		if ("error" in auth) return auth.error;
		const body = await request.json();
		const input = parseCreatePhongInput(body);
		const phong = await createPhong(input);
		return apiSuccess(phong, 201);
	});
}
