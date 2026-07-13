import type { NextRequest } from "next/server";
import { requireTraPhongRole } from "@/lib/traPhongSession";
import { parseMaHoSoOrError } from "@/lib/apiHelpers";
import { GiaoDichHoanCoc } from "@/lib/services/giaoDichHoanCoc.service";
import { HoSoTraPhong } from "@/lib/services/hoSoTraPhong.service";
import { apiSuccess, apiError, withApiErrorHandling } from "@/lib/api-response";

/**
 * POST /api/tra-phong/[maHoSo]/hoan-coc — UC5 Màn 1, nút "Ghi nhận giao dịch hoàn cọc".
 * Body: { phuongThucHoan: "Tiền mặt" | "Chuyển khoản", soTaiKhoanNhan? }
 * `soTienHoan` KHÔNG nhận từ client — server tự lấy từ kết quả đối soát đã lưu.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ maHoSo: string }> }) {
	const auth = await requireTraPhongRole(["ketoan"]);
	if ("error" in auth) return auth.error;

	return withApiErrorHandling(async () => {
		const { maHoSo } = await params;
		const parsed = parseMaHoSoOrError(maHoSo);
		if ("error" in parsed) return parsed.error;

		const body = await req.json();
		const phuongThucHoan = body?.phuongThucHoan;
		if (phuongThucHoan !== "Tiền mặt" && phuongThucHoan !== "Chuyển khoản") {
			return apiError("phuongThucHoan không hợp lệ.", 400);
		}

		const hoSo = await HoSoTraPhong.layThongTin(parsed.id);
		if (!hoSo) return apiError("Không tìm thấy hồ sơ.", 404);
		if (hoSo.doiSoatId == null) {
			return apiError("Hồ sơ chưa có kết quả đối soát.", 409);
		}
		if (!hoSo.soTienHoan || hoSo.soTienHoan <= 0) {
			return apiError("Hồ sơ không có số dư cần hoàn cọc.", 409);
		}
		if (hoSo.daHoanCoc) {
			return apiError("Hồ sơ đã được hoàn cọc trước đó.", 409);
		}

		const giaoDich = await GiaoDichHoanCoc.luu({
			doiSoatId: hoSo.doiSoatId,
			keToanId: auth.user.nguoiDungId,
			soTienHoan: hoSo.soTienHoan,
			phuongThucHoan,
			soTaiKhoanNhan: typeof body.soTaiKhoanNhan === "string" && body.soTaiKhoanNhan ? body.soTaiKhoanNhan : undefined,
			thoiDiemThucHien: new Date(),
		});

		return apiSuccess(giaoDich, 201);
	});
}
