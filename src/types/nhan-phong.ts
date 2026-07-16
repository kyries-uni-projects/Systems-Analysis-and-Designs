export type KiemTraThongTinListItem = {
	id: string;
	hoSoDatCocId: number;
	code: string;
	customer: string;
	room: string;
	appointmentTime: string;
	appointmentDate: string;
	status: string;
	cccd: string;
	gender: string;
	phone: string;
};

export type ThanhVienLuuTruInput = {
	name: string;
	cccd: string;
	gender: string;
	phone: string;
};

export type KiemTraThongTinDetail = KiemTraThongTinListItem & {
	hinhThucThue: string;
	ngayBatDauCuTru: string;
	thoiHanThueThang: number;
	ghiChu: string;
	daXacMinhGiayTo: boolean;
	members: ThanhVienLuuTruInput[];
};

export type LuuKiemTraThongTinInput = {
	ngayBatDauCuTru: string;
	thoiHanThueThang: number;
	ghiChu?: string;
	daXacMinhGiayTo: boolean;
	members: ThanhVienLuuTruInput[];
};

export type LuuKiemTraThongTinResult = {
	maHoSoNhanPhong: string;
	trangThai: string;
};

export type PheDuyetHoSoListItem = {
	id: string;
	hoSoNhanPhongId: number;
	code: string;
	customer: string;
	submittedAt: string;
	memberCount: number;
};

export type PheDuyetThanhVien = {
	id: string;
	thanhVienLuuTruId: number;
	name: string;
	cccd: string;
	gender: string;
	phone: string;
	isRepresentative: boolean;
	status: "pending" | "approved" | "rejected";
	rejectReason?: string;
};

export type PheDuyetHoSoDetail = PheDuyetHoSoListItem & {
	members: PheDuyetThanhVien[];
};

export type LuuPheDuyetHoSoInput = {
	members: {
		thanhVienLuuTruId: number;
		status: "approved" | "rejected";
		rejectReason?: string;
	}[];
	groupOption?: "continue" | "stop";
	representativeMemberId?: number;
};

export type LuuPheDuyetHoSoResult = {
	maHoSoNhanPhong: string;
	trangThai: string;
	ketQua: string;
};

export type LapHopDongMember = {
	name: string;
	cccd: string;
};

export type LapHopDongServiceFee = {
	idKhoanPhi: number;
	label: string;
	value: string;
	donGia: number;
	donViTinh?: string | null;
};

export type LapHopDongListItem = {
	id: string;
	hoSoNhanPhongId: number;
	code: string;
	customer: string;
	rentType: "giường" | "phòng";
	duration: string;
};

export type LapHopDongDetail = LapHopDongListItem & {
	cccd: string;
	dob: string;
	phone: string;
	address: string;
	room: string;
	floor: string;
	bedCount: number;
	pricePerBed: number;
	totalRent: number;
	startDate: string;
	endDate: string;
	deposit: number;
	contractCode: string;
	paymentCycle: string;
	members: LapHopDongMember[];
	serviceFees: LapHopDongServiceFee[];
	depositRules: string[];
	dormRules: string[];
	violationRules: string[];
};

export type LuuHopDongInput = {
	daXacNhanKhachDaKy: boolean;
};

export type LuuHopDongResult = {
	maHoSoNhanPhong: string;
	maHopDong: string;
	trangThaiHopDong: string;
	trangThaiHoSo: string;
};

export type ThanhToanDauKyListItem = {
	id: string;
	hoSoNhanPhongId: number;
	hopDongId: number;
	code: string;
	contractCode: string;
	customer: string;
	rentType: string;
	startDate: string;
};

export type ThanhToanKhoanThu = {
	id: string;
	source: "rent" | "service" | "extra";
	khoanPhiHopDongId?: number | null;
	label: string;
	description: string;
	amount: number;
};

export type ThanhToanDauKyDetail = ThanhToanDauKyListItem & {
	room: string;
	duration: string;
	paymentCycle: string;
	receiptStatus: string;
	paymentTime: string;
	charges: ThanhToanKhoanThu[];
	total: number;
};

export type LuuThanhToanDauKyInput = {
	charges: ThanhToanKhoanThu[];
	phuongThucThu?: string;
};

export type LuuThanhToanDauKyResult = {
	maHoSoNhanPhong: string;
	maHopDong: string;
	trangThaiHoSo: string;
	soTien: number;
};

export type BanGiaoPhongListItem = {
	id: string;
	hoSoNhanPhongId: number;
	hopDongId: number;
	code: string;
	contractCode: string;
	customer: string;
	memberCount: number;
};

export type TaiSanMacDinhBanGiao = {
	id: number;
	name: string;
	defaultQuantity: number;
	unit: string;
};

export type BanGiaoPhongDetail = BanGiaoPhongListItem & {
	room: string;
	location: string;
	handoverDate: string;
	assets: TaiSanMacDinhBanGiao[];
};

export type TaiSanBanGiaoInput = {
	assetId: number;
	quantity: number;
	note?: string;
};

export type LuuBienBanBanGiaoInput = {
	customerSigned: boolean;
	assets: TaiSanBanGiaoInput[];
};

export type LuuBienBanBanGiaoResult = {
	bienBanBanGiaoId: number;
	maHoSoNhanPhong: string;
	maHopDong: string;
	trangThaiHoSo: string;
	trangThaiPhongGiuong: string;
	soTaiSan: number;
};
