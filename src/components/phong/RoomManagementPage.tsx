"use client";

import { useMemo, useState } from "react";
import {
	AlertTriangle,
	BedDouble,
	Building2,
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	CircleDollarSign,
	Edit3,
	Hammer,
	MapPin,
	Plus,
	Search,
	X,
} from "lucide-react";
import { GENDER_OPTIONS } from "@/lib/gender";
import type { PhongGiuongRecord, PhongRecord } from "@/types/phong";

type RoomType = {
	idLoaiPhong: number;
	tenLoaiPhong: string;
	donGia: number;
};

type ApiPayload = {
	success?: boolean;
	error?: string;
	details?: { code?: string };
	data?: unknown;
};

const manageableStatuses = ["Trống", "Đang bảo trì", "Ngừng hoạt động"];
const filterStatuses = ["Trống", "Đang chờ xác nhận", "Đã cọc", "Đang sử dụng", "Đang bảo trì", "Ngừng hoạt động"];

function readError(payload: ApiPayload, fallback: string) {
	return typeof payload.error === "string" ? payload.error : fallback;
}

function displayStatus(status: string) {
	if (["DANG_HOAT_DONG", "Đang hoạt động"].includes(status)) return "Trống";
	if (status === "Dang su dung") return "Đang sử dụng";
	return status;
}

function isAvailable(status: string) {
	return ["Trống", "DANG_HOAT_DONG", "Đang hoạt động"].includes(status);
}

function statusClass(status: string) {
	const label = displayStatus(status);
	if (label === "Trống") return "border-emerald-200 bg-emerald-50 text-emerald-700";
	if (label === "Đang bảo trì") return "border-amber-200 bg-amber-50 text-amber-700";
	if (label === "Ngừng hoạt động") return "border-slate-200 bg-slate-100 text-slate-500";
	if (label === "Đã cọc" || label === "Đang chờ xác nhận") return "border-blue-200 bg-blue-50 text-blue-700";
	return "border-violet-200 bg-violet-50 text-violet-700";
}

function formatMoney(value: number) {
	return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}

export default function RoomManagementPage({ initialRooms, roomTypes }: { initialRooms: PhongRecord[]; roomTypes: RoomType[] }) {
	const [rooms, setRooms] = useState(initialRooms);
	const [search, setSearch] = useState("");
	const [areaFilter, setAreaFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");
	const [expandedRooms, setExpandedRooms] = useState<Set<number>>(new Set());
	const [editingRoom, setEditingRoom] = useState<PhongRecord | null | undefined>(undefined);
	const [editingBed, setEditingBed] = useState<{ room: PhongRecord; bed: PhongGiuongRecord | null } | null>(null);
	const [pageError, setPageError] = useState("");
	const [success, setSuccess] = useState("");
	const [isReloading, setIsReloading] = useState(false);

	const areas = useMemo(
		() => Array.from(new Set(rooms.map((room) => room.khu).filter((area): area is string => Boolean(area)))).sort(),
		[rooms],
	);

	const filteredRooms = useMemo(() => {
		const term = search.trim().toLocaleLowerCase("vi-VN");
		return rooms.filter((room) => {
			const matchesSearch =
				!term ||
				[room.maPhong, room.khu ?? "", room.loaiPhong.tenLoaiPhong, ...room.giuongs.map((bed) => bed.maGiuongLocal)].some((value) =>
					value.toLocaleLowerCase("vi-VN").includes(term),
				);
			return matchesSearch && (areaFilter === "all" || room.khu === areaFilter) && (statusFilter === "all" || displayStatus(room.trangThai) === statusFilter);
		});
	}, [areaFilter, rooms, search, statusFilter]);

	const allBeds = rooms.flatMap((room) => room.giuongs);
	const stats = {
		rooms: rooms.length,
		beds: allBeds.length,
		availableBeds: allBeds.filter((bed) => isAvailable(bed.trangThai)).length,
		maintenance: rooms.filter((room) => displayStatus(room.trangThai) === "Đang bảo trì").length + allBeds.filter((bed) => displayStatus(bed.trangThai) === "Đang bảo trì").length,
	};

	async function reloadRooms(message: string) {
		setIsReloading(true);
		setPageError("");
		try {
			const response = await fetch("/api/phong?pageSize=500", { cache: "no-store" });
			const payload = (await response.json()) as ApiPayload;
			if (!response.ok || !payload.success) throw new Error(readError(payload, "Không thể tải lại danh mục phòng/giường."));
			const data = payload.data as { items: PhongRecord[] };
			setRooms(data.items);
			setSuccess(message);
		} catch (error) {
			setPageError(error instanceof Error ? error.message : "Không thể tải lại danh mục phòng/giường.");
		} finally {
			setIsReloading(false);
		}
	}

	function toggleRoom(roomId: number) {
		setExpandedRooms((current) => {
			const next = new Set(current);
			if (next.has(roomId)) next.delete(roomId);
			else next.add(roomId);
			return next;
		});
	}

	return (
		<main className="min-h-full bg-[#f2f6fb] px-4 py-8 sm:px-8">
			<div className="mx-auto w-full max-w-6xl">
				<header className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">Danh mục lưu trú</p>
						<h1 className="mt-1 text-2xl font-bold text-[#1b2b4b]">Quản lý phòng / giường</h1>
						<p className="mt-1 text-sm text-slate-500">Theo dõi sức chứa, giá thuê và trạng thái khai thác</p>
					</div>
					<button type="button" onClick={() => setEditingRoom(null)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#20365f] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#182b4e]">
						<Plus className="size-4" /> Thêm phòng
					</button>
				</header>

				{pageError && <Notice tone="error" icon={<AlertTriangle className="size-4" />}>{pageError}</Notice>}
				{success && <Notice tone="success" icon={<CheckCircle2 className="size-4" />}>{success}</Notice>}

				<section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<StatCard icon={<Building2 className="size-6" />} value={stats.rooms} label="Tổng phòng" color="text-[#1b2b4b]" />
					<StatCard icon={<BedDouble className="size-6" />} value={stats.beds} label="Tổng giường" color="text-blue-600" />
					<StatCard icon={<CheckCircle2 className="size-6" />} value={stats.availableBeds} label="Giường trống" color="text-teal-600" />
					<StatCard icon={<Hammer className="size-6" />} value={stats.maintenance} label="Đang bảo trì" color="text-amber-500" />
				</section>

				<section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
					<div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_190px_190px_auto]">
						<label className="relative">
							<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
							<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm mã phòng, giường, loại phòng..." className="h-11 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
						</label>
						<FilterSelect value={areaFilter} onChange={setAreaFilter}><option value="all">Tất cả khu</option>{areas.map((area) => <option key={area} value={area}>{area}</option>)}</FilterSelect>
						<FilterSelect value={statusFilter} onChange={setStatusFilter}><option value="all">Tất cả trạng thái</option>{filterStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</FilterSelect>
						<span className="self-center text-right text-xs text-slate-400">{isReloading ? "Đang cập nhật..." : `${filteredRooms.length} phòng`}</span>
					</div>
				</section>

				<section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
					<div className="overflow-x-auto">
						<table className="w-full min-w-245 text-left text-sm">
							<thead className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
								<tr><th className="w-12 px-4 py-4" /><th className="px-3 py-4 font-semibold">Phòng</th><th className="px-3 py-4 font-semibold">Loại / Giá thuê</th><th className="px-3 py-4 font-semibold">Vị trí</th><th className="px-3 py-4 font-semibold">Sức chứa</th><th className="px-3 py-4 font-semibold">Trạng thái</th><th className="px-5 py-4 text-right font-semibold">Thao tác</th></tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{filteredRooms.map((room) => {
									const expanded = expandedRooms.has(room.phongId);
									const availableBeds = room.giuongs.filter((bed) => isAvailable(bed.trangThai)).length;
									return (
										<RoomRows key={room.phongId} room={room} expanded={expanded} availableBeds={availableBeds} onToggle={() => toggleRoom(room.phongId)} onEdit={() => setEditingRoom(room)} onAddBed={() => { setExpandedRooms((current) => new Set(current).add(room.phongId)); setEditingBed({ room, bed: null }); }} onEditBed={(bed) => setEditingBed({ room, bed })} />
									);
								})}
								{filteredRooms.length === 0 && <tr><td colSpan={7} className="px-5 py-14 text-center text-sm text-slate-400">Không có phòng phù hợp bộ lọc.</td></tr>}
							</tbody>
						</table>
					</div>
				</section>
			</div>

			{editingRoom !== undefined && <RoomFormModal room={editingRoom} roomTypes={roomTypes} onClose={() => setEditingRoom(undefined)} onSaved={(created) => { setEditingRoom(undefined); void reloadRooms(created ? "Tạo phòng thành công." : "Đã lưu thay đổi phòng."); }} />}
			{editingBed && <BedFormModal room={editingBed.room} bed={editingBed.bed} onClose={() => setEditingBed(null)} onSaved={(created) => { setEditingBed(null); void reloadRooms(created ? "Thêm giường thành công." : "Đã lưu thay đổi giường."); }} />}
		</main>
	);
}

function RoomRows({ room, expanded, availableBeds, onToggle, onEdit, onAddBed, onEditBed }: { room: PhongRecord; expanded: boolean; availableBeds: number; onToggle: () => void; onEdit: () => void; onAddBed: () => void; onEditBed: (bed: PhongGiuongRecord) => void }) {
	return <>
		<tr className="text-slate-600 transition hover:bg-slate-50/60">
			<td className="px-4 py-4"><button type="button" onClick={onToggle} aria-label={expanded ? `Thu gọn ${room.maPhong}` : `Mở danh sách giường ${room.maPhong}`} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#1b2b4b]">{expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}</button></td>
			<td className="px-3 py-4"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-[#e8f1ff] text-blue-600"><Building2 className="size-5" /></span><div><p className="font-semibold text-[#1b2b4b]">{room.maPhong}</p><p className="mt-0.5 text-xs text-slate-400">{room.gioiTinhApDung || "Không giới hạn giới tính"}</p></div></div></td>
			<td className="px-3 py-4"><p className="font-medium text-slate-700">{room.loaiPhong.tenLoaiPhong}</p><p className="mt-0.5 text-xs text-teal-600">{formatMoney(room.loaiPhong.donGia)} / tháng</p></td>
			<td className="px-3 py-4"><p className="inline-flex items-center gap-1.5"><MapPin className="size-3.5 text-slate-400" />{room.khu || "Chưa xác định"}</p><p className="mt-1 text-xs text-slate-400">{room.tang === null ? "Chưa nhập tầng" : `Tầng ${room.tang}`}</p></td>
			<td className="px-3 py-4"><p className="font-medium text-slate-700">{room.giuongs.length} / {room.sucChua} giường</p><p className="mt-0.5 text-xs text-slate-400">{availableBeds} giường trống</p></td>
			<td className="px-3 py-4"><StatusBadge status={room.trangThai} />{room.dangCoNguoiThue && <p className="mt-1.5 text-[11px] text-violet-600">{room.soHopDongHieuLuc} phân bổ đang thuê</p>}</td>
			<td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={onAddBed} disabled={room.giuongs.length >= room.sucChua} className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"><Plus className="size-3.5" /> Thêm giường</button><button type="button" onClick={onEdit} aria-label={`Chỉnh sửa ${room.maPhong}`} className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Edit3 className="size-4" /></button></div></td>
		</tr>
		{expanded && <tr className="bg-[#f8fafc]"><td colSpan={7} className="px-8 py-4"><div className="rounded-xl border border-slate-200 bg-white p-4"><div className="mb-3 flex items-center justify-between"><div><p className="text-sm font-semibold text-[#1b2b4b]">Giường thuộc phòng {room.maPhong}</p><p className="text-xs text-slate-400">Mã giường chỉ cần duy nhất trong phòng này</p></div><span className="text-xs text-slate-400">{room.giuongs.length} / {room.sucChua}</span></div>{room.giuongs.length > 0 ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{room.giuongs.map((bed) => <button type="button" key={bed.giuongId} onClick={() => onEditBed(bed)} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50/40"><span className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><BedDouble className="size-4" /></span><span><span className="block text-sm font-semibold text-[#1b2b4b]">{bed.maGiuongLocal}</span><span className="mt-1 block"><StatusBadge status={bed.trangThai} compact /></span></span></span><Edit3 className="size-3.5 text-slate-300" /></button>)}</div> : <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">Chưa khai báo giường. Dùng “Thêm giường” để bắt đầu.</div>}{room.tienIch && <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500"><span className="font-semibold text-slate-600">Tiện ích:</span> {room.tienIch}</p>}</div></td></tr>}
	</>;
}

function RoomFormModal({ room, roomTypes, onClose, onSaved }: { room: PhongRecord | null; roomTypes: RoomType[]; onClose: () => void; onSaved: (created: boolean) => void }) {
	const isCreate = room === null;
	const [form, setForm] = useState(() => ({ maPhong: room?.maPhong ?? "", idLoaiPhong: String(room?.idLoaiPhong ?? roomTypes[0]?.idLoaiPhong ?? ""), sucChua: String(room?.sucChua ?? 1), khu: room?.khu ?? "", tang: room?.tang === null || room?.tang === undefined ? "" : String(room.tang), gioiTinhApDung: room?.gioiTinhApDung ?? "", tienIch: room?.tienIch ?? "", trangThai: room?.trangThai ?? "Trống" }));
	const [error, setError] = useState("");
	const [warning, setWarning] = useState("");
	const [pendingPayload, setPendingPayload] = useState<Record<string, unknown> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const selectedType = roomTypes.find((type) => String(type.idLoaiPhong) === form.idLoaiPhong);
	const statusOptions = [form.trangThai, ...manageableStatuses.filter((status) => status !== displayStatus(form.trangThai))];
	const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

	async function save(payload: Record<string, unknown>, confirmed = false) {
		setError(""); setWarning(""); setIsSubmitting(true);
		const response = await fetch(isCreate ? "/api/phong" : `/api/phong/${room.phongId}`, { method: isCreate ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, xacNhanDangThue: confirmed }) });
		const result = (await response.json().catch(() => ({}))) as ApiPayload;
		setIsSubmitting(false);
		if (response.status === 409 && result.details?.code === "ACTIVE_RENTAL_CONFIRMATION_REQUIRED") { setPendingPayload(payload); setWarning(readError(result, "Phòng đang được thuê. Xác nhận nếu vẫn muốn đổi trạng thái.")); return; }
		if (!response.ok || !result.success) { setError(readError(result, isCreate ? "Không thể tạo phòng." : "Không thể lưu thay đổi.")); return; }
		onSaved(isCreate);
	}

	function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!form.maPhong.trim() || !form.idLoaiPhong || Number(form.sucChua) <= 0) { setError("Vui lòng nhập mã phòng, loại phòng và sức chứa hợp lệ."); return; }
		void save({ ...form, tang: form.tang || undefined, khu: form.khu || undefined, gioiTinhApDung: form.gioiTinhApDung || undefined, tienIch: form.tienIch || undefined });
	}

	return <ModalShell onClose={onClose}>
		<ModalHeader title={isCreate ? "Thêm phòng mới" : `Cập nhật phòng ${room.maPhong}`} subtitle="Thông tin phòng và chính sách khai thác" onClose={onClose} />
		{error && <InlineAlert tone="error">{error}</InlineAlert>}
		{warning && <InlineAlert tone="warning"><p>{warning}</p><p className="mt-1 text-xs">Thay đổi có thể ảnh hưởng nghiệp vụ đang xử lý.</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => { setWarning(""); setPendingPayload(null); }} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold">Giữ trạng thái cũ</button><button type="button" disabled={isSubmitting} onClick={() => pendingPayload && void save(pendingPayload, true)} className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white">Xác nhận vẫn cập nhật</button></div></InlineAlert>}
		<form onSubmit={submit} className="mt-6">
			<div className="grid gap-4 sm:grid-cols-2">
				<FormField label="Mã phòng" required value={form.maPhong} onChange={(value) => update("maPhong", value)} placeholder="A-101" />
				<SelectField label="Loại phòng" required value={form.idLoaiPhong} onChange={(value) => update("idLoaiPhong", value)}><option value="">Chọn loại phòng</option>{roomTypes.map((type) => <option key={type.idLoaiPhong} value={type.idLoaiPhong}>{type.tenLoaiPhong}</option>)}</SelectField>
				<FormField label="Sức chứa" required type="number" min="1" value={form.sucChua} onChange={(value) => update("sucChua", value)} />
				<div><p className="mb-1.5 text-xs font-semibold text-slate-600">Giá thuê theo loại phòng</p><div className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-teal-700"><CircleDollarSign className="size-4" />{selectedType ? `${formatMoney(selectedType.donGia)} / tháng` : "Chưa chọn loại phòng"}</div></div>
				<FormField label="Khu" value={form.khu} onChange={(value) => update("khu", value)} placeholder="Khu A" />
				<FormField label="Tầng" type="number" value={form.tang} onChange={(value) => update("tang", value)} placeholder="1" />
				<SelectField label="Giới tính áp dụng" value={form.gioiTinhApDung} onChange={(value) => update("gioiTinhApDung", value)}><option value="">Không giới hạn</option>{GENDER_OPTIONS.map((gender) => <option key={gender} value={gender}>{gender}</option>)}</SelectField>
				<SelectField label="Trạng thái" required value={form.trangThai} onChange={(value) => update("trangThai", value)}>{statusOptions.map((status) => <option key={status} value={status}>{displayStatus(status)}</option>)}</SelectField>
				<FormField className="sm:col-span-2" label="Tiện ích" value={form.tienIch} onChange={(value) => update("tienIch", value)} placeholder="Điều hòa, tủ đồ, ban công..." />
			</div>
			<ModalActions onClose={onClose} isSubmitting={isSubmitting} submitLabel={isCreate ? "Tạo phòng" : "Lưu thay đổi"} />
		</form>
	</ModalShell>;
}

function BedFormModal({ room, bed, onClose, onSaved }: { room: PhongRecord; bed: PhongGiuongRecord | null; onClose: () => void; onSaved: (created: boolean) => void }) {
	const isCreate = bed === null;
	const [maGiuongLocal, setMaGiuongLocal] = useState(bed?.maGiuongLocal ?? "");
	const [trangThai, setTrangThai] = useState(bed?.trangThai ?? "Trống");
	const [error, setError] = useState("");
	const [warning, setWarning] = useState("");
	const [pendingPayload, setPendingPayload] = useState<Record<string, unknown> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const statusOptions = Array.from(new Set([trangThai, ...manageableStatuses]));

	async function save(payload: Record<string, unknown>, confirmed = false) {
		setError(""); setWarning(""); setIsSubmitting(true);
		const url = isCreate ? `/api/phong/${room.phongId}/giuong` : `/api/phong/${room.phongId}/giuong/${bed.giuongId}`;
		const response = await fetch(url, { method: isCreate ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, xacNhanDangThue: confirmed }) });
		const result = (await response.json().catch(() => ({}))) as ApiPayload;
		setIsSubmitting(false);
		if (response.status === 409 && result.details?.code === "ACTIVE_RENTAL_CONFIRMATION_REQUIRED") { setPendingPayload(payload); setWarning(readError(result, "Giường đang được thuê. Xác nhận nếu vẫn muốn đổi trạng thái.")); return; }
		if (!response.ok || !result.success) { setError(readError(result, isCreate ? "Không thể thêm giường." : "Không thể lưu thay đổi.")); return; }
		onSaved(isCreate);
	}

	function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!maGiuongLocal.trim()) { setError("Vui lòng nhập mã giường."); return; }
		void save({ maGiuongLocal, trangThai });
	}

	return <ModalShell onClose={onClose} narrow>
		<ModalHeader title={isCreate ? `Thêm giường vào ${room.maPhong}` : `Cập nhật giường ${bed.maGiuongLocal}`} subtitle={`${room.giuongs.length} / ${room.sucChua} giường đã khai báo`} onClose={onClose} />
		{error && <InlineAlert tone="error">{error}</InlineAlert>}
		{warning && <InlineAlert tone="warning"><p>{warning}</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => { setWarning(""); setPendingPayload(null); }} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold">Giữ trạng thái cũ</button><button type="button" disabled={isSubmitting} onClick={() => pendingPayload && void save(pendingPayload, true)} className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white">Xác nhận vẫn cập nhật</button></div></InlineAlert>}
		<form onSubmit={submit} className="mt-6 space-y-4">
			<FormField label="Mã giường trong phòng" required value={maGiuongLocal} onChange={setMaGiuongLocal} placeholder="G1" />
			<SelectField label="Trạng thái" required value={trangThai} onChange={setTrangThai}>{statusOptions.map((status) => <option key={status} value={status}>{displayStatus(status)}</option>)}</SelectField>
			<ModalActions onClose={onClose} isSubmitting={isSubmitting} submitLabel={isCreate ? "Thêm giường" : "Lưu thay đổi"} />
		</form>
	</ModalShell>;
}

function Notice({ tone, icon, children }: { tone: "error" | "success"; icon: React.ReactNode; children: React.ReactNode }) {
	return <div className={`mt-5 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${tone === "error" ? "border-red-200 bg-red-50 text-red-600" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{icon}{children}</div>;
}

function InlineAlert({ tone, children }: { tone: "error" | "warning"; children: React.ReactNode }) {
	return <div className={`mt-5 rounded-lg border px-4 py-3 text-sm ${tone === "error" ? "border-red-200 bg-red-50 text-red-600" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{children}</div>;
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
	return <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm"><span className="absolute -right-4 -top-4 size-20 rounded-full bg-slate-50" /><div className="relative flex items-center gap-4"><span className={color}>{icon}</span><div><p className={`text-2xl font-bold ${color}`}>{value}</p><p className="text-xs text-slate-500">{label}</p></div></div></div>;
}

function StatusBadge({ status, compact = false }: { status: string; compact?: boolean }) {
	return <span className={`inline-flex items-center rounded-full border font-medium ${statusClass(status)} ${compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"}`}>{displayStatus(status)}</span>;
}

function FilterSelect({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: React.ReactNode }) {
	return <label className="relative"><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-600 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100">{children}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /></label>;
}

function ModalShell({ onClose, narrow = false, children }: { onClose: () => void; narrow?: boolean; children: React.ReactNode }) {
	return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10213a]/55 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className={`max-h-[92vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ${narrow ? "max-w-lg" : "max-w-2xl"}`}>{children}</div></div>;
}

function ModalHeader({ title, subtitle, onClose }: { title: string; subtitle: string; onClose: () => void }) {
	return <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-[#1b2b4b]">{title}</h2><p className="mt-1 text-xs text-slate-400">{subtitle}</p></div><button type="button" onClick={onClose} aria-label="Đóng" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="size-5" /></button></div>;
}

function ModalActions({ onClose, isSubmitting, submitLabel }: { onClose: () => void; isSubmitting: boolean; submitLabel: string }) {
	return <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5"><button type="button" onClick={onClose} className="h-11 rounded-lg bg-slate-100 text-sm font-medium text-slate-600">Hủy</button><button disabled={isSubmitting} className="h-11 rounded-lg bg-[#20365f] text-sm font-semibold text-white disabled:opacity-50">{isSubmitting ? "Đang lưu..." : submitLabel}</button></div>;
}

function FormField({ label, required, className = "", type = "text", min, value, onChange, placeholder }: { label: string; required?: boolean; className?: string; type?: string; min?: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
	return <label className={className}><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}{required && <span className="text-red-500"> *</span>}</span><input required={required} type={type} min={min} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-[#1b2b4b] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" /></label>;
}

function SelectField({ label, required, value, onChange, children }: { label: string; required?: boolean; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
	return <label><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}{required && <span className="text-red-500"> *</span>}</span><span className="relative block"><select required={required} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm text-[#1b2b4b] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100">{children}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /></span></label>;
}
