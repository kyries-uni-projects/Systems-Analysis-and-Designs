import { NextRequest, NextResponse } from "next/server";
import { layChiTietHoSoDatCoc, layDanhSachQuyDinhDatCoc, kiemTraTinhTrangPhong } from "@/lib/services/hoSoDatCocService";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const hoSoId = parseInt(id, 10);
		if (isNaN(hoSoId)) {
			return NextResponse.json({ success: false, error: "ID hồ sơ không hợp lệ" }, { status: 400 });
		}

		const hoSo = await layChiTietHoSoDatCoc(hoSoId);
		if (!hoSo) {
			return NextResponse.json({ success: false, error: "Không tìm thấy hồ sơ đặt cọc" }, { status: 404 });
		}

		// Lấy phong/giuong từ chiTietDatCocs[0] để backward compat
		const ct = hoSo.chiTietDatCocs?.[0];
		const phongId = ct?.phongId ?? null;
		const giuongId = ct?.giuongId ?? null;

		// Flatten phong/giuong lên hoSo cho các form cũ
		const hoSoFlat = {
			...hoSo,
			phong: ct?.phong ?? null,
			giuong: ct?.giuong ?? null,
			phongId,
			giuongId,
		};

		// Nếu trạng thái là "Chờ xác nhận điều kiện" -> Lấy danh sách quy định cho Sale
		let quyDinhList = null;
		if (hoSo.trangThai === "Chờ xác nhận điều kiện" || hoSo.trangThai === "Mới tạo") {
			quyDinhList = await layDanhSachQuyDinhDatCoc();
		}

		// Nếu trạng thái là "Chờ xác nhận quản lý" -> Lấy kết quả check tình trạng phòng
		let tinhTrangPhong = null;
		if (hoSo.trangThai === "Chờ xác nhận quản lý" && phongId) {
			tinhTrangPhong = await kiemTraTinhTrangPhong(phongId, giuongId);
		}

		return NextResponse.json({
			success: true,
			data: {
				hoSo: hoSoFlat,
				quyDinhList,
				tinhTrangPhong
			}
		});
	} catch (error) {
		console.error("Lỗi lấy chi tiết hồ sơ đặt cọc:", error);
		return NextResponse.json(
			{ success: false, error: "Lỗi máy chủ nội bộ" },
			{ status: 500 }
		);
	}
}
