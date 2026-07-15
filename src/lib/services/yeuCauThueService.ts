import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/auth";
import type { CreateYeuCauThueInput } from "@/types/yeu-cau-thue";

type TiepNhanVien = {
	username: string;
	name: string;
	role: Role;
};

export type TieuChiTimPhong = {
	loaiThue: string;
	khuVucMongMuon?: string | null;
	soNguoiDuKien: number;
	mucGiaTu?: number;
	mucGiaDen?: number;
	gioiTinh?: string | null;
	tieuChiUuTien: string[];
};

const TRANG_THAI_HO_SO_DANG_GIU_CHO = [
	"Chờ xác nhận quản lý",
	"Đã xác nhận điều kiện",
	"Chờ thanh toán",
	"Chờ xác nhận thanh toán",
	"Đã xác nhận thanh toán",
];

function normalizeArea(value: string | null | undefined) {
	return (value ?? "")
		.trim()
		.replace(/^khu\s+/iu, "")
		.toLocaleLowerCase("vi-VN");
}

export async function timPhongPhuHopTheoTieuChi(input: TieuChiTimPhong) {
	const rooms = await prisma.phong.findMany({
		where: {
			trangThai: { in: ["Trống", "Còn giường trống", "DANG_HOAT_DONG", "Đang hoạt động"] },
			sucChua: { gte: input.soNguoiDuKien },
			loaiPhong: {
				donGia: {
					...(input.mucGiaTu !== undefined ? { gte: input.mucGiaTu } : {}),
					...(input.mucGiaDen !== undefined ? { lte: input.mucGiaDen } : {}),
				},
			},
		},
		include: {
			loaiPhong: true,
			giuongs: true,
			chiTietDatCocs: {
				where: { hoSoDatCoc: { trangThai: { in: TRANG_THAI_HO_SO_DANG_GIU_CHO } } },
				select: { giuongId: true },
			},
			chiTietHopDongs: {
				where: { trangThai: { notIn: ["Đã trả", "Đã thanh lý", "Hoàn tất"] } },
				select: { giuongId: true },
			},
		},
		orderBy: { maPhong: "asc" },
	});

	const requestedArea = normalizeArea(input.khuVucMongMuon);
	const thueTheoGiuong = input.loaiThue.toLocaleLowerCase("vi-VN").includes("giường");

	return rooms
		.filter((room) => !requestedArea || normalizeArea(room.khu) === requestedArea)
		.filter(
			(room) =>
				!room.gioiTinhApDung ||
				!input.gioiTinh ||
				room.gioiTinhApDung.toLocaleLowerCase("vi-VN") === input.gioiTinh.toLocaleLowerCase("vi-VN"),
		)
		.filter((room) => matchesAmenities(room.tienIch, input.tieuChiUuTien))
		.filter((room) => {
			const wholeRoomHeld = room.chiTietDatCocs.some((deposit) => deposit.giuongId === null);
			const wholeRoomOccupied = room.chiTietHopDongs.some((contract) => contract.giuongId === null);
			if (wholeRoomHeld || wholeRoomOccupied) return false;
			const heldBedIds = new Set(room.chiTietDatCocs.flatMap((deposit) => (deposit.giuongId ? [deposit.giuongId] : [])));
			const occupiedBedIds = new Set(room.chiTietHopDongs.flatMap((contract) => (contract.giuongId ? [contract.giuongId] : [])));
			const availableBeds = room.giuongs.filter((bed) => bed.trangThai === "Trống" && !heldBedIds.has(bed.giuongId) && !occupiedBedIds.has(bed.giuongId));
			if (thueTheoGiuong) return availableBeds.length >= input.soNguoiDuKien;
			return room.chiTietHopDongs.length === 0 && room.giuongs.every((bed) => bed.trangThai === "Trống" && !heldBedIds.has(bed.giuongId));
		})
		.map((room) => {
			const unavailableBedIds = new Set([
				...room.chiTietDatCocs.flatMap((deposit) => (deposit.giuongId ? [deposit.giuongId] : [])),
				...room.chiTietHopDongs.flatMap((contract) => (contract.giuongId ? [contract.giuongId] : [])),
			]);
			return {
			phongId: room.phongId,
			maPhong: room.maPhong,
			khu: room.khu,
			tang: room.tang,
			sucChua: room.sucChua,
			loaiPhong: room.loaiPhong.tenLoaiPhong,
			donGia: room.loaiPhong.donGia,
			tienIch: room.tienIch,
			soGiuongTrong: room.giuongs.filter((bed) => bed.trangThai === "Trống" && !unavailableBedIds.has(bed.giuongId)).length,
			};
		});
}

function matchesAmenities(roomAmenities: string | null, requestedAmenities: string[]) {
	if (requestedAmenities.length === 0) return true;
	const amenities = (roomAmenities ?? "").toLocaleLowerCase("vi-VN");
	return requestedAmenities.every((item) => amenities.includes(item.toLocaleLowerCase("vi-VN")));
}

export async function createYeuCauThue(input: CreateYeuCauThueInput, tiepNhanVien: TiepNhanVien) {
	const phongPhuHop = await timPhongPhuHopTheoTieuChi(input);

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
