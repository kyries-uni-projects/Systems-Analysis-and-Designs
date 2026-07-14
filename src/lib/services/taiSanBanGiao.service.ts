// lib/services/taiSanBanGiao.service.ts
// Tầng Nghiệp vụ (BUS) cho TaiSanBanGiao — ứng với "TaiSanBanGiao"
import { TaiSanBanGiaoDB } from "../repositories/taiSanBanGiao.repository";

export type TaiSanBanGiaoInfo = {
	idTaiSanBanGiao: number;
	tenTaiSan: string;
	soLuong: number;
	tinhTrang: string | null;
};

type RawTaiSan = {
	idTaiSanBanGiao: number;
	soLuong: number;
	tinhTrang: string | null;
	taiSanMacDinh: { tenTaiSan: string };
};

export const TaiSanBanGiao = {
	/** UC2 Màn 1/2 (HienThi(maHoSo)): danh sách tài sản đã bàn giao lúc nhận phòng. */
	async layDanhSachTheoHoSo(yeuCauTraPhongId: number): Promise<TaiSanBanGiaoInfo[]> {
		const list = (await TaiSanBanGiaoDB.layDanhSachTheoHoSo(yeuCauTraPhongId)) as RawTaiSan[];
		return list.map((t) => ({
			idTaiSanBanGiao: t.idTaiSanBanGiao,
			tenTaiSan: t.taiSanMacDinh.tenTaiSan,
			soLuong: t.soLuong,
			tinhTrang: t.tinhTrang,
		}));
	},
};
