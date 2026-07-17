import { notFound } from "next/navigation";
import Link from "next/link";
import CapNhatThongTinHoSoForm from "@/components/dat-coc/CapNhatThongTinHoSoForm";
import { layChiTietHoSoDatCoc, layDanhSachQuyDinhDatCoc, layDanhSachYeuCauChoDatCoc, layYeuCauChoDatCoc } from "@/lib/services/hoSoDatCocService";

export default async function LapPhieuDatCocPage({ searchParams }: { searchParams: Promise<{ id?: string; yeuCauId?: string }> }) {
	const { id, yeuCauId } = await searchParams;
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

	if (!hoSo && !yeuCauId) {
		const requests = await layDanhSachYeuCauChoDatCoc();
		return (
			<main className="min-h-full bg-[#f4faf8] px-4 py-6 sm:px-8">
				<div className="mx-auto w-full max-w-5xl">
					<h1 className="text-2xl font-bold text-[#101828]">Chọn yêu cầu thuê để đặt cọc</h1>
					<p className="mt-2 text-sm text-slate-500">Chỉ hiển thị yêu cầu đã có lịch xem phòng và chưa lập hồ sơ đặt cọc.</p>
					<div className="mt-6 overflow-hidden rounded-xl border border-[#d7ece7] bg-white">
						{requests.map((request) => (
							<div key={request.yeuCauId} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 last:border-0">
								<div><p className="font-semibold text-slate-800">#{request.yeuCauId} · {request.khachHang.hoTen}</p><p className="mt-1 text-xs text-slate-500">{request.loaiThue} · {request.khuVucMongMuon || "Không giới hạn khu vực"}</p></div>
								<Link href={`/deposit/lap-phieu-dat-coc?yeuCauId=${request.yeuCauId}`} className="rounded-lg bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white">Chọn yêu cầu</Link>
							</div>
						))}
						{requests.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-500">Chưa có yêu cầu thuê đủ điều kiện chuyển sang đặt cọc.</p>}
					</div>
				</div>
			</main>
		);
	}

	if (!hoSo && yeuCauId) {
		const sourceId = Number(yeuCauId);
		if (!Number.isInteger(sourceId) || sourceId < 1) notFound();
		const request = await layYeuCauChoDatCoc(sourceId);
		if (!request) notFound();
		return (
			<main className="min-h-full bg-[#f4faf8] px-4 py-6 sm:px-8">
				<div className="mx-auto w-full max-w-5xl">
					<CapNhatThongTinHoSoForm
						sourceYeuCauId={request.yeuCauId}
						prefillData={{
							ngayBatDauDuKien: request.thoiGianDuKienVaoO?.toISOString().slice(0, 10) ?? "",
							ngayKetThucDuKien: "",
							khachHang: request.khachHang,
							yeuCauThue: request,
						}}
						dieuKien={dieuKienChuaRaSoat}
					/>
				</div>
			</main>
		);
	}
	if (!hoSo) notFound();

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
						chiTietDatCoc: hoSo.chiTietDatCoc
							? {
									giaThueThoaThuan: hoSo.chiTietDatCoc.giaThueThoaThuan,
									soGiuongQuyDoi: hoSo.chiTietDatCoc.soGiuongQuyDoi,
								}
							: null,
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
