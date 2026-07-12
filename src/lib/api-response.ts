import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

/**
 * Shared helpers for building consistent JSON responses from Next.js
 * Route Handlers (src/app/api/**\/route.ts), plus lightweight error types
 * that the service layer can throw and this module knows how to translate
 * into the right HTTP status code.
 */

export function apiSuccess<T>(data: T, status = 200) {
	return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400, details?: unknown) {
	return NextResponse.json({ success: false, error: message, details }, { status });
}

export class ApiValidationError extends Error {
	details?: unknown;

	constructor(message: string, details?: unknown) {
		super(message);
		this.name = "ApiValidationError";
		this.details = details;
	}
}

export class ApiNotFoundError extends Error {
	constructor(message = "Không tìm thấy dữ liệu") {
		super(message);
		this.name = "ApiNotFoundError";
	}
}

/**
 * Wrap a Route Handler body so services can just `throw` and callers don't
 * need to repeat try/catch + status-code mapping in every route.
 *
 * Usage:
 *   export async function GET(request: NextRequest) {
 *     return withApiErrorHandling(async () => {
 *       const data = await someService.list();
 *       return apiSuccess(data);
 *     });
 *   }
 */
export async function withApiErrorHandling(handler: () => Promise<NextResponse>): Promise<NextResponse> {
	try {
		return await handler();
	} catch (error) {
		if (error instanceof ApiValidationError) {
			return apiError(error.message, 400, error.details);
		}

		if (error instanceof ApiNotFoundError) {
			return apiError(error.message, 404);
		}

		if (error instanceof SyntaxError) {
			return apiError("Nội dung request không phải JSON hợp lệ", 400);
		}

		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === "P2002") {
				const target = (error.meta?.target as string[] | undefined)?.join(", ") ?? "trường dữ liệu";
				return apiError(`Dữ liệu bị trùng: ${target}`, 409);
			}
			if (error.code === "P2025") {
				return apiError("Không tìm thấy bản ghi để cập nhật/xóa", 404);
			}
			if (error.code === "P2003") {
				return apiError("Dữ liệu tham chiếu (khóa ngoại) không hợp lệ", 400);
			}
		}

		console.error("[api-error]", error);
		return apiError("Lỗi hệ thống, vui lòng thử lại sau", 500);
	}
}
