// lib/repositories/doiSoatHoanCoc.repository.ts
// Tầng Dữ liệu (DB) cho DoiSoatHoanCoc — ứng với "DoiSoatHoanCocDB"
import { prisma, type Db } from "../prisma";

export const DoiSoatHoanCocDB = {
  /**
   * UC3 Màn 3 (Lập phiếu & thông báo KH): lưu bảng đối soát.
   * SỬA: nhận thêm `db` để tham gia transaction thật (xem doiSoatHoanCoc.service.ts).
   * SỬA: đặt `trangThai: "Đã xác nhận"` khi tạo — bản ghi này chỉ được tạo SAU KHI khách
   * hàng đã đồng ý (xacNhanKhachHang = "Đã đồng ý", là điều kiện tiên quyết để gọi luu()),
   * nên để mặc định schema "Chờ xác nhận" là sai ngay từ lúc tạo, gây lệch với
   * xacNhanKhachHang.
   * SỬA (schema v7 — lỗi thật, bỏ sót ở lần review trước): DoiSoatHoanCoc giờ có field
   * `yeuCauTraPhongId` BẮT BUỘC (unique, không có default) — trước đây hàm này không nhận
   * field này, khiến Prisma từ chối câu lệnh tạo (toàn bộ transaction thất bại, hiện "Lỗi
   * hệ thống" khi bấm "Xác nhận đối soát").
   */
  async them(
    data: {
      yeuCauTraPhongId: number;
      bienBanKiemTraId: number;
      keToanId: number;
      tienCocGoc: number;
      tyLeHoanCoc: number;
      soTienHoanCoBan: number;
      tongKhauTru: number;
      soTienHoanThucNhan: number;
      soTienCanThuThem: number;
      xacNhanKhachHang: string;
    },
    db: Db = prisma,
  ) {
    return db.doiSoatHoanCoc.create({ data: { ...data, trangThai: "Đã xác nhận" } });
  },

  /** Tìm theo yeuCauTraPhongId — SỬA (schema v7): giờ đọc trực tiếp field này trên
   *  DoiSoatHoanCoc (trước đây phải đi vòng qua bienBanKiemTra, nay bienBanKiemTraId là
   *  optional nên đường vòng cũ không còn đáng tin). */
  async timTheoYeuCauTraPhongId(yeuCauTraPhongId: number, db: Db = prisma) {
    return db.doiSoatHoanCoc.findUnique({ where: { yeuCauTraPhongId } });
  },
};
