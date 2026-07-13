// lib/repositories/taiSanBanGiao.repository.ts
// Tầng Dữ liệu (DB) cho TaiSanBanGiao — ứng với "TaiSanBanGiaoDB"
import { prisma } from "../prisma";

export const TaiSanBanGiaoDB = {
  /**
   * UC2 Màn 1/2: lấy danh sách tài sản đã bàn giao ban đầu, theo hồ sơ trả phòng.
   * JOIN: yeu_cau_tra_phong -> ho_so_nhan_phong -> bien_ban_ban_giao -> tai_san_ban_giao
   */
  async layDanhSachTheoHoSo(yeuCauTraPhongId: number) {
    const yc = await prisma.yeuCauTraPhong.findUnique({
      where: { yeuCauTraPhongId },
      select: { hoSoNhanPhongId: true },
    });
    if (!yc?.hoSoNhanPhongId) return [];

    const bbbg = await prisma.bienBanBanGiao.findUnique({
      where: { hoSoNhanPhongId: yc.hoSoNhanPhongId },
      include: { taiSanBanGiaos: true },
    });
    return bbbg?.taiSanBanGiaos ?? [];
  },
};
