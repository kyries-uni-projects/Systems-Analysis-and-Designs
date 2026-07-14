import { notFound } from "next/navigation";
import CapNhatThongTinHoSoForm from "@/components/dat-coc/CapNhatThongTinHoSoForm";
import { layChiTietHoSoDatCoc, layDanhSachQuyDinhDatCoc } from "@/lib/services/hoSoDatCocService";

export default async function LapPhieuDatCocPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
	const { id } = await searchParams;
	const quyDinhs = await layDanhSachQuyDinhDatCoc();
	const requestedId = Number(id);
	const isUpdate = id !== undefined;
	if (isUpdate && (!Number.isInteger(requestedId) || requestedId < 1)) notFound();

	const hoSo = isUpdate ? await layChiTietHoSoDatCoc(requestedId) : null;
	if (isUpdate && !hoSo) notFound();
	const dieuKienChuaRaSoat = quyDinhs.map((quyDinh) => ({
		quyDinhId: quyDinh.quyDinhId,
		tenQuyDinh: quyDinh.tenQuyDinh,
		ketQua: "Chưa rà soát",
	}));

	if (!hoSo) {
		return (
			<main className="min-h-full bg-[#f4faf8] px-4 py-6 sm:px-8">
				<div className="mx-auto w-full max-w-5xl">
					<CapNhatThongTinHoSoForm dieuKien={dieuKienChuaRaSoat} />
				</div>
			</main>
		);
	}

	const ketQuaByQuyDinhId = new Map(hoSo.ketQuaKiemTraDieuKiens.map((ketQua) => [ketQua.quyDinhId, ketQua.ketQua]));

	return (
		<main className="min-h-full bg-[#f4faf8] px-4 py-6 sm:px-8">
			<div className="mx-auto w-full max-w-5xl">
				<CapNhatThongTinHoSoForm
					initialData={{
						hoSoId: hoSo.hoSoDatCocId,
						trangThai: hoSo.trangThai,
						lyDoTuChoi: hoSo.lyDoTuChoi,
						ngayBatDauDuKien: hoSo.ngayBatDauDuKien.toISOString().slice(0, 10),
						ngayKetThucDuKien: hoSo.ngayKetThucDuKien.toISOString().slice(0, 10),
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
