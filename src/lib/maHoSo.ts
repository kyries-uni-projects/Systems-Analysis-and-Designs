// lib/maHoSo.ts
// Schema thật KHÔNG có field "mã hồ sơ" dạng chuỗi (vd "TRP-2025-000045") — khóa thật
// là yeuCauTraPhongId (Int, tự tăng). 2 hàm dưới đây chỉ phục vụ HIỂN THỊ trên giao diện,
// khớp đúng định dạng UI hiện có ("TRP-<năm>-<6 số>"). Nếu muốn giữ URL dạng
// /tra-phong/kiem-tra/TRP-2025-000045 thay vì /tra-phong/kiem-tra/45, dùng parseMaHoSo()
// ở đầu mỗi route/server action để đổi ngược lại thành số trước khi query DB.

export function formatMaHoSo(yeuCauTraPhongId: number, nam: number = new Date().getFullYear()): string {
  return `TRP-${nam}-${String(yeuCauTraPhongId).padStart(6, "0")}`;
}

/** Trả về null nếu chuỗi không đúng định dạng "TRP-YYYY-NNNNNN". */
export function parseMaHoSo(maHoSo: string): number | null {
  const match = /^TRP-\d{4}-(\d+)$/.exec(maHoSo.trim());
  if (!match) return null;
  return parseInt(match[1], 10);
}

export function formatMaBienBanKiemTra(bienBanKiemTraId: number, nam: number = new Date().getFullYear()): string {
  return `BBKT-${nam}-${String(bienBanKiemTraId).padStart(6, "0")}`;
}
