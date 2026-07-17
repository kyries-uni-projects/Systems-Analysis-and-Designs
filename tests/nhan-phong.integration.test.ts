import assert from "node:assert/strict";
import { after, test } from "node:test";
import { prisma } from "../src/lib/prisma";
import { luuBienBanBanGiao, chiTietBanGiaoPhong } from "../src/lib/services/banGiaoPhong.service";
import {
	chiTietKiemTraThongTin,
	danhSachKiemTraThongTin,
	luuVaChuyenKiemTraDieuKien,
} from "../src/lib/services/kiemTraThongTinNhanPhong.service";
import { luuHopDong } from "../src/lib/services/lapHopDong.service";
import { luuKetQuaXetDuyet } from "../src/lib/services/pheDuyetHoSoLuuTru.service";
import { chiTietThanhToanDauKy, hoanTatThanhToanDauKy } from "../src/lib/services/thanhToanDauKy.service";

const useTemporaryDatabase = process.env.RUN_DB_INTEGRATION === "1";

after(async () => {
	await prisma.$disconnect();
});

test("check-in workflow persists the report state transitions and replacement representative", { skip: !useTemporaryDatabase }, async () => {
	const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
	const cccdBase = String(Date.now()).slice(-10);
	const oldRepresentativeCccd = `10${cccdBase}`;
	const newRepresentativeCccd = `20${cccdBase}`;
	const [sale, manager, accountant] = await Promise.all([
		prisma.nguoiDung.create({ data: { hoTen: "Sale test", tenDangNhap: `sale-${suffix}`, matKhauHash: "test", vaiTro: "SALE" } }),
		prisma.nguoiDung.create({ data: { hoTen: "Manager test", tenDangNhap: `manager-${suffix}`, matKhauHash: "test", vaiTro: "QUAN_LY" } }),
		prisma.nguoiDung.create({ data: { hoTen: "Accountant test", tenDangNhap: `accountant-${suffix}`, matKhauHash: "test", vaiTro: "KE_TOAN" } }),
	]);
	const customer = await prisma.khachHang.create({
		data: { hoTen: "Đại diện cũ", cccdPassport: oldRepresentativeCccd, gioiTinh: "Nữ", soDienThoai: "0900000001" },
	});
	const roomType = await prisma.loaiPhong.create({ data: { tenLoaiPhong: `Loại test ${suffix}`, donGia: 2_000_000 } });
	const room = await prisma.phong.create({
		data: { maPhong: `NP-${suffix}`, khu: "Khu Nữ", tang: 1, idLoaiPhong: roomType.idLoaiPhong, sucChua: 2, gioiTinhApDung: "Nữ", trangThai: "Trống" },
	});
	const [bed1, bed2] = await Promise.all([
		prisma.giuong.create({ data: { phongId: room.phongId, maGiuongLocal: "G1", trangThai: "Đã cọc" } }),
		prisma.giuong.create({ data: { phongId: room.phongId, maGiuongLocal: "G2", trangThai: "Đã cọc" } }),
	]);
	const request = await prisma.yeuCauThue.create({
		data: { khachHangId: customer.khachHangId, nhanVienId: sale.nguoiDungId, loaiThue: "Thuê giường", soNguoiDuKien: 2, soLuongGiuongDuKien: 2, trangThai: "Đã đặt cọc" },
	});
	const deposit = await prisma.hoSoDatCoc.create({
		data: {
			maHoSoDatCoc: `DC-${suffix}`,
			yeuCauId: request.yeuCauId,
			khachHangId: customer.khachHangId,
			nhanVienId: sale.nguoiDungId,
			hinhThucThue: "Thuê giường",
			ngayBatDauDuKien: new Date("2026-08-15"),
			ngayKetThucDuKien: new Date("2027-02-15"),
			trangThai: "Đã đặt cọc",
			ngayHenNhanPhong: new Date("2026-08-15"),
			gioHenNhanPhong: "08:30",
		},
	});
	await prisma.chiTietDatCoc.createMany({
		data: [bed1, bed2].map((bed) => ({
			hoSoDatCocId: deposit.hoSoDatCocId,
			phongId: room.phongId,
			giuongId: bed.giuongId,
			giaThueThoaThuan: 2_000_000,
			soGiuongQuyDoi: 1,
			tienCocPhanBo: 4_000_000,
			trangThai: "Đã cọc",
		})),
	});
	await prisma.mauNoiQuy.create({
		data: { tenMau: `Mẫu test ${suffix}`, noiQuy: "Giữ vệ sinh", quyDinhHoanCoc: "Theo hợp đồng", dieuKhoanViPham: "Bồi thường hư hỏng", trangThai: "Đang dùng" },
	});
	const perPersonFee = await prisma.khoanPhiDichVu.create({
		data: { tenLoaiPhi: `Phí theo người ${suffix}`, donViTinh: "người/tháng", donGia: 100_000, trangThai: "Đang áp dụng" },
	});
	let asset = await prisma.taiSanMacDinh.findFirst({ where: { trangThai: { in: ["Dang dung", "Đang dùng"] } } });
	asset ??= await prisma.taiSanMacDinh.create({ data: { tenTaiSan: `Tài sản test ${suffix}`, soLuongMacDinh: 1, trangThai: "Đang dùng" } });
	const [checkInDetail, phoneSearch] = await Promise.all([
		chiTietKiemTraThongTin(deposit.maHoSoDatCoc),
		danhSachKiemTraThongTin(customer.soDienThoai),
	]);
	assert.equal(checkInDetail.daXacMinhGiayTo, false);
	assert.equal(phoneSearch.items.some((item) => item.code === deposit.maHoSoDatCoc), true);

	const checkIn = await luuVaChuyenKiemTraDieuKien(deposit.maHoSoDatCoc, sale.nguoiDungId, {
		ngayBatDauCuTru: "2026-08-15",
		thoiHanThueThang: 6,
		daXacMinhGiayTo: true,
		members: [{ name: "Đại diện mới", cccd: newRepresentativeCccd, gender: "Nữ", phone: "0900000002" }],
	});
	const members = await prisma.thanhVienLuuTru.findMany({ where: { hoSoNhanPhong: { maHoSoNhanPhong: checkIn.maHoSoNhanPhong } }, orderBy: { sttThanhVien: "asc" } });
	assert.equal(new Set(members.map((member) => member.chiTietDatCocId)).size, 2);
	await assert.rejects(
		luuKetQuaXetDuyet(checkIn.maHoSoNhanPhong, manager.nguoiDungId, {
			groupOption: "continue",
			members: [
				{ thanhVienLuuTruId: members[0].thanhVienLuuTruId, status: "rejected", rejectReason: "Không đủ điều kiện" },
				{ thanhVienLuuTruId: members[1].thanhVienLuuTruId, status: "approved" },
			],
		}),
		/chon nguoi dai dien moi/i,
	);

	await luuKetQuaXetDuyet(checkIn.maHoSoNhanPhong, manager.nguoiDungId, {
		groupOption: "continue",
		representativeMemberId: members[1].thanhVienLuuTruId,
		members: [
			{ thanhVienLuuTruId: members[0].thanhVienLuuTruId, status: "rejected", rejectReason: "Không đủ điều kiện" },
			{ thanhVienLuuTruId: members[1].thanhVienLuuTruId, status: "approved" },
		],
	});
	const representative = await prisma.thanhVienLuuTru.findFirst({ where: { hoSoNhanPhong: { maHoSoNhanPhong: checkIn.maHoSoNhanPhong }, laNguoiDaiDien: true } });
	assert.equal(representative?.thanhVienLuuTruId, members[1].thanhVienLuuTruId);
	const rejectedAllocation = await prisma.chiTietDatCoc.findUniqueOrThrow({
		where: { chiTietDatCocId: members[0].chiTietDatCocId },
		include: { giuong: true },
	});
	assert.equal(rejectedAllocation.trangThai, "Đã hủy");
	assert.equal(rejectedAllocation.giuong?.trangThai, "Trống");

	await luuHopDong(checkIn.maHoSoNhanPhong, sale.nguoiDungId, { daXacNhanKhachDaKy: true });
	const contract = await prisma.hopDong.findFirstOrThrow({
		where: { hoSoNhanPhong: { maHoSoNhanPhong: checkIn.maHoSoNhanPhong } },
		include: { khachHang: true, chiTietHopDongs: true, khoanPhiHopDongs: true },
	});
	assert.equal(contract.khachHang.cccdPassport, members[1].soGiayTo);
	assert.equal(contract.chiTietHopDongs.length, 1);
	assert.equal(contract.chiTietHopDongs[0]?.soGiuongQuyDoi, 1);
	assert.equal(contract.khoanPhiHopDongs.find((fee) => fee.idKhoanPhi === perPersonFee.idKhoanPhi)?.soLuong, 1);

	const paymentDetail = await chiTietThanhToanDauKy(checkIn.maHoSoNhanPhong);
	assert.equal(paymentDetail.charges.find((charge) => charge.source === "rent")?.amount, 2_000_000);
	const payment = await hoanTatThanhToanDauKy(checkIn.maHoSoNhanPhong, accountant.nguoiDungId, { charges: paymentDetail.charges, phuongThucThu: "Tien mat" });
	assert.equal(payment.trangThaiHoSo, "Cho ban giao");

	const handoverDetail = await chiTietBanGiaoPhong(checkIn.maHoSoNhanPhong);
	await luuBienBanBanGiao(checkIn.maHoSoNhanPhong, manager.nguoiDungId, {
		customerSigned: true,
		assets: [{ assetId: asset.idTaiSanMacDinh, quantity: 1 }],
	});
	const [savedRoom, savedBeds, savedCheckIn] = await Promise.all([
		prisma.phong.findUniqueOrThrow({ where: { phongId: room.phongId } }),
		prisma.giuong.findMany({ where: { phongId: room.phongId } }),
		prisma.hoSoNhanPhong.findUniqueOrThrow({ where: { maHoSoNhanPhong: handoverDetail.code } }),
	]);
	assert.equal(savedRoom.trangThai, "Trống");
	assert.deepEqual(savedBeds.map((bed) => bed.trangThai).sort(), ["Dang su dung", "Trống"]);
	assert.equal(savedCheckIn.trangThai, "Hoan tat");
});
