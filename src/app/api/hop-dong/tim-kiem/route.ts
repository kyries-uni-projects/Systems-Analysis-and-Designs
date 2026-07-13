import type { NextRequest } from "next/server";
import { requireTraPhongRole } from "@/lib/traPhongSession";
import { HopDong } from "@/lib/services/hopDong.service";
import { apiSuccess, withApiErrorHandling } from "@/lib/api-response";

/** GET /api/hop-dong/tim-kiem?tuKhoa=...&sdt=...&hoTen=... — UC1 Màn 1. */
export async function GET(req: NextRequest) {
	const auth = await requireTraPhongRole(["nhanvien"]);
	if ("error" in auth) return auth.error;

	return withApiErrorHandling(async () => {
		const { searchParams } = new URL(req.url);
		const tuKhoa = searchParams.get("tuKhoa") ?? undefined;
		const sdt = searchParams.get("sdt") ?? undefined;
		const hoTen = searchParams.get("hoTen") ?? undefined;

		if (!tuKhoa && !sdt && !hoTen) {
			return apiSuccess(null, 200);
		}

		const hopDong = await HopDong.timKiem(tuKhoa, sdt, hoTen);
		// null nghĩa là A2 (không tìm thấy) — vẫn trả success:true, data:null.
		return apiSuccess(hopDong);
	});
}
