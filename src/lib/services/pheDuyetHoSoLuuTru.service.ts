import { ApiNotFoundError, ApiValidationError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import {
	capNhatTrangThaiHoSoNhanPhong,
	demSoHoSoChoDuyet,
	docHoSoNhanPhongTheoMa,
	layDanhSachChoDuyet,
	type HoSoNhanPhongApprovalRecord,
} from "@/lib/repositories/hoSoNhanPhong.repository";
import { luuKetQuaPheDuyet } from "@/lib/repositories/pheDuyetLuuTru.repository";
import {
	capNhatKetQua,
	capNhatTrangThaiThamGia,
} from "@/lib/repositories/thanhVienLuuTru.repository";
import type {
	LuuPheDuyetHoSoInput,
	PheDuyetHoSoDetail,
	PheDuyetHoSoListItem,
	PheDuyetThanhVien,
} from "@/types/nhan-phong";

const TRANG_THAI_CHO_KY_HOP_DONG = "Cho ky hop dong";
const TRANG_THAI_DUNG_THU_TUC_THUE = "Dung thu tuc thue";
const KET_QUA_DUOC_DUYET = "Duoc duyet";
const KET_QUA_TU_CHOI = "Tu choi";
const KET_QUA_DUYET_MOT_PHAN = "Duyet mot phan";
const KET_QUA_THANH_VIEN_DAT = "Dat";
const KET_QUA_THANH_VIEN_KHONG_DAT = "Khong dat";
const TRANG_THAI_THAM_GIA = "THAM_GIA";
const TRANG_THAI_LOAI_KHOI_HO_SO = "LOAI_KHOI_HO_SO";

function formatDate(value: Date) {
	return new Intl.DateTimeFormat("vi-VN", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		timeZone: "Asia/Ho_Chi_Minh",
	}).format(value);
}

function mapMember(member: HoSoNhanPhongApprovalRecord["thanhVienLuuTrus"][number]): PheDuyetThanhVien {
	const rejected = member.ketQuaDieuKien === KET_QUA_THANH_VIEN_KHONG_DAT;
	const approved = member.ketQuaDieuKien === KET_QUA_THANH_VIEN_DAT;

	return {
		id: String(member.thanhVienLuuTruId),
		thanhVienLuuTruId: member.thanhVienLuuTruId,
		name: member.hoTen,
		cccd: member.soGiayTo,
		gender: member.gioiTinh ?? "",
		phone: member.soDienThoai ?? "",
		status: rejected ? "rejected" : approved ? "approved" : "pending",
		rejectReason: member.lyDoKhongDat ?? "",
	};
}

function mapListItem(hoSo: HoSoNhanPhongApprovalRecord): PheDuyetHoSoListItem {
	return {
		id: String(hoSo.hoSoNhanPhongId),
		hoSoNhanPhongId: hoSo.hoSoNhanPhongId,
		code: hoSo.maHoSoNhanPhong,
		customer: hoSo.hoSoDatCoc.khachHang.hoTen,
		submittedAt: formatDate(hoSo.ngayTao),
		memberCount: hoSo.thanhVienLuuTrus.length,
	};
}

function mapDetail(hoSo: HoSoNhanPhongApprovalRecord): PheDuyetHoSoDetail {
	return {
		...mapListItem(hoSo),
		members: hoSo.thanhVienLuuTrus.map(mapMember),
	};
}

export async function danhSachPheDuyetHoSo(tuKhoa?: string) {
	const [records, total] = await Promise.all([
		layDanhSachChoDuyet(tuKhoa),
		demSoHoSoChoDuyet(),
	]);

	return {
		total,
		items: records.map(mapListItem),
	};
}

export async function chiTietPheDuyetHoSo(maHoSoNhanPhong: string) {
	const hoSo = await docHoSoNhanPhongTheoMa(maHoSoNhanPhong);
	if (!hoSo) throw new ApiNotFoundError("Khong tim thay ho so nhan phong.");
	return mapDetail(hoSo);
}

export async function luuKetQuaXetDuyet(maHoSoNhanPhong: string, quanLyId: number, input: LuuPheDuyetHoSoInput) {
	if (input.members.length === 0) throw new ApiValidationError("Ho so chua co thanh vien de phe duyet.");

	return prisma.$transaction(async (tx) => {
		const hoSo = await docHoSoNhanPhongTheoMa(maHoSoNhanPhong, tx);
		if (!hoSo) throw new ApiNotFoundError("Khong tim thay ho so nhan phong.");
		if (hoSo.pheDuyetLuuTru) throw new ApiValidationError("Ho so nay da co ket qua phe duyet.");

		const membersById = new Map(hoSo.thanhVienLuuTrus.map((member) => [member.thanhVienLuuTruId, member]));
		const uniqueIds = new Set(input.members.map((member) => member.thanhVienLuuTruId));
		if (uniqueIds.size !== hoSo.thanhVienLuuTrus.length || input.members.some((member) => !membersById.has(member.thanhVienLuuTruId))) {
			throw new ApiValidationError("Danh sach thanh vien phe duyet khong khop voi ho so.");
		}

		for (const member of input.members) {
			if (!["approved", "rejected"].includes(member.status)) {
				throw new ApiValidationError("Ket qua xet duyet thanh vien khong hop le.");
			}
			if (member.status === "rejected" && !member.rejectReason?.trim()) {
				throw new ApiValidationError("Vui long nhap ly do tu choi cho thanh vien khong dat.");
			}
		}

		const approved = input.members.filter((member) => member.status === "approved");
		const rejected = input.members.filter((member) => member.status === "rejected");
		if (approved.length === 0 && rejected.length === 0) throw new ApiValidationError("Vui long phe duyet hoac tu choi tung thanh vien.");
		if (approved.length > 0 && rejected.length > 0 && !input.groupOption) {
			throw new ApiValidationError("Vui long chon phuong an xu ly nhom.");
		}

		for (const member of input.members) {
			const isApproved = member.status === "approved";
			await capNhatKetQua(
				member.thanhVienLuuTruId,
				isApproved ? KET_QUA_THANH_VIEN_DAT : KET_QUA_THANH_VIEN_KHONG_DAT,
				isApproved ? null : member.rejectReason?.trim() ?? null,
				tx,
			);
			await capNhatTrangThaiThamGia(
				member.thanhVienLuuTruId,
				isApproved && input.groupOption !== "stop" ? TRANG_THAI_THAM_GIA : TRANG_THAI_LOAI_KHOI_HO_SO,
				tx,
			);
		}

		const allApproved = rejected.length === 0;
		const allRejected = approved.length === 0;
		const stopAll = allRejected || input.groupOption === "stop";
		const ketQua = allApproved ? KET_QUA_DUOC_DUYET : stopAll ? KET_QUA_TU_CHOI : KET_QUA_DUYET_MOT_PHAN;
		const trangThai = stopAll ? TRANG_THAI_DUNG_THU_TUC_THUE : TRANG_THAI_CHO_KY_HOP_DONG;
		const lyDoTuChoi = allRejected
			? rejected.map((member) => member.rejectReason?.trim()).filter(Boolean).join("; ")
			: null;

		await luuKetQuaPheDuyet(
			{
				hoSoNhanPhongId: hoSo.hoSoNhanPhongId,
				quanLyId,
				ketQua,
				phuongAnXuLyNhom: input.groupOption ?? null,
				lyDoTuChoi,
			},
			tx,
		);
		await capNhatTrangThaiHoSoNhanPhong(hoSo.hoSoNhanPhongId, trangThai, tx);

		return {
			maHoSoNhanPhong: hoSo.maHoSoNhanPhong,
			trangThai,
			ketQua,
		};
	});
}
