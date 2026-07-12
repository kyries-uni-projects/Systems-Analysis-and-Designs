import { prisma } from "@/lib/prisma";
import { ApiNotFoundError } from "@/lib/api-response";
import type { CreateKhachHangInput, UpdateKhachHangInput } from "@/types/khach-hang";

export interface ListKhachHangParams {
	search?: string;
	page?: number;
	pageSize?: number;
}

/** Sample DB read — paginated list with optional search across a few text columns. */
export async function listKhachHang({ search, page = 1, pageSize = 10 }: ListKhachHangParams = {}) {
	const where = search
		? {
				OR: [{ hoTen: { contains: search } }, { cccdPassport: { contains: search } }, { soDienThoai: { contains: search } }],
			}
		: undefined;

	const [items, total] = await Promise.all([
		prisma.khachHang.findMany({
			where,
			orderBy: { ngayTao: "desc" },
			skip: (page - 1) * pageSize,
			take: pageSize,
		}),
		prisma.khachHang.count({ where }),
	]);

	return { items, total, page, pageSize };
}

export async function findKhachHangById(id: number) {
	return prisma.khachHang.findUnique({ where: { khachHangId: id } });
}

/** Same as `findKhachHangById` but throws 404 when not found — used by API routes. */
export async function getKhachHangById(id: number) {
	const khachHang = await findKhachHangById(id);
	if (!khachHang) {
		throw new ApiNotFoundError(`Không tìm thấy khách hàng #${id}`);
	}
	return khachHang;
}

export async function createKhachHang(input: CreateKhachHangInput) {
	return prisma.khachHang.create({ data: input });
}

export async function updateKhachHang(id: number, input: UpdateKhachHangInput) {
	await getKhachHangById(id);
	return prisma.khachHang.update({ where: { khachHangId: id }, data: input });
}

export async function deleteKhachHang(id: number) {
	await getKhachHangById(id);
	await prisma.khachHang.delete({ where: { khachHangId: id } });
}
