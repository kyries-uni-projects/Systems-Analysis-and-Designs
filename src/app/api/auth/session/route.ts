import { NextRequest, NextResponse } from "next/server";
import { roleLabels } from "@/lib/auth";
import { getRequestSession } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
	const account = await getRequestSession(request);
	if (!account) {
		return NextResponse.json({ error: "Phiên đăng nhập không hợp lệ." }, { status: 401 });
	}

	return NextResponse.json({ name: account.name, role: account.role, position: roleLabels[account.role] });
}
