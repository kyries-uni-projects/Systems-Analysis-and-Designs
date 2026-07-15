import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";
import { apiError, apiSuccess, withApiErrorHandling } from "@/lib/api-response";
import { requireApiSession } from "@/lib/api-auth";
import { parseLichHenNhanPhongInput } from "@/lib/lichHenNhanPhongInput";
import { prisma } from "@/lib/prisma";
import { ghiNhanThongTinDatCoc, luuLichHenNhanPhong } from "@/lib/services/hoSoDatCocService";

async function parseAndAuthorize(request: NextRequest, params: Promise<{ id: string }>): Promise<{ error: NextResponse } | { hoSoId: number }> {
	const auth = await requireApiSession(request, ["nhanvien"]);
	if ("error" in auth) return { error: auth.error };
	const { id } = await params;
	const hoSoId = Number(id);
	if (!Number.isInteger(hoSoId) || hoSoId < 1) return { error: apiError("ID hồ sơ không hợp lệ.", 400) };

	if (auth.user.role !== "admin") {
		const owner = await prisma.hoSoDatCoc.findUnique({
			where: { hoSoDatCocId: hoSoId },
			select: { nhanVien: { select: { tenDangNhap: true } } },
		});
		if (!owner) return { error: apiError("Không tìm thấy hồ sơ đặt cọc.", 404) };
		if (owner.nhanVien.tenDangNhap !== auth.user.username) {
			return { error: apiError("Chỉ Sale phụ trách hồ sơ mới được ghi nhận đặt cọc.", 403) };
		}
	}

	return { hoSoId };
}

/** Chốt thông tin cọc và chuyển phòng/giường sang trạng thái Đã cọc. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withApiErrorHandling(async () => {
		const access = await parseAndAuthorize(request, params);
		if ("error" in access) return access.error;
		const result = await ghiNhanThongTinDatCoc(access.hoSoId);
		if (!result) return apiError("Không tìm thấy hồ sơ đặt cọc.", 404);
		return apiSuccess(result);
	});
}

/** Lưu lịch hẹn nhận phòng và mô phỏng gửi thông báo cho khách hàng. */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withApiErrorHandling(async () => {
		const access = await parseAndAuthorize(request, params);
		if ("error" in access) return access.error;
		const input = parseLichHenNhanPhongInput((await request.json()) as Record<string, unknown>);
		const result = await luuLichHenNhanPhong(access.hoSoId, input);
		if (!result) return apiError("Không tìm thấy hồ sơ đặt cọc.", 404);
		return apiSuccess(result);
	});
}
