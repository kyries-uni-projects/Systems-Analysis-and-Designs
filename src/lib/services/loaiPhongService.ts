import { prisma } from "@/lib/prisma";

/** Lookup/reference data used by the Phong create/edit form (dropdown of room types). */
export async function listLoaiPhong() {
	return prisma.loaiPhong.findMany({ orderBy: { idLoaiPhong: "asc" } });
}

export async function createLoaiPhong(input: { tenLoaiPhong: string; donGia: number }) {
	return prisma.loaiPhong.create({ data: input });
}
