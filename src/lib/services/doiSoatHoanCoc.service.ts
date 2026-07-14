// lib/services/doiSoatHoanCoc.service.ts
// Tầng Nghiệp vụ (BUS) cho DoiSoatHoanCoc — ứng với lớp "DoiSoatHoanCoc"
import { prisma } from "../prisma";
import { DoiSoatHoanCocDB } from "../repositories/doiSoatHoanCoc.repository";
import type { KhoanKhauTruInput } from "../repositories/bienBanKiemTra.repository";
import { YeuCauTraPhong } from "./yeuCauTraPhong.service";

export const DoiSoatHoanCoc = {
  /** UC3 Màn 1: đề xuất tỷ lệ hoàn cọc cơ bản theo đặc tả A3 (4 mức) — tính toán thuần túy, không gọi DB. */
  deXuatTyLeHoanCoc(trangThaiHopDong: string, soThangLuuTru: number): number {
    if (trangThaiHopDong === "Đã hết hạn") return 100;
    return soThangLuuTru >= 6 ? 70 : 50;
    // Case 80% ("đã đặt cọc nhưng chưa ký HĐ") không suy ra được từ 2 tham số này —
    // Kế toán tự chọn thủ công trên UI nếu rơi vào trường hợp đó (xem UC3 Màn 1).
  },

  /** UC3 Màn 1: tính toán thuần túy, không gọi DB. */
  tinhSoTienHoanTheoTyLe(tienCocGoc: number, tyLe: number): number {
    return Math.round((tienCocGoc * tyLe) / 100);
  },

  /** UC3 Màn 2: tính toán thuần túy. Kết quả âm nghĩa là cần thu thêm (A6). */
  tinhTienHoanThucTe(soTienHoanCoBan: number, dsKhauTru: KhoanKhauTruInput[]): number {
    const tongKhauTru = dsKhauTru.reduce((sum, kt) => sum + kt.soTien, 0);
    return soTienHoanCoBan - tongKhauTru;
  },

  /**
   * UC3 Màn 3, nút "Xác nhận đối soát" (chỉ khi KH đồng ý). Lưu xong cập nhật trạng thái hồ sơ.
   *
   * SỬA (thiếu transaction): trước đây 2 bước ghi (tạo DoiSoatHoanCoc rồi cập nhật trạng
   * thái hồ sơ) chạy tuần tự KHÔNG có transaction bao ngoài — nếu bước 2 lỗi, sẽ có 1
   * DoiSoatHoanCoc tồn tại nhưng hồ sơ vẫn kẹt ở trạng thái cũ (dữ liệu không nhất quán).
   * Giờ bọc cả 2 bước trong `prisma.$transaction()`, `tx` được truyền xuống cả 2 lời gọi.
   */
  async luu(params: {
    yeuCauTraPhongId: number;
    bienBanKiemTraId: number;
    keToanId: number;
    tienCocGoc: number;
    tyLeHoanCoc: number;
    soTienHoanCoBan: number;
    dsKhauTru: KhoanKhauTruInput[];
  }) {
    const tongKhauTru = params.dsKhauTru.reduce((sum, kt) => sum + kt.soTien, 0);
    const ketQua = params.soTienHoanCoBan - tongKhauTru;

    return prisma.$transaction(async (tx) => {
      const doiSoat = await DoiSoatHoanCocDB.them(
        {
          yeuCauTraPhongId: params.yeuCauTraPhongId,
          bienBanKiemTraId: params.bienBanKiemTraId,
          keToanId: params.keToanId,
          tienCocGoc: params.tienCocGoc,
          tyLeHoanCoc: params.tyLeHoanCoc,
          soTienHoanCoBan: params.soTienHoanCoBan,
          tongKhauTru,
          soTienHoanThucNhan: ketQua > 0 ? ketQua : 0,
          soTienCanThuThem: ketQua < 0 ? -ketQua : 0,
          xacNhanKhachHang: "Đã đồng ý",
        },
        tx,
      );
      await YeuCauTraPhong.capNhatTrangThai(params.yeuCauTraPhongId, "Đã xác nhận đối soát", tx);
      return doiSoat;
    });
  },

  /** UC3 Màn 3, nhánh A9 (không thống nhất): KHÔNG tạo DoiSoatHoanCoc, chỉ chuyển trạng thái. */
  async chuyenCapTren(yeuCauTraPhongId: number) {
    return YeuCauTraPhong.capNhatTrangThai(yeuCauTraPhongId, "Chờ giải quyết tranh chấp");
  },

  /** UC3 Màn 4 (Thành công): đọc lại theo hồ sơ. */
  async layThongTin(yeuCauTraPhongId: number) {
    return DoiSoatHoanCocDB.timTheoYeuCauTraPhongId(yeuCauTraPhongId);
  },
};
