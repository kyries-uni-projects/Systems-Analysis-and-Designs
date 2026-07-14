// lib/services/bienBanKiemTra.service.ts
// Tầng Nghiệp vụ (BUS) cho BienBanKiemTraTraPhong — ứng với lớp "BienBanKiemTraTraPhong"
// (UC2 Màn 3: Xác nhận tổng hợp — nơi lưu dữ liệu thật duy nhất của UC2)
import { prisma } from "../prisma";
import {
  BienBanKiemTraTraPhongDB,
  KhoanKhauTruDB,
  NghiaVuConLaiDB,
  type KhoanKhauTruInput,
  type NghiaVuConLaiInput,
} from "../repositories/bienBanKiemTra.repository";
import { ChiTietKiemTraTaiSanDB, type ChiTietKiemTraTaiSanInput } from "../repositories/chiTietKiemTraTaiSan.repository";
import { YeuCauTraPhong } from "./yeuCauTraPhong.service";

export const BienBanKiemTraTraPhong = {
  /**
   * UC2 Màn 3, nút "Xác nhận hoàn tất kiểm tra". Gọi tuần tự (trong 1 transaction để đảm
   * bảo toàn vẹn — sequence diagram thể hiện các bước này là lời gọi nối tiếp nhau):
   *  1) tạo biên bản kiểm tra
   *  2) lặp qua dsChiTietTaiSan, tạo từng ChiTietKiemTraTaiSan (SỬA — bổ sung theo review:
   *     trước đây tình trạng TỪNG tài sản thu thập ở UI nhưng không có chỗ lưu, chỉ có tình
   *     trạng tổng quát + khấu trừ gộp)
   *  3) lặp qua dsKhauTru, tạo từng KhoanKhauTru
   *  4) lặp qua dsNghiaVu, tạo từng NghiaVuConLai
   *  5) cập nhật YeuCauTraPhong.trangThai -> "Đã kiểm tra, chờ đối soát cọc"
   *
   * SỬA (lỗi transaction giả): trước đây các bước trên gọi các hàm DB mà bản thân chúng
   * luôn dùng client toàn cục (không dùng `tx` được `$transaction` cấp) — nên KHÔNG thật sự
   * nằm trong 1 transaction, dữ liệu có thể half-way nếu lỗi giữa chừng. Giờ `tx` được
   * truyền tường minh xuống từng lời gọi DB/BUS bên trong.
   */
  async luu(params: {
    yeuCauTraPhongId: number;
    quanLyId: number;
    tinhTrangVeSinh?: string;
    ghiChuKiemTra?: string;
    duongDanHinhAnh?: string;
    coHuHong: boolean;
    dsChiTietTaiSan: ChiTietKiemTraTaiSanInput[];
    dsKhauTru: KhoanKhauTruInput[];
    dsNghiaVu: NghiaVuConLaiInput[];
  }) {
    return prisma.$transaction(async (tx) => {
      const bb = await BienBanKiemTraTraPhongDB.them(
        {
          yeuCauTraPhongId: params.yeuCauTraPhongId,
          quanLyId: params.quanLyId,
          tinhTrangVeSinh: params.tinhTrangVeSinh,
          ghiChuKiemTra: params.ghiChuKiemTra,
          duongDanHinhAnh: params.duongDanHinhAnh,
          coHuHong: params.coHuHong ? "Có" : "Không",
        },
        tx,
      );

      for (const ct of params.dsChiTietTaiSan) {
        await ChiTietKiemTraTaiSanDB.them(bb.bienBanKiemTraId, ct, tx);
      }
      for (const kt of params.dsKhauTru) {
        await KhoanKhauTruDB.them(bb.bienBanKiemTraId, kt, tx);
      }
      for (const nv of params.dsNghiaVu) {
        await NghiaVuConLaiDB.them(bb.bienBanKiemTraId, nv, tx);
      }

      await YeuCauTraPhong.capNhatTrangThai(params.yeuCauTraPhongId, "Đã kiểm tra, chờ đối soát cọc", tx);

      return bb;
    });
  },

  /** UC2 Màn 4 (Thành công): đọc lại biên bản vừa lưu. */
  async layThongTin(bienBanKiemTraId: number) {
    return BienBanKiemTraTraPhongDB.docThongTin(bienBanKiemTraId);
  },

  /**
   * UC3 Màn 2 (Khấu trừ phát sinh): đọc lại danh sách khoản khấu trừ Quản lý đã ghi nhận ở
   * UC2, để Kế toán thấy ngay khi mở hồ sơ (thay vì phải gõ lại từ đầu — đây chính là lỗi
   * đã sửa: trước đây UC3 không hề gọi hàm này, màn "Khấu trừ phát sinh" luôn trống).
   */
  async layDsKhauTru(bienBanKiemTraId: number) {
    const bb = await BienBanKiemTraTraPhongDB.docThongTin(bienBanKiemTraId);
    return bb?.khoanKhauTrus ?? [];
  },

  /** Đọc chi tiết tình trạng từng tài sản của 1 biên bản (dùng khi hiển thị lại/audit). */
  async layChiTietTaiSan(bienBanKiemTraId: number) {
    return ChiTietKiemTraTaiSanDB.layDanhSachTheoBienBan(bienBanKiemTraId);
  },
};
