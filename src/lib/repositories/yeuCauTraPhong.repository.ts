// lib/repositories/yeuCauTraPhong.repository.ts
// Tầng Dữ liệu (DB) cho YeuCauTraPhong — ứng với lớp "YeuCauTraPhongDB"
import { prisma, type Db } from "../prisma";

// Chuỗi include dùng chung cho docThongTin()/layDanhSach() — là nguồn duy nhất, KHÔNG lặp
// lại ở hoSoTraPhong.repository.ts nữa (trước đây 2 file viết 2 bản gần như y hệt nhau,
// dễ lệch nhau nếu sau này chỉ sửa 1 chỗ).
//
// SỬA: bổ sung nhánh `hoSoDatCoc` (khai báo trực tiếp trên YeuCauTraPhong) — trước đây chỉ
// include `hoSoNhanPhong`, nên hồ sơ thuộc case "hoàn 80% — đặt cọc nhưng chưa ký hợp đồng"
// (dùng hoSoDatCocId thay vì hoSoNhanPhongId, đúng ràng buộc exclusive-or trong schema) sẽ
// bị đọc thiếu toàn bộ thông tin khách hàng/phòng/tiền cọc. UC1 hiện tại (chỉ tìm theo
// HopDong) chưa có đường tạo hồ sơ dạng này, nhưng include ở đây để tầng BUS đọc ĐÚNG nếu
// có bản ghi loại này (vd. seed dữ liệu test, hoặc UI bổ sung sau) — không còn trả về "—"
// sai lệch một cách âm thầm.
export const yeuCauTraPhongIncludeChain = {
  hoSoNhanPhong: {
    include: {
      hopDong: { include: { khachHang: true } },
      hoSoDatCoc: { include: { phong: true, giuong: true } },
    },
  },
  hoSoDatCoc: {
    include: { khachHang: true, phong: true, giuong: true, yeuCauThanhToanCoc: true },
  },
  bienBanKiemTraTraPhong: { include: { doiSoatHoanCoc: { include: { giaoDichHoanCoc: true } } } },
  bienBanTraPhong: true,
} as const;

export const YeuCauTraPhongDB = {
  /**
   * UC1 Màn 3: tạo hồ sơ trả phòng mới.
   * SỬA: nhận thêm `hoSoDatCocId?` (song song `hoSoNhanPhongId?`) để hỗ trợ đúng ràng buộc
   * exclusive-or của schema (`hoSoNhanPhongId` XOR `hoSoDatCocId`). Việc validate "phải
   * truyền đúng 1 trong 2" nằm ở tầng BUS (yeuCauTraPhong.service.ts), không phải ở đây.
   * SỬA: nhận thêm `db` để có thể tham gia transaction của bên gọi (mặc định dùng client
   * toàn cục nếu không nằm trong transaction nào).
   */
  async them(
    data: {
      hoSoNhanPhongId?: number;
      hoSoDatCocId?: number;
      nhanVienId: number;
      ngayTraPhongDuKien: Date;
      gioTraPhong?: string;
      lyDoTraPhong?: string;
      coHetHanTheoLich: string;
      trangThai: string;
    },
    db: Db = prisma,
  ) {
    return db.yeuCauTraPhong.create({ data });
  },

  /** Dùng ở nhiều màn (UC2 M1/M2, UC3 M1/M2, UC4 M1, UC4 M3, UC4 M5...) để hiển thị lại thông tin. */
  async docThongTin(yeuCauTraPhongId: number, db: Db = prisma) {
    return db.yeuCauTraPhong.findUnique({
      where: { yeuCauTraPhongId },
      include: yeuCauTraPhongIncludeChain,
    });
  },

  /** Toàn bộ danh sách — dùng cho màn "Danh sách hồ sơ trả phòng". */
  async layDanhSach(db: Db = prisma) {
    return db.yeuCauTraPhong.findMany({
      include: yeuCauTraPhongIncludeChain,
      orderBy: { ngayTao: "desc" },
    });
  },

  /** Dùng ở UC2 M3 (-> "Đã kiểm tra, chờ đối soát cọc"), UC3 M3 (-> "Đã xác nhận đối soát"),
   *  UC4 M2 nhánh từ chối (-> "Chờ giải quyết tranh chấp"), UC4 M4 (-> "Hoàn tất").
   *  SỬA: nhận thêm `db` để tham gia đúng transaction khi được gọi từ các hàm luu()/hoanTat()
   *  ở service khác (bienBanKiemTra, doiSoatHoanCoc, bienBanTraPhong). */
  async capNhatTrangThai(yeuCauTraPhongId: number, trangThaiMoi: string, db: Db = prisma) {
    const result = await db.yeuCauTraPhong.update({
      where: { yeuCauTraPhongId },
      data: { trangThai: trangThaiMoi },
    });
    return !!result;
  },
};
