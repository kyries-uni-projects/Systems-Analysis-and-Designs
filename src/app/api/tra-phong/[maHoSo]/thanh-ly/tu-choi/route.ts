import { requireTraPhongRole } from "@/lib/traPhongSession";
import { parseMaHoSoOrError } from "@/lib/apiHelpers";
import { YeuCauTraPhong } from "@/lib/services/yeuCauTraPhong.service";
import { apiSuccess, withApiErrorHandling } from "@/lib/api-response";

/**
 * POST /api/tra-phong/[maHoSo]/thanh-ly/tu-choi — UC4 Màn 2, nhánh A5 (khách từ chối ký).
 * Body: { lyDo? }
 *
 * LƯU Ý (gap đã biết): schema.prisma hiện CHƯA có cột lưu "lý do từ chối ký" cho bước này
 * (khác với lyDoTraPhong ở UC1). `lyDo` do người dùng nhập ở đây tạm thời KHÔNG được lưu
 * vào CSDL — chỉ chuyển trạng thái hồ sơ.
 */
export async function POST(req: Request, { params }: { params: Promise<{ maHoSo: string }> }) {
	const auth = await requireTraPhongRole(["quanly"]);
	if ("error" in auth) return auth.error;

	return withApiErrorHandling(async () => {
		const { maHoSo } = await params;
		const parsed = parseMaHoSoOrError(maHoSo);
		if ("error" in parsed) return parsed.error;

		await req.json().catch(() => null);
		await YeuCauTraPhong.capNhatTrangThai(parsed.id, "Chờ giải quyết tranh chấp");
		return apiSuccess({ ok: true });
	});
}
