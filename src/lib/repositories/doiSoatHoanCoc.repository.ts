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
   */
  async them(
    data: {
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

  /** Tìm theo yeuCauTraPhongId (đi qua bienBanKiemTraTraPhong) — dùng ở UC3 M4, UC4, UC5. */
  async timTheoYeuCauTraPhongId(yeuCauTraPhongId: number, db: Db = prisma) {
    return db.doiSoatHoanCoc.findFirst({
      where: { bienBanKiemTra: { yeuCauTraPhongId } },
      include: { bienBanKiemTra: true },
    });
  },
};
