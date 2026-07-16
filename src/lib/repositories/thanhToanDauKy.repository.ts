import type { Prisma } from "@prisma/client";
import { prisma, type Db } from "@/lib/prisma";
import type { ThanhToanKhoanThu } from "@/types/nhan-phong";

const hopDongThanhToanInclude = {
	khachHang: true,
	hoSoNhanPhong: {
		include: {
			hoSoDatCoc: true,
		},
	},
	chiTietHopDongs: {
		include: {
			phong: true,
			giuong: true,
			chiTietDatCoc: true,
		},
		orderBy: { chiTietHopDongId: "asc" },
	},
	khoanPhiHopDongs: {
		include: {
			khoanPhiDichVu: true,
		},
		orderBy: { idKhoanPhiHopDong: "asc" },
	},
	khoanThuDauKys: true,
} as const;

export type HopDongThanhToanRecord = Prisma.HopDongGetPayload<{ include: typeof hopDongThanhToanInclude }>;

export async function layHopDongDaKyTheoHoSo(hoSoNhanPhongId: number, db: Db = prisma) {
	return db.hopDong.findUnique({
		where: { hoSoNhanPhongId },
		include: hopDongThanhToanInclude,
	});
}

export async function kiemTraDaThanhToan(hopDongId: number, db: Db = prisma) {
	const count = await db.khoanThuDauKy.count({
		where: {
			hopDongId,
			trangThai: "Da thu",
		},
	});
	return count > 0;
}

export async function luuDanhSachDaThu(
	hopDongId: number,
	keToanId: number,
	charges: ThanhToanKhoanThu[],
	phuongThucThu = "Tien mat",
	db: Db = prisma,
) {
	const thoiDiemThu = new Date();
	return db.khoanThuDauKy.createMany({
		data: charges.map((charge) => ({
			hopDongId,
			tenKhoan: charge.label,
			soTien: charge.amount,
			trangThai: "Da thu",
			keToanId,
			thoiDiemThu,
			phuongThucThu,
			idKhoanPhiHopDong: charge.khoanPhiHopDongId ?? null,
		})),
	});
}
