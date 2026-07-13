// lib/repositories/hoSoTraPhong.repository.ts
// Tầng Dữ liệu (DB) cho lớp tổng hợp (read-model) "HoSoTraPhong" — ứng với "HoSoTraPhongDB".
//
// SỬA: trước đây file này tự viết lại một bản include/JOIN gần như y hệt
// `YeuCauTraPhongDB.docThongTin()/layDanhSach()` ở yeuCauTraPhong.repository.ts — 2 nguồn
// dữ liệu song song, dễ lệch nhau nếu sau này chỉ sửa 1 chỗ (đúng như vậy: chỗ này thiếu
// nhánh `hoSoDatCoc` cho case hoàn 80% mà chỗ kia không thiếu). Từ nay chỉ còn 1 nguồn duy
// nhất ở `yeuCauTraPhong.repository.ts`; class này giữ nguyên tên (khớp thiết kế lớp DB đã
// thống nhất trước đó — "HoSoTraPhongDB" là read-model riêng cho màn danh sách/hiển thị) và
// chỉ ủy quyền (delegate) sang đó.
import { YeuCauTraPhongDB } from "./yeuCauTraPhong.repository";

export const HoSoTraPhongDB = {
  async layDanhSach() {
    return YeuCauTraPhongDB.layDanhSach();
  },

  async layThongTin(yeuCauTraPhongId: number) {
    return YeuCauTraPhongDB.docThongTin(yeuCauTraPhongId);
  },
};
