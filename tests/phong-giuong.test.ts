import assert from "node:assert/strict";
import test from "node:test";
import { parseCreateGiuongInput, parseCreatePhongInput, parseUpdateGiuongInput } from "../src/types/phong";

test("phòng mới mặc định ở trạng thái Trống", () => {
	const input = parseCreatePhongInput({ maPhong: " A-101 ", idLoaiPhong: 1, sucChua: 4 });
	assert.equal(input.maPhong, "A-101");
	assert.equal(input.trangThai, "Trống");
});

test("sức chứa phòng phải là số nguyên dương", () => {
	assert.throws(() => parseCreatePhongInput({ maPhong: "A-101", idLoaiPhong: 1, sucChua: 0 }), /số nguyên dương/);
});

test("mã giường được chuẩn hóa và mặc định Trống", () => {
	assert.deepEqual(parseCreateGiuongInput({ maGiuongLocal: " G1 " }), { maGiuongLocal: "G1", trangThai: "Trống" });
});

test("không nhận trạng thái giường ngoài danh mục", () => {
	assert.throws(() => parseUpdateGiuongInput({ trangThai: "Không xác định" }), /trangThai giường không hợp lệ/);
});
