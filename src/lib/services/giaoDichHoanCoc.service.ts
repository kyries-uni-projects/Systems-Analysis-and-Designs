// lib/services/giaoDichHoanCoc.service.ts
// Tầng Nghiệp vụ (BUS) cho GiaoDichHoanCoc — ứng với lớp "GiaoDichHoanCoc" (UC5 + checkpoint UC4)
import { GiaoDichHoanCocDB } from "../repositories/giaoDichHoanCoc.repository";

export const GiaoDichHoanCoc = {
  /** UC5 Màn 1: ghi nhận giao dịch hoàn cọc (tiền mặt hoặc chuyển khoản). */
  async luu(params: {
    doiSoatId: number;
    keToanId: number;
    soTienHoan: number;
    phuongThucHoan: "Tiền mặt" | "Chuyển khoản";
    soTaiKhoanNhan?: string;
    duongDanChungTu?: string;
    thoiDiemThucHien: Date;
  }) {
    return GiaoDichHoanCocDB.them(params);
  },

  /** UC5 Màn 2 (Xác nhận thành công). */
  async layThongTin(doiSoatId: number) {
    return GiaoDichHoanCocDB.timTheoDoiSoatId(doiSoatId);
  },

  /** UC4 Màn 3 (Checkpoint hoàn cọc): Quản lý xem hồ sơ đã được Kế toán hoàn cọc chưa. */
  async kiemTraDaHoanCoc(doiSoatId: number): Promise<boolean> {
    return GiaoDichHoanCocDB.kiemTraTonTai(doiSoatId);
  },
};
