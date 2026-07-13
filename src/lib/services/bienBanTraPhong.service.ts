// lib/services/bienBanTraPhong.service.ts
// Tầng Nghiệp vụ (BUS) cho BienBanTraPhong — ứng với lớp "BienBanTraPhong" (UC4 Màn 2 và Màn 4)
import { prisma } from "../prisma";
import { BienBanTraPhongDB } from "../repositories/bienBanTraPhong.repository";
import { HopDong } from "./hopDong.service";
import { PhongGiuong } from "./phongGiuong.service";
import { YeuCauTraPhong } from "./yeuCauTraPhong.service";

export const BienBanTraPhong = {
  /**
   * UC4 Màn 2, nút "Ký xác nhận & lưu" (chỉ gọi khi khách ĐÃ KÝ — nhánh A5 từ chối ký
   * KHÔNG gọi hàm này, xem LapBienBanTraPhongThanhLyPage / route action riêng).
   * Lưu biên bản rồi cập nhật HopDong.trangThai -> "Đã thanh lý" — NHƯNG chỉ khi hợp
   * đồng không còn phòng nào khác đang hoạt động (HĐ nhiều phòng, xem HopDong.service.ts).
   *
   * SỬA (lỗi transaction giả): trước đây `BienBanTraPhongDB.them()` và
   * `HopDong.capNhatTrangThaiNeuHetPhong()` bên trong không dùng chung 1 `tx`, nên nếu bước
   * 2 lỗi (vd. update HopDong lỗi), biên bản trả phòng vẫn đã lưu — không rollback được.
   * Giờ `tx` được truyền tường minh xuống cả 2 lời gọi.
   */
  async luu(params: {
    yeuCauTraPhongId: number;
    hoSoNhanPhongId: number;
    doiSoatId: number;
    quanLyId: number;
    maHopDong: string;
    ngayTraPhongThucTe: Date;
    tinhTrangBanGiaoCuoi?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const bb = await BienBanTraPhongDB.them(
        {
          yeuCauTraPhongId: params.yeuCauTraPhongId,
          doiSoatId: params.doiSoatId,
          quanLyId: params.quanLyId,
          ngayTraPhongThucTe: params.ngayTraPhongThucTe,
          tinhTrangBanGiaoCuoi: params.tinhTrangBanGiaoCuoi,
        },
        tx,
      );
      await HopDong.capNhatTrangThaiNeuHetPhong(params.maHopDong, params.hoSoNhanPhongId, tx);
      return bb;
    });
  },

  /**
   * UC4 Màn 4, nút "Hoàn tất thủ tục trả phòng". Gọi tuần tự:
   *  1) đánh dấu đã thu hồi chìa khóa
   *  2) cập nhật phòng/giường -> "Trống"
   *  3) cập nhật hồ sơ trả phòng -> "Hoàn tất"
   *
   * SỬA (lỗi transaction giả): tương tự luu() — cả 3 bước giờ dùng chung `tx`.
   */
  async hoanTat(params: {
    bienBanTraPhongId: number;
    yeuCauTraPhongId: number;
    phongId: number;
    giuongId: number | null;
    daThuHoiChiaKhoa: boolean;
  }) {
    return prisma.$transaction(async (tx) => {
      await BienBanTraPhongDB.capNhatThuHoiChiaKhoa(params.bienBanTraPhongId, params.daThuHoiChiaKhoa, tx);
      await PhongGiuong.capNhatTrangThai({ phongId: params.phongId, giuongId: params.giuongId }, "Trống", tx);
      await YeuCauTraPhong.capNhatTrangThai(params.yeuCauTraPhongId, "Hoàn tất", tx);
    });
  },
};
