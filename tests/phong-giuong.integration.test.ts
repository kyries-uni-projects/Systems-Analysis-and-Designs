import assert from "node:assert/strict";
import { after, test } from "node:test";
import { prisma } from "../src/lib/prisma";
import { createGiuong, createPhong, listPhong, updateGiuong, updatePhong } from "../src/lib/services/phongService";

const useTemporaryDatabase = process.env.RUN_DB_INTEGRATION === "1";

after(async () => {
	await prisma.$disconnect();
});

test("quản lý phòng/giường giữ đúng sức chứa và trả dữ liệu lồng nhau", { skip: !useTemporaryDatabase }, async () => {
	const suffix = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
	const roomType = await prisma.loaiPhong.create({ data: { tenLoaiPhong: `Loại PG ${suffix}`, donGia: 1_750_000 } });
	let roomId: number | undefined;
	let bedId: number | undefined;

	try {
		const room = await createPhong({ maPhong: `PG-${suffix}`, idLoaiPhong: roomType.idLoaiPhong, sucChua: 2, khu: "Khu test" });
		roomId = room.phongId;
		const bed = await createGiuong(room.phongId, { maGiuongLocal: "G1" });
		bedId = bed.giuongId;
		await createGiuong(room.phongId, { maGiuongLocal: "G2" });

		await assert.rejects(createGiuong(room.phongId, { maGiuongLocal: "G3" }), /đã đủ 2 giường/);
		await assert.rejects(updatePhong(room.phongId, { sucChua: 1 }), /không thể nhỏ hơn 2 giường/);

		const result = await listPhong({ search: `PG-${suffix}`, pageSize: 10 });
		assert.equal(result.total, 1);
		assert.deepEqual(result.items[0].giuongs.map((bed) => bed.maGiuongLocal), ["G1", "G2"]);
		assert.equal(result.items[0].loaiPhong.donGia, 1_750_000);

		const user = await prisma.nguoiDung.create({ data: { hoTen: "Sale PG", tenDangNhap: `sale-pg-${suffix}`, matKhauHash: "test", vaiTro: "SALE" } });
		const customer = await prisma.khachHang.create({ data: { hoTen: "Khách PG", cccdPassport: `PG-${suffix}`, soDienThoai: "0900000000" } });
		const request = await prisma.yeuCauThue.create({ data: { khachHangId: customer.khachHangId, nhanVienId: user.nguoiDungId, loaiThue: "Thuê giường", soNguoiDuKien: 1 } });
		const deposit = await prisma.hoSoDatCoc.create({ data: { maHoSoDatCoc: `DC-PG-${suffix}`, yeuCauId: request.yeuCauId, khachHangId: customer.khachHangId, nhanVienId: user.nguoiDungId, hinhThucThue: "Thuê giường", ngayBatDauDuKien: new Date("2026-08-01"), ngayKetThucDuKien: new Date("2027-08-01") } });
		const depositDetail = await prisma.chiTietDatCoc.create({ data: { hoSoDatCocId: deposit.hoSoDatCocId, phongId: room.phongId, giuongId: bed.giuongId, giaThueThoaThuan: 1_750_000, tienCocPhanBo: 1_750_000 } });
		const checkIn = await prisma.hoSoNhanPhong.create({ data: { maHoSoNhanPhong: `NP-PG-${suffix}`, hoSoDatCocId: deposit.hoSoDatCocId, nhanVienId: user.nguoiDungId } });
		const rules = await prisma.mauNoiQuy.create({ data: { tenMau: `Nội quy PG ${suffix}`, noiQuy: "Test", quyDinhHoanCoc: "Test", dieuKhoanViPham: "Test" } });
		const contract = await prisma.hopDong.create({ data: { maHopDong: `HD-PG-${suffix}`, hoSoNhanPhongId: checkIn.hoSoNhanPhongId, khachHangId: customer.khachHangId, nhanVienId: user.nguoiDungId, idMauNoiQuy: rules.idMauNoiQuy, tienCocGoc: 1_750_000, trangThai: "Đang cho thuê" } });
		await prisma.chiTietHopDong.create({ data: { hopDongId: contract.hopDongId, chiTietDatCocId: depositDetail.chiTietDatCocId, phongId: room.phongId, giuongId: bed.giuongId, hinhThucThue: "Thuê giường", giaThueThoaThuan: 1_750_000, tienCocPhanBo: 1_750_000, ngayBatDau: new Date("2026-08-01"), ngayKetThuc: new Date("2027-08-01") } });

		await assert.rejects(updateGiuong(room.phongId, bed.giuongId, { trangThai: "Đang bảo trì" }), /đang có 1 phân bổ thuê/);
		const updatedBed = await updateGiuong(room.phongId, bed.giuongId, { trangThai: "Đang bảo trì" }, { xacNhanDangThue: true });
		assert.equal(updatedBed.trangThai, "Đang bảo trì");
	} finally {
		if (bedId) await prisma.chiTietHopDong.deleteMany({ where: { giuongId: bedId } });
		await prisma.hopDong.deleteMany({ where: { maHopDong: `HD-PG-${suffix}` } });
		await prisma.hoSoNhanPhong.deleteMany({ where: { maHoSoNhanPhong: `NP-PG-${suffix}` } });
		await prisma.chiTietDatCoc.deleteMany({ where: { hoSoDatCoc: { maHoSoDatCoc: `DC-PG-${suffix}` } } });
		await prisma.hoSoDatCoc.deleteMany({ where: { maHoSoDatCoc: `DC-PG-${suffix}` } });
		await prisma.yeuCauThue.deleteMany({ where: { khachHang: { cccdPassport: `PG-${suffix}` } } });
		await prisma.mauNoiQuy.deleteMany({ where: { tenMau: `Nội quy PG ${suffix}` } });
		await prisma.khachHang.deleteMany({ where: { cccdPassport: `PG-${suffix}` } });
		await prisma.nguoiDung.deleteMany({ where: { tenDangNhap: `sale-pg-${suffix}` } });
		if (roomId) await prisma.giuong.deleteMany({ where: { phongId: roomId } });
		if (roomId) await prisma.phong.deleteMany({ where: { phongId: roomId } });
		await prisma.loaiPhong.deleteMany({ where: { idLoaiPhong: roomType.idLoaiPhong } });
	}
});
