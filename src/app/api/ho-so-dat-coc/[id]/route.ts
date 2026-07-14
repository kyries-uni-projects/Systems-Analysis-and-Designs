import type { NextRequest } from "next/server";
import { apiError, apiSuccess, withApiErrorHandling } from "@/lib/api-response";
import { demoAccounts, SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE, SESSION_USER_COOKIE_NAME } from "@/lib/auth";
import { kiemTraTinhTrangPhong, layChiTietHoSoDatCoc, layDanhSachQuyDinhDatCoc } from "@/lib/services/hoSoDatCocService";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withApiErrorHandling(async () => {
		const username = request.cookies.get(SESSION_USER_COOKIE_NAME)?.value;
		const account = username ? demoAccounts[username] : undefined;
		if (request.cookies.get(SESSION_COOKIE_NAME)?.value !== SESSION_COOKIE_VALUE || !account) {
			return apiError("Chưa xác thực.", 401);
		}

		const { id } = await params;
		const hoSoId = Number(id);
		if (!Number.isInteger(hoSoId) || hoSoId < 1) return apiError("ID hồ sơ không hợp lệ.", 400);

		const hoSo = await layChiTietHoSoDatCoc(hoSoId);
		if (!hoSo) return apiError("Không tìm thấy hồ sơ đặt cọc.", 404);

		const isSaleStage = ["Chờ xác nhận điều kiện", "Mới tạo"].includes(hoSo.trangThai);
		const quyDinhList = isSaleStage ? await layDanhSachQuyDinhDatCoc() : null;
		const tinhTrangPhong =
			hoSo.trangThai === "Chờ xác nhận quản lý" && hoSo.phongId !== null
				? await kiemTraTinhTrangPhong(hoSo.phongId, hoSo.giuongId, hoSo.hoSoDatCocId)
				: null;

		return apiSuccess({ hoSo, quyDinhList, tinhTrangPhong });
	});
}
