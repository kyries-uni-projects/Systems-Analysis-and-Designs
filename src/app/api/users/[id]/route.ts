import type { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess, ApiValidationError, withApiErrorHandling } from "@/lib/api-response";
import { requireApiSession } from "@/lib/api-auth";
import { capNhatNguoiDung, doiTrangThaiNguoiDung, xoaNguoiDung } from "@/lib/services/nguoiDung.service";
import { parseUserManagementInput } from "@/lib/user-management-input";
import type { AuthenticatedSession } from "@/lib/session";

async function authorizeAndParseId(request: NextRequest, params: Promise<{ id: string }>): Promise<{ error: NextResponse } | { auth: AuthenticatedSession; userId: number }> {
	const auth = await requireApiSession(request, ["admin"]);
	if ("error" in auth) return { error: auth.error };
	const userId = Number((await params).id);
	if (!Number.isInteger(userId) || userId < 1) return { error: apiError("ID người dùng không hợp lệ.", 400) };
	return { auth: auth.user, userId };
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withApiErrorHandling(async () => {
		const access = await authorizeAndParseId(request, params);
		if ("error" in access) return access.error;
		const input = parseUserManagementInput((await request.json()) as Record<string, unknown>, "update");
		const user = await capNhatNguoiDung(access.userId, input, access.auth.userId);
		if (!user) return apiError("Không tìm thấy người dùng.", 404);
		return apiSuccess(user);
	});
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withApiErrorHandling(async () => {
		const access = await authorizeAndParseId(request, params);
		if ("error" in access) return access.error;
		const body = (await request.json()) as Record<string, unknown>;
		if (typeof body.active !== "boolean") throw new ApiValidationError("Trạng thái tài khoản không hợp lệ.");
		const user = await doiTrangThaiNguoiDung(access.userId, body.active, access.auth.userId);
		if (!user) return apiError("Không tìm thấy người dùng.", 404);
		return apiSuccess(user);
	});
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withApiErrorHandling(async () => {
		const access = await authorizeAndParseId(request, params);
		if ("error" in access) return access.error;
		const result = await xoaNguoiDung(access.userId, access.auth.userId);
		if (!result) return apiError("Không tìm thấy người dùng.", 404);
		return apiSuccess(result);
	});
}
