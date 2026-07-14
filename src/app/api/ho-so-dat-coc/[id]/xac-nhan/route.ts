import { NextRequest, NextResponse } from "next/server";
import { xacNhanDieuKienSale, xacNhanTinhTrangQuanLy } from "@/lib/services/hoSoDatCocService";
import { SESSION_USER_COOKIE_NAME, demoAccounts } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const hoSoId = parseInt(id, 10);
		if (isNaN(hoSoId)) {
			return NextResponse.json({ success: false, error: "ID hồ sơ không hợp lệ" }, { status: 400 });
		}

		const username = request.cookies.get(SESSION_USER_COOKIE_NAME)?.value;
		const account = username ? demoAccounts[username] : null;

		if (!account) {
			return NextResponse.json({ success: false, error: "Chưa xác thực" }, { status: 401 });
		}

		const body = await request.json();
		const { ketQuaKiemTra, lyDoTuChoi } = body;
		const nguoiDung = await prisma.nguoiDung.upsert({
			where: { tenDangNhap: username },
			update: {},
			create: {
				hoTen: account.name,
				tenDangNhap: username,
				matKhauHash: "demo-session-account",
				vaiTro: account.role,
			},
		});

		if (account.role === "nhanvien") {
			await xacNhanDieuKienSale(hoSoId, nguoiDung.nguoiDungId, ketQuaKiemTra || [], lyDoTuChoi);
			return NextResponse.json({ success: true, message: "Đã gửi yêu cầu xác nhận lên Quản lý" });
		} else if (account.role === "quanly") {
			await xacNhanTinhTrangQuanLy(hoSoId, nguoiDung.nguoiDungId, lyDoTuChoi);
			return NextResponse.json({ success: true, message: "Đã xác nhận tình trạng phòng" });
		} else {
			return NextResponse.json({ success: false, error: "Tài khoản không có quyền thao tác" }, { status: 403 });
		}
	} catch (error) {
		console.error("Lỗi xác nhận hồ sơ đặt cọc:", error);
		return NextResponse.json({ success: false, error: "Lỗi máy chủ nội bộ" }, { status: 500 });
	}
}
