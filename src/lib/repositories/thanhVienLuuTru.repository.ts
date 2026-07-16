import { prisma, type Db } from "@/lib/prisma";

export async function demTheoHoSoNhanPhong(hoSoNhanPhongId: number, db: Db = prisma) {
	return db.thanhVienLuuTru.count({ where: { hoSoNhanPhongId } });
}

export async function kiemTraTonTaiSoGiayTo(hoSoNhanPhongId: number, soGiayTo: string, db: Db = prisma) {
	const count = await db.thanhVienLuuTru.count({
		where: {
			hoSoNhanPhongId,
			soGiayTo,
			trangThaiThamGia: "THAM_GIA",
		},
	});

	return count > 0;
}

export async function xoaTheoHoSoNhanPhong(hoSoNhanPhongId: number, db: Db = prisma) {
	return db.thanhVienLuuTru.deleteMany({ where: { hoSoNhanPhongId } });
}

export async function themNhieu(
	hoSoNhanPhongId: number,
	chiTietDatCocId: number,
	nguoiXacMinhId: number,
	members: {
		hoTen: string;
		soGiayTo: string;
		gioiTinh: string;
		soDienThoai: string;
		laNguoiDaiDien: boolean;
		daXacMinhGiayTo: boolean;
	}[],
	db: Db = prisma,
) {
	if (members.length === 0) return { count: 0 };

	return db.thanhVienLuuTru.createMany({
		data: members.map((member, index) => ({
			hoSoNhanPhongId,
			chiTietDatCocId,
			sttThanhVien: index + 1,
			hoTen: member.hoTen,
			gioiTinh: member.gioiTinh,
			loaiGiayTo: "CCCD",
			soGiayTo: member.soGiayTo,
			soDienThoai: member.soDienThoai,
			laNguoiDaiDien: member.laNguoiDaiDien,
			daXacMinhGiayTo: member.daXacMinhGiayTo,
			nguoiXacMinhId: member.daXacMinhGiayTo ? nguoiXacMinhId : null,
			thoiDiemXacMinh: member.daXacMinhGiayTo ? new Date() : null,
			trangThaiThamGia: "THAM_GIA",
		})),
	});
}

export async function layTheoHoSoNhanPhong(hoSoNhanPhongId: number, db: Db = prisma) {
	return db.thanhVienLuuTru.findMany({
		where: { hoSoNhanPhongId },
		orderBy: { sttThanhVien: "asc" },
	});
}

export async function capNhatKetQua(
	thanhVienLuuTruId: number,
	ketQuaDieuKien: string,
	lyDoKhongDat: string | null,
	db: Db = prisma,
) {
	return db.thanhVienLuuTru.update({
		where: { thanhVienLuuTruId },
		data: { ketQuaDieuKien, lyDoKhongDat },
	});
}

export async function capNhatTrangThaiThamGia(thanhVienLuuTruId: number, trangThaiThamGia: string, db: Db = prisma) {
	return db.thanhVienLuuTru.update({
		where: { thanhVienLuuTruId },
		data: { trangThaiThamGia },
	});
}
