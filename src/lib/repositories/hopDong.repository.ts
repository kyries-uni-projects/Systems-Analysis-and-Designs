// lib/repositories/hopDong.repository.ts
// Tầng Dữ liệu (DB) cho HopDong — ứng với lớp "HopDongDB" trong DacTa_BUS_DB_Nhom4.md
import { prisma, type Db } from "../prisma";

export const HopDongDB = {
  /** UC1 Màn 1 (Tìm kiếm hợp đồng): tìm theo mã HĐ hoặc theo SĐT/họ tên khách hàng. */
  async timTheoTuKhoa(tuKhoa?: string, sdt?: string, hoTen?: string) {
    return prisma.hopDong.findFirst({
      where: {
        OR: [
          tuKhoa ? { maHopDong: tuKhoa } : undefined,
          sdt ? { khachHang: { soDienThoai: sdt } } : undefined,
          hoTen ? { khachHang: { hoTen: { contains: hoTen } } } : undefined,
        ].filter(Boolean) as object[],
      },
      include: {
        khachHang: true,
        hoSoNhanPhongs: { include: { hoSoDatCoc: { include: { phong: true, giuong: true } } } },
      },
    });
  },

  /** UC1 Màn 2 (Thông tin hợp đồng): lấy chi tiết theo đúng 1 mã hợp đồng. */
  async docThongTin(maHopDong: string) {
    return prisma.hopDong.findUnique({
      where: { maHopDong },
      include: {
        khachHang: true,
        hoSoNhanPhongs: { include: { hoSoDatCoc: { include: { phong: true, giuong: true } } } },
      },
    });
  },

  /** UC4 Màn 2: đếm số HoSoNhanPhong KHÁC (cùng hợp đồng, khác phòng đang xử lý) mà
   *  YeuCauTraPhong tương ứng CHƯA "Hoàn tất" — dùng để tránh đóng cả hợp đồng khi
   *  hợp đồng có nhiều phòng và mới chỉ 1 phòng được trả.
   *  SỬA: nhận thêm `db` — hàm này được gọi bên trong transaction của
   *  BienBanTraPhong.luu(), phải đọc trên cùng `tx` để thấy đúng dữ liệu vừa ghi (nếu có). */
  async demPhongKhacChuaHoanTat(maHopDong: string, hoSoNhanPhongIdHienTai: number, db: Db = prisma): Promise<number> {
    return db.hoSoNhanPhong.count({
      where: {
        hopDong: { maHopDong },
        hoSoNhanPhongId: { not: hoSoNhanPhongIdHienTai },
        OR: [
          { yeuCauTraPhong: null }, // phòng còn lại chưa từng đăng ký trả phòng -> vẫn đang ở
          { yeuCauTraPhong: { trangThai: { not: "Hoàn tất" } } },
        ],
      },
    });
  },

  /** UC4 Màn 2 (Lập biên bản & ký thanh lý): cập nhật trạng thái HĐ -> "Đã thanh lý".
   *  SỬA: nhận thêm `db` để tham gia transaction thật. */
  async capNhatTrangThai(maHopDong: string, trangThaiMoi: string, db: Db = prisma) {
    const result = await db.hopDong.update({
      where: { maHopDong },
      data: { trangThai: trangThaiMoi },
    });
    return !!result;
  },
};
