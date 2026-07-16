import { prisma, type Db } from "@/lib/prisma";

export async function luuKetQuaPheDuyet(
	input: {
		hoSoNhanPhongId: number;
		quanLyId: number;
		ketQua: string;
		phuongAnXuLyNhom?: string | null;
		lyDoTuChoi?: string | null;
	},
	db: Db = prisma,
) {
	return db.pheDuyetLuuTru.upsert({
		where: { hoSoNhanPhongId: input.hoSoNhanPhongId },
		create: input,
		update: {
			quanLyId: input.quanLyId,
			ketQua: input.ketQua,
			phuongAnXuLyNhom: input.phuongAnXuLyNhom,
			lyDoTuChoi: input.lyDoTuChoi,
			thoiDiemPheDuyet: new Date(),
		},
	});
}
