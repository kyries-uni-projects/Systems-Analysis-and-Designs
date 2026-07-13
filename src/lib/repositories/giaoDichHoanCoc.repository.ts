// lib/repositories/giaoDichHoanCoc.repository.ts
// Tầng Dữ liệu (DB) cho GiaoDichHoanCoc — ứng với "GiaoDichHoanCocDB"
//
// Ghi chú: khác với BienBanKiemTraTraPhong/DoiSoatHoanCoc/BienBanTraPhong, UC5 chỉ có ĐÚNG
// 1 lời ghi (them()) — không cần bọc transaction (1 câu lệnh ghi tự nó đã atomic). Vẫn thêm
// tham số `db` như các file khác để nhất quán và phòng khi sau này có service khác muốn gọi
// hàm này bên trong 1 transaction lớn hơn.
import { prisma, type Db } from "../prisma";

export const GiaoDichHoanCocDB = {
  /** UC5 Màn 1, nút "Ghi nhận giao dịch hoàn cọc". */
  async them(
    data: {
      doiSoatId: number;
      keToanId: number;
      soTienHoan: number;
      phuongThucHoan: string;
      soTaiKhoanNhan?: string;
      duongDanChungTu?: string;
      thoiDiemThucHien: Date;
    },
    db: Db = prisma,
  ) {
    return db.giaoDichHoanCoc.create({ data });
  },

  async timTheoDoiSoatId(doiSoatId: number, db: Db = prisma) {
    return db.giaoDichHoanCoc.findUnique({ where: { doiSoatId } });
  },

  /** UC4 Màn 3 (Checkpoint hoàn cọc): kiểm tra sự TỒN TẠI, không có field "daHoanCoc" riêng. */
  async kiemTraTonTai(doiSoatId: number, db: Db = prisma): Promise<boolean> {
    const count = await db.giaoDichHoanCoc.count({ where: { doiSoatId } });
    return count > 0;
  },
};
