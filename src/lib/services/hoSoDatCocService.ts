import { prisma } from "../prisma";

const chiTietHoSoDatCocInclude = {
	khachHang: true,
	yeuCauThue: true,
	phong: {
		include: { loaiPhong: true },
	},
	giuong: true,
	ketQuaKiemTraDieuKiens: {
		include: { quyDinh: true },
	},
} as const;

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

	if (!hoSo) return null;
	return hoSo;
}

export async function layHoSoDatCocMoiNhat() {
	return prisma.hoSoDatCoc.findFirst({
		orderBy: { ngayTao: "desc" },
		include: chiTietHoSoDatCocInclude,
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
			trangThai: "Dang ap dung",
		},
		orderBy: { quyDinhId: "asc" },
	});
}

/**
 * Kiểm tra tình trạng phòng tự động cho Quản lý
 */
export async function kiemTraTinhTrangPhong(phongId: number, giuongId?: number | null) {
	const phong = await prisma.phong.findUnique({
		where: { phongId },
		include: { giuongs: true },
	});

	if (!phong) return null;

	// Đếm số giường trống
	const soGiuongTrong = phong.giuongs.filter((g) => g.trangThai === "Trống").length;

	// Kiểm tra xem có ai khác đang cọc phòng này không
	const cacsHoSoKhac = await prisma.hoSoDatCoc.findMany({
		where: {
			phongId,
			trangThai: { in: ["Chờ xác nhận quản lý", "Đã xác nhận điều kiện", "Chờ thanh toán"] },
		},
	});

	let hasOtherDeposit = false;
	if (giuongId) {
		hasOtherDeposit = cacsHoSoKhac.some((hs) => hs.giuongId === giuongId);
	} else {
		hasOtherDeposit = cacsHoSoKhac.length > 0;
	}

	return {
		tinhTrangPhong: phong.trangThai,
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

	await prisma.hoSoDatCoc.update({
		where: { hoSoDatCocId: hoSoId },
		data: {
			trangThai: trangThaiMoi,
			lyDoTuChoi: lyDoTuChoi || null,
			quanLyXacNhanId: quanLyId,
		},
	});

	return { success: true };
}
