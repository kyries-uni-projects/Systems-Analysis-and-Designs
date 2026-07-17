import { prisma, type Db } from "@/lib/prisma";

export async function kiemTraHopDongTonTaiTheoHoSo(hoSoNhanPhongId: number, db: Db = prisma) {
	const count = await db.hopDong.count({ where: { hoSoNhanPhongId } });
	return count > 0;
}

export async function layMauNoiQuyDangApDung(db: Db = prisma) {
	return db.mauNoiQuy.findFirst({
		where: {
			OR: [
				{ trangThai: "Dang dung" },
				{ trangThai: "Dang ap dung" },
				{ trangThai: "Đang dùng" },
				{ trangThai: "Đang áp dụng" },
			],
		},
		orderBy: { ngayApDung: "desc" },
	});
}

export async function layDanhSachKhoanPhiDangApDung(db: Db = prisma) {
	return db.khoanPhiDichVu.findMany({
		where: {
			OR: [
				{ trangThai: "Dang ap dung" },
				{ trangThai: "Đang áp dụng" },
			],
		},
		orderBy: { idKhoanPhi: "asc" },
	});
}

export async function layNoiQuyDangApDung(db: Db = prisma) {
	return db.quyDinhKyTucXa.findMany({
		where: {
			nhomQuyDinh: { contains: "noi" },
			OR: [
				{ trangThai: "Dang ap dung" },
				{ trangThai: "Đang áp dụng" },
			],
		},
		orderBy: { ngayApDung: "desc" },
	});
}

export async function layDieuKhoanViPhamDangApDung(db: Db = prisma) {
	return db.quyDinhKyTucXa.findMany({
		where: {
			OR: [
				{ nhomQuyDinh: { contains: "vi pham" } },
				{ tenQuyDinh: { contains: "vi phạm" } },
				{ tenQuyDinh: { contains: "vi pham" } },
			],
			AND: [
				{
					OR: [
						{ trangThai: "Dang ap dung" },
						{ trangThai: "Đang áp dụng" },
					],
				},
			],
		},
		orderBy: { ngayApDung: "desc" },
	});
}

export async function taoHopDongDaKy(
	input: {
		maHopDong: string;
		hoSoNhanPhongId: number;
		khachHangId: number;
		nhanVienId: number;
		idMauNoiQuy: number;
		kyThanhToan: string;
		tienCocGoc: number;
		trangThai: string;
		ngayKy: Date;
		chiTietDatCocs: {
			chiTietDatCocId: number;
			phongId: number | null;
			giuongId: number | null;
			hinhThucThue: string;
			giaThueThoaThuan: number;
			soGiuongQuyDoi: number;
			tienCocPhanBo: number;
			ngayBatDau: Date;
			ngayKetThuc: Date;
		}[];
		khoanPhiDichVus: {
			idKhoanPhi: number;
			donGia: number;
			soLuong: number;
			thanhTien: number;
			ghiChu?: string | null;
		}[];
	},
	db: Db = prisma,
) {
	const hopDong = await db.hopDong.create({
		data: {
			maHopDong: input.maHopDong,
			hoSoNhanPhongId: input.hoSoNhanPhongId,
			khachHangId: input.khachHangId,
			nhanVienId: input.nhanVienId,
			idMauNoiQuy: input.idMauNoiQuy,
			kyThanhToan: input.kyThanhToan,
			tienCocGoc: input.tienCocGoc,
			trangThai: input.trangThai,
			ngayKy: input.ngayKy,
		},
	});

	if (input.chiTietDatCocs.length > 0) {
		await db.chiTietHopDong.createMany({
			data: input.chiTietDatCocs.map((detail) => ({
				hopDongId: hopDong.hopDongId,
				chiTietDatCocId: detail.chiTietDatCocId,
				phongId: detail.phongId,
				giuongId: detail.giuongId,
				hinhThucThue: detail.hinhThucThue,
				giaThueThoaThuan: detail.giaThueThoaThuan,
				soGiuongQuyDoi: detail.soGiuongQuyDoi,
				tienCocPhanBo: detail.tienCocPhanBo,
				ngayBatDau: detail.ngayBatDau,
				ngayKetThuc: detail.ngayKetThuc,
				trangThai: "Dang hieu luc",
			})),
		});
	}

	if (input.khoanPhiDichVus.length > 0) {
		await db.khoanPhiHopDong.createMany({
			data: input.khoanPhiDichVus.map((fee) => ({
				hopDongId: hopDong.hopDongId,
				idKhoanPhi: fee.idKhoanPhi,
				donGiaApDung: fee.donGia,
				soLuong: fee.soLuong,
				thanhTien: fee.thanhTien,
				ghiChu: fee.ghiChu ?? null,
			})),
		});
	}

	return hopDong;
}
