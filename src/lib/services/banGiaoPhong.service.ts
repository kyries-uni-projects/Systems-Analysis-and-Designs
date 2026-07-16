import { ApiNotFoundError, ApiValidationError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { capNhatTrangThaiHoSoNhanPhong } from "@/lib/repositories/hoSoNhanPhong.repository";
import {
	capNhatTrangThaiGiuong,
	capNhatTrangThaiPhong,
	demSoHoSoChoBanGiao,
	docHoSoBanGiaoTheoMa,
	kiemTraTonTaiBienBanTheoHopDong,
	layDanhSachChoBanGiao,
	layDanhSachTaiSanMacDinhDangDung,
	themBienBanBanGiao,
	themNhieuTaiSanBanGiao,
	TRANG_THAI_CHO_BAN_GIAO,
	TRANG_THAI_DANG_SU_DUNG,
	TRANG_THAI_DANG_THUE,
	TRANG_THAI_HOAN_TAT,
	type HoSoBanGiaoRecord,
} from "@/lib/repositories/banGiaoPhong.repository";
import type {
	BanGiaoPhongDetail,
	BanGiaoPhongListItem,
	LuuBienBanBanGiaoInput,
} from "@/types/nhan-phong";

function formatDate(value: Date) {
	return new Intl.DateTimeFormat("vi-VN", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		timeZone: "Asia/Ho_Chi_Minh",
	}).format(value);
}

function layHopDong(record: HoSoBanGiaoRecord) {
	if (!record.hopDong) throw new ApiValidationError("Hồ sơ chưa có hợp đồng để bàn giao.");
	return record.hopDong;
}

function kiemTraDuDieuKienBanGiao(record: HoSoBanGiaoRecord) {
	const hopDong = record.hopDong;
	return [TRANG_THAI_CHO_BAN_GIAO, TRANG_THAI_DANG_THUE].includes(record.trangThai)
		&& hopDong?.trangThai === "Da ky"
		&& !hopDong.bienBanBanGiao
		&& hopDong.khoanThuDauKys.some((item) => item.trangThai === "Da thu");
}

function mapListItem(record: HoSoBanGiaoRecord): BanGiaoPhongListItem {
	const hopDong = layHopDong(record);
	return {
		id: String(record.hoSoNhanPhongId),
		hoSoNhanPhongId: record.hoSoNhanPhongId,
		hopDongId: hopDong.hopDongId,
		code: record.maHoSoNhanPhong,
		contractCode: hopDong.maHopDong,
		customer: hopDong.khachHang.hoTen,
		memberCount: record.thanhVienLuuTrus.length,
	};
}

function layMoTaPhongGiuong(record: HoSoBanGiaoRecord) {
	const hopDong = layHopDong(record);
	if (hopDong.chiTietHopDongs.length === 0) return "Chưa có phòng/giường";
	return hopDong.chiTietHopDongs.map((detail) => {
		const room = detail.phong?.maPhong ?? "Chưa rõ phòng";
		return detail.giuong ? `${room} – Giường ${detail.giuong.maGiuongLocal}` : room;
	}).join(", ");
}

function layViTri(record: HoSoBanGiaoRecord) {
	const hopDong = layHopDong(record);
	const locations = hopDong.chiTietHopDongs
		.map((detail) => detail.phong ? `Tầng ${detail.phong.tang} – Dãy ${detail.phong.khu}` : null)
		.filter((item): item is string => Boolean(item));
	return [...new Set(locations)].join(", ") || "Chưa rõ vị trí";
}

export async function danhSachBanGiaoPhong(tuKhoa?: string) {
	const [records, total] = await Promise.all([
		layDanhSachChoBanGiao(tuKhoa),
		demSoHoSoChoBanGiao(),
	]);
	return { total, items: records.map(mapListItem) };
}

export async function chiTietBanGiaoPhong(maHoSoNhanPhong: string): Promise<BanGiaoPhongDetail> {
	const record = await docHoSoBanGiaoTheoMa(maHoSoNhanPhong);
	if (!record) throw new ApiNotFoundError("Hồ sơ không tồn tại. Vui lòng nhập lại mã hồ sơ.");
	if (!kiemTraDuDieuKienBanGiao(record)) {
		throw new ApiValidationError("Hồ sơ chưa đủ điều kiện để lập biên bản bàn giao. Vui lòng nhập lại mã hồ sơ.");
	}
	const assets = await layDanhSachTaiSanMacDinhDangDung();
	const base = mapListItem(record);
	return {
		...base,
		room: layMoTaPhongGiuong(record),
		location: layViTri(record),
		handoverDate: formatDate(new Date()),
		assets: assets.map((asset) => ({
			id: asset.idTaiSanMacDinh,
			name: asset.tenTaiSan,
			defaultQuantity: asset.soLuongMacDinh,
			unit: "cái",
		})),
	};
}

function validateInput(input: LuuBienBanBanGiaoInput) {
	if (!input?.customerSigned) {
		throw new ApiValidationError("Chưa xác nhận khách hàng đã ký biên bản. Vui lòng xác nhận trước khi lưu.");
	}
	if (!Array.isArray(input.assets) || input.assets.length === 0) {
		throw new ApiValidationError("Vui lòng chọn ít nhất một tài sản bàn giao.");
	}
	const ids = new Set<number>();
	for (const asset of input.assets) {
		if (!Number.isInteger(asset.assetId) || !Number.isInteger(asset.quantity) || asset.quantity <= 0 || ids.has(asset.assetId)) {
			throw new ApiValidationError("Danh sách tài sản bàn giao không hợp lệ.");
		}
		ids.add(asset.assetId);
	}
}

export async function luuBienBanBanGiao(
	maHoSoNhanPhong: string,
	quanLyId: number,
	input: LuuBienBanBanGiaoInput,
) {
	validateInput(input);

	return prisma.$transaction(async (tx) => {
		const record = await docHoSoBanGiaoTheoMa(maHoSoNhanPhong, tx);
		if (!record) throw new ApiNotFoundError("Hồ sơ không tồn tại. Vui lòng nhập lại mã hồ sơ.");
		if (!kiemTraDuDieuKienBanGiao(record)) {
			throw new ApiValidationError("Hồ sơ chưa đủ điều kiện để lập biên bản bàn giao. Vui lòng nhập lại mã hồ sơ.");
		}

		const hopDong = layHopDong(record);
		if (await kiemTraTonTaiBienBanTheoHopDong(hopDong.hopDongId, tx)) {
			throw new ApiValidationError("Hợp đồng đã có biên bản bàn giao.");
		}
		const activeAssets = await layDanhSachTaiSanMacDinhDangDung(tx);
		const activeIds = new Set(activeAssets.map((asset) => asset.idTaiSanMacDinh));
		if (input.assets.some((asset) => !activeIds.has(asset.assetId))) {
			throw new ApiValidationError("Danh mục tài sản đã thay đổi. Vui lòng tải lại hồ sơ.");
		}

		const bienBan = await themBienBanBanGiao(hopDong.hopDongId, quanLyId, new Date(), tx);
		await themNhieuTaiSanBanGiao(bienBan.bienBanBanGiaoId, input.assets, tx);
		await capNhatTrangThaiHoSoNhanPhong(record.hoSoNhanPhongId, TRANG_THAI_HOAN_TAT, tx);

		const phongIds = [...new Set(hopDong.chiTietHopDongs.flatMap((detail) => detail.phongId ? [detail.phongId] : []))];
		const giuongIds = [...new Set(hopDong.chiTietHopDongs.flatMap((detail) => detail.giuongId ? [detail.giuongId] : []))];
		await capNhatTrangThaiPhong(phongIds, tx);
		await capNhatTrangThaiGiuong(giuongIds, tx);

		return {
			bienBanBanGiaoId: bienBan.bienBanBanGiaoId,
			maHoSoNhanPhong: record.maHoSoNhanPhong,
			maHopDong: hopDong.maHopDong,
			trangThaiHoSo: TRANG_THAI_HOAN_TAT,
			trangThaiPhongGiuong: TRANG_THAI_DANG_SU_DUNG,
			soTaiSan: input.assets.length,
		};
	});
}
