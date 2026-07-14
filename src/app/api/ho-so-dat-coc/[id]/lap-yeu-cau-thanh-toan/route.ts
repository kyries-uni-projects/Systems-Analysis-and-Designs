import { NextRequest, NextResponse } from "next/server";
import { lapYeuCauThanhToanCoc } from "@/lib/services/hoSoDatCocService";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const hoSoId = parseInt(id, 10);
		if (isNaN(hoSoId)) {
			return NextResponse.json({ success: false, error: "ID không hợp lệ" }, { status: 400 });
		}

		const body = await request.json();
		const { keToanId } = body;

		const result = await lapYeuCauThanhToanCoc(hoSoId, keToanId ?? 1);
		return NextResponse.json({ success: true, data: result });
	} catch (error) {
		console.error("Lỗi lập yêu cầu thanh toán:", error);
		return NextResponse.json(
			{ success: false, error: error instanceof Error ? error.message : "Lỗi máy chủ" },
			{ status: 500 },
		);
	}
}
