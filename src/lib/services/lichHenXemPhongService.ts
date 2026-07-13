import { prisma } from "@/lib/prisma";
import { ApiNotFoundError, ApiValidationError } from "@/lib/api-response";
import type { CreateLichHenInput } from "@/types/lich-hen-xem-phong";
import type { Role } from "@/lib/auth";

// ============================================================
// DB Layer — tương ứng YeuCauThueDB, LichXemPhongDB, KhachHangDB
// ============================================================

/** YeuCauThueDB.LayYeuCauThue + KhachHangDB.LayKhachHang (via Prisma include) */
export async function getYeuCauThueWithDetails(yeuCauId: number) {
	const yeuCau = await prisma.yeuCauThue.findUnique({
		where: { yeuCauId },
		include: {
			khachHang: true,
			nhanVien: true,
			lichHenXemPhongs: {
				include: { phong: { include: { loaiPhong: true } } },
				orderBy: { ngayTao: "desc" },
			},
		},
	});

	if (!yeuCau) {
		throw new ApiNotFoundError(`Không tìm thấy yêu cầu thuê #${yeuCauId}`);
	}

	return yeuCau;
}

/** YeuCauThue.TimPhongPhuHop — Tìm phòng phù hợp dựa trên tiêu chí yêu cầu thuê */
export async function timPhongPhuHop(yeuCauId: number) {
	const yeuCau = await getYeuCauThueWithDetails(yeuCauId);

	const rooms = await prisma.phong.findMany({
		where: {
			trangThai: { in: ["Trống", "Còn giường trống"] },
			...(yeuCau.khuVucMongMuon ? { khu: yeuCau.khuVucMongMuon } : {}),
			sucChua: { gte: yeuCau.soNguoiDuKien },
			...(yeuCau.loaiThue === "Thuê giường" ? { giuongs: { some: { trangThai: "Trống" } } } : {}),
		},
		include: { loaiPhong: true, giuongs: true },
		orderBy: { maPhong: "asc" },
	});

	return rooms.map((room) => ({
		phongId: room.phongId,
		maPhong: room.maPhong,
		khu: room.khu,
		tang: room.tang,
		sucChua: room.sucChua,
		loaiPhong: room.loaiPhong.tenLoaiPhong,
		donGia: room.loaiPhong.donGia,
		tienIch: room.tienIch,
		soGiuongTrong: room.giuongs.filter((bed) => bed.trangThai === "Trống").length,
	}));
}

/** LichXemPhongDB.LayDanhSachLichHenTheoNgay — Lấy lịch hẹn của phòng theo ngày */
export async function layDanhSachLichHenTheoNgay(phongId: number, ngay: Date) {
	const startOfDay = new Date(ngay);
	startOfDay.setHours(0, 0, 0, 0);
	const endOfDay = new Date(ngay);
	endOfDay.setHours(23, 59, 59, 999);

	return prisma.lichHenXemPhong.findMany({
		where: {
			phongId,
			ngayXem: { gte: startOfDay, lte: endOfDay },
			trangThai: { not: "Đã hủy" },
		},
		orderBy: { gioBatDau: "asc" },
	});
}

// ============================================================
// BUS Layer — tương ứng LichXemPhong (nghiệp vụ)
// ============================================================

/** LichXemPhong.KiemTraThoiGianHopLe — Kiểm tra thời gian hẹn hợp lệ */
export async function kiemTraThoiGianHopLe(phongId: number, ngayXem: string, gioBatDau: string, gioKetThuc: string) {
	// Kiểm tra giờ làm việc (7:00 - 21:00)
	const [startHour] = gioBatDau.split(":").map(Number);
	const [endHour] = gioKetThuc.split(":").map(Number);

	if (startHour < 7 || endHour > 21) {
		throw new ApiValidationError("Giờ hẹn phải trong khoảng 07:00 - 21:00");
	}

	// Kiểm tra trùng lịch
	const existingSchedules = await layDanhSachLichHenTheoNgay(phongId, new Date(`${ngayXem}T00:00:00`));

	for (const schedule of existingSchedules) {
		if (gioBatDau < schedule.gioKetThuc && gioKetThuc > schedule.gioBatDau) {
			throw new ApiValidationError(`Trùng lịch hẹn với lịch hẹn #${schedule.lichHenId} (${schedule.gioBatDau} - ${schedule.gioKetThuc})`);
		}
	}

	return true;
}

type NhanVienInfo = {
	username: string;
	name: string;
	role: Role;
};

/** LichXemPhong.TaoLichHen + LichXemPhongDB.ThemLichHen — Tạo lịch hẹn mới */
export async function taoLichHen(input: CreateLichHenInput, nhanVienInfo: NhanVienInfo) {
	// Validate thời gian
	await kiemTraThoiGianHopLe(input.phongId, input.ngayXem, input.gioBatDau, input.gioKetThuc);

	// Kiểm tra yêu cầu thuê tồn tại
	const yeuCau = await getYeuCauThueWithDetails(input.yeuCauId);

	// Kiểm tra phòng tồn tại
	const phong = await prisma.phong.findUnique({ where: { phongId: input.phongId } });
	if (!phong) {
		throw new ApiNotFoundError(`Không tìm thấy phòng #${input.phongId}`);
	}

	// Tạo lịch hẹn trong transaction
	const result = await prisma.$transaction(async (tx) => {
		const nhanVien = await tx.nguoiDung.upsert({
			where: { tenDangNhap: nhanVienInfo.username },
			update: {},
			create: {
				hoTen: nhanVienInfo.name,
				tenDangNhap: nhanVienInfo.username,
				matKhauHash: "session-authenticated",
				vaiTro: nhanVienInfo.role === "nhanvien" ? "Sale" : nhanVienInfo.role,
			},
		});

		const lichHen = await tx.lichHenXemPhong.create({
			data: {
				yeuCauId: input.yeuCauId,
				phongId: input.phongId,
				nhanVienId: nhanVien.nguoiDungId,
				ngayXem: new Date(`${input.ngayXem}T00:00:00`),
				gioBatDau: input.gioBatDau,
				gioKetThuc: input.gioKetThuc,
				trangThai: "Đã lên lịch",
				trangThaiGuiThongBao: "Chưa gửi",
			},
			include: {
				phong: { include: { loaiPhong: true } },
				yeuCauThue: { include: { khachHang: true } },
			},
		});

		return lichHen;
	});

	// GuiThongBao — Mô phỏng gửi thông báo
	const thongBaoResult = await guiThongBao(result, yeuCau.khachHang);

	return {
		lichHen: {
			lichHenId: result.lichHenId,
			phong: result.phong.maPhong,
			ngayXem: input.ngayXem,
			gioBatDau: input.gioBatDau,
			gioKetThuc: input.gioKetThuc,
			trangThai: result.trangThai,
		},
		thongBao: thongBaoResult,
	};
}

/** LichXemPhong.GuiThongBao — Mô phỏng gửi thông báo cho khách hàng */
async function guiThongBao(
	lichHen: { lichHenId: number; gioBatDau: string; gioKetThuc: string },
	khachHang: { hoTen: string; soDienThoai: string; email: string | null },
) {
	// Mô phỏng: 90% gửi thành công
	const isSuccess = Math.random() > 0.1;

	if (isSuccess) {
		// Cập nhật trạng thái gửi thông báo
		await prisma.lichHenXemPhong.update({
			where: { lichHenId: lichHen.lichHenId },
			data: { trangThaiGuiThongBao: "Đã gửi", phuongThucThongBao: khachHang.email ? "Email" : "SMS" },
		});

		return {
			success: true,
			message: `Đã gửi thông báo thành công đến ${khachHang.hoTen} (${khachHang.email ?? khachHang.soDienThoai})`,
		};
	} else {
		// Gửi thất bại — lịch hẹn vẫn lưu nhưng thông báo chưa gửi được
		await prisma.lichHenXemPhong.update({
			where: { lichHenId: lichHen.lichHenId },
			data: { trangThaiGuiThongBao: "Gửi thất bại" },
		});

		return {
			success: false,
			message: `Lịch hẹn đã được lưu. Gửi thông báo thất bại — vui lòng tự liên hệ khách hàng ${khachHang.hoTen} (SĐT: ${khachHang.soDienThoai})`,
		};
	}
}

/** Lấy danh sách yêu cầu thuê có thể lập lịch */
export async function layDanhSachYeuCauChuaLapLich() {
	return prisma.yeuCauThue.findMany({
		where: {
			trangThai: "Mới tạo",
		},
		include: {
			khachHang: true,
			nhanVien: true,
			lichHenXemPhongs: true,
		},
		orderBy: { ngayTao: "desc" },
	});
}
