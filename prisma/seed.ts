// prisma/seed.ts
// Dữ liệu mẫu để test end-to-end 5 UC của Nhóm 4 (Trả phòng & Hoàn cọc). Chạy: yarn db:seed
//
// LƯU Ý: 4 tài khoản NguoiDung tạo dưới đây có `tenDangNhap` khớp CHÍNH XÁC với
// `demoAccounts` trong src/lib/auth.ts (nguồn xác thực thật của cả app). Cột `matKhauHash`
// ở đây KHÔNG được dùng để xác thực (login hiện tại so khớp thẳng với demoAccounts, không
// tra DB) — chỉ tồn tại vì đây là cột NOT NULL trong schema. `src/lib/traPhongSession.ts`
// tra bảng NguoiDung THEO tenDangNhap để lấy `nguoiDungId` thật cho các cột khóa ngoại của
// Nhóm 4 (quanLyId, keToanId, nhanVienId...).
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

const KHONG_DUNG_DE_XAC_THUC = "khong-dung-de-xac-thuc-xem-src-lib-auth-ts";

async function main() {
	console.log("Đang xoá dữ liệu cũ của Nhóm 4 + danh mục dùng chung (nếu có)...");
	await prisma.giaoDichHoanCoc.deleteMany();
	await prisma.bienBanTraPhong.deleteMany();
	await prisma.doiSoatHoanCoc.deleteMany();
	await prisma.nghiaVuConLai.deleteMany();
	await prisma.khoanKhauTru.deleteMany();
	await prisma.bienBanKiemTraTraPhong.deleteMany();
	await prisma.yeuCauTraPhong.deleteMany();
	await prisma.taiSanBanGiao.deleteMany();
	await prisma.bienBanBanGiao.deleteMany();
	await prisma.ketQuaKiemTraDieuKien.deleteMany();
	await prisma.khoanPhiDichVu.deleteMany();
	await prisma.pheDuyetLuuTru.deleteMany();
	await prisma.thanhVienLuuTru.deleteMany();
	await prisma.khoanThuDauKy.deleteMany();
	await prisma.hoSoNhanPhong.deleteMany();
	await prisma.hopDong.deleteMany();
	await prisma.chungTuThanhToan.deleteMany();
	await prisma.yeuCauThanhToanCoc.deleteMany();
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
	const admin = await prisma.nguoiDung.create({
		data: { hoTen: "Nguyễn Văn An", tenDangNhap: "admin", matKhauHash: KHONG_DUNG_DE_XAC_THUC, vaiTro: "Admin" },
	});
	const nhanVien = await prisma.nguoiDung.create({
		data: { hoTen: "Phạm Thị Dung", tenDangNhap: "nhanvien01", matKhauHash: KHONG_DUNG_DE_XAC_THUC, vaiTro: "Sale" },
	});
	const quanLy = await prisma.nguoiDung.create({
		data: { hoTen: "Trần Thị Bình", tenDangNhap: "quanly01", matKhauHash: KHONG_DUNG_DE_XAC_THUC, vaiTro: "QuanLy" },
	});
	const keToan = await prisma.nguoiDung.create({
		data: { hoTen: "Lê Minh Cường", tenDangNhap: "ketoan01", matKhauHash: KHONG_DUNG_DE_XAC_THUC, vaiTro: "KeToan" },
	});
	void admin;

	console.log("Tạo danh mục loại phòng, mẫu nội quy...");
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

	console.log("Tạo phòng & giường...");
	const phongA101 = await prisma.phong.create({
		data: { maPhong: "A-101", khu: "A", tang: 1, idLoaiPhong: loaiPhongTapThe.idLoaiPhong, sucChua: 4, trangThai: "Đang sử dụng" },
	});
	const giuongA101G1 = await prisma.giuong.create({ data: { phongId: phongA101.phongId, maGiuongLocal: "G1", trangThai: "Đang sử dụng" } });

	const phongB201 = await prisma.phong.create({
		data: { maPhong: "B-201", khu: "B", tang: 2, idLoaiPhong: loaiPhongDon.idLoaiPhong, sucChua: 1, trangThai: "Đang sử dụng" },
	});

	const phongD404 = await prisma.phong.create({
		data: { maPhong: "D-404", khu: "D", tang: 4, idLoaiPhong: loaiPhongTapThe.idLoaiPhong, sucChua: 4, trangThai: "Đang sử dụng" },
	});
	const giuongD404G2 = await prisma.giuong.create({ data: { phongId: phongD404.phongId, maGiuongLocal: "G2", trangThai: "Đang sử dụng" } });

	const phongC303 = await prisma.phong.create({
		data: { maPhong: "C-303", khu: "C", tang: 3, idLoaiPhong: loaiPhongTapThe.idLoaiPhong, sucChua: 4, trangThai: "Đang sử dụng" },
	});
	const giuongC303G1 = await prisma.giuong.create({ data: { phongId: phongC303.phongId, maGiuongLocal: "G1", trangThai: "Đang sử dụng" } });

	const phongB202 = await prisma.phong.create({
		data: { maPhong: "B-202", khu: "B", tang: 2, idLoaiPhong: loaiPhongDon.idLoaiPhong, sucChua: 1, trangThai: "Đang sử dụng" },
	});

	const phongE505 = await prisma.phong.create({
		data: { maPhong: "E-505", khu: "E", tang: 5, idLoaiPhong: loaiPhongTapThe.idLoaiPhong, sucChua: 4, trangThai: "Đang sử dụng" },
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

	async function taoHopDongDaKy(params: {
		khachHangId: number;
		phongId: number;
		giuongId?: number;
		maHopDong: string;
		ngayBatDau: Date;
		ngayKetThuc: Date;
		tienCocGoc: number;
		trangThaiHopDong: string;
		soThangLuuTru: number;
	}) {
		const yc = await prisma.yeuCauThue.create({
			data: {
				khachHangId: params.khachHangId,
				nhanVienId: nhanVien.nguoiDungId,
				loaiThue: params.giuongId ? "Theo giường" : "Nguyên phòng",
				soNguoiDuKien: 1,
				trangThai: "Đã xử lý",
			},
		});
		const hoSoDatCoc = await prisma.hoSoDatCoc.create({
			data: {
				yeuCauId: yc.yeuCauId,
				khachHangId: params.khachHangId,
				phongId: params.phongId,
				giuongId: params.giuongId,
				hinhThucThue: params.giuongId ? "Theo giường" : "Nguyên phòng",
				soGiuongThue: 1,
				nhanVienId: nhanVien.nguoiDungId,
				quanLyXacNhanId: quanLy.nguoiDungId,
				trangThai: "Đã xác nhận",
			},
		});
		const hopDong = await prisma.hopDong.create({
			data: {
				maHopDong: params.maHopDong,
				khachHangId: params.khachHangId,
				nhanVienId: nhanVien.nguoiDungId,
				idMauNoiQuy: mauNoiQuy.idMauNoiQuy,
				ngayBatDau: params.ngayBatDau,
				ngayKetThuc: params.ngayKetThuc,
				tienCocGoc: params.tienCocGoc,
				trangThai: params.trangThaiHopDong,
				ngayKy: params.ngayBatDau,
			},
		});
		const hoSoNhanPhong = await prisma.hoSoNhanPhong.create({
			data: {
				hoSoDatCocId: hoSoDatCoc.hoSoDatCocId,
				hopDongId: hopDong.hopDongId,
				nhanVienId: nhanVien.nguoiDungId,
				ngayBatDauCuTru: params.ngayBatDau,
				thoiHanThuetThang: params.soThangLuuTru,
				giaThueThoaThuan: params.giuongId ? 1_500_000 : 3_000_000,
				trangThai: "Đang thuê",
			},
		});
		return { hoSoNhanPhongId: hoSoNhanPhong.hoSoNhanPhongId, maHopDong: hopDong.maHopDong };
	}

	async function taoBienBanBanGiao(hoSoNhanPhongId: number) {
		const bbbg = await prisma.bienBanBanGiao.create({
			data: {
				hoSoNhanPhongId,
				quanLyId: quanLy.nguoiDungId,
				tinhTrangVeSinh: "Sạch sẽ",
				xacNhanKyKhach: "Đã ký",
				trangThai: "Đã bàn giao",
				ngayBanGiao: new Date(),
			},
		});
		await prisma.taiSanBanGiao.createMany({
			data: [
				{ bienBanBanGiaoId: bbbg.bienBanBanGiaoId, tenTaiSan: "Giường tầng", soLuong: 1, tinhTrang: "Tốt" },
				{ bienBanBanGiaoId: bbbg.bienBanBanGiaoId, tenTaiSan: "Tủ quần áo", soLuong: 1, tinhTrang: "Tốt" },
				{ bienBanBanGiaoId: bbbg.bienBanBanGiaoId, tenTaiSan: "Bàn học", soLuong: 1, tinhTrang: "Tốt" },
				{ bienBanBanGiaoId: bbbg.bienBanBanGiaoId, tenTaiSan: "Ghế", soLuong: 1, tinhTrang: "Tốt" },
			],
		});
	}

	const nam = (n: number) => new Date(Date.UTC(2025, n - 1, 1));

	console.log("Kịch bản S1 — HĐ đang cho thuê, CHƯA đăng ký trả phòng (test UC1 từ đầu)...");
	const s1 = await taoHopDongDaKy({
		khachHangId: khKhoa.khachHangId,
		phongId: phongA101.phongId,
		giuongId: giuongA101G1.giuongId,
		maHopDong: "HD-2025-000123",
		ngayBatDau: nam(3),
		ngayKetThuc: nam(9),
		tienCocGoc: 3_000_000,
		trangThaiHopDong: "Đang cho thuê",
		soThangLuuTru: 6,
	});
	await taoBienBanBanGiao(s1.hoSoNhanPhongId);

	console.log("Kịch bản S2 — HĐ đã hết hạn, CHƯA đăng ký trả phòng (test UC1 nhánh A4)...");
	const s2 = await taoHopDongDaKy({
		khachHangId: khLan.khachHangId,
		phongId: phongB201.phongId,
		maHopDong: "HD-2025-000222",
		ngayBatDau: nam(2),
		ngayKetThuc: nam(4),
		tienCocGoc: 4_000_000,
		trangThaiHopDong: "Đã hết hạn",
		soThangLuuTru: 2,
	});
	await taoBienBanBanGiao(s2.hoSoNhanPhongId);

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
		soThangLuuTru: 6,
	});
	await taoBienBanBanGiao(s3.hoSoNhanPhongId);
	await prisma.yeuCauTraPhong.create({
		data: {
			hoSoNhanPhongId: s3.hoSoNhanPhongId,
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
		soThangLuuTru: 4,
	});
	await taoBienBanBanGiao(s4.hoSoNhanPhongId);
	const yc4 = await prisma.yeuCauTraPhong.create({
		data: {
			hoSoNhanPhongId: s4.hoSoNhanPhongId,
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
		soThangLuuTru: 8,
	});
	await taoBienBanBanGiao(s5.hoSoNhanPhongId);
	const yc5 = await prisma.yeuCauTraPhong.create({
		data: {
			hoSoNhanPhongId: s5.hoSoNhanPhongId,
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
		soThangLuuTru: 4,
	});
	await taoBienBanBanGiao(s6.hoSoNhanPhongId);
	const yc6 = await prisma.yeuCauTraPhong.create({
		data: {
			hoSoNhanPhongId: s6.hoSoNhanPhongId,
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
