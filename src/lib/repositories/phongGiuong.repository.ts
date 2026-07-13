// lib/repositories/phongGiuong.repository.ts
// Tầng Dữ liệu (DB) cho PhongGiuong — ứng với "PhongGiuongDB". Cập nhật trạng thái Phong
// và/hoặc Giuong tùy hồ sơ trả 1 phòng riêng hay cả phòng (xem services để biết logic chọn).
import { prisma, type Db } from "../prisma";

export const PhongGiuongDB = {
  /** SỬA: nhận thêm `db` — được gọi bên trong transaction của BienBanTraPhong.hoanTat(). */
  async capNhatTrangThaiPhong(phongId: number, trangThaiMoi: string, db: Db = prisma) {
    const r = await db.phong.update({ where: { phongId }, data: { trangThai: trangThaiMoi } });
    return !!r;
  },
  async capNhatTrangThaiGiuong(giuongId: number, trangThaiMoi: string, db: Db = prisma) {
    const r = await db.giuong.update({ where: { giuongId }, data: { trangThai: trangThaiMoi } });
    return !!r;
  },
};
