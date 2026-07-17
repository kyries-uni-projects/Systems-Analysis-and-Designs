import { ApiNotFoundError, ApiValidationError } from "@/lib/api-response";
import {
	laHinhThucThueTheoGiuong,
	TRANG_THAI_CHO_DUYET_DIEU_KIEN_LUU_TRU,
} from "@/lib/nhan-phong-rules";
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
	datNguoiDaiDienMoi,
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
		isRepresentative: member.laNguoiDaiDien,
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
	if (hoSo.trangThai !== TRANG_THAI_CHO_DUYET_DIEU_KIEN_LUU_TRU || hoSo.pheDuyetLuuTru) {
		throw new ApiValidationError("Ho so khong o trang thai cho duyet dieu kien luu tru.");
	}
	return mapDetail(hoSo);
}

export async function luuKetQuaXetDuyet(maHoSoNhanPhong: string, quanLyId: number, input: LuuPheDuyetHoSoInput) {
	if (input.members.length === 0) throw new ApiValidationError("Ho so chua co thanh vien de phe duyet.");

	return prisma.$transaction(async (tx) => {
		const hoSo = await docHoSoNhanPhongTheoMa(maHoSoNhanPhong, tx);
		if (!hoSo) throw new ApiNotFoundError("Khong tim thay ho so nhan phong.");
		if (hoSo.trangThai !== TRANG_THAI_CHO_DUYET_DIEU_KIEN_LUU_TRU) {
			throw new ApiValidationError("Ho so khong o trang thai cho duyet dieu kien luu tru.");
		}
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
		const currentRepresentative = hoSo.thanhVienLuuTrus.find((member) => member.laNguoiDaiDien);
		if (!currentRepresentative) throw new ApiValidationError("Ho so chua co nguoi dai dien.");
		const representativeRejected = rejected.some((member) => member.thanhVienLuuTruId === currentRepresentative.thanhVienLuuTruId);
		if (representativeRejected && input.groupOption === "continue") {
			if (!input.representativeMemberId || !approved.some((member) => member.thanhVienLuuTruId === input.representativeMemberId)) {
				throw new ApiValidationError("Vui long chon nguoi dai dien moi trong danh sach thanh vien du dieu kien.");
			}
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
		if (!stopAll && representativeRejected && input.representativeMemberId) {
			await datNguoiDaiDienMoi(hoSo.hoSoNhanPhongId, input.representativeMemberId, tx);
		}

		if (!stopAll) {
			await tx.yeuCauThue.update({
				where: { yeuCauId: hoSo.hoSoDatCoc.yeuCauId },
				data: { soNguoiDuKien: approved.length },
			});
		}

		// Với thuê theo giường, giải phóng các phân bổ không còn thành viên nào được duyệt.
		// Chi tiết dùng chung cho nhiều thành viên vẫn được giữ; số lượng chính xác sẽ được
		// chốt thành snapshot khi lập hợp đồng.
		if (laHinhThucThueTheoGiuong(hoSo.hoSoDatCoc.hinhThucThue)) {
			const thanhVienTiepTuc = stopAll ? [] : approved;
			const chiTietConNguoiThue = new Set(
				thanhVienTiepTuc.map((member) => membersById.get(member.thanhVienLuuTruId)?.chiTietDatCocId).filter((id): id is number => id != null),
			);
			const chiTietCanGiaiPhong = hoSo.hoSoDatCoc.chiTietDatCocs.filter(
				(detail) => !chiTietConNguoiThue.has(detail.chiTietDatCocId),
			);
			if (chiTietCanGiaiPhong.length > 0) {
				await tx.chiTietDatCoc.updateMany({
					where: { chiTietDatCocId: { in: chiTietCanGiaiPhong.map((detail) => detail.chiTietDatCocId) } },
					data: { trangThai: "Đã hủy" },
				});
				const giuongIds = chiTietCanGiaiPhong.flatMap((detail) => detail.giuongId ? [detail.giuongId] : []);
				if (giuongIds.length > 0) {
					await tx.giuong.updateMany({
						where: { giuongId: { in: giuongIds } },
						data: { trangThai: "Trống" },
					});
				}
			}
		}

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
