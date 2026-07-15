import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import type { Role } from "@/lib/auth";
import { ApiValidationError } from "@/lib/api-response";
import { prisma } from "../prisma";

const chiTietHoSoDatCocInclude = {
	khachHang: true,
	yeuCauThue: true,
	nhanVien: { select: { hoTen: true } },
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
	yeuCauThanhToanCoc: {
		include: {
			keToan: { select: { hoTen: true } },
			chungTuThanhToans: { orderBy: { ngayTao: "desc" } },
		},
	},
} as const;

type HoSoDatCocWithRelations = Prisma.HoSoDatCocGetPayload<{ include: typeof chiTietHoSoDatCocInclude }>;

function chuanHoaHoSoDatCoc(hoSo: HoSoDatCocWithRelations) {
	const chiTietDatCoc = hoSo.chiTietDatCocs[0] ?? null;

	return {
		...hoSo,
		chiTietDatCoc,
		chungTuThanhToan: hoSo.yeuCauThanhToanCoc?.chungTuThanhToans[0] ?? null,
		phongId: chiTietDatCoc?.phongId ?? null,
		giuongId: chiTietDatCoc?.giuongId ?? null,
		phong: chiTietDatCoc?.phong ?? null,
		giuong: chiTietDatCoc?.giuong ?? null,
	};
}

export type CapNhatThongTinHoSoDatCocInput = {
	yeuCauId?: number;
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

export type XacDinhYeuCauDatCocInput = {
	phongId: number;
	giuongId?: number;
	giaThueThoaThuan: number;
	soGiuongQuyDoi: number;
};

export type CapNhatChungTuThanhToanInput = {
	duongDanFile: string;
	soTienThucNhan: number;
	kenhThanhToan: string;
	thoiDiemNhan: Date;
};

export type LichHenNhanPhongInput = {
	ngayNhanPhong: Date;
	gioNhanPhong: string;
	ghiChu?: string;
};

const TRANG_THAI_DANG_GIU_CHO = [
	"Chờ xác nhận quản lý",
	"Đã xác nhận điều kiện",
	"Chờ thanh toán",
	"Chờ xác nhận thanh toán",
	"Đã xác nhận thanh toán",
];

function laTrangThaiPhongKhaDung(trangThai: string) {
	return ["Trống", "DANG_HOAT_DONG", "Đang hoạt động"].includes(trangThai);
}

function laTrangThaiGiuongTrong(trangThai: string) {
	return ["Trống", "TRONG"].includes(trangThai);
}

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
		return hoSoDaChuanHoa.filter((hoSo) => ["Chờ xác nhận quản lý", "Chờ xác nhận thanh toán"].includes(hoSo.trangThai));
	}
	if (role === "ketoan") {
		return hoSoDaChuanHoa.filter((hoSo) => hoSo.trangThai === "Đã xác nhận điều kiện" && !hoSo.yeuCauThanhToanCoc);
	}

	return hoSoDaChuanHoa;
}

export async function layDanhSachPhongGiuongKhaDung() {
	const [danhSach, chiTietDangGiuCho] = await Promise.all([
		prisma.phong.findMany({
			where: { trangThai: { in: ["Trống", "DANG_HOAT_DONG", "Đang hoạt động"] } },
			include: { loaiPhong: true, giuongs: { orderBy: { maGiuongLocal: "asc" } } },
			orderBy: { maPhong: "asc" },
		}),
		prisma.chiTietDatCoc.findMany({
			where: { hoSoDatCoc: { trangThai: { in: TRANG_THAI_DANG_GIU_CHO } } },
			select: { phongId: true, giuongId: true },
		}),
	]);
	const phongDaGiuNguyen = new Set(chiTietDangGiuCho.filter((chiTiet) => chiTiet.giuongId === null).map((chiTiet) => chiTiet.phongId));
	const giuongDaGiu = new Set(chiTietDangGiuCho.flatMap((chiTiet) => (chiTiet.giuongId ? [chiTiet.giuongId] : [])));

	return danhSach.filter((phong) => !phongDaGiuNguyen.has(phong.phongId)).map((phong) => ({
		phongId: phong.phongId,
		maPhong: phong.maPhong,
		khu: phong.khu,
		tang: phong.tang,
		sucChua: phong.sucChua,
		gioiTinhApDung: phong.gioiTinhApDung,
		trangThai: phong.trangThai,
		loaiPhong: phong.loaiPhong.tenLoaiPhong,
		donGia: phong.loaiPhong.donGia,
		giuongs: phong.giuongs.map((giuong) => ({
			giuongId: giuong.giuongId,
			maGiuongLocal: giuong.maGiuongLocal,
			trangThai: giuong.trangThai,
			khaDung: laTrangThaiGiuongTrong(giuong.trangThai) && !giuongDaGiu.has(giuong.giuongId),
		})),
	}));
}

export async function lapYeuCauThanhToanCoc(hoSoId: number, keToanId: number) {
	const hoSo = await prisma.hoSoDatCoc.findUnique({
		where: { hoSoDatCocId: hoSoId },
		include: { chiTietDatCocs: true, yeuCauThanhToanCoc: true },
	});
	if (!hoSo) return null;
	if (hoSo.yeuCauThanhToanCoc) return hoSo.yeuCauThanhToanCoc;
	if (hoSo.trangThai !== "Đã xác nhận điều kiện") {
		throw new ApiValidationError("Hồ sơ chưa đủ điều kiện để lập yêu cầu thanh toán.");
	}
	if (hoSo.chiTietDatCocs.length === 0) throw new ApiValidationError("Hồ sơ chưa có thông tin phòng hoặc giường đặt cọc.");

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

async function danhDauYeuCauDatCocDaHuy(hoSoId: number, reason: string) {
	return prisma.$transaction(async (transaction) => {
		const hoSo = await transaction.hoSoDatCoc.findUnique({
			where: { hoSoDatCocId: hoSoId },
			include: { yeuCauThanhToanCoc: true, chiTietDatCocs: true },
		});
		if (!hoSo) return null;
		if (!['Chờ thanh toán', 'Chờ xác nhận thanh toán'].includes(hoSo.trangThai)) {
			throw new ApiValidationError("Chỉ có thể hủy yêu cầu đặt cọc đang chờ thanh toán.");
		}
		if (hoSo.yeuCauThanhToanCoc) {
			await transaction.yeuCauThanhToanCoc.update({
				where: { yeuCauThanhToanId: hoSo.yeuCauThanhToanCoc.yeuCauThanhToanId },
				data: { trangThai: "Đã hủy" },
			});
		}
		await transaction.chiTietDatCoc.updateMany({ where: { hoSoDatCocId: hoSoId }, data: { trangThai: "Đã hủy" } });
		for (const detail of hoSo.chiTietDatCocs) {
			if (detail.giuongId) {
				await transaction.giuong.updateMany({ where: { giuongId: detail.giuongId, trangThai: "Đang chờ xác nhận" }, data: { trangThai: "Trống" } });
			} else if (detail.phongId) {
				await transaction.phong.updateMany({ where: { phongId: detail.phongId, trangThai: "Đang chờ xác nhận" }, data: { trangThai: "DANG_HOAT_DONG" } });
			}
		}
		await transaction.hoSoDatCoc.update({
			where: { hoSoDatCocId: hoSoId },
			data: { trangThai: "Đã hủy", lyDoTuChoi: reason },
		});
		return { trangThai: "Đã hủy" };
	});
}

export async function huyYeuCauDatCoc(hoSoId: number, reason?: string) {
	return danhDauYeuCauDatCocDaHuy(hoSoId, reason?.trim() || "Khách hàng chủ động hủy yêu cầu đặt cọc.");
}

async function huyNeuQuaHan(hoSoId: number) {
	const payment = await prisma.yeuCauThanhToanCoc.findUnique({
		where: { hoSoDatCocId: hoSoId },
		select: { hanThanhToan: true },
	});
	if (payment && payment.hanThanhToan.getTime() < Date.now()) {
		await danhDauYeuCauDatCocDaHuy(hoSoId, "Yêu cầu thanh toán đã quá thời hạn 24 giờ.");
		throw new ApiValidationError("Yêu cầu thanh toán đã quá thời hạn 24 giờ và đã được hủy.");
	}
}

/** Sale cập nhật chứng từ sau khi khách hàng đã thanh toán cọc. */
export async function capNhatChungTuThanhToan(hoSoId: number, input: CapNhatChungTuThanhToanInput) {
	if (!Number.isFinite(input.soTienThucNhan) || input.soTienThucNhan <= 0) {
		throw new ApiValidationError("Số tiền thực nhận phải lớn hơn 0.");
	}
	if (!input.kenhThanhToan.trim()) throw new ApiValidationError("Kênh thanh toán là bắt buộc.");
	if (Number.isNaN(input.thoiDiemNhan.getTime())) throw new ApiValidationError("Thời điểm nhận thanh toán không hợp lệ.");
	if (input.thoiDiemNhan.getTime() > Date.now() + 5 * 60 * 1000) {
		throw new ApiValidationError("Thời điểm nhận thanh toán không được ở tương lai.");
	}
	await huyNeuQuaHan(hoSoId);

	return prisma.$transaction(async (transaction) => {
		const hoSo = await transaction.hoSoDatCoc.findUnique({
			where: { hoSoDatCocId: hoSoId },
			include: {
				yeuCauThanhToanCoc: { include: { chungTuThanhToans: { orderBy: { ngayTao: "desc" }, take: 1 } } },
			},
		});
		if (!hoSo) return null;
		if (!hoSo.yeuCauThanhToanCoc) throw new ApiValidationError("Hồ sơ chưa có yêu cầu thanh toán cọc.");
		if (hoSo.trangThai !== "Chờ thanh toán") {
			throw new ApiValidationError("Hồ sơ không ở bước Sale cập nhật chứng từ thanh toán.");
		}

		const chungTuGanNhat = hoSo.yeuCauThanhToanCoc.chungTuThanhToans[0];
		if (chungTuGanNhat && chungTuGanNhat.trangThaiXacNhan !== "Từ chối") {
			throw new ApiValidationError("Chứng từ hiện tại đang chờ hoặc đã được Quản lý xác nhận.");
		}

		const data = {
			duongDanFile: input.duongDanFile,
			soTienThucNhan: input.soTienThucNhan,
			kenhThanhToan: input.kenhThanhToan.trim(),
			thoiDiemNhan: input.thoiDiemNhan,
			trangThaiXacNhan: "Chờ xác nhận",
			quanLyXacNhanId: null,
			lyDoTuChoi: null,
		};
		const chungTu = chungTuGanNhat
			? await transaction.chungTuThanhToan.update({ where: { chungTuId: chungTuGanNhat.chungTuId }, data })
			: await transaction.chungTuThanhToan.create({
					data: { ...data, yeuCauThanhToanId: hoSo.yeuCauThanhToanCoc.yeuCauThanhToanId },
				});

		await transaction.yeuCauThanhToanCoc.update({
			where: { yeuCauThanhToanId: hoSo.yeuCauThanhToanCoc.yeuCauThanhToanId },
			data: { trangThai: "Chờ xác nhận thanh toán" },
		});
		await transaction.hoSoDatCoc.update({
			where: { hoSoDatCocId: hoSoId },
			data: { trangThai: "Chờ xác nhận thanh toán", lyDoTuChoi: null },
		});
		return chungTu;
	});
}

/** Quản lý xác nhận hoặc từ chối chứng từ thanh toán cọc. */
export async function xacNhanThanhToanCoc(hoSoId: number, quanLyId: number, xacNhan: boolean, lyDoTuChoi?: string) {
	if (!xacNhan && !lyDoTuChoi?.trim()) throw new ApiValidationError("Vui lòng nhập lý do từ chối chứng từ.");
	await huyNeuQuaHan(hoSoId);

	return prisma.$transaction(async (transaction) => {
		const hoSo = await transaction.hoSoDatCoc.findUnique({
			where: { hoSoDatCocId: hoSoId },
			include: {
				yeuCauThanhToanCoc: { include: { chungTuThanhToans: { orderBy: { ngayTao: "desc" }, take: 1 } } },
			},
		});
		if (!hoSo) return null;
		if (hoSo.trangThai !== "Chờ xác nhận thanh toán" || !hoSo.yeuCauThanhToanCoc) {
			throw new ApiValidationError("Hồ sơ không ở bước Quản lý xác nhận thanh toán cọc.");
		}
		const chungTu = hoSo.yeuCauThanhToanCoc.chungTuThanhToans[0];
		if (!chungTu || chungTu.trangThaiXacNhan !== "Chờ xác nhận") {
			throw new ApiValidationError("Không có chứng từ đang chờ xác nhận.");
		}
		if (xacNhan && Math.abs(chungTu.soTienThucNhan - hoSo.yeuCauThanhToanCoc.soTienCoc) > 0.01) {
			throw new ApiValidationError("Số tiền trên chứng từ không khớp với số tiền cọc phải thu.");
		}

		const trangThaiChungTu = xacNhan ? "Đã xác nhận" : "Từ chối";
		const trangThaiHoSo = xacNhan ? "Đã xác nhận thanh toán" : "Chờ thanh toán";
		await transaction.chungTuThanhToan.update({
			where: { chungTuId: chungTu.chungTuId },
			data: {
				quanLyXacNhanId: quanLyId,
				trangThaiXacNhan: trangThaiChungTu,
				lyDoTuChoi: xacNhan ? null : lyDoTuChoi?.trim(),
			},
		});
		await transaction.yeuCauThanhToanCoc.update({
			where: { yeuCauThanhToanId: hoSo.yeuCauThanhToanCoc.yeuCauThanhToanId },
			data: { trangThai: trangThaiHoSo },
		});
		await transaction.hoSoDatCoc.update({
			where: { hoSoDatCocId: hoSoId },
			data: { trangThai: trangThaiHoSo, lyDoTuChoi: xacNhan ? null : lyDoTuChoi?.trim() },
		});

		return { xacNhan, trangThai: trangThaiHoSo, chungTuId: chungTu.chungTuId };
	});
}

/**
 * Sale chốt thông tin cọc sau khi chứng từ đã được Quản lý xác nhận.
 * Việc khóa phòng/giường được thực hiện trong cùng transaction để không có
 * khoảng trống mà một Sale khác có thể chọn lại tài nguyên vừa đặt cọc.
 */
export async function ghiNhanThongTinDatCoc(hoSoId: number) {
	return prisma.$transaction(async (transaction) => {
		const hoSo = await transaction.hoSoDatCoc.findUnique({
			where: { hoSoDatCocId: hoSoId },
			include: {
				chiTietDatCocs: true,
				yeuCauThanhToanCoc: { include: { chungTuThanhToans: { orderBy: { ngayTao: "desc" }, take: 1 } } },
			},
		});
		if (!hoSo) return null;
		if (hoSo.trangThai === "Chờ nhập lịch nhận phòng" || hoSo.trangThai === "Đã đặt cọc") {
			return { trangThai: hoSo.trangThai, maHoSoDatCoc: hoSo.maHoSoDatCoc };
		}
		if (hoSo.trangThai !== "Đã xác nhận thanh toán") {
			throw new ApiValidationError("Hồ sơ chưa được xác nhận thanh toán để ghi nhận đặt cọc.");
		}
		const chungTu = hoSo.yeuCauThanhToanCoc?.chungTuThanhToans[0];
		if (!hoSo.yeuCauThanhToanCoc || hoSo.yeuCauThanhToanCoc.trangThai !== "Đã xác nhận thanh toán" || chungTu?.trangThaiXacNhan !== "Đã xác nhận") {
			throw new ApiValidationError("Khoản thanh toán cọc chưa được Quản lý xác nhận hợp lệ.");
		}
		if (hoSo.chiTietDatCocs.length === 0) {
			throw new ApiValidationError("Hồ sơ chưa có thông tin phòng hoặc giường đặt cọc.");
		}

		for (const chiTiet of hoSo.chiTietDatCocs) {
			if (chiTiet.giuongId) {
				const result = await transaction.giuong.updateMany({
					where: { giuongId: chiTiet.giuongId, trangThai: { in: ["Đang chờ xác nhận", "Đã cọc"] } },
					data: { trangThai: "Đã cọc" },
				});
				if (result.count !== 1) throw new ApiValidationError("Giường không còn ở trạng thái giữ chỗ để ghi nhận đặt cọc.");
			} else if (chiTiet.phongId) {
				const result = await transaction.phong.updateMany({
					where: { phongId: chiTiet.phongId, trangThai: { in: ["Đang chờ xác nhận", "Đã cọc"] } },
					data: { trangThai: "Đã cọc" },
				});
				if (result.count !== 1) throw new ApiValidationError("Phòng không còn ở trạng thái giữ chỗ để ghi nhận đặt cọc.");
			}
		}

		await transaction.chiTietDatCoc.updateMany({
			where: { hoSoDatCocId: hoSoId },
			data: { trangThai: "Đã cọc" },
		});
		await transaction.hoSoDatCoc.update({
			where: { hoSoDatCocId: hoSoId },
			data: { trangThai: "Chờ nhập lịch nhận phòng" },
		});

		return { trangThai: "Chờ nhập lịch nhận phòng", maHoSoDatCoc: hoSo.maHoSoDatCoc };
	});
}

/** Lưu lịch nhận phòng đã thống nhất; thông tin cọc vẫn được giữ nếu bước thông báo gặp lỗi. */
export async function luuLichHenNhanPhong(hoSoId: number, input: LichHenNhanPhongInput) {
	if (Number.isNaN(input.ngayNhanPhong.getTime())) throw new ApiValidationError("Ngày nhận phòng không hợp lệ.");
	if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.gioNhanPhong)) throw new ApiValidationError("Giờ nhận phòng không hợp lệ.");
	const [hours, minutes] = input.gioNhanPhong.split(":").map(Number);
	const thoiDiemHen = new Date(input.ngayNhanPhong);
	thoiDiemHen.setHours(hours, minutes, 0, 0);
	if (thoiDiemHen.getTime() <= Date.now()) throw new ApiValidationError("Lịch hẹn nhận phòng phải ở tương lai.");

	const result = await prisma.$transaction(async (transaction) => {
		const hoSo = await transaction.hoSoDatCoc.findUnique({
			where: { hoSoDatCocId: hoSoId },
			include: { khachHang: true },
		});
		if (!hoSo) return null;
		if (hoSo.trangThai !== "Chờ nhập lịch nhận phòng") {
			throw new ApiValidationError("Hồ sơ chưa được ghi nhận đặt cọc hoặc lịch hẹn đã được lưu.");
		}

		await transaction.hoSoDatCoc.update({
			where: { hoSoDatCocId: hoSoId },
			data: {
				ngayHenNhanPhong: input.ngayNhanPhong,
				gioHenNhanPhong: input.gioNhanPhong,
				ghiChuHenNhanPhong: input.ghiChu?.trim() || null,
				trangThai: "Đã đặt cọc",
			},
		});
		await transaction.yeuCauThue.update({
			where: { yeuCauId: hoSo.yeuCauId },
			data: { trangThai: "Đã đặt cọc" },
		});

		return { hoSo, ngayNhanPhong: input.ngayNhanPhong, gioNhanPhong: input.gioNhanPhong };
	});
	if (!result) return null;

	// Dự án hiện mô phỏng cổng gửi thông báo giống luồng lịch xem phòng.
	const kenhThongBao = [result.hoSo.khachHang.email ? "Email" : null, result.hoSo.khachHang.soDienThoai ? "SMS" : null].filter(Boolean);
	return {
		trangThai: "Đã đặt cọc",
		maHoSoDatCoc: result.hoSo.maHoSoDatCoc,
		thongBao: kenhThongBao.length > 0
			? { success: true, message: `Đã gửi thông báo lịch nhận phòng qua ${kenhThongBao.join(" và ")}.` }
			: { success: false, message: "Lịch hẹn đã được lưu nhưng không có email hoặc số điện thoại để gửi thông báo." },
	};
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

		if (!input.yeuCauId) throw new ApiValidationError("Vui lòng chọn yêu cầu thuê đã được ghi nhận trước khi lập hồ sơ đặt cọc.");
		const sourceRequest = await transaction.yeuCauThue.findUnique({
			where: { yeuCauId: input.yeuCauId },
			include: { khachHang: true, hoSoDatCocs: { select: { hoSoDatCocId: true } }, lichHenXemPhongs: { select: { lichHenId: true } } },
		});
		if (!sourceRequest) throw new ApiValidationError("Không tìm thấy yêu cầu thuê đã chọn.");
		if (sourceRequest.hoSoDatCocs.length > 0) throw new ApiValidationError("Yêu cầu thuê này đã có hồ sơ đặt cọc.");
		if (sourceRequest.lichHenXemPhongs.length === 0) {
			throw new ApiValidationError("Yêu cầu thuê chưa có lịch xem phòng, chưa thể chuyển sang đặt cọc.");
		}
		await transaction.khachHang.update({ where: { khachHangId: sourceRequest.khachHangId }, data: input.khachHang });
		const yeuCauThue = await transaction.yeuCauThue.update({
			where: { yeuCauId: sourceRequest.yeuCauId },
			data: {
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
				khachHangId: sourceRequest.khachHangId,
				nhanVienId: nhanVien.nguoiDungId,
				hinhThucThue: input.yeuCauThue.loaiThue,
				ngayBatDauDuKien: input.ngayBatDauDuKien,
				ngayKetThucDuKien: input.ngayKetThucDuKien,
				trangThai: "Chờ xác nhận điều kiện",
				lyDoTuChoi: input.lyDoTuChoi ?? null,
			},
		});
	});
}

export async function layDanhSachYeuCauChoDatCoc() {
	return prisma.yeuCauThue.findMany({
		where: { hoSoDatCocs: { none: {} }, lichHenXemPhongs: { some: {} } },
		include: { khachHang: true, lichHenXemPhongs: { orderBy: { ngayTao: "desc" }, take: 1 } },
		orderBy: { ngayTao: "desc" },
	});
}

export async function layYeuCauChoDatCoc(yeuCauId: number) {
	return prisma.yeuCauThue.findFirst({
		where: { yeuCauId, hoSoDatCocs: { none: {} }, lichHenXemPhongs: { some: {} } },
		include: { khachHang: true },
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

	const soGiuongTrong = phong.giuongs.filter((g) => laTrangThaiGiuongTrong(g.trangThai)).length;
	const giuongYeuCau = giuongId ? phong.giuongs.find((giuong) => giuong.giuongId === giuongId) : null;

	// Kiểm tra xem có ai khác đang cọc phòng này không
	const cacsHoSoKhac = await prisma.chiTietDatCoc.findMany({
		where: {
			phongId,
			...(hoSoDatCocId ? { hoSoDatCocId: { not: hoSoDatCocId } } : {}),
			hoSoDatCoc: {
				trangThai: { in: TRANG_THAI_DANG_GIU_CHO },
			},
		},
		select: { giuongId: true },
	});

	let hasOtherDeposit = false;
	if (giuongId) {
		hasOtherDeposit = cacsHoSoKhac.some((chiTietDatCoc) => chiTietDatCoc.giuongId === giuongId || chiTietDatCoc.giuongId === null);
	} else {
		hasOtherDeposit = cacsHoSoKhac.length > 0;
	}

	const hoSo = hoSoDatCocId
		? await prisma.hoSoDatCoc.findUnique({ where: { hoSoDatCocId }, include: { khachHang: true } })
		: null;
	const phuHopGioiTinh =
		!phong.gioiTinhApDung || !hoSo?.khachHang.gioiTinh || phong.gioiTinhApDung.toLocaleLowerCase("vi-VN") === hoSo.khachHang.gioiTinh.toLocaleLowerCase("vi-VN");
	const doiTuongKhaDung = giuongYeuCau
		? laTrangThaiGiuongTrong(giuongYeuCau.trangThai)
		: laTrangThaiPhongKhaDung(phong.trangThai) && phong.giuongs.every((giuong) => laTrangThaiGiuongTrong(giuong.trangThai));
	const coTheXacNhan = doiTuongKhaDung && !hasOtherDeposit && phuHopGioiTinh && (giuongYeuCau !== undefined || !giuongId);

	return {
		tinhTrangPhong: doiTuongKhaDung ? "Trống" : "Không khả dụng",
		datCocChoTuSaleKhac: hasOtherDeposit,
		phuHopGioiTinh,
		sucChuaConLai: `${soGiuongTrong}/${phong.sucChua} giường trống`,
		coTheXacNhan,
	};
}

/**
 * Nhân viên Sale xác nhận điều kiện
 */
export async function xacNhanDieuKienSale(
	hoSoId: number,
	nhanVienId: number,
	ketQuaKiemTra: { quyDinhId: number; ketQua: string; ghiChu?: string }[],
	chiTietDatCoc?: XacDinhYeuCauDatCocInput,
	lyDoTuChoi?: string,
) {
	return prisma.$transaction(async (transaction) => {
		const hoSo = await transaction.hoSoDatCoc.findUnique({ where: { hoSoDatCocId: hoSoId } });
		if (!hoSo) return null;
		if (!["Chờ xác nhận điều kiện", "Mới tạo"].includes(hoSo.trangThai)) {
			throw new ApiValidationError("Hồ sơ không ở bước Sale xác định yêu cầu đặt cọc.");
		}

		const isRejected = Boolean(lyDoTuChoi?.trim());
		if (!isRejected) {
			if (!chiTietDatCoc) throw new ApiValidationError("Vui lòng chọn phòng hoặc giường cần đặt cọc.");
			const thueTheoGiuong = hoSo.hinhThucThue.toLocaleLowerCase("vi-VN").includes("giường");
			if (thueTheoGiuong && !chiTietDatCoc.giuongId) throw new ApiValidationError("Vui lòng chọn giường cần đặt cọc.");
			if (!thueTheoGiuong && chiTietDatCoc.giuongId) throw new ApiValidationError("Hồ sơ thuê nguyên phòng không được chọn giường riêng lẻ.");
			if (!Number.isFinite(chiTietDatCoc.giaThueThoaThuan) || chiTietDatCoc.giaThueThoaThuan <= 0) {
				throw new ApiValidationError("Giá thuê thỏa thuận phải lớn hơn 0.");
			}
			if (!Number.isInteger(chiTietDatCoc.soGiuongQuyDoi) || chiTietDatCoc.soGiuongQuyDoi < 1) {
				throw new ApiValidationError("Số giường quy đổi phải lớn hơn 0.");
			}

			const quyDinhBatBuoc = await transaction.quyDinhKyTucXa.findMany({
				where: { batBuoc: true, trangThai: { in: ["Dang ap dung", "Đang áp dụng"] } },
				select: { quyDinhId: true },
			});
			const ketQuaById = new Map(ketQuaKiemTra.map((item) => [item.quyDinhId, item.ketQua]));
			if (quyDinhBatBuoc.some((quyDinh) => ketQuaById.get(quyDinh.quyDinhId) !== "Đạt")) {
				throw new ApiValidationError("Tất cả điều kiện lưu trú bắt buộc phải được xác nhận đạt.");
			}

			const phong = await transaction.phong.findUnique({
				where: { phongId: chiTietDatCoc.phongId },
				include: { giuongs: true },
			});
			if (!phong || !laTrangThaiPhongKhaDung(phong.trangThai)) throw new ApiValidationError("Phòng đã chọn không khả dụng.");
			if (chiTietDatCoc.giuongId) {
				const giuong = phong.giuongs.find((item) => item.giuongId === chiTietDatCoc.giuongId);
				if (!giuong || !laTrangThaiGiuongTrong(giuong.trangThai)) throw new ApiValidationError("Giường đã chọn không khả dụng.");
			}

			const hoSoKhac = await transaction.chiTietDatCoc.findFirst({
				where: {
					hoSoDatCocId: { not: hoSoId },
					phongId: chiTietDatCoc.phongId,
					hoSoDatCoc: { trangThai: { in: TRANG_THAI_DANG_GIU_CHO } },
					...(chiTietDatCoc.giuongId ? { OR: [{ giuongId: chiTietDatCoc.giuongId }, { giuongId: null }] } : {}),
				},
			});
			if (hoSoKhac) throw new ApiValidationError("Phòng hoặc giường đã có hồ sơ đặt cọc khác đang giữ chỗ.");

			await transaction.chiTietDatCoc.deleteMany({ where: { hoSoDatCocId: hoSoId } });
			await transaction.chiTietDatCoc.create({
				data: {
					hoSoDatCocId: hoSoId,
					phongId: chiTietDatCoc.phongId,
					giuongId: chiTietDatCoc.giuongId,
					giaThueThoaThuan: chiTietDatCoc.giaThueThoaThuan,
					soGiuongQuyDoi: chiTietDatCoc.soGiuongQuyDoi,
					tienCocPhanBo: chiTietDatCoc.giaThueThoaThuan * 2 * chiTietDatCoc.soGiuongQuyDoi,
					trangThai: "Chờ xác nhận quản lý",
				},
			});
		}

		await transaction.ketQuaKiemTraDieuKien.deleteMany({ where: { hoSoDatCocId: hoSoId } });
		if (ketQuaKiemTra.length > 0) {
			await transaction.ketQuaKiemTraDieuKien.createMany({
				data: ketQuaKiemTra.map((ketQua) => ({
					hoSoDatCocId: hoSoId,
					quyDinhId: ketQua.quyDinhId,
					nguoiKiemTraId: nhanVienId,
					ketQua: ketQua.ketQua,
					ghiChu: ketQua.ghiChu,
				})),
			});
		}

		await transaction.hoSoDatCoc.update({
			where: { hoSoDatCocId: hoSoId },
			data: { trangThai: isRejected ? "Từ chối" : "Chờ xác nhận quản lý", lyDoTuChoi: lyDoTuChoi?.trim() || null },
		});
		return { success: true };
	});
}

/**
 * Quản lý xác nhận
 */
export async function xacNhanTinhTrangQuanLy(hoSoId: number, quanLyId: number, lyDoTuChoi?: string) {
	const hoSo = await layChiTietHoSoDatCoc(hoSoId);
	if (!hoSo) return null;
	if (hoSo.trangThai !== "Chờ xác nhận quản lý") throw new ApiValidationError("Hồ sơ không ở bước Quản lý xác nhận tình trạng.");
	if (!hoSo.phongId) throw new ApiValidationError("Hồ sơ chưa có phòng hoặc giường cần xác nhận.");

	const isRejected = Boolean(lyDoTuChoi?.trim());
	const tinhTrang = await kiemTraTinhTrangPhong(hoSo.phongId, hoSo.giuongId, hoSoId);
	if (!isRejected && !tinhTrang?.coTheXacNhan) {
		throw new ApiValidationError("Phòng hoặc giường không còn đáp ứng điều kiện nhận cọc.");
	}
	const trangThaiMoi = isRejected ? "Từ chối" : "Đã xác nhận điều kiện";

	await prisma.$transaction(async (transaction) => {
		await transaction.hoSoDatCoc.update({
			where: { hoSoDatCocId: hoSoId },
			data: {
				trangThai: trangThaiMoi,
				lyDoTuChoi: lyDoTuChoi?.trim() || null,
			},
		});
		await transaction.chiTietDatCoc.updateMany({
			where: { hoSoDatCocId: hoSoId },
			data: {
				quanLyXacNhanId: quanLyId,
				thoiDiemXacNhan: new Date(),
				trangThai: trangThaiMoi,
				lyDoTuChoi: lyDoTuChoi?.trim() || null,
			},
		});
		if (!isRejected) {
			if (hoSo.giuongId) {
				await transaction.giuong.update({ where: { giuongId: hoSo.giuongId }, data: { trangThai: "Đang chờ xác nhận" } });
			} else {
				await transaction.phong.update({ where: { phongId: hoSo.phongId! }, data: { trangThai: "Đang chờ xác nhận" } });
			}
		}
	});

	return { success: true };
}
