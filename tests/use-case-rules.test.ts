import assert from "node:assert/strict";
import test from "node:test";
import { parseHoSoDatCocInput } from "../src/lib/hoSoDatCocInput";
import { DoiSoatHoanCoc } from "../src/lib/services/doiSoatHoanCoc.service";
import { HopDong } from "../src/lib/services/hopDong.service";
import { getWorkflowAction, workflowGroups } from "../src/lib/workflow-navigation";

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
