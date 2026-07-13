import { requireTraPhongRole } from "@/lib/traPhongSession";
import { parseMaHoSoOrError } from "@/lib/apiHelpers";
import { TaiSanBanGiao } from "@/lib/services/taiSanBanGiao.service";
import { apiSuccess, withApiErrorHandling } from "@/lib/api-response";

/** GET /api/tra-phong/[maHoSo]/tai-san — UC2 Màn 1/2: tài sản đã bàn giao ban đầu. */
export async function GET(_req: Request, { params }: { params: Promise<{ maHoSo: string }> }) {
	const auth = await requireTraPhongRole(["quanly"]);
	if ("error" in auth) return auth.error;

	return withApiErrorHandling(async () => {
		const { maHoSo } = await params;
		const parsed = parseMaHoSoOrError(maHoSo);
		if ("error" in parsed) return parsed.error;

		const list = await TaiSanBanGiao.layDanhSachTheoHoSo(parsed.id);
		return apiSuccess(list);
	});
}
