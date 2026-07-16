import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiConflictError, ApiNotFoundError, ApiValidationError } from "@/lib/api-response";
import type {
	CreateGiuongInput,
	CreatePhongInput,
	PhongGiuongRecord,
	PhongRecord,
	UpdateGiuongInput,
	UpdatePhongInput,
} from "@/types/phong";

export interface ListPhongParams {
	search?: string;
	page?: number;
	pageSize?: number;
}

interface UpdateStatusOptions {
	xacNhanDangThue?: boolean;
}

const CLOSED_ASSIGNMENT_STATUSES = ["Đã trả", "Đã thanh lý", "Hoàn tất"];
const activeAssignmentWhere: Prisma.ChiTietHopDongWhereInput = {
	trangThai: { notIn: CLOSED_ASSIGNMENT_STATUSES },
};

const roomInclude = {
	loaiPhong: true,
	giuongs: {
		include: {
			chiTietHopDongs: {
				where: activeAssignmentWhere,
				select: { chiTietHopDongId: true },
			},
		},
		orderBy: { giuongId: "asc" as const },
	},
	chiTietHopDongs: {
		where: activeAssignmentWhere,
		select: { chiTietHopDongId: true },
	},
};

type RoomWithRelations = Prisma.PhongGetPayload<{ include: typeof roomInclude }>;

function toBedRecord(bed: RoomWithRelations["giuongs"][number]): PhongGiuongRecord {
	return {
		giuongId: bed.giuongId,
		phongId: bed.phongId,
		maGiuongLocal: bed.maGiuongLocal,
		trangThai: bed.trangThai,
		dangCoNguoiThue: bed.chiTietHopDongs.length > 0,
		soHopDongHieuLuc: bed.chiTietHopDongs.length,
	};
}

function toRoomRecord(room: RoomWithRelations): PhongRecord {
	return {
		phongId: room.phongId,
		maPhong: room.maPhong,
		khu: room.khu,
		tang: room.tang,
		idLoaiPhong: room.idLoaiPhong,
		sucChua: room.sucChua,
		gioiTinhApDung: room.gioiTinhApDung,
		tienIch: room.tienIch,
		trangThai: room.trangThai,
		ngayTao: room.ngayTao.toISOString(),
		loaiPhong: room.loaiPhong,
		giuongs: room.giuongs.map(toBedRecord),
		dangCoNguoiThue: room.chiTietHopDongs.length > 0,
		soHopDongHieuLuc: room.chiTietHopDongs.length,
	};
}

export async function listPhong({ search, page = 1, pageSize = 10 }: ListPhongParams = {}) {
	const safePage = Number.isInteger(page) && page > 0 ? page : 1;
	const safePageSize = Number.isInteger(pageSize) && pageSize > 0 ? Math.min(pageSize, 500) : 10;
	const term = search?.trim();
	const where: Prisma.PhongWhereInput | undefined = term
		? {
				OR: [
					{ maPhong: { contains: term } },
					{ khu: { contains: term } },
					{ loaiPhong: { tenLoaiPhong: { contains: term } } },
					{ giuongs: { some: { maGiuongLocal: { contains: term } } } },
				],
			}
		: undefined;

	const [rooms, total] = await Promise.all([
		prisma.phong.findMany({
			where,
			include: roomInclude,
			orderBy: [{ khu: "asc" }, { tang: "asc" }, { maPhong: "asc" }],
			skip: (safePage - 1) * safePageSize,
			take: safePageSize,
		}),
		prisma.phong.count({ where }),
	]);

	return { items: rooms.map(toRoomRecord), total, page: safePage, pageSize: safePageSize };
}

export async function findPhongById(id: number) {
	const room = await prisma.phong.findUnique({ where: { phongId: id }, include: roomInclude });
	return room ? toRoomRecord(room) : null;
}

export async function getPhongById(id: number) {
	const room = await findPhongById(id);
	if (!room) throw new ApiNotFoundError(`Không tìm thấy phòng #${id}`);
	return room;
}

export async function createPhong(input: CreatePhongInput) {
	const room = await prisma.phong.create({ data: input, select: { phongId: true } });
	return getPhongById(room.phongId);
}

export async function updatePhong(id: number, input: UpdatePhongInput, options: UpdateStatusOptions = {}) {
	const current = await getPhongById(id);
	if (input.sucChua !== undefined && input.sucChua < current.giuongs.length) {
		throw new ApiValidationError(`Sức chứa không thể nhỏ hơn ${current.giuongs.length} giường đã khai báo.`);
	}

	if (input.trangThai && input.trangThai !== current.trangThai && current.dangCoNguoiThue && !options.xacNhanDangThue) {
		throw new ApiConflictError(
			`Phòng ${current.maPhong} đang có ${current.soHopDongHieuLuc} phân bổ thuê còn hiệu lực.`,
			{ code: "ACTIVE_RENTAL_CONFIRMATION_REQUIRED", activeContracts: current.soHopDongHieuLuc },
		);
	}

	await prisma.phong.update({ where: { phongId: id }, data: input });
	return getPhongById(id);
}

export async function deletePhong(id: number) {
	await getPhongById(id);
	await prisma.phong.delete({ where: { phongId: id } });
}

export async function createGiuong(phongId: number, input: CreateGiuongInput) {
	const bedId = await prisma.$transaction(async (tx) => {
		const room = await tx.phong.findUnique({
			where: { phongId },
			select: { maPhong: true, sucChua: true, _count: { select: { giuongs: true } } },
		});
		if (!room) throw new ApiNotFoundError(`Không tìm thấy phòng #${phongId}`);
		if (room._count.giuongs >= room.sucChua) {
			throw new ApiValidationError(`Phòng ${room.maPhong} đã đủ ${room.sucChua} giường theo sức chứa.`);
		}
		const bed = await tx.giuong.create({ data: { phongId, ...input }, select: { giuongId: true } });
		return bed.giuongId;
	});
	return getGiuongById(phongId, bedId);
}

export async function getGiuongById(phongId: number, giuongId: number): Promise<PhongGiuongRecord> {
	const bed = await prisma.giuong.findFirst({
		where: { giuongId, phongId },
		include: {
			chiTietHopDongs: {
				where: activeAssignmentWhere,
				select: { chiTietHopDongId: true },
			},
		},
	});
	if (!bed) throw new ApiNotFoundError(`Không tìm thấy giường #${giuongId} trong phòng #${phongId}`);
	return toBedRecord(bed);
}

export async function updateGiuong(
	phongId: number,
	giuongId: number,
	input: UpdateGiuongInput,
	options: UpdateStatusOptions = {},
) {
	const current = await getGiuongById(phongId, giuongId);
	if (input.trangThai && input.trangThai !== current.trangThai && current.dangCoNguoiThue && !options.xacNhanDangThue) {
		throw new ApiConflictError(
			`Giường ${current.maGiuongLocal} đang có ${current.soHopDongHieuLuc} phân bổ thuê còn hiệu lực.`,
			{ code: "ACTIVE_RENTAL_CONFIRMATION_REQUIRED", activeContracts: current.soHopDongHieuLuc },
		);
	}
	await prisma.giuong.update({ where: { giuongId }, data: input });
	return getGiuongById(phongId, giuongId);
}
