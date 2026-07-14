// lib/repositories/bienBanTraPhong.repository.ts
// Tầng Dữ liệu (DB) cho BienBanTraPhong — ứng với "BienBanTraPhongDB"
import { prisma, type Db } from "../prisma";

export const BienBanTraPhongDB = {
  /**
   * UC4 Màn 2 (nhánh khách đã ký): tạo biên bản trả phòng & thanh lý.
   * SỬA: nhận thêm `db` để tham gia transaction thật.
   * SỬA: đặt `trangThai: "Chờ thu hồi chìa khóa"` thay vì để mặc định schema
   * "Chờ ký thanh lý" — hàm này CHỈ được gọi khi khách ĐÃ KÝ (nhánh "Chờ ký thanh lý" mô tả
   * trạng thái TRƯỚC khi ký, không đúng ngay tại thời điểm tạo bản ghi này). Giữ nguyên field
   * `xacNhanKyKhach: "Đã ký"` như code gốc.
   */
  async them(
    data: {
      yeuCauTraPhongId: number;
      doiSoatId: number;
      quanLyId: number;
      ngayTraPhongThucTe: Date;
      tinhTrangBanGiaoCuoi?: string;
    },
    db: Db = prisma,
  ) {
    return db.bienBanTraPhong.create({
      data: { ...data, xacNhanKyKhach: "Đã ký", trangThai: "Chờ thu hồi chìa khóa" },
    });
  },

  /** UC4 Màn 4: đánh dấu đã thu hồi chìa khóa.
   *  SỬA: lỗi gõ nhầm tên trường (`daaThuHoiChiaKhoa` -> `daThuHoiChiaKhoa`, đúng tên cột
   *  schema) — trước đây sẽ khiến Prisma từ chối câu lệnh update khi chạy tới bước này. */
  async capNhatThuHoiChiaKhoa(bienBanTraPhongId: number, daThuHoi: boolean, db: Db = prisma) {
    const r = await db.bienBanTraPhong.update({
      where: { bienBanTraPhongId },
      data: { daThuHoiChiaKhoa: daThuHoi ? "Đã" : "Chưa", trangThai: "Hoàn tất" },
    });
    return !!r;
  },

  async timTheoYeuCauTraPhongId(yeuCauTraPhongId: number, db: Db = prisma) {
    return db.bienBanTraPhong.findUnique({ where: { yeuCauTraPhongId } });
  },
};
