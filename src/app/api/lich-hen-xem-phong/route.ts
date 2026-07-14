import type { NextRequest } from "next/server";
import { apiSuccess, withApiErrorHandling } from "@/lib/api-response";
import { requireApiSession } from "@/lib/api-auth";
import { taoLichHen, layDanhSachYeuCauChuaLapLich } from "@/lib/services/lichHenXemPhongService";
import { parseCreateLichHenInput } from "@/types/lich-hen-xem-phong";

/** GET — Lấy danh sách yêu cầu thuê có thể lập lịch */
export async function GET(request: NextRequest) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["nhanvien"]);
		if ("error" in auth) return auth.error;

		const data = await layDanhSachYeuCauChuaLapLich();
		return apiSuccess(data);
	});
}

/** POST — Tạo lịch hẹn mới (theo Sequence Diagram) */
export async function POST(request: NextRequest) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["nhanvien"]);
		if ("error" in auth) return auth.error;

		const input = parseCreateLichHenInput(await request.json());
		const result = await taoLichHen(input, auth.user);
		return apiSuccess(result, 201);
	});
}
