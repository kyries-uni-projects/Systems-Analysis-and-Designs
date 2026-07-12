-- CreateTable
CREATE TABLE "nguoi_dung" (
    "nguoi_dung_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ho_ten" TEXT NOT NULL,
    "ten_dang_nhap" TEXT NOT NULL,
    "mat_khau_hash" TEXT NOT NULL,
    "email" TEXT,
    "so_dien_thoai" TEXT,
    "vai_tro" TEXT NOT NULL,
    "trang_thai" TEXT NOT NULL DEFAULT 'Hoạt động',
    "ngay_tao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "khach_hang" (
    "khach_hang_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ho_ten" TEXT NOT NULL,
    "cccd_passport" TEXT NOT NULL,
    "gioi_tinh" TEXT,
    "quoc_tich" TEXT,
    "so_dien_thoai" TEXT NOT NULL,
    "email" TEXT,
    "ghi_chu" TEXT,
    "ngay_tao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "loai_phong" (
    "id_loai_phong" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ten_loai_phong" TEXT NOT NULL,
    "don_gia" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "phong" (
    "phong_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ma_phong" TEXT NOT NULL,
    "khu" TEXT,
    "tang" INTEGER,
    "id_loai_phong" INTEGER NOT NULL,
    "suc_chua" INTEGER NOT NULL,
    "gioi_tinh_ap_dung" TEXT,
    "tien_ich" TEXT,
    "trang_thai" TEXT NOT NULL DEFAULT 'Trống',
    "ngay_tao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "phong_id_loai_phong_fkey" FOREIGN KEY ("id_loai_phong") REFERENCES "loai_phong" ("id_loai_phong") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "giuong" (
    "giuong_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "phong_id" INTEGER NOT NULL,
    "ma_giuong_local" TEXT NOT NULL,
    "trang_thai" TEXT NOT NULL DEFAULT 'Trống',
    CONSTRAINT "giuong_phong_id_fkey" FOREIGN KEY ("phong_id") REFERENCES "phong" ("phong_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mau_noi_quy" (
    "id_mau_noi_quy" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ten_mau" TEXT NOT NULL,
    "noi_quy" TEXT NOT NULL,
    "quy_dinh_hoan_coc" TEXT NOT NULL,
    "dieu_khoan_vi_pham" TEXT NOT NULL,
    "ngay_ap_dung" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trang_thai" TEXT NOT NULL DEFAULT 'Đang dùng'
);

-- CreateTable
CREATE TABLE "quy_dinh_ky_tuc_xa" (
    "quy_dinh_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ma_quy_dinh" TEXT NOT NULL,
    "ten_quy_dinh" TEXT NOT NULL,
    "nhom_quy_dinh" TEXT NOT NULL,
    "noi_dung" TEXT NOT NULL,
    "tham_so_kiem_tra" TEXT,
    "bat_buoc" BOOLEAN NOT NULL DEFAULT true,
    "ngay_ap_dung" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trang_thai" TEXT NOT NULL DEFAULT 'Dang ap dung'
);

-- CreateTable
CREATE TABLE "ket_qua_kiem_tra_dieu_kien" (
    "ket_qua_kiem_tra_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ho_so_dat_coc_id" INTEGER,
    "ho_so_nhan_phong_id" INTEGER,
    "quy_dinh_id" INTEGER NOT NULL,
    "nguoi_kiem_tra_id" INTEGER NOT NULL,
    "ket_qua" TEXT NOT NULL,
    "ghi_chu" TEXT,
    "thoi_diem_kiem_tra" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ket_qua_kiem_tra_dieu_kien_ho_so_dat_coc_id_fkey" FOREIGN KEY ("ho_so_dat_coc_id") REFERENCES "ho_so_dat_coc" ("ho_so_dat_coc_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ket_qua_kiem_tra_dieu_kien_ho_so_nhan_phong_id_fkey" FOREIGN KEY ("ho_so_nhan_phong_id") REFERENCES "ho_so_nhan_phong" ("ho_so_nhan_phong_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ket_qua_kiem_tra_dieu_kien_quy_dinh_id_fkey" FOREIGN KEY ("quy_dinh_id") REFERENCES "quy_dinh_ky_tuc_xa" ("quy_dinh_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ket_qua_kiem_tra_dieu_kien_nguoi_kiem_tra_id_fkey" FOREIGN KEY ("nguoi_kiem_tra_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "yeu_cau_thue" (
    "yeu_cau_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "khach_hang_id" INTEGER NOT NULL,
    "nhan_vien_id" INTEGER NOT NULL,
    "loai_thue" TEXT NOT NULL,
    "khu_vuc_mong_muon" TEXT,
    "so_nguoi_du_kien" INTEGER NOT NULL,
    "muc_gia_mong_muon" REAL,
    "thoi_gian_du_kien_vao_o" DATETIME,
    "thoi_han_thue_thang" INTEGER,
    "tieu_chi_uu_tien" TEXT,
    "trang_thai" TEXT NOT NULL DEFAULT 'Mới tạo',
    "ngay_tao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "yeu_cau_thue_khach_hang_id_fkey" FOREIGN KEY ("khach_hang_id") REFERENCES "khach_hang" ("khach_hang_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "yeu_cau_thue_nhan_vien_id_fkey" FOREIGN KEY ("nhan_vien_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lich_hen_xem_phong" (
    "lich_hen_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "yeu_cau_id" INTEGER NOT NULL,
    "phong_id" INTEGER NOT NULL,
    "giuong_id" INTEGER,
    "nhan_vien_id" INTEGER NOT NULL,
    "ngay_xem" DATETIME NOT NULL,
    "gio_bat_dau" TEXT NOT NULL,
    "gio_ket_thuc" TEXT NOT NULL,
    "phuong_thuc_thong_bao" TEXT,
    "trang_thai_gui_thong_bao" TEXT NOT NULL DEFAULT 'Chưa gửi',
    "trang_thai" TEXT NOT NULL DEFAULT 'Đã lên lịch',
    "ngay_tao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lich_hen_xem_phong_yeu_cau_id_fkey" FOREIGN KEY ("yeu_cau_id") REFERENCES "yeu_cau_thue" ("yeu_cau_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "lich_hen_xem_phong_phong_id_fkey" FOREIGN KEY ("phong_id") REFERENCES "phong" ("phong_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "lich_hen_xem_phong_giuong_id_fkey" FOREIGN KEY ("giuong_id") REFERENCES "giuong" ("giuong_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "lich_hen_xem_phong_nhan_vien_id_fkey" FOREIGN KEY ("nhan_vien_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ho_so_dat_coc" (
    "ho_so_dat_coc_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "yeu_cau_id" INTEGER NOT NULL,
    "khach_hang_id" INTEGER NOT NULL,
    "phong_id" INTEGER NOT NULL,
    "giuong_id" INTEGER,
    "hinh_thuc_thue" TEXT NOT NULL,
    "so_giuong_thue" INTEGER NOT NULL,
    "nhan_vien_id" INTEGER NOT NULL,
    "quan_ly_xac_nhan_id" INTEGER,
    "trang_thai" TEXT NOT NULL DEFAULT 'Chờ xác nhận điều kiện',
    "ly_do_tu_choi" TEXT,
    "ngay_hen_nhan_phong" DATETIME,
    "gio_hen_nhan_phong" TEXT,
    "ghi_chu_hen_nhan_phong" TEXT,
    "ngay_tao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ho_so_dat_coc_yeu_cau_id_fkey" FOREIGN KEY ("yeu_cau_id") REFERENCES "yeu_cau_thue" ("yeu_cau_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ho_so_dat_coc_khach_hang_id_fkey" FOREIGN KEY ("khach_hang_id") REFERENCES "khach_hang" ("khach_hang_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ho_so_dat_coc_phong_id_fkey" FOREIGN KEY ("phong_id") REFERENCES "phong" ("phong_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ho_so_dat_coc_giuong_id_fkey" FOREIGN KEY ("giuong_id") REFERENCES "giuong" ("giuong_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ho_so_dat_coc_nhan_vien_id_fkey" FOREIGN KEY ("nhan_vien_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ho_so_dat_coc_quan_ly_xac_nhan_id_fkey" FOREIGN KEY ("quan_ly_xac_nhan_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "yeu_cau_thanh_toan_coc" (
    "yeu_cau_thanh_toan_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ho_so_dat_coc_id" INTEGER NOT NULL,
    "so_tien_coc" REAL NOT NULL,
    "ke_toan_id" INTEGER NOT NULL,
    "thoi_diem_phat_hanh" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "han_thanh_toan" DATETIME NOT NULL,
    "so_tai_khoan_nhan" TEXT,
    "trang_thai" TEXT NOT NULL DEFAULT 'Chờ thanh toán',
    CONSTRAINT "yeu_cau_thanh_toan_coc_ho_so_dat_coc_id_fkey" FOREIGN KEY ("ho_so_dat_coc_id") REFERENCES "ho_so_dat_coc" ("ho_so_dat_coc_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "yeu_cau_thanh_toan_coc_ke_toan_id_fkey" FOREIGN KEY ("ke_toan_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chung_tu_thanh_toan" (
    "chung_tu_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "yeu_cau_thanh_toan_id" INTEGER NOT NULL,
    "duong_dan_file" TEXT NOT NULL,
    "so_tien_thuc_nhan" REAL NOT NULL,
    "kenh_thanh_toan" TEXT,
    "thoi_diem_nhan" DATETIME NOT NULL,
    "quan_ly_xac_nhan_id" INTEGER,
    "trang_thai_xac_nhan" TEXT NOT NULL DEFAULT 'Chờ xác nhận',
    "ly_do_tu_choi" TEXT,
    "ngay_tao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chung_tu_thanh_toan_yeu_cau_thanh_toan_id_fkey" FOREIGN KEY ("yeu_cau_thanh_toan_id") REFERENCES "yeu_cau_thanh_toan_coc" ("yeu_cau_thanh_toan_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "chung_tu_thanh_toan_quan_ly_xac_nhan_id_fkey" FOREIGN KEY ("quan_ly_xac_nhan_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hop_dong" (
    "hop_dong_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ma_hop_dong" TEXT NOT NULL,
    "khach_hang_id" INTEGER NOT NULL,
    "nhan_vien_id" INTEGER NOT NULL,
    "id_mau_noi_quy" INTEGER NOT NULL,
    "ky_thanh_toan" TEXT,
    "ngay_bat_dau" DATETIME NOT NULL,
    "ngay_ket_thuc" DATETIME NOT NULL,
    "tien_coc_goc" REAL NOT NULL,
    "trang_thai" TEXT NOT NULL DEFAULT 'Chờ ký',
    "ngay_ky" DATETIME,
    CONSTRAINT "hop_dong_khach_hang_id_fkey" FOREIGN KEY ("khach_hang_id") REFERENCES "khach_hang" ("khach_hang_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "hop_dong_nhan_vien_id_fkey" FOREIGN KEY ("nhan_vien_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "hop_dong_id_mau_noi_quy_fkey" FOREIGN KEY ("id_mau_noi_quy") REFERENCES "mau_noi_quy" ("id_mau_noi_quy") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ho_so_nhan_phong" (
    "ho_so_nhan_phong_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ho_so_dat_coc_id" INTEGER NOT NULL,
    "hop_dong_id" INTEGER,
    "nhan_vien_id" INTEGER NOT NULL,
    "so_cccd_doi_chieu" TEXT,
    "ket_qua_doi_chieu" TEXT,
    "ngay_bat_dau_cu_tru" DATETIME,
    "thoi_han_thue_thang" INTEGER,
    "gia_thue_thoa_thuan" REAL,
    "ghi_chu" TEXT,
    "trang_thai" TEXT NOT NULL DEFAULT 'Chờ duyệt điều kiện lưu trú',
    "ngay_tao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ho_so_nhan_phong_ho_so_dat_coc_id_fkey" FOREIGN KEY ("ho_so_dat_coc_id") REFERENCES "ho_so_dat_coc" ("ho_so_dat_coc_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ho_so_nhan_phong_hop_dong_id_fkey" FOREIGN KEY ("hop_dong_id") REFERENCES "hop_dong" ("hop_dong_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ho_so_nhan_phong_nhan_vien_id_fkey" FOREIGN KEY ("nhan_vien_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "thanh_vien_luu_tru" (
    "ho_so_nhan_phong_id" INTEGER NOT NULL,
    "stt_thanh_vien" INTEGER NOT NULL,
    "ho_ten" TEXT NOT NULL,
    "ngay_sinh" DATETIME,
    "gioi_tinh" TEXT,
    "cccd" TEXT NOT NULL,
    "so_dien_thoai" TEXT,
    "quan_he" TEXT,
    "ket_qua_dieu_kien" TEXT NOT NULL DEFAULT 'Chờ duyệt',
    "ly_do_khong_dat" TEXT,

    PRIMARY KEY ("ho_so_nhan_phong_id", "stt_thanh_vien"),
    CONSTRAINT "thanh_vien_luu_tru_ho_so_nhan_phong_id_fkey" FOREIGN KEY ("ho_so_nhan_phong_id") REFERENCES "ho_so_nhan_phong" ("ho_so_nhan_phong_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "phe_duyet_luu_tru" (
    "phe_duyet_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ho_so_nhan_phong_id" INTEGER NOT NULL,
    "quan_ly_id" INTEGER NOT NULL,
    "ket_qua" TEXT NOT NULL,
    "ly_do_tu_choi" TEXT,
    "thoi_diem_phe_duyet" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "phe_duyet_luu_tru_ho_so_nhan_phong_id_fkey" FOREIGN KEY ("ho_so_nhan_phong_id") REFERENCES "ho_so_nhan_phong" ("ho_so_nhan_phong_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "phe_duyet_luu_tru_quan_ly_id_fkey" FOREIGN KEY ("quan_ly_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "loai_phi_dich_vu" (
    "id_loai_phi" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ten_loai_phi" TEXT NOT NULL,
    "don_vi_tinh" TEXT
);

-- CreateTable
CREATE TABLE "khoan_phi_dich_vu" (
    "id_khoan_phi" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ho_so_nhan_phong_id" INTEGER NOT NULL,
    "id_loai_phi" INTEGER NOT NULL,
    "don_gia" REAL NOT NULL,
    CONSTRAINT "khoan_phi_dich_vu_ho_so_nhan_phong_id_fkey" FOREIGN KEY ("ho_so_nhan_phong_id") REFERENCES "ho_so_nhan_phong" ("ho_so_nhan_phong_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "khoan_phi_dich_vu_id_loai_phi_fkey" FOREIGN KEY ("id_loai_phi") REFERENCES "loai_phi_dich_vu" ("id_loai_phi") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "khoan_thu_dau_ky" (
    "khoan_thu_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hop_dong_id" INTEGER NOT NULL,
    "ten_khoan" TEXT NOT NULL,
    "so_tien" REAL NOT NULL,
    "trang_thai" TEXT NOT NULL DEFAULT 'Chưa thu',
    "ke_toan_id" INTEGER,
    "thoi_diem_thu" DATETIME,
    "phuong_thuc_thu" TEXT,
    CONSTRAINT "khoan_thu_dau_ky_hop_dong_id_fkey" FOREIGN KEY ("hop_dong_id") REFERENCES "hop_dong" ("hop_dong_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "khoan_thu_dau_ky_ke_toan_id_fkey" FOREIGN KEY ("ke_toan_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bien_ban_ban_giao" (
    "bien_ban_ban_giao_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ho_so_nhan_phong_id" INTEGER NOT NULL,
    "quan_ly_id" INTEGER NOT NULL,
    "tinh_trang_ve_sinh" TEXT,
    "ghi_chu_kiem_tra" TEXT,
    "xac_nhan_ky_khach" TEXT NOT NULL DEFAULT 'Chưa ký',
    "trang_thai" TEXT NOT NULL DEFAULT 'Chờ bàn giao',
    "ngay_ban_giao" DATETIME,
    CONSTRAINT "bien_ban_ban_giao_ho_so_nhan_phong_id_fkey" FOREIGN KEY ("ho_so_nhan_phong_id") REFERENCES "ho_so_nhan_phong" ("ho_so_nhan_phong_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bien_ban_ban_giao_quan_ly_id_fkey" FOREIGN KEY ("quan_ly_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tai_san_ban_giao" (
    "id_tai_san_ban_giao" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bien_ban_ban_giao_id" INTEGER NOT NULL,
    "ten_tai_san" TEXT NOT NULL,
    "so_luong" INTEGER NOT NULL DEFAULT 1,
    "tinh_trang" TEXT,
    "ghi_chu" TEXT,
    CONSTRAINT "tai_san_ban_giao_bien_ban_ban_giao_id_fkey" FOREIGN KEY ("bien_ban_ban_giao_id") REFERENCES "bien_ban_ban_giao" ("bien_ban_ban_giao_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "yeu_cau_tra_phong" (
    "yeu_cau_tra_phong_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ho_so_nhan_phong_id" INTEGER,
    "ho_so_dat_coc_id" INTEGER,
    "nhan_vien_id" INTEGER NOT NULL,
    "ngay_tra_phong_du_kien" DATETIME NOT NULL,
    "gio_tra_phong" TEXT,
    "ly_do_tra_phong" TEXT,
    "co_het_han_theo_lich" TEXT NOT NULL DEFAULT 'Không',
    "trang_thai" TEXT NOT NULL DEFAULT 'Chờ quản lý kiểm tra',
    "trang_thai_gui_thong_bao" TEXT NOT NULL DEFAULT 'Chưa gửi',
    "ngay_tao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "yeu_cau_tra_phong_ho_so_nhan_phong_id_fkey" FOREIGN KEY ("ho_so_nhan_phong_id") REFERENCES "ho_so_nhan_phong" ("ho_so_nhan_phong_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "yeu_cau_tra_phong_ho_so_dat_coc_id_fkey" FOREIGN KEY ("ho_so_dat_coc_id") REFERENCES "ho_so_dat_coc" ("ho_so_dat_coc_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "yeu_cau_tra_phong_nhan_vien_id_fkey" FOREIGN KEY ("nhan_vien_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bien_ban_kiem_tra_tra_phong" (
    "bien_ban_kiem_tra_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "yeu_cau_tra_phong_id" INTEGER NOT NULL,
    "quan_ly_id" INTEGER NOT NULL,
    "tinh_trang_ve_sinh" TEXT,
    "ghi_chu_kiem_tra" TEXT,
    "duong_dan_hinh_anh" TEXT,
    "co_hu_hong" TEXT NOT NULL DEFAULT 'Không',
    "trang_thai" TEXT NOT NULL DEFAULT 'Đang kiểm tra',
    "ngay_kiem_tra" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bien_ban_kiem_tra_tra_phong_yeu_cau_tra_phong_id_fkey" FOREIGN KEY ("yeu_cau_tra_phong_id") REFERENCES "yeu_cau_tra_phong" ("yeu_cau_tra_phong_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bien_ban_kiem_tra_tra_phong_quan_ly_id_fkey" FOREIGN KEY ("quan_ly_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "khoan_khau_tru" (
    "bien_ban_kiem_tra_id" INTEGER NOT NULL,
    "stt_khau_tru" INTEGER NOT NULL,
    "loai_khoan_khau_tru" TEXT NOT NULL,
    "mo_ta" TEXT,
    "so_tien" REAL NOT NULL,

    PRIMARY KEY ("bien_ban_kiem_tra_id", "stt_khau_tru"),
    CONSTRAINT "khoan_khau_tru_bien_ban_kiem_tra_id_fkey" FOREIGN KEY ("bien_ban_kiem_tra_id") REFERENCES "bien_ban_kiem_tra_tra_phong" ("bien_ban_kiem_tra_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "nghia_vu_con_lai" (
    "bien_ban_kiem_tra_id" INTEGER NOT NULL,
    "stt_nghia_vu" INTEGER NOT NULL,
    "loai_nghia_vu" TEXT NOT NULL,
    "so_tien_con_no" REAL NOT NULL,
    "ghi_chu" TEXT,

    PRIMARY KEY ("bien_ban_kiem_tra_id", "stt_nghia_vu"),
    CONSTRAINT "nghia_vu_con_lai_bien_ban_kiem_tra_id_fkey" FOREIGN KEY ("bien_ban_kiem_tra_id") REFERENCES "bien_ban_kiem_tra_tra_phong" ("bien_ban_kiem_tra_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "doi_soat_hoan_coc" (
    "doi_soat_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bien_ban_kiem_tra_id" INTEGER NOT NULL,
    "ke_toan_id" INTEGER NOT NULL,
    "tien_coc_goc" REAL NOT NULL,
    "ty_le_hoan_coc" REAL NOT NULL,
    "so_tien_hoan_co_ban" REAL NOT NULL,
    "tong_khau_tru" REAL NOT NULL DEFAULT 0,
    "so_tien_hoan_thuc_nhan" REAL NOT NULL DEFAULT 0,
    "so_tien_can_thu_them" REAL NOT NULL DEFAULT 0,
    "trang_thai" TEXT NOT NULL DEFAULT 'Chờ xác nhận',
    "xac_nhan_khach_hang" TEXT NOT NULL DEFAULT 'Chưa xác nhận',
    "ngay_doi_soat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "doi_soat_hoan_coc_bien_ban_kiem_tra_id_fkey" FOREIGN KEY ("bien_ban_kiem_tra_id") REFERENCES "bien_ban_kiem_tra_tra_phong" ("bien_ban_kiem_tra_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "doi_soat_hoan_coc_ke_toan_id_fkey" FOREIGN KEY ("ke_toan_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bien_ban_tra_phong" (
    "bien_ban_tra_phong_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "yeu_cau_tra_phong_id" INTEGER NOT NULL,
    "doi_soat_id" INTEGER NOT NULL,
    "quan_ly_id" INTEGER NOT NULL,
    "ngay_tra_phong_thuc_te" DATETIME NOT NULL,
    "tinh_trang_ban_giao_cuoi" TEXT,
    "da_thu_hoi_chia_khoa" TEXT NOT NULL DEFAULT 'Chưa',
    "xac_nhan_ky_khach" TEXT NOT NULL DEFAULT 'Chưa ký',
    "trang_thai" TEXT NOT NULL DEFAULT 'Chờ ký thanh lý',
    "ngay_lap" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bien_ban_tra_phong_yeu_cau_tra_phong_id_fkey" FOREIGN KEY ("yeu_cau_tra_phong_id") REFERENCES "yeu_cau_tra_phong" ("yeu_cau_tra_phong_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bien_ban_tra_phong_doi_soat_id_fkey" FOREIGN KEY ("doi_soat_id") REFERENCES "doi_soat_hoan_coc" ("doi_soat_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bien_ban_tra_phong_quan_ly_id_fkey" FOREIGN KEY ("quan_ly_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "giao_dich_hoan_coc" (
    "giao_dich_hoan_coc_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "doi_soat_id" INTEGER NOT NULL,
    "ke_toan_id" INTEGER NOT NULL,
    "so_tien_hoan" REAL NOT NULL,
    "phuong_thuc_hoan" TEXT NOT NULL,
    "so_tai_khoan_nhan" TEXT,
    "duong_dan_chung_tu" TEXT,
    "thoi_diem_thuc_hien" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trang_thai" TEXT NOT NULL DEFAULT 'Hoàn tất',
    CONSTRAINT "giao_dich_hoan_coc_doi_soat_id_fkey" FOREIGN KEY ("doi_soat_id") REFERENCES "doi_soat_hoan_coc" ("doi_soat_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "giao_dich_hoan_coc_ke_toan_id_fkey" FOREIGN KEY ("ke_toan_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "nguoi_dung_ten_dang_nhap_key" ON "nguoi_dung"("ten_dang_nhap");

-- CreateIndex
CREATE UNIQUE INDEX "khach_hang_cccd_passport_key" ON "khach_hang"("cccd_passport");

-- CreateIndex
CREATE UNIQUE INDEX "loai_phong_ten_loai_phong_key" ON "loai_phong"("ten_loai_phong");

-- CreateIndex
CREATE UNIQUE INDEX "phong_ma_phong_key" ON "phong"("ma_phong");

-- CreateIndex
CREATE UNIQUE INDEX "giuong_phong_id_ma_giuong_local_key" ON "giuong"("phong_id", "ma_giuong_local");

-- CreateIndex
CREATE UNIQUE INDEX "quy_dinh_ky_tuc_xa_ma_quy_dinh_key" ON "quy_dinh_ky_tuc_xa"("ma_quy_dinh");

-- CreateIndex
CREATE UNIQUE INDEX "yeu_cau_thanh_toan_coc_ho_so_dat_coc_id_key" ON "yeu_cau_thanh_toan_coc"("ho_so_dat_coc_id");

-- CreateIndex
CREATE UNIQUE INDEX "hop_dong_ma_hop_dong_key" ON "hop_dong"("ma_hop_dong");

-- CreateIndex
CREATE UNIQUE INDEX "ho_so_nhan_phong_ho_so_dat_coc_id_key" ON "ho_so_nhan_phong"("ho_so_dat_coc_id");

-- CreateIndex
CREATE UNIQUE INDEX "phe_duyet_luu_tru_ho_so_nhan_phong_id_key" ON "phe_duyet_luu_tru"("ho_so_nhan_phong_id");

-- CreateIndex
CREATE UNIQUE INDEX "loai_phi_dich_vu_ten_loai_phi_key" ON "loai_phi_dich_vu"("ten_loai_phi");

-- CreateIndex
CREATE UNIQUE INDEX "khoan_phi_dich_vu_ho_so_nhan_phong_id_id_loai_phi_key" ON "khoan_phi_dich_vu"("ho_so_nhan_phong_id", "id_loai_phi");

-- CreateIndex
CREATE UNIQUE INDEX "bien_ban_ban_giao_ho_so_nhan_phong_id_key" ON "bien_ban_ban_giao"("ho_so_nhan_phong_id");

-- CreateIndex
CREATE UNIQUE INDEX "tai_san_ban_giao_bien_ban_ban_giao_id_ten_tai_san_key" ON "tai_san_ban_giao"("bien_ban_ban_giao_id", "ten_tai_san");

-- CreateIndex
CREATE UNIQUE INDEX "yeu_cau_tra_phong_ho_so_nhan_phong_id_key" ON "yeu_cau_tra_phong"("ho_so_nhan_phong_id");

-- CreateIndex
CREATE UNIQUE INDEX "yeu_cau_tra_phong_ho_so_dat_coc_id_key" ON "yeu_cau_tra_phong"("ho_so_dat_coc_id");

-- CreateIndex
CREATE UNIQUE INDEX "bien_ban_kiem_tra_tra_phong_yeu_cau_tra_phong_id_key" ON "bien_ban_kiem_tra_tra_phong"("yeu_cau_tra_phong_id");

-- CreateIndex
CREATE UNIQUE INDEX "doi_soat_hoan_coc_bien_ban_kiem_tra_id_key" ON "doi_soat_hoan_coc"("bien_ban_kiem_tra_id");

-- CreateIndex
CREATE UNIQUE INDEX "bien_ban_tra_phong_yeu_cau_tra_phong_id_key" ON "bien_ban_tra_phong"("yeu_cau_tra_phong_id");

-- CreateIndex
CREATE UNIQUE INDEX "bien_ban_tra_phong_doi_soat_id_key" ON "bien_ban_tra_phong"("doi_soat_id");

-- CreateIndex
CREATE UNIQUE INDEX "giao_dich_hoan_coc_doi_soat_id_key" ON "giao_dich_hoan_coc"("doi_soat_id");
