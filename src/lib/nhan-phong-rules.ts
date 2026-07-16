export const CHECK_IN_READY_STATUSES = [
	"Đã đặt cọc",
	"Đã xác nhận thanh toán",
	"CHO_NHAN_PHONG",
	"DA_XAC_NHAN_THANH_TOAN",
] as const;

export const TRANG_THAI_CHO_DUYET_DIEU_KIEN_LUU_TRU = "Cho duyet dieu kien luu tru";
export const TRANG_THAI_CHO_KY_HOP_DONG = "Cho ky hop dong";
export const TRANG_THAI_CHO_THANH_TOAN_DAU_KY = "Cho thanh toan dau ky";
export const TRANG_THAI_CHO_BAN_GIAO = "Cho ban giao";

export function laPhieuDatCocHopLeDeNhanPhong(input: {
	trangThai: string;
	ngayHenNhanPhong: Date | null;
	gioHenNhanPhong: string | null;
}) {
	return CHECK_IN_READY_STATUSES.includes(input.trangThai as (typeof CHECK_IN_READY_STATUSES)[number])
		&& input.ngayHenNhanPhong !== null
		&& Boolean(input.gioHenNhanPhong?.trim());
}

type ThanhVienCanPhanBo = {
	gender: string;
};

type ChoODaDat = {
	chiTietDatCocId: number;
	soGiuongQuyDoi: number;
	gioiTinhApDung?: string | null;
};

function chuanHoaGioiTinh(value?: string | null) {
	const normalized = value
		?.normalize("NFD")
		.replace(/[\u0300-\u036f]/gu, "")
		.toLocaleLowerCase("vi-VN")
		.trim();

	if (!normalized || normalized.includes("hon hop") || normalized.includes("khong gioi han")) return null;
	if (normalized === "nam" || normalized.includes("khu nam")) return "nam";
	if (normalized === "nu" || normalized.includes("khu nu")) return "nu";
	return null;
}

/**
 * Ghép từng thành viên vào một chỗ đã đặt cọc. Kết quả giữ nguyên thứ tự
 * thành viên và đồng thời bảo đảm sức chứa cùng giới tính áp dụng của phòng.
 */
export function phanBoThanhVienVaoChoO(thanhViens: ThanhVienCanPhanBo[], choOs: ChoODaDat[]) {
	const slots = choOs.flatMap((choO) =>
		Array.from({ length: Math.max(0, choO.soGiuongQuyDoi) }, () => ({
			chiTietDatCocId: choO.chiTietDatCocId,
			gioiTinhApDung: chuanHoaGioiTinh(choO.gioiTinhApDung),
		})),
	);
	if (thanhViens.length > slots.length) return null;

	const compatibleSlots = thanhViens.map((member) => {
		const gender = chuanHoaGioiTinh(member.gender);
		return slots.flatMap((slot, slotIndex) =>
			slot.gioiTinhApDung === null || slot.gioiTinhApDung === gender ? [slotIndex] : [],
		);
	});
	if (compatibleSlots.some((indexes) => indexes.length === 0)) return null;

	const memberOrder = compatibleSlots
		.map((indexes, memberIndex) => ({ memberIndex, optionCount: indexes.length }))
		.sort((left, right) => left.optionCount - right.optionCount);
	const memberBySlot = new Array<number>(slots.length).fill(-1);

	function assign(memberIndex: number, visited: Set<number>): boolean {
		for (const slotIndex of compatibleSlots[memberIndex]) {
			if (visited.has(slotIndex)) continue;
			visited.add(slotIndex);
			if (memberBySlot[slotIndex] === -1 || assign(memberBySlot[slotIndex], visited)) {
				memberBySlot[slotIndex] = memberIndex;
				return true;
			}
		}
		return false;
	}

	for (const { memberIndex } of memberOrder) {
		if (!assign(memberIndex, new Set())) return null;
	}

	const allocation = new Array<number>(thanhViens.length);
	memberBySlot.forEach((memberIndex, slotIndex) => {
		if (memberIndex !== -1) allocation[memberIndex] = slots[slotIndex].chiTietDatCocId;
	});
	return allocation;
}
