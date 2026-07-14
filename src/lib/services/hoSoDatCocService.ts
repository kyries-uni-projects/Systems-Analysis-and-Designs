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
	lyDoTuChoi?: string;
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

export async function layHoSoDatCocMoiNhat() {
	const hoSo = await prisma.hoSoDatCoc.findFirst({
		orderBy: { ngayTao: "desc" },
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
			data: input.yeuCauThue,
		}),
		prisma.hoSoDatCoc.update({
			where: { hoSoDatCocId: hoSoId },
			data: { lyDoTuChoi: input.lyDoTuChoi ?? null },
		}),
	]);

	return layChiTietHoSoDatCoc(hoSoId);
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
