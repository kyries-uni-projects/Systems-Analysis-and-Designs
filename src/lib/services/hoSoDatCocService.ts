import { prisma } from "../prisma";

const chiTietHoSoDatCocInclude = {
	khachHang: true,
	yeuCauThue: true,
	nhanVien: { select: { hoTen: true } },
	chiTietDatCocs: {
		include: {
			phong: { include: { loaiPhong: true } },
			giuong: true,
		},
	},
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

	// Kiểm tra xem có ai khác đang cọc phòng/giường này không (qua chiTietDatCoc)
	const chiTietKhac = await prisma.chiTietDatCoc.findMany({
		where: {
			phongId,
			hoSoDatCoc: {
				trangThai: { in: ["Chờ xác nhận quản lý", "Đã xác nhận điều kiện", "Chờ thanh toán"] },
			},
		},
	});

	let hasOtherDeposit = false;
	if (giuongId) {
		hasOtherDeposit = chiTietKhac.some((ct) => ct.giuongId === giuongId);
	} else {
		hasOtherDeposit = chiTietKhac.length > 0;
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

	await prisma.$transaction([
		prisma.hoSoDatCoc.update({
			where: { hoSoDatCocId: hoSoId },
			data: {
				trangThai: trangThaiMoi,
				lyDoTuChoi: lyDoTuChoi || null,
			},
		}),
		// Cập nhật chi tiết đặt cọc
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


/**
 * Danh sách hồ sơ đặt cọc — lọc theo role
 */
export async function layDanhSachHoSoDatCoc(
	role: string,
	search?: string,
	trangThai?: string,
) {
	// Mỗi role chỉ thấy các trạng thái liên quan
	const trangThaiMap: Record<string, string[]> = {
		nhanvien: ["Chờ xác nhận điều kiện", "Chờ thanh toán", "Đã xác nhận thanh toán", "Chờ xác nhận quản lý", "Đã xác nhận điều kiện"],
		quanly: ["Chờ xác nhận quản lý", "Chờ xác nhận thanh toán"],
		ketoan: ["Đã xác nhận điều kiện", "Chờ thanh toán", "Đã xác nhận thanh toán"],
	};

	const allowedStatuses = role === "admin" ? undefined : trangThaiMap[role] ?? [];

	const where: Record<string, unknown> = {};

	if (trangThai && trangThai !== "all") {
		where.trangThai = trangThai;
	} else if (allowedStatuses) {
		where.trangThai = { in: allowedStatuses };
	}

	if (search) {
		where.OR = [
			{ maHoSoDatCoc: { contains: search } },
			{ khachHang: { hoTen: { contains: search } } },
		];
	}

	const list = await prisma.hoSoDatCoc.findMany({
		where,
		orderBy: { ngayTao: "desc" },
		include: {
			khachHang: { select: { hoTen: true } },
			chiTietDatCocs: {
				include: {
					phong: { select: { maPhong: true } },
					giuong: { select: { maGiuongLocal: true } },
				},
			},
			nhanVien: { select: { hoTen: true } },
		},
	});

	return list.map((hs) => {
		const ct = hs.chiTietDatCocs[0]; // Lấy chi tiết đầu tiên
		const maPhong = ct?.phong?.maPhong ?? "—";
		const giuong = ct?.giuong?.maGiuongLocal ? `Giường ${ct.giuong.maGiuongLocal}` : "";
		const phongGiuong = giuong ? `${maPhong} - ${giuong}` : maPhong;

		return {
			hoSoDatCocId: hs.hoSoDatCocId,
			maHoSoDatCoc: hs.maHoSoDatCoc,
			khachHang: hs.khachHang.hoTen,
			phongGiuong,
			hinhThucThue: hs.hinhThucThue,
			soGiuong: hs.chiTietDatCocs.reduce((s, c) => s + c.soGiuongQuyDoi, 0),
			trangThai: hs.trangThai,
			nhanVien: hs.nhanVien.hoTen,
			giaThueThoaThuan: ct?.giaThueThoaThuan ?? 0,
		};
	});
}

/**
 * Kế toán lập yêu cầu thanh toán cọc
 */
export async function lapYeuCauThanhToanCoc(hoSoId: number, keToanId: number) {
	const hoSo = await prisma.hoSoDatCoc.findUnique({
		where: { hoSoDatCocId: hoSoId },
		include: { chiTietDatCocs: true },
	});

	if (!hoSo) throw new Error("Không tìm thấy hồ sơ");
	if (hoSo.trangThai !== "Đã xác nhận điều kiện") {
		throw new Error("Hồ sơ chưa được xác nhận điều kiện");
	}

	// Tính tiền cọc = Tiền thuê 2 tháng × Số giường
	const tongTienCoc = hoSo.chiTietDatCocs.reduce(
		(sum, ct) => sum + ct.giaThueThoaThuan * 2 * ct.soGiuongQuyDoi,
		0,
	);

	// Hạn thanh toán = 24h
	const hanThanhToan = new Date();
	hanThanhToan.setHours(hanThanhToan.getHours() + 24);

	await prisma.$transaction([
		prisma.yeuCauThanhToanCoc.create({
			data: {
				hoSoDatCocId: hoSoId,
				soTienCoc: tongTienCoc,
				keToanId,
				hanThanhToan,
				soTaiKhoanNhan: "1234567890",
			},
		}),
		prisma.hoSoDatCoc.update({
			where: { hoSoDatCocId: hoSoId },
			data: { trangThai: "Chờ thanh toán" },
		}),
	]);

	return { success: true, tongTienCoc };
}
