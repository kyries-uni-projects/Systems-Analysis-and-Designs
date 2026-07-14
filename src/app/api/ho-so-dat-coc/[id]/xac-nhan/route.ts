import type { NextRequest } from "next/server";
import { apiError, apiSuccess, ApiValidationError, withApiErrorHandling } from "@/lib/api-response";
import { requireApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
	layChiTietHoSoDatCoc,
	xacNhanDieuKienSale,
	xacNhanTinhTrangQuanLy,
	type XacDinhYeuCauDatCocInput,
} from "@/lib/services/hoSoDatCocService";

type KetQuaKiemTraInput = { quyDinhId: number; ketQua: string; ghiChu?: string };

function optionalString(value: unknown) {
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parseKetQua(value: unknown): KetQuaKiemTraInput[] {
	if (value === undefined) return [];
	if (!Array.isArray(value)) throw new ApiValidationError("Kết quả kiểm tra điều kiện không hợp lệ.");
	return value.map((item) => {
		if (typeof item !== "object" || item === null) throw new ApiValidationError("Kết quả kiểm tra điều kiện không hợp lệ.");
		const record = item as Record<string, unknown>;
		const quyDinhId = Number(record.quyDinhId);
		if (!Number.isInteger(quyDinhId) || quyDinhId < 1 || !["Đạt", "Không đạt"].includes(String(record.ketQua))) {
			throw new ApiValidationError("Kết quả kiểm tra điều kiện không hợp lệ.");
		}
		return { quyDinhId, ketQua: String(record.ketQua), ghiChu: optionalString(record.ghiChu) };
	});
}

function parseChiTiet(value: unknown): XacDinhYeuCauDatCocInput | undefined {
	if (value === undefined || value === null) return undefined;
	if (typeof value !== "object") throw new ApiValidationError("Thông tin phòng hoặc giường không hợp lệ.");
	const record = value as Record<string, unknown>;
	const phongId = Number(record.phongId);
	const giuongId = record.giuongId ? Number(record.giuongId) : undefined;
	const giaThueThoaThuan = Number(record.giaThueThoaThuan);
	const soGiuongQuyDoi = Number(record.soGiuongQuyDoi);
	if (!Number.isInteger(phongId) || phongId < 1 || (giuongId !== undefined && (!Number.isInteger(giuongId) || giuongId < 1))) {
		throw new ApiValidationError("Phòng hoặc giường đã chọn không hợp lệ.");
	}
	return { phongId, giuongId, giaThueThoaThuan, soGiuongQuyDoi };
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withApiErrorHandling(async () => {
		const auth = await requireApiSession(request, ["nhanvien", "quanly"]);
		if ("error" in auth) return auth.error;
		const account = auth.user;
		const username = auth.user.username;

		const { id } = await params;
		const hoSoId = Number(id);
		if (!Number.isInteger(hoSoId) || hoSoId < 1) return apiError("ID hồ sơ không hợp lệ.", 400);

		const body = (await request.json()) as Record<string, unknown>;
		const lyDoTuChoi = optionalString(body.lyDoTuChoi);
		const hoSo = await layChiTietHoSoDatCoc(hoSoId);
		if (!hoSo) return apiError("Không tìm thấy hồ sơ đặt cọc.", 404);

		const nguoiDung = await prisma.nguoiDung.upsert({
			where: { tenDangNhap: username },
			update: {},
			create: {
				hoTen: account.name,
				tenDangNhap: username,
				matKhauHash: "demo-session-account",
				vaiTro: account.role,
			},
			select: { nguoiDungId: true },
		});

		const isSaleStage = ["Chờ xác nhận điều kiện", "Mới tạo"].includes(hoSo.trangThai);
		if ((account.role === "nhanvien" || account.role === "admin") && isSaleStage) {
			const result = await xacNhanDieuKienSale(
				hoSoId,
				nguoiDung.nguoiDungId,
				parseKetQua(body.ketQuaKiemTra),
				parseChiTiet(body.chiTietDatCoc),
				lyDoTuChoi,
			);
			if (!result) return apiError("Không tìm thấy hồ sơ đặt cọc.", 404);
			return apiSuccess({ message: lyDoTuChoi ? "Đã từ chối hồ sơ." : "Đã gửi yêu cầu xác nhận lên Quản lý." });
		}

		if ((account.role === "quanly" || account.role === "admin") && hoSo.trangThai === "Chờ xác nhận quản lý") {
			const result = await xacNhanTinhTrangQuanLy(hoSoId, nguoiDung.nguoiDungId, lyDoTuChoi);
			if (!result) return apiError("Không tìm thấy hồ sơ đặt cọc.", 404);
			return apiSuccess({ message: lyDoTuChoi ? "Đã từ chối hồ sơ." : "Đã xác nhận tình trạng phòng hoặc giường." });
		}

		return apiError("Tài khoản không có quyền xử lý hồ sơ ở bước hiện tại.", 403);
	});
}
