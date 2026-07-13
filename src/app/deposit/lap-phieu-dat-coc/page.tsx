import { notFound } from "next/navigation";
import CapNhatThongTinHoSoForm from "@/components/dat-coc/CapNhatThongTinHoSoForm";
import { layChiTietHoSoDatCoc, layDanhSachQuyDinhDatCoc, layHoSoDatCocMoiNhat } from "@/lib/services/hoSoDatCocService";

export default async function LapPhieuDatCocPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
	const { id } = await searchParams;
	const requestedId = Number(id);
	const hoSo = Number.isInteger(requestedId) && requestedId > 0 ? await layChiTietHoSoDatCoc(requestedId) : await layHoSoDatCocMoiNhat();
	if (!hoSo) notFound();

	const quyDinhs = await layDanhSachQuyDinhDatCoc();
	const ketQuaByQuyDinhId = new Map(hoSo.ketQuaKiemTraDieuKiens.map((ketQua) => [ketQua.quyDinhId, ketQua.ketQua]));

	return (
		<main className="min-h-full bg-[#f4faf8] px-4 py-6 sm:px-8">
			<div className="mx-auto w-full max-w-5xl">
				<CapNhatThongTinHoSoForm
					initialData={{
						hoSoId: hoSo.hoSoDatCocId,
						trangThai: hoSo.trangThai,
						lyDoTuChoi: hoSo.lyDoTuChoi,
						khachHang: hoSo.khachHang,
						yeuCauThue: hoSo.yeuCauThue,
						dieuKien: quyDinhs.map((quyDinh) => ({
							quyDinhId: quyDinh.quyDinhId,
							tenQuyDinh: quyDinh.tenQuyDinh,
							ketQua: ketQuaByQuyDinhId.get(quyDinh.quyDinhId) ?? "Chưa rà soát",
						})),
					}}
				/>
			</div>
		</main>
	);
}