import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/lib/api-auth";
import { ensureDemoAccounts } from "@/lib/demo-account-seed";

/** Admin-only, idempotent demo-data helper. The full fixture remains available through `yarn db:seed`. */
export async function POST(request: NextRequest) {
	const auth = await requireApiSession(request, ["admin"]);
	if ("error" in auth) return auth.error;

	try {
		const ngayBatDauDuKien = new Date();
		ngayBatDauDuKien.setHours(0, 0, 0, 0);
		ngayBatDauDuKien.setDate(ngayBatDauDuKien.getDate() + 7);
		const ngayKetThucDuKien = new Date(ngayBatDauDuKien);
		ngayKetThucDuKien.setMonth(ngayKetThucDuKien.getMonth() + 6);

		// 1. Seed QuyDinhKyTucXa
		const quyDinhs = [
			{ maQuyDinh: "QD_GT", tenQuyDinh: "Giới tính phù hợp khu vực", nhomQuyDinh: "DatCoc" },
			{ maQuyDinh: "QD_QT", tenQuyDinh: "Quốc tịch hợp lệ", nhomQuyDinh: "DatCoc" },
			{ maQuyDinh: "QD_CCCD", tenQuyDinh: "Giấy tờ tùy thân hợp lệ", nhomQuyDinh: "DatCoc" },
			{ maQuyDinh: "QD_TC", tenQuyDinh: "Khả năng tài chính đáp ứng", nhomQuyDinh: "DatCoc" },
			{ maQuyDinh: "QD_UT", tenQuyDinh: "Đáp ứng tiêu chí ưu tiên", nhomQuyDinh: "DatCoc" },
		];

		for (const qd of quyDinhs) {
			await prisma.quyDinhKyTucXa.upsert({
				where: { maQuyDinh: qd.maQuyDinh },
				update: {},
				create: {
					...qd,
					noiDung: qd.tenQuyDinh,
					batBuoc: true,
					trangThai: "Dang ap dung",
				},
			});
		}

		// 2. Ensure a Customer exists
		const khachHang = await prisma.khachHang.upsert({
			where: { cccdPassport: "079201012345" },
			update: {},
			create: {
				hoTen: "Trần Thị Bình",
				cccdPassport: "079201012345",
				gioiTinh: "Nữ",
				quocTich: "Việt Nam",
				soDienThoai: "0901234567",
				email: "binhtt@email.com",
			},
		});

		// 3. Ensure all preset login accounts exist in the database.
		const { nhanvien01: sale } = await ensureDemoAccounts(prisma);

		// 4. Ensure a Room type and Room exists
		const loaiPhong = await prisma.loaiPhong.upsert({
			where: { tenLoaiPhong: "Phòng giường tầng Nữ" },
			update: {},
			create: {
				tenLoaiPhong: "Phòng giường tầng Nữ",
				donGia: 1500000,
			},
		});

		const phong = await prisma.phong.upsert({
			where: { maPhong: "A105" },
			update: {},
			create: {
				maPhong: "A105",
				khu: "Khu A",
				tang: 1,
				idLoaiPhong: loaiPhong.idLoaiPhong,
				sucChua: 4,
				gioiTinhApDung: "Nữ",
				tienIch: "Máy lạnh, tủ lạnh",
				trangThai: "Trống",
			},
		});

		const giuong = await prisma.giuong.upsert({
			where: {
				phongId_maGiuongLocal: {
					phongId: phong.phongId,
					maGiuongLocal: "2",
				},
			},
			update: {},
			create: {
				phongId: phong.phongId,
				maGiuongLocal: "2",
				trangThai: "Trống",
			},
		});

		// 5. Ensure a YeuCauThue exists
		let yeuCauThue = await prisma.yeuCauThue.findFirst({
			where: { khachHangId: khachHang.khachHangId },
		});
		if (!yeuCauThue) {
			yeuCauThue = await prisma.yeuCauThue.create({
				data: {
					khachHangId: khachHang.khachHangId,
					nhanVienId: sale.nguoiDungId,
					loaiThue: "Thuê giường",
					khuVucMongMuon: "Khu A - Nữ",
					soNguoiDuKien: 2,
					thoiGianDuKienVaoO: ngayBatDauDuKien,
				},
			});
		} else {
			yeuCauThue = await prisma.yeuCauThue.update({
				where: { yeuCauId: yeuCauThue.yeuCauId },
				data: { thoiGianDuKienVaoO: ngayBatDauDuKien },
			});
		}

		// 6. Ensure HoSoDatCoc exists
		let hoSoDatCoc = await prisma.hoSoDatCoc.findFirst({
			where: { khachHangId: khachHang.khachHangId },
		});
		if (!hoSoDatCoc) {
			hoSoDatCoc = await prisma.hoSoDatCoc.create({
				data: {
					maHoSoDatCoc: "HSDC-0001",
					yeuCauId: yeuCauThue.yeuCauId,
					khachHangId: khachHang.khachHangId,
					hinhThucThue: "Thuê giường",
					nhanVienId: sale.nguoiDungId,
					ngayBatDauDuKien,
					ngayKetThucDuKien,
					trangThai: "Chờ xác nhận điều kiện",
					chiTietDatCocs: {
						create: {
							phongId: phong.phongId,
							giuongId: giuong.giuongId,
							giaThueThoaThuan: loaiPhong.donGia,
							soGiuongQuyDoi: 1,
							tienCocPhanBo: loaiPhong.donGia * 2,
						},
					},
				},
			});
		} else {
			hoSoDatCoc = await prisma.hoSoDatCoc.update({
				where: { hoSoDatCocId: hoSoDatCoc.hoSoDatCocId },
				data: { ngayBatDauDuKien, ngayKetThucDuKien },
			});
		}

		return NextResponse.json({ success: true, hoSoDatCocId: hoSoDatCoc.hoSoDatCocId });
	} catch (error) {
		return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
	}
}
