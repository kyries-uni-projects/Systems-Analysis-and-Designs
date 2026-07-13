// lib/services/hopDong.service.ts
// Tầng Nghiệp vụ (BUS) cho HopDong — ứng với lớp "HopDong" trong DacTa_BUS_DB_Nhom4.md
import { prisma, type Db } from "../prisma";
import { HopDongDB } from "../repositories/hopDong.repository";

export type HopDongInfo = {
  maHopDong: string;
  hoSoNhanPhongId: number | null; // khóa thật cần truyền cho YeuCauTraPhong.taoMoi() — null nếu HĐ chưa có phòng nào (hiếm/lỗi dữ liệu)
  khachHang: string;
  phongGiuong: string;
  ngayBatDau: Date;
  ngayKetThuc: Date;
  trangThai: string;
  tienCocGoc: number;
};

function toHopDongInfo(hd: NonNullable<Awaited<ReturnType<typeof HopDongDB.timTheoTuKhoa>>>): HopDongInfo {
  // 1 hợp đồng có thể có nhiều HoSoNhanPhong (nhiều phòng) — với UC Trả phòng, ta hiển
  // thị + trả về khóa của dòng ĐẦU TIÊN. Nếu app thật cho trả phòng riêng từng phòng
  // trong 1 HĐ nhiều phòng, tầng GUI cần màn chọn phòng trước khi gọi hàm này (schema
  // hiện không tự phân biệt được "trả phòng nào" chỉ từ mã hợp đồng khi HĐ có >1 phòng).
  const hsnp = hd.hoSoNhanPhongs[0];
  const phong = hsnp?.hoSoDatCoc?.phong;
  const giuong = hsnp?.hoSoDatCoc?.giuong;
  const phongGiuong = phong ? `${phong.maPhong}${giuong ? " - " + giuong.maGiuongLocal : ""}` : "—";

  return {
    maHopDong: hd.maHopDong,
    hoSoNhanPhongId: hsnp?.hoSoNhanPhongId ?? null,
    khachHang: hd.khachHang.hoTen,
    phongGiuong,
    ngayBatDau: hd.ngayBatDau,
    ngayKetThuc: hd.ngayKetThuc,
    trangThai: hd.trangThai,
    tienCocGoc: hd.tienCocGoc,
  };
}

export const HopDong = {
  /** UC1 Màn 1: B2. Tìm hợp đồng theo từ khóa/SĐT/họ tên. Trả null nếu không thấy (-> A2). */
  async timKiem(tuKhoa?: string, sdt?: string, hoTen?: string): Promise<HopDongInfo | null> {
    const hd = await HopDongDB.timTheoTuKhoa(tuKhoa, sdt, hoTen);
    return hd ? toHopDongInfo(hd) : null;
  },

  /** UC1 Màn 2: hiển thị lại chi tiết hợp đồng theo mã (màn tự fetch, không nhận object từ màn trước). */
  async layThongTin(maHopDong: string): Promise<HopDongInfo | null> {
    const hd = await HopDongDB.docThongTin(maHopDong);
    return hd ? toHopDongInfo(hd) : null;
  },

  /**
   * Kiểm tra điều kiện được phép trả phòng: trạng thái phải "Đang cho thuê" hoặc "Đã hết hạn".
   * Trả thêm coHetHan để UC1 Màn 3 (TaoMoi) dùng cho luồng phụ A4.
   */
  kiemTraDieuKienTraPhong(trangThai: string): { hopLe: boolean; coHetHan: boolean } {
    const hopLe = trangThai === "Đang cho thuê" || trangThai === "Đã hết hạn";
    const coHetHan = trangThai === "Đã hết hạn";
    return { hopLe, coHetHan };
  },

  /** UC4 Màn 2 (nhánh khách đã ký): cập nhật trạng thái HĐ -> "Đã thanh lý".
   *  SỬA: nhận thêm `db` để tham gia transaction thật của bên gọi. */
  async capNhatTrangThai(maHopDong: string, trangThaiMoi: string, db: Db = prisma): Promise<boolean> {
    return HopDongDB.capNhatTrangThai(maHopDong, trangThaiMoi, db);
  },

  /**
   * UC4 Màn 2: chỉ đóng HĐ ("Đã thanh lý") nếu KHÔNG còn phòng nào khác trong cùng hợp
   * đồng đang chờ/đang thuê — tránh lỗi "1 hợp đồng nhiều phòng, trả 1 phòng mà đóng cả HĐ".
   * Nếu còn phòng khác chưa xong, HopDong giữ nguyên trạng thái (không đổi), chỉ riêng
   * hồ sơ trả phòng của phòng này vẫn tiếp tục các bước sau bình thường.
   * SỬA: nhận thêm `db` — được gọi bên trong transaction của BienBanTraPhong.luu(), cả 2
   * lời gọi bên trong (đếm + cập nhật) đều phải cùng nằm trên `tx` đó.
   */
  async capNhatTrangThaiNeuHetPhong(maHopDong: string, hoSoNhanPhongIdHienTai: number, db: Db = prisma): Promise<boolean> {
    const conPhongKhac = await HopDongDB.demPhongKhacChuaHoanTat(maHopDong, hoSoNhanPhongIdHienTai, db);
    if (conPhongKhac > 0) return false; // chưa đóng HĐ, còn phòng khác đang hoạt động
    return HopDongDB.capNhatTrangThai(maHopDong, "Đã thanh lý", db);
  },
};
