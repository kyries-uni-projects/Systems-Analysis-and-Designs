import type { NextRequest } from "next/server";
import { apiSuccess, withApiErrorHandling } from "@/lib/api-response";
import { listKhachHang, createKhachHang } from "@/lib/services/khachHangService";
import { parseCreateKhachHangInput } from "@/types/khach-hang";
import { requireApiSession } from "@/lib/api-auth";

// GET /api/khach-hang?search=&page=&pageSize=
export async function GET(request: NextRequest) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request);
		if ("error" in auth) return auth.error;
		const searchParams = request.nextUrl.searchParams;
		const search = searchParams.get("search") ?? undefined;
		const page = Number(searchParams.get("page") ?? "1");
		const pageSize = Number(searchParams.get("pageSize") ?? "10");

		const result = await listKhachHang({ search, page, pageSize });
		return apiSuccess(result);
	});
}

// POST /api/khach-hang
export async function POST(request: NextRequest) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["nhanvien"]);
		if ("error" in auth) return auth.error;
		const body = await request.json();
		const input = parseCreateKhachHangInput(body);
		const khachHang = await createKhachHang(input);
		return apiSuccess(khachHang, 201);
	});
}
