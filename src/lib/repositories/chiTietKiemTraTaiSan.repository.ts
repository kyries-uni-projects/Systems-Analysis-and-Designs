// src/lib/repositories/chiTietKiemTraTaiSan.repository.ts
// Tầng Dữ liệu (DB) cho ChiTietKiemTraTaiSan — bảng mới bổ sung theo review: ghi nhận tình
// trạng TỪNG tài sản đã bàn giao lúc nhận phòng, khi kiểm tra trả phòng (UC2 Màn 3).
import { prisma, type Db } from "../prisma";

export type ChiTietKiemTraTaiSanInput = {
  idTaiSanBanGiao: number;
  soLuongDaTra: number;
  tinhTrangKhiTra: string;
  coHuHongMatMat: boolean;
  chiPhiBoiThuong: number;
  ghiChu?: string;
};

export const ChiTietKiemTraTaiSanDB = {
  /** Ghi 1 dòng chi tiết cho 1 tài sản cụ thể — gọi lặp lại cho từng tài sản trong danh sách.
   *  SỬA: `coHuHongMatMat` là cột Boolean thật trong schema (không phải chuỗi "Có"/"Không"
   *  như các field trạng thái khác trong Nhóm 4) — trước đây gán nhầm thành chuỗi, khiến
   *  Prisma từ chối câu lệnh ghi (toàn bộ transaction lưu biên bản kiểm tra thất bại). */
  async them(bienBanKiemTraId: number, item: ChiTietKiemTraTaiSanInput, db: Db = prisma) {
    return db.chiTietKiemTraTaiSan.create({
      data: {
        bienBanKiemTraId,
        idTaiSanBanGiao: item.idTaiSanBanGiao,
        soLuongDaTra: item.soLuongDaTra,
        tinhTrangKhiTra: item.tinhTrangKhiTra,
        coHuHongMatMat: item.coHuHongMatMat,
        chiPhiBoiThuong: item.chiPhiBoiThuong,
        ghiChu: item.ghiChu,
      },
    });
  },

  async layDanhSachTheoBienBan(bienBanKiemTraId: number, db: Db = prisma) {
    return db.chiTietKiemTraTaiSan.findMany({
      where: { bienBanKiemTraId },
      include: { taiSanBanGiao: true },
    });
  },
};
