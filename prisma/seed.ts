// prisma/seed.ts
// Dữ liệu mẫu để test end-to-end 5 UC của Nhóm 4 (Trả phòng & Hoàn cọc), theo đúng schema
// v7 (HopDong 1:1 HoSoNhanPhong, phòng/giường ở ChiTietHopDong — nhiều dòng/hợp đồng).
// Chạy: yarn db:seed
//
// LƯU Ý: 4 tài khoản NguoiDung tạo dưới đây có `tenDangNhap` khớp CHÍNH XÁC với
// `demoAccounts` trong src/lib/auth.ts. Mật khẩu demo được băm PBKDF2 và đăng nhập tra cứu
// trực tiếp bảng NguoiDung giống các tài khoản do Admin tạo.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { ensureDemoAccounts } from "../src/lib/demo-account-seed";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
	console.log("Đang xoá dữ liệu cũ của Nhóm 4 + danh mục dùng chung (nếu có)...");
	await prisma.giaoDichHoanCoc.deleteMany();
	await prisma.bienBanTraPhong.deleteMany();
	await prisma.doiSoatHoanCoc.deleteMany();
	await prisma.nghiaVuConLai.deleteMany();
	await prisma.khoanKhauTru.deleteMany();
	await prisma.chiTietKiemTraTaiSan.deleteMany();
	await prisma.bienBanKiemTraTraPhong.deleteMany();
	await prisma.yeuCauTraPhong.deleteMany();
	await prisma.taiSanBanGiao.deleteMany();
	await prisma.taiSanMacDinh.deleteMany();
	await prisma.bienBanBanGiao.deleteMany();
	await prisma.ketQuaKiemTraDieuKien.deleteMany();
	await prisma.khoanThuDauKy.deleteMany();
	await prisma.khoanPhiHopDong.deleteMany();
	await prisma.khoanPhiDichVu.deleteMany();
	await prisma.chiTietHopDong.deleteMany();
	await prisma.hopDong.deleteMany();
	await prisma.pheDuyetLuuTru.deleteMany();
	await prisma.thanhVienLuuTru.deleteMany();
	await prisma.hoSoNhanPhong.deleteMany();
	await prisma.chungTuThanhToan.deleteMany();
	await prisma.yeuCauThanhToanCoc.deleteMany();
	await prisma.chiTietDatCoc.deleteMany();
	await prisma.hoSoDatCoc.deleteMany();
	await prisma.lichHenXemPhong.deleteMany();
	await prisma.yeuCauThue.deleteMany();
	await prisma.giuong.deleteMany();
	await prisma.phong.deleteMany();
	await prisma.loaiPhong.deleteMany();
	await prisma.mauNoiQuy.deleteMany();
	await prisma.khachHang.deleteMany();
	await prisma.nguoiDung.deleteMany();

	console.log("Tạo tài khoản người dùng (khớp đúng demoAccounts trong src/lib/auth.ts)...");
	const { admin, nhanvien01: nhanVien, quanly01: quanLy, ketoan01: keToan } = await ensureDemoAccounts(prisma);
	void admin;

	console.log("Tạo danh mục loại phòng, mẫu nội quy, danh mục tài sản mặc định...");
	const loaiPhongDon = await prisma.loaiPhong.create({ data: { tenLoaiPhong: "Phòng đơn", donGia: 3_000_000 } });
	const loaiPhongTapThe = await prisma.loaiPhong.create({ data: { tenLoaiPhong: "Phòng tập thể", donGia: 1_500_000 } });

	const mauNoiQuy = await prisma.mauNoiQuy.create({
		data: {
			tenMau: "Nội quy chuẩn 2025",
			noiQuy: "Không gây ồn sau 22h. Giữ vệ sinh chung. Không nuôi thú cưng.",
			quyDinhHoanCoc: "Hoàn 100% nếu HĐ hết hạn; 70% nếu ở >= 6 tháng; 50% nếu ở < 6 tháng, trừ hư hỏng phát sinh.",
			dieuKhoanViPham: "Vi phạm nội quy 3 lần trở lên bị trừ tối đa 20% tiền cọc.",
		},
	});

	const [tsGiuong, tsTu, tsBan, tsGhe] = await Promise.all(
		["Giường tầng", "Tủ quần áo", "Bàn học", "Ghế"].map((tenTaiSan) =>
			prisma.taiSanMacDinh.create({ data: { tenTaiSan } }),
		),
	);

	console.log("Tạo phòng & giường...");
	const phongA101 = await prisma.phong.create({
		data: { maPhong: "A-101", khu: "A", tang: 1, idLoaiPhong: loaiPhongTapThe.idLoaiPhong, sucChua: 4, trangThai: "DANG_HOAT_DONG" },
	});
	const giuongA101G1 = await prisma.giuong.create({ data: { phongId: phongA101.phongId, maGiuongLocal: "G1", trangThai: "Đang sử dụng" } });

	const phongB201 = await prisma.phong.create({
		data: { maPhong: "B-201", khu: "B", tang: 2, idLoaiPhong: loaiPhongDon.idLoaiPhong, sucChua: 1, trangThai: "DANG_HOAT_DONG" },
	});

	const phongD404 = await prisma.phong.create({
		data: { maPhong: "D-404", khu: "D", tang: 4, idLoaiPhong: loaiPhongTapThe.idLoaiPhong, sucChua: 4, trangThai: "DANG_HOAT_DONG" },
	});
	const giuongD404G2 = await prisma.giuong.create({ data: { phongId: phongD404.phongId, maGiuongLocal: "G2", trangThai: "Đang sử dụng" } });

	const phongC303 = await prisma.phong.create({
		data: { maPhong: "C-303", khu: "C", tang: 3, idLoaiPhong: loaiPhongTapThe.idLoaiPhong, sucChua: 4, trangThai: "DANG_HOAT_DONG" },
	});
	const giuongC303G1 = await prisma.giuong.create({ data: { phongId: phongC303.phongId, maGiuongLocal: "G1", trangThai: "Đang sử dụng" } });

	const phongB202 = await prisma.phong.create({
		data: { maPhong: "B-202", khu: "B", tang: 2, idLoaiPhong: loaiPhongDon.idLoaiPhong, sucChua: 1, trangThai: "DANG_HOAT_DONG" },
	});

	const phongE505 = await prisma.phong.create({
		data: { maPhong: "E-505", khu: "E", tang: 5, idLoaiPhong: loaiPhongTapThe.idLoaiPhong, sucChua: 4, trangThai: "DANG_HOAT_DONG" },
	});
	const giuongE505G2 = await prisma.giuong.create({ data: { phongId: phongE505.phongId, maGiuongLocal: "G2", trangThai: "Đang sử dụng" } });

	console.log("Tạo khách hàng...");
	const khNames: [string, string][] = [
		["Trần Minh Khoa", "079099001234"],
		["Nguyễn Thị Lan", "079099002345"],
		["Phạm Văn Đức", "079099003456"],
		["Vũ Thị Mai", "079099004567"],
		["Ngô Văn Tâm", "079099005678"],
		["Lê Thị Hồng", "079099006789"],
	];
	const [khKhoa, khLan, khDuc, khMai, khTam, khHong] = await Promise.all(
		khNames.map(([hoTen, cccd]) =>
			prisma.khachHang.create({ data: { hoTen, cccdPassport: cccd, soDienThoai: "09" + cccd.slice(-8) } }),
		),
	);

	let dem = 0;
	const maTiepTheo = (tienTo: string) => `${tienTo}-2025-${String(++dem).padStart(6, "0")}`;

	// Dựng trọn chuỗi: YeuCauThue -> HoSoDatCoc -> ChiTietDatCoc -> HoSoNhanPhong -> HopDong
	// -> ChiTietHopDong (1 phòng) -> BienBanBanGiao (+ 4 tài sản mặc định), trả về
	// chiTietHopDongId (khóa cần cho YeuCauTraPhong của Nhóm 4) và hopDongId.
	async function taoHopDongDaKy(params: {
		khachHangId: number;
		phongId: number;
		giuongId?: number;
		maHopDong: string;
		ngayBatDau: Date;
		ngayKetThuc: Date;
		tienCocGoc: number;
		trangThaiHopDong: string;
	}) {
		const hinhThucThue = params.giuongId ? "Theo giường" : "Nguyên phòng";

		const yc = await prisma.yeuCauThue.create({
			data: { khachHangId: params.khachHangId, nhanVienId: nhanVien.nguoiDungId, loaiThue: hinhThucThue, soNguoiDuKien: 1, trangThai: "Đã xử lý" },
		});
		const hoSoDatCoc = await prisma.hoSoDatCoc.create({
			data: {
				maHoSoDatCoc: maTiepTheo("DC"),
				yeuCauId: yc.yeuCauId,
				khachHangId: params.khachHangId,
				nhanVienId: nhanVien.nguoiDungId,
				hinhThucThue,
				ngayBatDauDuKien: params.ngayBatDau,
				ngayKetThucDuKien: params.ngayKetThuc,
				trangThai: "DA_XAC_NHAN",
			},
		});
		const chiTietDatCoc = await prisma.chiTietDatCoc.create({
			data: {
				hoSoDatCocId: hoSoDatCoc.hoSoDatCocId,
				phongId: params.phongId,
				giuongId: params.giuongId,
				giaThueThoaThuan: params.giuongId ? 1_500_000 : 3_000_000,
				tienCocPhanBo: params.tienCocGoc,
				quanLyXacNhanId: quanLy.nguoiDungId,
				thoiDiemXacNhan: new Date(),
				trangThai: "DA_XAC_NHAN",
			},
		});
		const hoSoNhanPhong = await prisma.hoSoNhanPhong.create({
			data: {
				maHoSoNhanPhong: maTiepTheo("NP"),
				hoSoDatCocId: hoSoDatCoc.hoSoDatCocId,
				nhanVienId: nhanVien.nguoiDungId,
				trangThai: "Đã duyệt",
			},
		});
		const hopDong = await prisma.hopDong.create({
			data: {
				maHopDong: params.maHopDong,
				hoSoNhanPhongId: hoSoNhanPhong.hoSoNhanPhongId,
				khachHangId: params.khachHangId,
				nhanVienId: nhanVien.nguoiDungId,
				idMauNoiQuy: mauNoiQuy.idMauNoiQuy,
				tienCocGoc: params.tienCocGoc,
				trangThai: params.trangThaiHopDong,
				ngayKy: params.ngayBatDau,
			},
		});
		const chiTietHopDong = await prisma.chiTietHopDong.create({
			data: {
				hopDongId: hopDong.hopDongId,
				chiTietDatCocId: chiTietDatCoc.chiTietDatCocId,
				phongId: params.phongId,
				giuongId: params.giuongId,
				hinhThucThue,
				giaThueThoaThuan: params.giuongId ? 1_500_000 : 3_000_000,
				tienCocPhanBo: params.tienCocGoc,
				ngayBatDau: params.ngayBatDau,
				ngayKetThuc: params.ngayKetThuc,
				trangThai: "Đang hiệu lực",
			},
		});

		const bbbg = await prisma.bienBanBanGiao.create({
			data: {
				hopDongId: hopDong.hopDongId,
				quanLyId: quanLy.nguoiDungId,
				tinhTrangVeSinh: "Sạch sẽ",
				xacNhanKyKhach: "Đã ký",
				trangThai: "Đã bàn giao",
				ngayBanGiao: new Date(),
			},
		});
		await prisma.taiSanBanGiao.createMany({
			data: [
				{ bienBanBanGiaoId: bbbg.bienBanBanGiaoId, idTaiSanMacDinh: tsGiuong.idTaiSanMacDinh, soLuong: 1, tinhTrang: "Tốt" },
				{ bienBanBanGiaoId: bbbg.bienBanBanGiaoId, idTaiSanMacDinh: tsTu.idTaiSanMacDinh, soLuong: 1, tinhTrang: "Tốt" },
				{ bienBanBanGiaoId: bbbg.bienBanBanGiaoId, idTaiSanMacDinh: tsBan.idTaiSanMacDinh, soLuong: 1, tinhTrang: "Tốt" },
				{ bienBanBanGiaoId: bbbg.bienBanBanGiaoId, idTaiSanMacDinh: tsGhe.idTaiSanMacDinh, soLuong: 1, tinhTrang: "Tốt" },
			],
		});

		return { hopDongId: hopDong.hopDongId, chiTietHopDongId: chiTietHopDong.chiTietHopDongId };
	}

	const nam = (n: number) => new Date(Date.UTC(2025, n - 1, 1));

	console.log("Kịch bản S1 — HĐ đang cho thuê, CHƯA đăng ký trả phòng (test UC1 từ đầu)...");
	await taoHopDongDaKy({
		khachHangId: khKhoa.khachHangId,
		phongId: phongA101.phongId,
		giuongId: giuongA101G1.giuongId,
		maHopDong: "HD-2025-000123",
		ngayBatDau: nam(3),
		ngayKetThuc: nam(9),
		tienCocGoc: 3_000_000,
		trangThaiHopDong: "Đang cho thuê",
	});

	console.log("Kịch bản S2 — HĐ đã hết hạn, CHƯA đăng ký trả phòng (test UC1 nhánh A4)...");
	await taoHopDongDaKy({
		khachHangId: khLan.khachHangId,
		phongId: phongB201.phongId,
		maHopDong: "HD-2025-000222",
		ngayBatDau: nam(2),
		ngayKetThuc: nam(4),
		tienCocGoc: 4_000_000,
		trangThaiHopDong: "Đã hết hạn",
	});

	console.log("Kịch bản S3 — đã đăng ký trả phòng, sẵn sàng cho UC2 (Quản lý kiểm tra)...");
	const s3 = await taoHopDongDaKy({
		khachHangId: khDuc.khachHangId,
		phongId: phongD404.phongId,
		giuongId: giuongD404G2.giuongId,
		maHopDong: "HD-2025-000098",
		ngayBatDau: new Date(Date.UTC(2024, 10, 1)),
		ngayKetThuc: nam(12),
		tienCocGoc: 2_500_000,
		trangThaiHopDong: "Đang cho thuê",
	});
	await prisma.yeuCauTraPhong.create({
		data: {
			chiTietHopDongId: s3.chiTietHopDongId,
			nhanVienId: nhanVien.nguoiDungId,
			ngayTraPhongDuKien: nam(12),
			gioTraPhong: "14:00",
			lyDoTraPhong: "Hết hợp đồng",
			coHetHanTheoLich: "Không",
			trangThai: "Đã đăng ký, chờ ngày trả phòng",
		},
	});

	console.log("Kịch bản S4 — đã kiểm tra xong, sẵn sàng cho UC3 (Kế toán đối soát)...");
	const s4 = await taoHopDongDaKy({
		khachHangId: khMai.khachHangId,
		phongId: phongC303.phongId,
		giuongId: giuongC303G1.giuongId,
		maHopDong: "HD-2025-000150",
		ngayBatDau: nam(1),
		ngayKetThuc: nam(5),
		tienCocGoc: 2_800_000,
		trangThaiHopDong: "Đang cho thuê",
	});
	const yc4 = await prisma.yeuCauTraPhong.create({
		data: {
			chiTietHopDongId: s4.chiTietHopDongId,
			nhanVienId: nhanVien.nguoiDungId,
			ngayTraPhongDuKien: nam(5),
			gioTraPhong: "10:00",
			coHetHanTheoLich: "Không",
			trangThai: "Đã kiểm tra, chờ đối soát cọc",
		},
	});
	await prisma.bienBanKiemTraTraPhong.create({
		data: {
			yeuCauTraPhongId: yc4.yeuCauTraPhongId,
			quanLyId: quanLy.nguoiDungId,
			tinhTrangVeSinh: "Sạch sẽ",
			coHuHong: "Không",
			trangThai: "Đã hoàn tất",
		},
	});

	console.log("Kịch bản S5 — đã đối soát, cần thu thêm (soTienHoan âm), sẵn sàng cho UC4...");
	const s5 = await taoHopDongDaKy({
		khachHangId: khTam.khachHangId,
		phongId: phongB202.phongId,
		maHopDong: "HD-2025-000201",
		ngayBatDau: new Date(Date.UTC(2024, 8, 1)),
		ngayKetThuc: nam(5),
		tienCocGoc: 4_000_000,
		trangThaiHopDong: "Đã hết hạn",
	});
	const yc5 = await prisma.yeuCauTraPhong.create({
		data: {
			chiTietHopDongId: s5.chiTietHopDongId,
			nhanVienId: nhanVien.nguoiDungId,
			ngayTraPhongDuKien: nam(5),
			coHetHanTheoLich: "Có",
			trangThai: "Đã xác nhận đối soát",
		},
	});
	const bbkt5 = await prisma.bienBanKiemTraTraPhong.create({
		data: {
			yeuCauTraPhongId: yc5.yeuCauTraPhongId,
			quanLyId: quanLy.nguoiDungId,
			coHuHong: "Có",
			trangThai: "Đã hoàn tất",
		},
	});
	await prisma.khoanKhauTru.create({
		data: { bienBanKiemTraId: bbkt5.bienBanKiemTraId, sttKhauTru: 1, loaiKhoanKhauTru: "Hư hỏng tài sản", moTa: "Vỡ kính cửa sổ", soTien: 4_500_000 },
	});
	await prisma.doiSoatHoanCoc.create({
		data: {
			yeuCauTraPhongId: yc5.yeuCauTraPhongId,
			bienBanKiemTraId: bbkt5.bienBanKiemTraId,
			keToanId: keToan.nguoiDungId,
			tienCocGoc: 4_000_000,
			tyLeHoanCoc: 100,
			soTienHoanCoBan: 4_000_000,
			tongKhauTru: 4_500_000,
			soTienHoanThucNhan: 0,
			soTienCanThuThem: 500_000,
			xacNhanKhachHang: "Đã đồng ý",
			trangThai: "Đã xác nhận",
		},
	});

	console.log("Kịch bản S6 — đã đối soát, có hoàn cọc dương, sẵn sàng cho UC4 -> UC5...");
	const s6 = await taoHopDongDaKy({
		khachHangId: khHong.khachHangId,
		phongId: phongE505.phongId,
		giuongId: giuongE505G2.giuongId,
		maHopDong: "HD-2025-000188",
		ngayBatDau: nam(1),
		ngayKetThuc: nam(5),
		tienCocGoc: 2_800_000,
		trangThaiHopDong: "Đang cho thuê",
	});
	const yc6 = await prisma.yeuCauTraPhong.create({
		data: {
			chiTietHopDongId: s6.chiTietHopDongId,
			nhanVienId: nhanVien.nguoiDungId,
			ngayTraPhongDuKien: nam(5),
			coHetHanTheoLich: "Không",
			trangThai: "Đã xác nhận đối soát",
		},
	});
	const bbkt6 = await prisma.bienBanKiemTraTraPhong.create({
		data: {
			yeuCauTraPhongId: yc6.yeuCauTraPhongId,
			quanLyId: quanLy.nguoiDungId,
			coHuHong: "Không",
			trangThai: "Đã hoàn tất",
		},
	});
	await prisma.doiSoatHoanCoc.create({
		data: {
			yeuCauTraPhongId: yc6.yeuCauTraPhongId,
			bienBanKiemTraId: bbkt6.bienBanKiemTraId,
			keToanId: keToan.nguoiDungId,
			tienCocGoc: 2_800_000,
			tyLeHoanCoc: 70,
			soTienHoanCoBan: 1_960_000,
			tongKhauTru: 0,
			soTienHoanThucNhan: 1_960_000,
			soTienCanThuThem: 0,
			xacNhanKhachHang: "Đã đồng ý",
			trangThai: "Đã xác nhận",
		},
	});

	console.log("");
	console.log("Xong. Đăng nhập bằng 4 tài khoản demo có sẵn ở trang /login:");
	console.log("  admin / admin123      — Quản trị hệ thống");
	console.log("  nhanvien01 / nv123    — Nhân viên (UC1)");
	console.log("  quanly01 / ql123      — Quản lý (UC2, UC4)");
	console.log("  ketoan01 / kt123      — Kế toán (UC3, UC5)");
	console.log("");
	console.log("6 kịch bản mẫu:");
	console.log("  HD-2025-000123 (Trần Minh Khoa, A-101) — chưa đăng ký trả phòng, test UC1");
	console.log("  HD-2025-000222 (Nguyễn Thị Lan, B-201) — HĐ hết hạn, chưa đăng ký, test UC1 nhánh A4");
	console.log("  HD-2025-000098 (Phạm Văn Đức, D-404)   — đã đăng ký, sẵn sàng UC2");
	console.log("  HD-2025-000150 (Vũ Thị Mai, C-303)     — đã kiểm tra xong, sẵn sàng UC3");
	console.log("  HD-2025-000201 (Ngô Văn Tâm, B-202)    — đã đối soát (cần thu thêm), sẵn sàng UC4");
	console.log("  HD-2025-000188 (Lê Thị Hồng, E-505)    — đã đối soát (hoàn cọc dương), sẵn sàng UC4->UC5");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
