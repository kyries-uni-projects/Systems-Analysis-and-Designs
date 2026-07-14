// lib/repositories/taiSanBanGiao.repository.ts
// Tầng Dữ liệu (DB) cho TaiSanBanGiao — ứng với "TaiSanBanGiaoDB"
//
// SỬA (schema v7): BienBanBanGiao giờ gắn trực tiếp với HopDong (hopDongId, 1 biên bản/cả
// hợp đồng — không còn theo từng HoSoNhanPhong). TaiSanBanGiao giờ tham chiếu danh mục mới
// `TaiSanMacDinh` để lấy tên tài sản (tenTaiSan), thay vì tự lưu tên trực tiếp.
import { prisma } from "../prisma";

export const TaiSanBanGiaoDB = {
	/**
	 * UC2 Màn 1/2: lấy danh sách tài sản đã bàn giao ban đầu, theo hồ sơ trả phòng.
	 * JOIN: yeu_cau_tra_phong -> chi_tiet_hop_dong -> hop_dong -> bien_ban_ban_giao ->
	 * tai_san_ban_giao -> tai_san_mac_dinh
	 */
	async layDanhSachTheoHoSo(yeuCauTraPhongId: number) {
		const yc = await prisma.yeuCauTraPhong.findUnique({
			where: { yeuCauTraPhongId },
			select: { chiTietHopDong: { select: { hopDongId: true } } },
		});
		if (!yc?.chiTietHopDong) return [];

		const bbbg = await prisma.bienBanBanGiao.findUnique({
			where: { hopDongId: yc.chiTietHopDong.hopDongId },
			include: { taiSanBanGiaos: { include: { taiSanMacDinh: true } } },
		});
		return bbbg?.taiSanBanGiaos ?? [];
	},
};
