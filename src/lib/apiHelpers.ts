// src/lib/apiHelpers.ts
// (Nhóm 4) Helper dùng chung cho các route "/api/tra-phong/[maHoSo]/..." — mọi route con
// chỉ nhận đúng 1 khóa (maHoSo dạng hiển thị "TRP-2025-000045") trên URL, tự parse ra khóa
// thật (yeuCauTraPhongId) để truy vấn.
import { NextResponse } from "next/server";
import { parseMaHoSo } from "./maHoSo";
import { apiError } from "./api-response";

export function parseMaHoSoOrError(maHoSoParam: string): { id: number } | { error: NextResponse } {
	const id = parseMaHoSo(decodeURIComponent(maHoSoParam));
	if (id == null) {
		return { error: apiError(`Mã hồ sơ không hợp lệ: "${maHoSoParam}".`, 400) };
	}
	return { id };
}
