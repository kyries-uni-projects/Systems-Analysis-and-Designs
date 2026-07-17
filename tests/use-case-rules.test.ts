import assert from "node:assert/strict";
import test from "node:test";
import { parseLocalCalendarDate } from "../src/lib/calendar-date";
import { parseHoSoDatCocInput } from "../src/lib/hoSoDatCocInput";
import {
	laPhieuDatCocHopLeDeNhanPhong,
	phanBoThanhVienVaoChoO,
	tinhPhanBoHopDongSauPheDuyet,
	TRANG_THAI_CHO_BAN_GIAO,
} from "../src/lib/nhan-phong-rules";
import { DoiSoatHoanCoc } from "../src/lib/services/doiSoatHoanCoc.service";
import { HopDong } from "../src/lib/services/hopDong.service";
import { getWorkflowAction, workflowGroups } from "../src/lib/workflow-navigation";
import { parseLichHenNhanPhongInput } from "../src/lib/lichHenNhanPhongInput";
import { hashPassword, verifyPassword } from "../src/lib/password";
import { roleFromDatabase } from "../src/lib/user-role";
import { parseUserManagementInput } from "../src/lib/user-management-input";

test("navigation only exposes the two rental-registration use cases from the report", () => {
	const group = workflowGroups.find((item) => item.slug === "dang-ky-thue-phong");
	assert.deepEqual(group?.actions.map((action) => action.slug), ["kiem-tra-thong-tin", "lap-lich-xem-phong"]);
	assert.equal(getWorkflowAction("dang-ky-thue-phong", "lap-ho-so-thue"), null);
});

test("deposit creation preserves the source rental request", () => {
	const input = parseHoSoDatCocInput({
		yeuCauId: 12,
		khachHang: { hoTen: "Nguyễn Văn A", cccdPassport: "012345678901", gioiTinh: "Nam", soDienThoai: "0900000000" },
		yeuCauThue: { soNguoiDuKien: 1, loaiThue: "Thuê giường", khuVucMongMuon: "Khu A" },
		ngayBatDauDuKien: "2026-08-01",
		ngayKetThucDuKien: "2027-02-01",
	});
	assert.equal(input.yeuCauId, 12);
	assert.equal(input.yeuCauThue.loaiThue, "Thuê giường");
});

test("check-in appointment input rejects invalid calendar values", () => {
	const parsed = parseLichHenNhanPhongInput({ ngayNhanPhong: "2026-08-15", gioNhanPhong: "08:30", ghiChu: "Mang CCCD" });
	assert.equal(parsed.gioNhanPhong, "08:30");
	assert.equal(parsed.ghiChu, "Mang CCCD");
	assert.throws(() => parseLichHenNhanPhongInput({ ngayNhanPhong: "2026-02-30", gioNhanPhong: "08:30" }), /không tồn tại/);
	assert.throws(() => parseLichHenNhanPhongInput({ ngayNhanPhong: "2026-08-15", gioNhanPhong: "25:00" }), /không hợp lệ/);
});

test("check-in residence date rejects JavaScript calendar normalization", () => {
	assert.equal(Number.isNaN(parseLocalCalendarDate("2026-02-30").getTime()), true);
	assert.equal(Number.isNaN(parseLocalCalendarDate("30/02/2026").getTime()), true);
	assert.equal(Number.isNaN(parseLocalCalendarDate("2026-04-31").getTime()), true);
	assert.equal(Number.isNaN(parseLocalCalendarDate("2026-13-01").getTime()), true);
	assert.equal(Number.isNaN(parseLocalCalendarDate("2024-02-29").getTime()), false);
	assert.equal(Number.isNaN(parseLocalCalendarDate("29/02/2024").getTime()), false);
});

test("check-in only accepts a valid deposit with a complete appointment", () => {
	assert.equal(laPhieuDatCocHopLeDeNhanPhong({ trangThai: "Đã đặt cọc", ngayHenNhanPhong: new Date("2026-08-15"), gioHenNhanPhong: "08:30" }), true);
	assert.equal(laPhieuDatCocHopLeDeNhanPhong({ trangThai: "Đã hủy", ngayHenNhanPhong: new Date("2026-08-15"), gioHenNhanPhong: "08:30" }), false);
	assert.equal(laPhieuDatCocHopLeDeNhanPhong({ trangThai: "Đã đặt cọc", ngayHenNhanPhong: null, gioHenNhanPhong: "08:30" }), false);
	assert.equal(laPhieuDatCocHopLeDeNhanPhong({ trangThai: "Đã đặt cọc", ngayHenNhanPhong: new Date("2026-08-15"), gioHenNhanPhong: null }), false);
});

test("group check-in allocates members without exceeding gender-restricted beds", () => {
	const allocation = phanBoThanhVienVaoChoO(
		[{ gender: "Nữ" }, { gender: "Nam" }],
		[
			{ chiTietDatCocId: 11, soGiuongQuyDoi: 1, gioiTinhApDung: "Khu Nữ" },
			{ chiTietDatCocId: 12, soGiuongQuyDoi: 1, gioiTinhApDung: "Khu Nam" },
		],
	);
	assert.deepEqual(allocation, [11, 12]);
	assert.equal(phanBoThanhVienVaoChoO([{ gender: "Nam" }], [{ chiTietDatCocId: 11, soGiuongQuyDoi: 1, gioiTinhApDung: "Nữ" }]), null);
	assert.equal(phanBoThanhVienVaoChoO([{ gender: "Nam" }, { gender: "Nam" }], [{ chiTietDatCocId: 11, soGiuongQuyDoi: 1 }]), null);
});

test("approved occupancy reduces bed rental but keeps whole-room rental unchanged", () => {
	const chiTietDatCocs = [{ chiTietDatCocId: 11, soGiuongQuyDoi: 4 }];
	const thanhVienLuuTrus = [
		{ chiTietDatCocId: 11, trangThaiThamGia: "THAM_GIA" },
		{ chiTietDatCocId: 11, trangThaiThamGia: "THAM_GIA" },
		{ chiTietDatCocId: 11, trangThaiThamGia: "THAM_GIA" },
		{ chiTietDatCocId: 11, trangThaiThamGia: "LOAI_KHOI_HO_SO" },
	];

	assert.deepEqual(
		tinhPhanBoHopDongSauPheDuyet({ hinhThucThue: "Thuê giường", chiTietDatCocs, thanhVienLuuTrus }),
		[{ chiTietDatCocId: 11, soGiuongQuyDoi: 3 }],
	);
	assert.deepEqual(
		tinhPhanBoHopDongSauPheDuyet({ hinhThucThue: "Thuê nguyên phòng", chiTietDatCocs, thanhVienLuuTrus }),
		[{ chiTietDatCocId: 11, soGiuongQuyDoi: 4 }],
	);
});

test("check-in workflow follows the report order and waits for handover after payment", () => {
	const group = workflowGroups.find((item) => item.slug === "checkin");
	assert.deepEqual(group?.actions.map((action) => action.slug), [
		"kiem-tra-thong-tin",
		"phe-duyet-ho-so",
		"lap-hop-dong",
		"thanh-toan-dau-ky",
		"ban-giao-phong",
	]);
	assert.equal(TRANG_THAI_CHO_BAN_GIAO, "Cho ban giao");
});

test("Admin user input follows the report validation branches", () => {
	const parsed = parseUserManagementInput({
		hoTen: "Nguyễn Văn A",
		tenDangNhap: "nguyenvana",
		email: "vana@homestaydorm.vn",
		soDienThoai: "0901234567",
		chiNhan: "Chi nhánh trung tâm",
		vaiTro: "nhanvien",
		trangThai: "Hoạt động",
		matKhau: "temp123",
	}, "create");
	assert.equal(parsed.tenDangNhap, "nguyenvana");
	assert.equal(parsed.vaiTro, "nhanvien");
	assert.throws(() => parseUserManagementInput({ vaiTro: "nhanvien", trangThai: "Hoạt động" }, "create"), /điền đầy đủ/);
	assert.throws(() => parseUserManagementInput({ ...parsed, soDienThoai: "123", matKhau: "temp123" }, "create"), /Số điện thoại/);
	assert.throws(() => parseUserManagementInput({ ...parsed, matKhau: "123" }, "create"), /Mật khẩu/);
});

test("managed-user passwords are hashed and role values are normalized", async () => {
	const encoded = await hashPassword("temp123");
	assert.notEqual(encoded, "temp123");
	assert.equal(await verifyPassword("temp123", encoded), true);
	assert.equal(await verifyPassword("wrong", encoded), false);
	assert.equal(roleFromDatabase("Quản lý"), "quanly");
	assert.equal(roleFromDatabase("KeToan"), "ketoan");
});

test("return-room eligibility follows the report", () => {
	assert.deepEqual(HopDong.kiemTraDieuKienTraPhong("Đang cho thuê"), { hopLe: true, coHetHan: false });
	assert.deepEqual(HopDong.kiemTraDieuKienTraPhong("Đã hết hạn"), { hopLe: true, coHetHan: true });
	assert.equal(HopDong.kiemTraDieuKienTraPhong("Đã thanh lý").hopLe, false);
});

test("deposit reconciliation applies the documented refund rates and deductions", () => {
	assert.equal(DoiSoatHoanCoc.deXuatTyLeHoanCoc("Đã hết hạn", 3), 100);
	assert.equal(DoiSoatHoanCoc.deXuatTyLeHoanCoc("Đang cho thuê", 5), 50);
	assert.equal(DoiSoatHoanCoc.deXuatTyLeHoanCoc("Đang cho thuê", 6), 70);
	assert.equal(DoiSoatHoanCoc.tinhSoTienHoanTheoTyLe(4_000_000, 70), 2_800_000);
	assert.equal(DoiSoatHoanCoc.tinhTienHoanThucTe(2_800_000, [{ loaiKhoanKhauTru: "Hư hỏng", soTien: 3_000_000 }]), -200_000);
});
