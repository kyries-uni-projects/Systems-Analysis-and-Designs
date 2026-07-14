import type { NextRequest } from "next/server";
import { apiError, apiSuccess, withApiErrorHandling } from "@/lib/api-response";
import { canReadDepositAtStatus, requireApiSession } from "@/lib/api-auth";
import { kiemTraTinhTrangPhong, layChiTietHoSoDatCoc, layDanhSachQuyDinhDatCoc } from "@/lib/services/hoSoDatCocService";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request);
		if ("error" in auth) return auth.error;

		const { id } = await params;
		const hoSoId = Number(id);
		if (!Number.isInteger(hoSoId) || hoSoId < 1) return apiError("ID hồ sơ không hợp lệ.", 400);

		const hoSo = await layChiTietHoSoDatCoc(hoSoId);
		if (!hoSo) return apiError("Không tìm thấy hồ sơ đặt cọc.", 404);
		if (!canReadDepositAtStatus(auth.user.role, hoSo.trangThai)) {
			return apiError("Tài khoản không có quyền xem hồ sơ ở bước hiện tại.", 403);
		}

		const isSaleStage = ["Chờ xác nhận điều kiện", "Mới tạo"].includes(hoSo.trangThai);
		const quyDinhList = isSaleStage ? await layDanhSachQuyDinhDatCoc() : null;
		const tinhTrangPhong =
			hoSo.trangThai === "Chờ xác nhận quản lý" && hoSo.phongId !== null
				? await kiemTraTinhTrangPhong(hoSo.phongId, hoSo.giuongId, hoSo.hoSoDatCocId)
				: null;

		return apiSuccess({ hoSo, quyDinhList, tinhTrangPhong });
	});
}
