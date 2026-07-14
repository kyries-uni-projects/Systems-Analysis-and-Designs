import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/auth";
import type { CreateYeuCauThueInput } from "@/types/yeu-cau-thue";

type TiepNhanVien = {
	username: string;
	name: string;
	role: Role;
};

function matchesAmenities(roomAmenities: string | null, requestedAmenities: string[]) {
	if (requestedAmenities.length === 0) return true;
	const amenities = (roomAmenities ?? "").toLocaleLowerCase("vi-VN");
	return requestedAmenities.every((item) => amenities.includes(item.toLocaleLowerCase("vi-VN")));
}

export async function createYeuCauThue(input: CreateYeuCauThueInput, tiepNhanVien: TiepNhanVien) {
	const rooms = await prisma.phong.findMany({
		where: {
			trangThai: "Trống",
			...(input.khuVucMongMuon ? { khu: input.khuVucMongMuon } : {}),
			sucChua: { gte: input.soNguoiDuKien },
			loaiPhong: {
				donGia: {
					...(input.mucGiaTu !== undefined ? { gte: input.mucGiaTu } : {}),
					...(input.mucGiaDen !== undefined ? { lte: input.mucGiaDen } : {}),
				},
			},
			...(input.loaiThue === "Thuê giường" ? { giuongs: { some: { trangThai: "Trống" } } } : {}),
		},
		include: { loaiPhong: true, giuongs: true },
		orderBy: { maPhong: "asc" },
	});

	const phongPhuHop = rooms
		.filter((room) => (!room.gioiTinhApDung || room.gioiTinhApDung === input.gioiTinh) && matchesAmenities(room.tienIch, input.tieuChiUuTien))
		.map((room) => ({
			phongId: room.phongId,
			maPhong: room.maPhong,
			khu: room.khu,
			tang: room.tang,
			sucChua: room.sucChua,
			loaiPhong: room.loaiPhong.tenLoaiPhong,
			donGia: room.loaiPhong.donGia,
			tienIch: room.tienIch,
			soGiuongTrong: room.giuongs.filter((bed) => bed.trangThai === "Trống").length,
		}));

	const result = await prisma.$transaction(async (transaction) => {
		const khachHang = await transaction.khachHang.upsert({
			where: { cccdPassport: input.cccdPassport },
			update: {
				hoTen: input.hoTen,
				gioiTinh: input.gioiTinh,
				quocTich: input.quocTich,
				soDienThoai: input.soDienThoai,
				email: input.email,
				ghiChu: input.ghiChu,
			},
			create: {
				hoTen: input.hoTen,
				cccdPassport: input.cccdPassport,
				gioiTinh: input.gioiTinh,
				quocTich: input.quocTich,
				soDienThoai: input.soDienThoai,
				email: input.email,
				ghiChu: input.ghiChu,
			},
		});

		const nhanVien = await transaction.nguoiDung.upsert({
			where: { tenDangNhap: tiepNhanVien.username },
			update: {},
			create: {
				hoTen: tiepNhanVien.name,
				tenDangNhap: tiepNhanVien.username,
				matKhauHash: "session-authenticated",
				vaiTro: tiepNhanVien.role === "nhanvien" ? "Sale" : tiepNhanVien.role,
			},
		});

		return transaction.yeuCauThue.create({
			data: {
				khachHangId: khachHang.khachHangId,
				nhanVienId: nhanVien.nguoiDungId,
				loaiThue: input.loaiThue,
				khuVucMongMuon: input.khuVucMongMuon,
				soNguoiDuKien: input.soNguoiDuKien,
				mucGiaMongMuon: input.mucGiaDen,
				thoiGianDuKienVaoO: input.thoiGianDuKienVaoO,
				thoiHanThueThang: input.thoiHanThueThang,
				tieuChiUuTien: JSON.stringify({ tienIch: input.tieuChiUuTien, mucGiaTu: input.mucGiaTu, mucGiaDen: input.mucGiaDen }),
			},
			select: { yeuCauId: true, trangThai: true },
		});
	});

	return { yeuCau: result, phongPhuHop };
}
