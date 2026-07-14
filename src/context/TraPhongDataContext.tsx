"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { api } from "@/lib/apiClient";

/**
 * (Nhóm 4) Kho dữ liệu cho 5 UC Trả phòng & Hoàn cọc — gọi API thật (`/api/tra-phong/...`).
 * `updateHoSo`/`addHoSo` KHÔNG tồn tại dạng "ghi 1 patch tuỳ ý" — mỗi hành động nghiệp vụ cụ
 * thể có 1 hàm/route riêng, xem cách dùng trong từng file trang UC (src/features/traphong/).
 */

export type TrangThaiHoSo =
	| "Đã đăng ký, chờ ngày trả phòng"
	| "Đang xử lý trả phòng"
	| "Đã kiểm tra, chờ đối soát cọc"
	| "Đã xác nhận đối soát"
	| "Hoàn tất"
	| "Chờ giải quyết tranh chấp";

export type HoSoTraPhong = {
	maHoSo: string;
	yeuCauTraPhongId: number;
	hopDongId: number | null;
	chiTietHopDongId: number | null;
	phongId: number | null;
	giuongId: number | null;
	soHopDong: string;
	khachHang: string;
	phongGiuong: string;
	tienCocGoc: number;
	ngayBatDauLuuTru: string; // dd/MM/yyyy — đã format sẵn cho hiển thị
	ngayTraPhong: string; // dd/MM/yyyy
	trangThaiHopDong: string;
	soThangLuuTru: number;
	trangThaiHoSo: TrangThaiHoSo;
	maBienBanKiemTra: string | null;
	bienBanKiemTraId: number | null;
	tongKhauTruKiemTra: number | null;
	doiSoatId: number | null;
	tyLeHoanCoc: number | null;
	soTienHoan: number | null;
	bienBanTraPhongId: number | null;
	daHoanCoc: boolean;
};

function formatDDMMYYYY(iso: string | null | undefined): string {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	const p = (n: number) => String(n).padStart(2, "0");
	return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

function soThangGiua(tuISO: string | null | undefined, denISO: string | null | undefined): number {
	if (!tuISO || !denISO) return 0;
	const tu = new Date(tuISO);
	const den = new Date(denISO);
	if (Number.isNaN(tu.getTime()) || Number.isNaN(den.getTime())) return 0;
	const thang = (den.getUTCFullYear() - tu.getUTCFullYear()) * 12 + (den.getUTCMonth() - tu.getUTCMonth());
	return Math.max(0, thang);
}

type RawHoSo = {
	yeuCauTraPhongId: number;
	maHoSo: string;
	hopDongId: number | null;
	chiTietHopDongId: number | null;
	phongId: number | null;
	giuongId: number | null;
	soHopDong: string;
	khachHang: string;
	phongGiuong: string;
	tienCocGoc: number;
	ngayBatDauLuuTru: string;
	ngayTraPhong: string;
	trangThaiHopDong: string;
	trangThaiHoSo: TrangThaiHoSo;
	bienBanKiemTraId: number | null;
	maBienBanKiemTra: string | null;
	tongKhauTruKiemTra: number | null;
	doiSoatId: number | null;
	tyLeHoanCoc: number | null;
	soTienHoan: number | null;
	bienBanTraPhongId: number | null;
	daHoanCoc: boolean;
};

function mapRaw(hs: RawHoSo): HoSoTraPhong {
	return {
		maHoSo: hs.maHoSo,
		yeuCauTraPhongId: hs.yeuCauTraPhongId,
		hopDongId: hs.hopDongId,
		chiTietHopDongId: hs.chiTietHopDongId,
		phongId: hs.phongId,
		giuongId: hs.giuongId,
		soHopDong: hs.soHopDong,
		khachHang: hs.khachHang,
		phongGiuong: hs.phongGiuong,
		tienCocGoc: hs.tienCocGoc,
		ngayBatDauLuuTru: formatDDMMYYYY(hs.ngayBatDauLuuTru),
		ngayTraPhong: formatDDMMYYYY(hs.ngayTraPhong),
		trangThaiHopDong: hs.trangThaiHopDong,
		soThangLuuTru: soThangGiua(hs.ngayBatDauLuuTru, hs.ngayTraPhong),
		trangThaiHoSo: hs.trangThaiHoSo,
		maBienBanKiemTra: hs.maBienBanKiemTra,
		bienBanKiemTraId: hs.bienBanKiemTraId,
		tongKhauTruKiemTra: hs.tongKhauTruKiemTra,
		doiSoatId: hs.doiSoatId,
		tyLeHoanCoc: hs.tyLeHoanCoc,
		soTienHoan: hs.soTienHoan,
		bienBanTraPhongId: hs.bienBanTraPhongId,
		daHoanCoc: hs.daHoanCoc,
	};
}

type TraPhongContextValue = {
	hoSoList: HoSoTraPhong[];
	loading: boolean;
	refresh: () => Promise<void>;
	getHoSo: (maHoSo: string) => HoSoTraPhong | undefined;
};

const TraPhongContext = createContext<TraPhongContextValue | null>(null);

export function TraPhongProvider({ children }: { children: ReactNode }) {
	const [hoSoList, setHoSoList] = useState<HoSoTraPhong[]>([]);
	const [loading, setLoading] = useState(true);

	const refresh = useCallback(async () => {
		setLoading(true);
		try {
			const data = await api.get<RawHoSo[]>("/api/tra-phong");
			setHoSoList(data.map(mapRaw));
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const getHoSo = useCallback((maHoSo: string) => hoSoList.find((h) => h.maHoSo === maHoSo), [hoSoList]);

	return (
		<TraPhongContext.Provider value={{ hoSoList, loading, refresh, getHoSo }}>{children}</TraPhongContext.Provider>
	);
}

export function useTraPhongData(): TraPhongContextValue {
	const ctx = useContext(TraPhongContext);
	if (!ctx) throw new Error("useTraPhongData phải được dùng bên trong <TraPhongProvider>");
	return ctx;
}
