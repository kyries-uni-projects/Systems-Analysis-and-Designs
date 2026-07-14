import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import type { Role } from "@/lib/auth";
import { prisma } from "../prisma";

const chiTietHoSoDatCocInclude = {
	khachHang: true,
	yeuCauThue: true,
	chiTietDatCocs: {
		include: {
			phong: {
				include: { loaiPhong: true },
			},
			giuong: true,
		},
		orderBy: { chiTietDatCocId: "asc" },
	},
	ketQuaKiemTraDieuKiens: {
		include: { quyDinh: true },
	},
	yeuCauThanhToanCoc: true,
} as const;

type HoSoDatCocWithRelations = Prisma.HoSoDatCocGetPayload<{ include: typeof chiTietHoSoDatCocInclude }>;

function chuanHoaHoSoDatCoc(hoSo: HoSoDatCocWithRelations) {
	const chiTietDatCoc = hoSo.chiTietDatCocs[0] ?? null;

	return {
		...hoSo,
		chiTietDatCoc,
		phongId: chiTietDatCoc?.phongId ?? null,
		giuongId: chiTietDatCoc?.giuongId ?? null,
		phong: chiTietDatCoc?.phong ?? null,
		giuong: chiTietDatCoc?.giuong ?? null,
	};
}

export type CapNhatThongTinHoSoDatCocInput = {
	khachHang: {
		hoTen: string;
		cccdPassport: string;
		gioiTinh?: string;
		quocTich?: string;
		soDienThoai: string;
		email?: string;
	};
	yeuCauThue: {
		soNguoiDuKien: number;
		loaiThue: string;
		khuVucMongMuon?: string;
	};
	ngayBatDauDuKien: Date;
	ngayKetThucDuKien: Date;
	lyDoTuChoi?: string;
};

type NguoiLapHoSo = {
	username: string;
	name: string;
	role: Role;
};

/**
 * Lấy chi tiết hồ sơ đặt cọc, bao gồm khách hàng, phòng, yêu cầu thuê.
 */
export async function layChiTietHoSoDatCoc(hoSoId: number) {
	const hoSo = await prisma.hoSoDatCoc.findUnique({
		where: { hoSoDatCocId: hoSoId },
		include: chiTietHoSoDatCocInclude,
	});

	return hoSo ? chuanHoaHoSoDatCoc(hoSo) : null;
}

export async function layDanhSachHoSoDatCoc(role: Role) {
	const danhSach = await prisma.hoSoDatCoc.findMany({
		include: chiTietHoSoDatCocInclude,
		orderBy: { ngayTao: "desc" },
	});

	const hoSoDaChuanHoa = danhSach.map(chuanHoaHoSoDatCoc);
	if (role === "quanly") {
		return hoSoDaChuanHoa.filter((hoSo) => hoSo.trangThai === "Chờ xác nhận quản lý");
	}
	if (role === "ketoan") {
		return hoSoDaChuanHoa.filter((hoSo) => hoSo.trangThai === "Đã xác nhận điều kiện" && !hoSo.yeuCauThanhToanCoc);
	}

	return hoSoDaChuanHoa;
}

export async function lapYeuCauThanhToanCoc(hoSoId: number, keToanId: number) {
	const hoSo = await prisma.hoSoDatCoc.findUnique({
		where: { hoSoDatCocId: hoSoId },
		include: { chiTietDatCocs: true, yeuCauThanhToanCoc: true },
	});
	if (!hoSo) return null;
	if (hoSo.yeuCauThanhToanCoc) return hoSo.yeuCauThanhToanCoc;
	if (hoSo.trangThai !== "Đã xác nhận điều kiện") {
		throw new Error("Hồ sơ chưa đủ điều kiện để lập yêu cầu thanh toán.");
	}

	const soTienCoc = hoSo.chiTietDatCocs.reduce((tong, chiTiet) => tong + chiTiet.giaThueThoaThuan * 2 * chiTiet.soGiuongQuyDoi, 0);
	const hanThanhToan = new Date();
	hanThanhToan.setHours(hanThanhToan.getHours() + 24);

	return prisma.$transaction(async (tx) => {
		const yeuCau = await tx.yeuCauThanhToanCoc.create({
			data: {
				hoSoDatCocId: hoSoId,
				soTienCoc,
				keToanId,
				hanThanhToan,
				soTaiKhoanNhan: "1234567890",
				trangThai: "Chờ thanh toán",
			},
		});
		await tx.hoSoDatCoc.update({ where: { hoSoDatCocId: hoSoId }, data: { trangThai: "Chờ thanh toán" } });
		return yeuCau;
	});
}

export async function capNhatThongTinHoSoDatCoc(hoSoId: number, input: CapNhatThongTinHoSoDatCocInput) {
	const hoSo = await prisma.hoSoDatCoc.findUnique({
		where: { hoSoDatCocId: hoSoId },
		select: { khachHangId: true, yeuCauId: true },
	});
	if (!hoSo) return null;

	await prisma.$transaction([
		prisma.khachHang.update({
			where: { khachHangId: hoSo.khachHangId },
			data: input.khachHang,
		}),
		prisma.yeuCauThue.update({
			where: { yeuCauId: hoSo.yeuCauId },
			data: {
				...input.yeuCauThue,
				thoiGianDuKienVaoO: input.ngayBatDauDuKien,
			},
		}),
		prisma.hoSoDatCoc.update({
			where: { hoSoDatCocId: hoSoId },
			data: {
				hinhThucThue: input.yeuCauThue.loaiThue,
				ngayBatDauDuKien: input.ngayBatDauDuKien,
				ngayKetThucDuKien: input.ngayKetThucDuKien,
				lyDoTuChoi: input.lyDoTuChoi ?? null,
			},
		}),
	]);

	return layChiTietHoSoDatCoc(hoSoId);
}

/** Tạo mới toàn bộ hồ sơ đặt cọc từ màn hình Lập phiếu. */
export async function taoHoSoDatCoc(input: CapNhatThongTinHoSoDatCocInput, nguoiLap: NguoiLapHoSo) {
	return prisma.$transaction(async (transaction) => {
		const khachHang = await transaction.khachHang.upsert({
			where: { cccdPassport: input.khachHang.cccdPassport },
			update: input.khachHang,
			create: input.khachHang,
		});

		const nhanVien = await transaction.nguoiDung.upsert({
			where: { tenDangNhap: nguoiLap.username },
			update: {},
			create: {
				hoTen: nguoiLap.name,
				tenDangNhap: nguoiLap.username,
				matKhauHash: "session-authenticated",
				vaiTro: nguoiLap.role === "nhanvien" ? "Sale" : nguoiLap.role,
			},
		});

		const yeuCauThue = await transaction.yeuCauThue.create({
			data: {
				khachHangId: khachHang.khachHangId,
				nhanVienId: nhanVien.nguoiDungId,
				loaiThue: input.yeuCauThue.loaiThue,
				khuVucMongMuon: input.yeuCauThue.khuVucMongMuon,
				soNguoiDuKien: input.yeuCauThue.soNguoiDuKien,
				thoiGianDuKienVaoO: input.ngayBatDauDuKien,
				trangThai: "Đã lập hồ sơ đặt cọc",
			},
		});

		const maHoSoDatCoc = `HSDC-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
		return transaction.hoSoDatCoc.create({
			data: {
				maHoSoDatCoc,
				yeuCauId: yeuCauThue.yeuCauId,
				khachHangId: khachHang.khachHangId,
				nhanVienId: nhanVien.nguoiDungId,
				hinhThucThue: input.yeuCauThue.loaiThue,
				ngayBatDauDuKien: input.ngayBatDauDuKien,
				ngayKetThucDuKien: input.ngayKetThucDuKien,
				trangThai: "Mới tạo",
				lyDoTuChoi: input.lyDoTuChoi ?? null,
			},
		});
	});
}

/**
 * Lấy danh sách quy định lưu trú (dành cho Sale check)
 */
export async function layDanhSachQuyDinhDatCoc() {
	return await prisma.quyDinhKyTucXa.findMany({
		where: {
			trangThai: { in: ["Dang ap dung", "Đang áp dụng"] },
		},
		orderBy: { quyDinhId: "asc" },
	});
}

/**
 * Kiểm tra tình trạng phòng tự động cho Quản lý
 */
export async function kiemTraTinhTrangPhong(phongId: number, giuongId?: number | null, hoSoDatCocId?: number) {
	const phong = await prisma.phong.findUnique({
		where: { phongId },
		include: { giuongs: true },
	});

	if (!phong) return null;

	// Đếm số giường trống
	const soGiuongTrong = phong.giuongs.filter((g) => g.trangThai === "Trống").length;

	// Kiểm tra xem có ai khác đang cọc phòng này không
	const cacsHoSoKhac = await prisma.chiTietDatCoc.findMany({
		where: {
			phongId,
			...(hoSoDatCocId ? { hoSoDatCocId: { not: hoSoDatCocId } } : {}),
			hoSoDatCoc: {
				trangThai: { in: ["Chờ xác nhận quản lý", "Đã xác nhận điều kiện", "Chờ thanh toán"] },
			},
		},
		select: { giuongId: true },
	});

	let hasOtherDeposit = false;
	if (giuongId) {
		hasOtherDeposit = cacsHoSoKhac.some((chiTietDatCoc) => chiTietDatCoc.giuongId === giuongId);
	} else {
		hasOtherDeposit = cacsHoSoKhac.length > 0;
	}

	return {
		tinhTrangPhong: soGiuongTrong > 0 ? "Trống" : phong.trangThai,
		datCocChoTuSaleKhac: hasOtherDeposit,
		phuHopGioiTinh: true, // Mock logic for demo
		sucChuaConLai: `${soGiuongTrong}/${phong.sucChua} giường trống`,
	};
}

/**
 * Nhân viên Sale xác nhận điều kiện
 */
export async function xacNhanDieuKienSale(
	hoSoId: number,
	nhanVienId: number,
	ketQuaKiemTra: { quyDinhId: number; ketQua: string; ghiChu?: string }[],
	lyDoTuChoi?: string,
) {
	// 1. Cập nhật hồ sơ
	const trangThaiMoi = lyDoTuChoi ? "Từ chối" : "Chờ xác nhận quản lý";

	await prisma.hoSoDatCoc.update({
		where: { hoSoDatCocId: hoSoId },
		data: {
			trangThai: trangThaiMoi,
			lyDoTuChoi: lyDoTuChoi || null,
		},
	});

	// 2. Lưu kết quả kiểm tra
	if (ketQuaKiemTra.length > 0) {
		// Xoá cũ
		await prisma.ketQuaKiemTraDieuKien.deleteMany({
			where: { hoSoDatCocId: hoSoId },
		});

		// Thêm mới
		await prisma.ketQuaKiemTraDieuKien.createMany({
			data: ketQuaKiemTra.map((kq) => ({
				hoSoDatCocId: hoSoId,
				quyDinhId: kq.quyDinhId,
				nguoiKiemTraId: nhanVienId,
				ketQua: kq.ketQua,
				ghiChu: kq.ghiChu,
			})),
		});
	}

	return { success: true };
}

/**
 * Quản lý xác nhận
 */
export async function xacNhanTinhTrangQuanLy(hoSoId: number, quanLyId: number, lyDoTuChoi?: string) {
	const trangThaiMoi = lyDoTuChoi ? "Từ chối" : "Đã xác nhận điều kiện";

	await prisma.$transaction([
		prisma.hoSoDatCoc.update({
			where: { hoSoDatCocId: hoSoId },
			data: {
				trangThai: trangThaiMoi,
				lyDoTuChoi: lyDoTuChoi || null,
			},
		}),
		prisma.chiTietDatCoc.updateMany({
			where: { hoSoDatCocId: hoSoId },
			data: {
				quanLyXacNhanId: quanLyId,
				thoiDiemXacNhan: new Date(),
				trangThai: trangThaiMoi,
				lyDoTuChoi: lyDoTuChoi || null,
			},
		}),
	]);

	return { success: true };
}
