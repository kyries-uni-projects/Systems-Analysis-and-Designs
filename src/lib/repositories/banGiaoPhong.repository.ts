import type { Prisma } from "@prisma/client";
import { prisma, type Db } from "@/lib/prisma";
import type { TaiSanBanGiaoInput } from "@/types/nhan-phong";

export const TRANG_THAI_CHO_BAN_GIAO = "Cho ban giao";
export const TRANG_THAI_DANG_THUE = "Dang thue";
export const TRANG_THAI_HOAN_TAT = "Hoan tat";
export const TRANG_THAI_DANG_SU_DUNG = "Dang su dung";

const TRANG_THAI_HO_SO_DU_DIEU_KIEN = [TRANG_THAI_CHO_BAN_GIAO, TRANG_THAI_DANG_THUE];

const banGiaoInclude = {
	hoSoDatCoc: { include: { khachHang: true } },
	thanhVienLuuTrus: true,
	hopDong: {
		include: {
			khachHang: true,
			chiTietHopDongs: {
				include: { phong: true, giuong: true },
				orderBy: { chiTietHopDongId: "asc" },
			},
			khoanThuDauKys: true,
			bienBanBanGiao: true,
		},
	},
} as const;

export type HoSoBanGiaoRecord = Prisma.HoSoNhanPhongGetPayload<{ include: typeof banGiaoInclude }>;

const dieuKienChoBanGiao = {
	trangThai: { in: TRANG_THAI_HO_SO_DU_DIEU_KIEN },
	hopDong: {
		is: {
			trangThai: "Da ky",
			bienBanBanGiao: { is: null },
			khoanThuDauKys: { some: { trangThai: "Da thu" } },
		},
	},
} satisfies Prisma.HoSoNhanPhongWhereInput;

export async function layDanhSachChoBanGiao(tuKhoa?: string, db: Db = prisma) {
	const keyword = tuKhoa?.trim();
	return db.hoSoNhanPhong.findMany({
		where: {
			...dieuKienChoBanGiao,
			...(keyword
				? {
						OR: [
							{ maHoSoNhanPhong: { contains: keyword } },
							{ hoSoDatCoc: { khachHang: { hoTen: { contains: keyword } } } },
						],
					}
				: {}),
		},
		include: banGiaoInclude,
		orderBy: { ngayTao: "asc" },
	});
}

export async function demSoHoSoChoBanGiao(db: Db = prisma) {
	return db.hoSoNhanPhong.count({ where: dieuKienChoBanGiao });
}

export async function docHoSoBanGiaoTheoMa(maHoSoNhanPhong: string, db: Db = prisma) {
	return db.hoSoNhanPhong.findUnique({
		where: { maHoSoNhanPhong },
		include: banGiaoInclude,
	});
}

export async function layDanhSachTaiSanMacDinhDangDung(db: Db = prisma) {
	return db.taiSanMacDinh.findMany({
		where: { trangThai: { in: ["Dang dung", "Đang dùng"] } },
		orderBy: { idTaiSanMacDinh: "asc" },
	});
}

export async function kiemTraTonTaiBienBanTheoHopDong(hopDongId: number, db: Db = prisma) {
	return (await db.bienBanBanGiao.count({ where: { hopDongId } })) > 0;
}

export async function themBienBanBanGiao(
	hopDongId: number,
	quanLyId: number,
	ngayBanGiao: Date,
	db: Db = prisma,
) {
	return db.bienBanBanGiao.create({
		data: {
			hopDongId,
			quanLyId,
			xacNhanKyKhach: "Da ky",
			trangThai: "Hoan tat",
			ngayBanGiao,
		},
	});
}

export async function themNhieuTaiSanBanGiao(
	bienBanBanGiaoId: number,
	assets: TaiSanBanGiaoInput[],
	db: Db = prisma,
) {
	return db.taiSanBanGiao.createMany({
		data: assets.map((asset) => ({
			bienBanBanGiaoId,
			idTaiSanMacDinh: asset.assetId,
			soLuong: asset.quantity,
			tinhTrang: asset.note?.trim() ? "Co loi" : "Tot",
			ghiChu: asset.note?.trim() || null,
		})),
	});
}

export async function capNhatTrangThaiPhong(phongIds: number[], db: Db = prisma) {
	if (phongIds.length === 0) return { count: 0 };
	return db.phong.updateMany({
		where: { phongId: { in: phongIds } },
		data: { trangThai: TRANG_THAI_DANG_SU_DUNG },
	});
}

export async function capNhatTrangThaiGiuong(giuongIds: number[], db: Db = prisma) {
	if (giuongIds.length === 0) return { count: 0 };
	return db.giuong.updateMany({
		where: { giuongId: { in: giuongIds } },
		data: { trangThai: TRANG_THAI_DANG_SU_DUNG },
	});
}
