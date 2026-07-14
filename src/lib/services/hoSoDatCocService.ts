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
				trangThai: "Chờ xác nhận điều kiện",
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

	await prisma.$transaction([
		prisma.hoSoDatCoc.update({
			where: { hoSoDatCocId: hoSoId },
			data: {
				trangThai: trangThaiMoi,
				lyDoTuChoi: lyDoTuChoi?.trim() || null,
			},
		}),
		prisma.chiTietDatCoc.updateMany({
			where: { hoSoDatCocId: hoSoId },
			data: {
				quanLyXacNhanId: quanLyId,
				thoiDiemXacNhan: new Date(),
				trangThai: trangThaiMoi,
				lyDoTuChoi: lyDoTuChoi?.trim() || null,
			},
		}),
	]);

	return { success: true };
}
