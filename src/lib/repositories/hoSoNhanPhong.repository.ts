import type { Prisma } from "@prisma/client";
import {
	CHECK_IN_READY_STATUSES,
	TRANG_THAI_CHO_DUYET_DIEU_KIEN_LUU_TRU,
	TRANG_THAI_CHO_KY_HOP_DONG,
	TRANG_THAI_CHO_THANH_TOAN_DAU_KY,
} from "@/lib/nhan-phong-rules";
import { prisma, type Db } from "@/lib/prisma";

const checkInInclude = {
	khachHang: true,
	chiTietDatCocs: {
		include: {
			phong: true,
			giuong: true,
		},
		orderBy: { chiTietDatCocId: "asc" },
	},
	hoSoNhanPhong: {
		include: {
			thanhVienLuuTrus: {
				orderBy: { sttThanhVien: "asc" },
			},
		},
	},
} as const;

export type HoSoDatCocCheckInRecord = Prisma.HoSoDatCocGetPayload<{ include: typeof checkInInclude }>;

export async function layDanhSachChoNhanPhong(tuKhoa?: string, db: Db = prisma) {
	const keyword = tuKhoa?.trim();

	return db.hoSoDatCoc.findMany({
		where: {
			trangThai: { in: [...CHECK_IN_READY_STATUSES] },
			ngayHenNhanPhong: { not: null },
			hoSoNhanPhong: { is: null },
			...(keyword
				? {
						OR: [
							{ maHoSoDatCoc: { contains: keyword } },
							{ khachHang: { hoTen: { contains: keyword } } },
							{ khachHang: { soDienThoai: { contains: keyword } } },
						],
					}
				: {}),
		},
		include: checkInInclude,
		orderBy: [{ ngayHenNhanPhong: "asc" }, { gioHenNhanPhong: "asc" }],
	});
}

export {
	TRANG_THAI_CHO_DUYET_DIEU_KIEN_LUU_TRU,
	TRANG_THAI_CHO_KY_HOP_DONG,
	TRANG_THAI_CHO_THANH_TOAN_DAU_KY,
};

export async function demSoHoSoChoNhanPhong(db: Db = prisma) {
	return db.hoSoDatCoc.count({
		where: {
			trangThai: { in: [...CHECK_IN_READY_STATUSES] },
			ngayHenNhanPhong: { not: null },
			hoSoNhanPhong: { is: null },
		},
	});
}

export async function layThongTinChiTiet(maHoSoDatCoc: string, db: Db = prisma) {
	return db.hoSoDatCoc.findUnique({
		where: { maHoSoDatCoc },
		include: checkInInclude,
	});
}

export async function themHoSoNhanPhong(
	data: {
		maHoSoNhanPhong: string;
		hoSoDatCocId: number;
		nhanVienId: number;
		ghiChu?: string | null;
		trangThai: string;
	},
	db: Db = prisma,
) {
	return db.hoSoNhanPhong.create({ data });
}

export async function capNhatTrangThaiHoSoNhanPhong(hoSoNhanPhongId: number, trangThai: string, db: Db = prisma) {
	return db.hoSoNhanPhong.update({
		where: { hoSoNhanPhongId },
		data: { trangThai },
	});
}

export async function kiemTraTonTaiTheoHoSoDatCoc(hoSoDatCocId: number, db: Db = prisma) {
	const count = await db.hoSoNhanPhong.count({ where: { hoSoDatCocId } });
	return count > 0;
}

export async function capNhatThoiGianCuTru(
	hoSoDatCocId: number,
	ngayBatDau: Date,
	ngayKetThuc: Date,
	db: Db = prisma,
) {
	return db.hoSoDatCoc.update({
		where: { hoSoDatCocId },
		data: {
			ngayBatDauDuKien: ngayBatDau,
			ngayKetThucDuKien: ngayKetThuc,
		},
	});
}

export async function tinhSucChuaDaDat(hoSoDatCocId: number, db: Db = prisma) {
	const chiTiet = await db.chiTietDatCoc.findMany({
		where: { hoSoDatCocId },
		select: { soGiuongQuyDoi: true },
	});

	return chiTiet.reduce((total, item) => total + item.soGiuongQuyDoi, 0);
}

const approvalInclude = {
	hoSoDatCoc: {
		include: {
			khachHang: true,
			chiTietDatCocs: true,
		},
	},
	thanhVienLuuTrus: {
		orderBy: { sttThanhVien: "asc" },
	},
	pheDuyetLuuTru: true,
} as const;

export type HoSoNhanPhongApprovalRecord = Prisma.HoSoNhanPhongGetPayload<{ include: typeof approvalInclude }>;

export async function layDanhSachChoDuyet(tuKhoa?: string, db: Db = prisma) {
	const keyword = tuKhoa?.trim();

	return db.hoSoNhanPhong.findMany({
		where: {
			trangThai: TRANG_THAI_CHO_DUYET_DIEU_KIEN_LUU_TRU,
			pheDuyetLuuTru: { is: null },
			...(keyword
				? {
						OR: [
							{ maHoSoNhanPhong: { contains: keyword } },
							{ hoSoDatCoc: { khachHang: { hoTen: { contains: keyword } } } },
						],
					}
				: {}),
		},
		include: approvalInclude,
		orderBy: { ngayTao: "asc" },
	});
}

export async function demSoHoSoChoDuyet(db: Db = prisma) {
	return db.hoSoNhanPhong.count({
		where: {
			trangThai: TRANG_THAI_CHO_DUYET_DIEU_KIEN_LUU_TRU,
			pheDuyetLuuTru: { is: null },
		},
	});
}

export async function docHoSoNhanPhongTheoMa(maHoSoNhanPhong: string, db: Db = prisma) {
	return db.hoSoNhanPhong.findUnique({
		where: { maHoSoNhanPhong },
		include: approvalInclude,
	});
}

const contractInclude = {
	hoSoDatCoc: {
		include: {
			khachHang: true,
			chiTietDatCocs: {
				include: {
					phong: true,
					giuong: true,
				},
				orderBy: { chiTietDatCocId: "asc" },
			},
		},
	},
	thanhVienLuuTrus: {
		orderBy: { sttThanhVien: "asc" },
	},
	hopDong: true,
} as const;

export type HoSoNhanPhongContractRecord = Prisma.HoSoNhanPhongGetPayload<{ include: typeof contractInclude }>;

export async function layDanhSachChoKyHopDong(tuKhoa?: string, db: Db = prisma) {
	const keyword = tuKhoa?.trim();

	return db.hoSoNhanPhong.findMany({
		where: {
			trangThai: TRANG_THAI_CHO_KY_HOP_DONG,
			hopDong: { is: null },
			...(keyword
				? {
						OR: [
							{ maHoSoNhanPhong: { contains: keyword } },
							{ hoSoDatCoc: { khachHang: { hoTen: { contains: keyword } } } },
						],
					}
				: {}),
		},
		include: contractInclude,
		orderBy: { ngayTao: "asc" },
	});
}

export async function demSoHoSoChoKyHopDong(db: Db = prisma) {
	return db.hoSoNhanPhong.count({
		where: {
			trangThai: TRANG_THAI_CHO_KY_HOP_DONG,
			hopDong: { is: null },
		},
	});
}

export async function docHoSoLapHopDongTheoMa(maHoSoNhanPhong: string, db: Db = prisma) {
	return db.hoSoNhanPhong.findUnique({
		where: { maHoSoNhanPhong },
		include: contractInclude,
	});
}

const paymentInclude = {
	hoSoDatCoc: {
		include: {
			khachHang: true,
		},
	},
	hopDong: {
		include: {
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
		},
	},
} as const;

export type HoSoNhanPhongPaymentRecord = Prisma.HoSoNhanPhongGetPayload<{ include: typeof paymentInclude }>;

export async function layDanhSachChoThanhToan(tuKhoa?: string, db: Db = prisma) {
	const keyword = tuKhoa?.trim();

	return db.hoSoNhanPhong.findMany({
		where: {
			trangThai: TRANG_THAI_CHO_THANH_TOAN_DAU_KY,
			hopDong: { is: { trangThai: "Da ky" } },
			...(keyword
				? {
						OR: [
							{ maHoSoNhanPhong: { contains: keyword } },
							{ hoSoDatCoc: { khachHang: { hoTen: { contains: keyword } } } },
							{ hopDong: { maHopDong: { contains: keyword } } },
						],
					}
				: {}),
		},
		include: paymentInclude,
		orderBy: { ngayTao: "asc" },
	});
}

export async function demSoHoSoChoThanhToan(db: Db = prisma) {
	return db.hoSoNhanPhong.count({
		where: {
			trangThai: TRANG_THAI_CHO_THANH_TOAN_DAU_KY,
			hopDong: { is: { trangThai: "Da ky" } },
		},
	});
}

export async function docHoSoThanhToanTheoMa(maHoSoNhanPhong: string, db: Db = prisma) {
	return db.hoSoNhanPhong.findUnique({
		where: { maHoSoNhanPhong },
		include: paymentInclude,
	});
}
