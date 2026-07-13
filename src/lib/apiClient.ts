// src/lib/apiClient.ts
// (Nhóm 4) Helper gọi fetch dùng trong các component "use client" — KHÔNG import
// next/headers hay Prisma ở đây (file này chạy trong trình duyệt).
// Đọc đúng shape response chuẩn của cả app: { success: true, data } hoặc
// { success: false, error, details? } (xem src/lib/api-response.ts).
export class ApiError extends Error {}

type ApiEnvelope<T> = { success: true; data: T } | { success: false; error: string; details?: unknown };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
	const res = await fetch(url, {
		...init,
		headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
	});
	const body = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;

	if (!res.ok || !body || body.success === false) {
		const message = body && body.success === false ? body.error : `Lỗi ${res.status}`;
		throw new ApiError(message);
	}
	return body.data;
}

export const api = {
	get: <T>(url: string) => request<T>(url),
	post: <T>(url: string, body?: unknown) =>
		request<T>(url, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
};
