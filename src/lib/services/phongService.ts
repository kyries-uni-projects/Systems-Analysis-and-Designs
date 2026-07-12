import { prisma } from "@/lib/prisma";
import { ApiNotFoundError } from "@/lib/api-response";
import type { CreatePhongInput, UpdatePhongInput } from "@/types/phong";

export interface ListPhongParams {
	search?: string;
	page?: number;
	pageSize?: number;
}

/** Sample DB read — paginated list with a relation include (loaiPhong) + a to-many include (giuongs). */
export async function listPhong({ search, page = 1, pageSize = 10 }: ListPhongParams = {}) {
	const where = search
		? {
				OR: [{ maPhong: { contains: search } }, { khu: { contains: search } }],
			}
		: undefined;

	const [items, total] = await Promise.all([
		prisma.phong.findMany({
			where,
			include: { loaiPhong: true, giuongs: true },
			orderBy: { phongId: "asc" },
			skip: (page - 1) * pageSize,
			take: pageSize,
		}),
		prisma.phong.count({ where }),
	]);

	return { items, total, page, pageSize };
}

export async function findPhongById(id: number) {
	return prisma.phong.findUnique({
		where: { phongId: id },
		include: { loaiPhong: true, giuongs: true },
	});
}

/** Same as `findPhongById` but throws 404 when not found — used by API routes. */
export async function getPhongById(id: number) {
	const phong = await findPhongById(id);
	if (!phong) {
		throw new ApiNotFoundError(`Không tìm thấy phòng #${id}`);
	}
	return phong;
}

export async function createPhong(input: CreatePhongInput) {
	return prisma.phong.create({ data: input, include: { loaiPhong: true } });
}

export async function updatePhong(id: number, input: UpdatePhongInput) {
	await getPhongById(id);
	return prisma.phong.update({ where: { phongId: id }, data: input, include: { loaiPhong: true } });
}

export async function deletePhong(id: number) {
	await getPhongById(id);
	await prisma.phong.delete({ where: { phongId: id } });
}
