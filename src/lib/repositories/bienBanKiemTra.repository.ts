// lib/repositories/bienBanKiemTra.repository.ts
// Tầng Dữ liệu (DB) cho BienBanKiemTraTraPhong + KhoanKhauTru + NghiaVuConLai
// — ứng với "BienBanKiemTraTraPhongDB", "KhoanKhauTruDB", "NghiaVuConLaiDB"
import { prisma, type Db } from "../prisma";

export type KhoanKhauTruInput = { loaiKhoanKhauTru: string; moTa?: string; soTien: number };
export type NghiaVuConLaiInput = { loaiNghiaVu: string; soTienConNo: number; ghiChu?: string };

export const BienBanKiemTraTraPhongDB = {
  /**
   * UC2 Màn 3 (Xác nhận tổng hợp): tạo biên bản kiểm tra.
   * SỬA: nhận thêm `db` để tham gia transaction thật của bên gọi.
   * SỬA: đặt sẵn `trangThai: "Đã hoàn tất"` khi tạo — trước đây không set, nên field này bị
   * bỏ mặc định "Đang kiểm tra" (default trong schema) VĨNH VIỄN dù biên bản đã lưu xong và
   * hồ sơ đã chuyển bước tiếp theo. Biên bản trong thiết kế này luôn được tạo TRỌN VẸN 1 lần
   * (không có trạng thái nháp/dở dang), nên "Đang kiểm tra" là sai ngay từ lúc tạo.
   */
  async them(
    data: {
      yeuCauTraPhongId: number;
      quanLyId: number;
      tinhTrangVeSinh?: string;
      ghiChuKiemTra?: string;
      duongDanHinhAnh?: string;
      coHuHong: string;
    },
    db: Db = prisma,
  ) {
    return db.bienBanKiemTraTraPhong.create({ data: { ...data, trangThai: "Đã hoàn tất" } });
  },

  async docThongTin(bienBanKiemTraId: number, db: Db = prisma) {
    return db.bienBanKiemTraTraPhong.findUnique({
      where: { bienBanKiemTraId },
      include: { khoanKhauTrus: true, nghiaVuConLais: true },
    });
  },
};

export const KhoanKhauTruDB = {
  /** KhoanKhauTru dùng composite key [bienBanKiemTraId, sttKhauTru] — tự tính stt kế tiếp.
   *  SỬA: nhận thêm `db` — cả 2 câu lệnh (aggregate + create) PHẢI cùng chạy trên `db`
   *  được truyền vào để đảm bảo tính đúng đắn khi nằm trong transaction (đọc max đúng lúc). */
  async them(bienBanKiemTraId: number, kt: KhoanKhauTruInput, db: Db = prisma) {
    const max = await db.khoanKhauTru.aggregate({
      where: { bienBanKiemTraId },
      _max: { sttKhauTru: true },
    });
    const sttKhauTru = (max._max.sttKhauTru ?? 0) + 1;
    return db.khoanKhauTru.create({
      data: { bienBanKiemTraId, sttKhauTru, loaiKhoanKhauTru: kt.loaiKhoanKhauTru, moTa: kt.moTa, soTien: kt.soTien },
    });
  },
};

export const NghiaVuConLaiDB = {
  /** NghiaVuConLai dùng composite key [bienBanKiemTraId, sttNghiaVu] — tự tính stt kế tiếp. */
  async them(bienBanKiemTraId: number, nv: NghiaVuConLaiInput, db: Db = prisma) {
    const max = await db.nghiaVuConLai.aggregate({
      where: { bienBanKiemTraId },
      _max: { sttNghiaVu: true },
    });
    const sttNghiaVu = (max._max.sttNghiaVu ?? 0) + 1;
    return db.nghiaVuConLai.create({
      data: { bienBanKiemTraId, sttNghiaVu, loaiNghiaVu: nv.loaiNghiaVu, soTienConNo: nv.soTienConNo, ghiChu: nv.ghiChu },
    });
  },
};
