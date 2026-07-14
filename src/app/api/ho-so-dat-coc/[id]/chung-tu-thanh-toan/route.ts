import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { apiError, apiSuccess, ApiValidationError, withApiErrorHandling } from "@/lib/api-response";
import { demoAccounts, SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE, SESSION_USER_COOKIE_NAME } from "@/lib/auth";
import { capNhatChungTuThanhToan } from "@/lib/services/hoSoDatCocService";

const extensionByMimeType: Record<string, string> = {
	"application/pdf": ".pdf",
	"image/jpeg": ".jpg",
	"image/png": ".png",
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withApiErrorHandling(async () => {
		const username = request.cookies.get(SESSION_USER_COOKIE_NAME)?.value;
		const account = username ? demoAccounts[username] : undefined;
		if (request.cookies.get(SESSION_COOKIE_NAME)?.value !== SESSION_COOKIE_VALUE || !account) return apiError("Chưa xác thực.", 401);
		if (account.role !== "nhanvien" && account.role !== "admin") {
			return apiError("Tài khoản không có quyền cập nhật chứng từ thanh toán.", 403);
		}

		const { id } = await params;
		const hoSoId = Number(id);
		if (!Number.isInteger(hoSoId) || hoSoId < 1) return apiError("ID hồ sơ không hợp lệ.", 400);

		const formData = await request.formData();
		const file = formData.get("chungTu");
		if (!(file instanceof File) || file.size === 0) throw new ApiValidationError("Vui lòng chọn tệp chứng từ thanh toán.");
		if (file.size > 5 * 1024 * 1024) throw new ApiValidationError("Tệp chứng từ không được vượt quá 5 MB.");
		const extension = extensionByMimeType[file.type];
		if (!extension) throw new ApiValidationError("Chứng từ chỉ hỗ trợ định dạng PDF, JPG hoặc PNG.");

		const soTienThucNhan = Number(formData.get("soTienThucNhan"));
		const kenhThanhToan = String(formData.get("kenhThanhToan") ?? "").trim();
		const thoiDiemNhan = new Date(String(formData.get("thoiDiemNhan") ?? ""));
		const uploadDirectory = path.join(process.cwd(), "public", "uploads", "chung-tu");
		const fileName = `${randomUUID()}${extension}`;
		const absolutePath = path.join(uploadDirectory, fileName);
		await mkdir(uploadDirectory, { recursive: true });
		await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

		try {
			const chungTu = await capNhatChungTuThanhToan(hoSoId, {
				duongDanFile: `/uploads/chung-tu/${fileName}`,
				soTienThucNhan,
				kenhThanhToan,
				thoiDiemNhan,
			});
			if (!chungTu) {
				await unlink(absolutePath).catch(() => undefined);
				return apiError("Không tìm thấy hồ sơ đặt cọc.", 404);
			}
			return apiSuccess(chungTu);
		} catch (error) {
			await unlink(absolutePath).catch(() => undefined);
			throw error;
		}
	});
}
