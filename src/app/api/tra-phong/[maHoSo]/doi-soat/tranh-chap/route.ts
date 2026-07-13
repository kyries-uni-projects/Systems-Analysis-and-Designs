import { requireTraPhongRole } from "@/lib/traPhongSession";
import { parseMaHoSoOrError } from "@/lib/apiHelpers";
import { DoiSoatHoanCoc } from "@/lib/services/doiSoatHoanCoc.service";
import { apiSuccess, withApiErrorHandling } from "@/lib/api-response";

/** POST /api/tra-phong/[maHoSo]/doi-soat/tranh-chap — UC3 Màn 3, nhánh A9 (không thống nhất). */
export async function POST(_req: Request, { params }: { params: Promise<{ maHoSo: string }> }) {
	const auth = await requireTraPhongRole(["ketoan"]);
	if ("error" in auth) return auth.error;

	return withApiErrorHandling(async () => {
		const { maHoSo } = await params;
		const parsed = parseMaHoSoOrError(maHoSo);
		if ("error" in parsed) return parsed.error;

		await DoiSoatHoanCoc.chuyenCapTren(parsed.id);
		return apiSuccess({ ok: true });
	});
}
