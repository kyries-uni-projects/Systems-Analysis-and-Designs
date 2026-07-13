// lib/services/phongGiuong.service.ts
// Tầng Nghiệp vụ (BUS) cho PhongGiuong — ứng với lớp "PhongGiuong"
import { prisma, type Db } from "../prisma";
import { PhongGiuongDB } from "../repositories/phongGiuong.repository";

export const PhongGiuong = {
  /**
   * UC4 Màn 4 (Thu hồi & hoàn tất), gọi nội bộ từ BienBanTraPhong.hoanTat().
   * Nếu khách thuê nguyên phòng (giuongId null trên HoSoDatCoc) -> cập nhật Phong.
   * Nếu thuê theo giường -> cập nhật Giuong (phòng có thể còn giường khác đang ở).
   * SỬA: nhận thêm `db` để tham gia transaction thật của BienBanTraPhong.hoanTat().
   */
  async capNhatTrangThai(
    params: { phongId: number; giuongId: number | null },
    trangThaiMoi: string,
    db: Db = prisma,
  ): Promise<boolean> {
    if (params.giuongId) {
      return PhongGiuongDB.capNhatTrangThaiGiuong(params.giuongId, trangThaiMoi, db);
    }
    return PhongGiuongDB.capNhatTrangThaiPhong(params.phongId, trangThaiMoi, db);
  },
};
