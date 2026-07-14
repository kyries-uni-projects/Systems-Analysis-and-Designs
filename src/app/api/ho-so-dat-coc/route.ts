import { NextRequest, NextResponse } from "next/server";
import { layDanhSachHoSoDatCoc } from "@/lib/services/hoSoDatCocService";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const role = searchParams.get("role") || "nhanvien";
		const search = searchParams.get("search") || undefined;
		const trangThai = searchParams.get("trangThai") || undefined;

		const data = await layDanhSachHoSoDatCoc(role, search, trangThai);

		return NextResponse.json({ success: true, data });
	} catch (error) {
		console.error("Lỗi lấy danh sách hồ sơ đặt cọc:", error);
		return NextResponse.json({ success: false, error: "Lỗi máy chủ nội bộ" }, { status: 500 });
	}
}
