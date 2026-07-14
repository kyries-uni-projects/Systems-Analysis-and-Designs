/*
  Warnings:

  - You are about to drop the `loai_phi_dich_vu` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `ho_so_nhan_phong_id` on the `bien_ban_ban_giao` table. All the data in the column will be lost.
  - You are about to alter the column `co_hu_hong_mat_mat` on the `chi_tiet_kiem_tra_tai_san` table. The data in that column could be lost. The data in that column will be cast from `String` to `Boolean`.
  - You are about to drop the column `giuong_id` on the `ho_so_dat_coc` table. All the data in the column will be lost.
  - You are about to drop the column `phong_id` on the `ho_so_dat_coc` table. All the data in the column will be lost.
  - You are about to drop the column `quan_ly_xac_nhan_id` on the `ho_so_dat_coc` table. All the data in the column will be lost.
  - You are about to drop the column `so_giuong_thue` on the `ho_so_dat_coc` table. All the data in the column will be lost.
  - You are about to drop the column `gia_thue_thoa_thuan` on the `ho_so_nhan_phong` table. All the data in the column will be lost.
  - You are about to drop the column `hop_dong_id` on the `ho_so_nhan_phong` table. All the data in the column will be lost.
  - You are about to drop the column `ket_qua_doi_chieu` on the `ho_so_nhan_phong` table. All the data in the column will be lost.
  - You are about to drop the column `ngay_bat_dau_cu_tru` on the `ho_so_nhan_phong` table. All the data in the column will be lost.
  - You are about to drop the column `so_cccd_doi_chieu` on the `ho_so_nhan_phong` table. All the data in the column will be lost.
  - You are about to drop the column `thoi_han_thue_thang` on the `ho_so_nhan_phong` table. All the data in the column will be lost.
  - You are about to drop the column `ngay_bat_dau` on the `hop_dong` table. All the data in the column will be lost.
  - You are about to drop the column `ngay_ket_thuc` on the `hop_dong` table. All the data in the column will be lost.
  - You are about to drop the column `ho_so_nhan_phong_id` on the `khoan_phi_dich_vu` table. All the data in the column will be lost.
  - You are about to drop the column `id_loai_phi` on the `khoan_phi_dich_vu` table. All the data in the column will be lost.
  - You are about to drop the column `ten_tai_san` on the `tai_san_ban_giao` table. All the data in the column will be lost.
  - The primary key for the `thanh_vien_luu_tru` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `cccd` on the `thanh_vien_luu_tru` table. All the data in the column will be lost.
  - You are about to drop the column `ho_so_dat_coc_id` on the `yeu_cau_tra_phong` table. All the data in the column will be lost.
  - You are about to drop the column `ho_so_nhan_phong_id` on the `yeu_cau_tra_phong` table. All the data in the column will be lost.
  - Added the required column `hop_dong_id` to the `bien_ban_ban_giao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `yeu_cau_tra_phong_id` to the `doi_soat_hoan_coc` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ma_ho_so_dat_coc` to the `ho_so_dat_coc` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ngay_bat_dau_du_kien` to the `ho_so_dat_coc` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ngay_ket_thuc_du_kien` to the `ho_so_dat_coc` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ma_ho_so_nhan_phong` to the `ho_so_nhan_phong` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ho_so_nhan_phong_id` to the `hop_dong` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ten_loai_phi` to the `khoan_phi_dich_vu` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_tai_san_mac_dinh` to the `tai_san_ban_giao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chi_tiet_dat_coc_id` to the `thanh_vien_luu_tru` table without a default value. This is not possible if the table is not empty.
  - Added the required column `loai_giay_to` to the `thanh_vien_luu_tru` table without a default value. This is not possible if the table is not empty.
  - Added the required column `so_giay_to` to the `thanh_vien_luu_tru` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thanh_vien_luu_tru_id` to the `thanh_vien_luu_tru` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "loai_phi_dich_vu_ten_loai_phi_key";

-- AlterTable
ALTER TABLE "phe_duyet_luu_tru" ADD COLUMN "phuong_an_xu_ly_nhom" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "loai_phi_dich_vu";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "chi_tiet_dat_coc" (
    "chi_tiet_dat_coc_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ho_so_dat_coc_id" INTEGER NOT NULL,
    "phong_id" INTEGER,
    "giuong_id" INTEGER,
    "gia_thue_thoa_thuan" REAL NOT NULL,
    "so_giuong_quy_doi" INTEGER NOT NULL DEFAULT 1,
    "tien_coc_phan_bo" REAL NOT NULL,
    "quan_ly_xac_nhan_id" INTEGER,
    "thoi_diem_xac_nhan" DATETIME,
    "trang_thai" TEXT NOT NULL DEFAULT 'CHO_XAC_NHAN',
    "ly_do_tu_choi" TEXT,
    "ghi_chu" TEXT,
    CONSTRAINT "chi_tiet_dat_coc_ho_so_dat_coc_id_fkey" FOREIGN KEY ("ho_so_dat_coc_id") REFERENCES "ho_so_dat_coc" ("ho_so_dat_coc_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "chi_tiet_dat_coc_phong_id_fkey" FOREIGN KEY ("phong_id") REFERENCES "phong" ("phong_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "chi_tiet_dat_coc_giuong_id_fkey" FOREIGN KEY ("giuong_id") REFERENCES "giuong" ("giuong_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "chi_tiet_dat_coc_quan_ly_xac_nhan_id_fkey" FOREIGN KEY ("quan_ly_xac_nhan_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chi_tiet_hop_dong" (
    "chi_tiet_hop_dong_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hop_dong_id" INTEGER NOT NULL,
    "chi_tiet_dat_coc_id" INTEGER NOT NULL,
    "phong_id" INTEGER,
    "giuong_id" INTEGER,
    "hinh_thuc_thue" TEXT NOT NULL,
    "gia_thue_thoa_thuan" REAL NOT NULL,
    "tien_coc_phan_bo" REAL NOT NULL,
    "ngay_bat_dau" DATETIME NOT NULL,
    "ngay_ket_thuc" DATETIME NOT NULL,
    "trang_thai" TEXT NOT NULL DEFAULT 'Đang hiệu lực',
    CONSTRAINT "chi_tiet_hop_dong_hop_dong_id_fkey" FOREIGN KEY ("hop_dong_id") REFERENCES "hop_dong" ("hop_dong_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "chi_tiet_hop_dong_chi_tiet_dat_coc_id_fkey" FOREIGN KEY ("chi_tiet_dat_coc_id") REFERENCES "chi_tiet_dat_coc" ("chi_tiet_dat_coc_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "chi_tiet_hop_dong_phong_id_fkey" FOREIGN KEY ("phong_id") REFERENCES "phong" ("phong_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "chi_tiet_hop_dong_giuong_id_fkey" FOREIGN KEY ("giuong_id") REFERENCES "giuong" ("giuong_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "khoan_phi_hop_dong" (
    "id_khoan_phi_hop_dong" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hop_dong_id" INTEGER NOT NULL,
    "id_khoan_phi" INTEGER NOT NULL,
    "don_gia_ap_dung" REAL NOT NULL,
    "so_luong" INTEGER NOT NULL DEFAULT 1,
    "thanh_tien" REAL NOT NULL,
    "ghi_chu" TEXT,
    CONSTRAINT "khoan_phi_hop_dong_hop_dong_id_fkey" FOREIGN KEY ("hop_dong_id") REFERENCES "hop_dong" ("hop_dong_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "khoan_phi_hop_dong_id_khoan_phi_fkey" FOREIGN KEY ("id_khoan_phi") REFERENCES "khoan_phi_dich_vu" ("id_khoan_phi") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tai_san_mac_dinh" (
    "id_tai_san_mac_dinh" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ten_tai_san" TEXT NOT NULL,
    "so_luong_mac_dinh" INTEGER NOT NULL DEFAULT 1,
    "trang_thai" TEXT NOT NULL DEFAULT 'Đang dùng'
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_bien_ban_ban_giao" (
    "bien_ban_ban_giao_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hop_dong_id" INTEGER NOT NULL,
    "quan_ly_id" INTEGER NOT NULL,
    "tinh_trang_ve_sinh" TEXT,
    "ghi_chu_kiem_tra" TEXT,
    "xac_nhan_ky_khach" TEXT NOT NULL DEFAULT 'Chưa ký',
    "trang_thai" TEXT NOT NULL DEFAULT 'Chờ bàn giao',
    "ngay_ban_giao" DATETIME,
    CONSTRAINT "bien_ban_ban_giao_hop_dong_id_fkey" FOREIGN KEY ("hop_dong_id") REFERENCES "hop_dong" ("hop_dong_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bien_ban_ban_giao_quan_ly_id_fkey" FOREIGN KEY ("quan_ly_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_bien_ban_ban_giao" ("bien_ban_ban_giao_id", "ghi_chu_kiem_tra", "ngay_ban_giao", "quan_ly_id", "tinh_trang_ve_sinh", "trang_thai", "xac_nhan_ky_khach") SELECT "bien_ban_ban_giao_id", "ghi_chu_kiem_tra", "ngay_ban_giao", "quan_ly_id", "tinh_trang_ve_sinh", "trang_thai", "xac_nhan_ky_khach" FROM "bien_ban_ban_giao";
DROP TABLE "bien_ban_ban_giao";
ALTER TABLE "new_bien_ban_ban_giao" RENAME TO "bien_ban_ban_giao";
CREATE UNIQUE INDEX "bien_ban_ban_giao_hop_dong_id_key" ON "bien_ban_ban_giao"("hop_dong_id");
CREATE TABLE "chi_tiet_kiem_tra_tai_san" (
    "chi_tiet_kiem_tra_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bien_ban_kiem_tra_id" INTEGER NOT NULL,
    "id_tai_san_ban_giao" INTEGER NOT NULL,
    "so_luong_da_tra" INTEGER NOT NULL DEFAULT 0,
    "tinh_trang_khi_tra" TEXT,
    "co_hu_hong_mat_mat" BOOLEAN NOT NULL DEFAULT false,
    "chi_phi_boi_thuong" REAL NOT NULL DEFAULT 0,
    "ghi_chu" TEXT,
    CONSTRAINT "chi_tiet_kiem_tra_tai_san_bien_ban_kiem_tra_id_fkey" FOREIGN KEY ("bien_ban_kiem_tra_id") REFERENCES "bien_ban_kiem_tra_tra_phong" ("bien_ban_kiem_tra_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "chi_tiet_kiem_tra_tai_san_id_tai_san_ban_giao_fkey" FOREIGN KEY ("id_tai_san_ban_giao") REFERENCES "tai_san_ban_giao" ("id_tai_san_ban_giao") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "chi_tiet_kiem_tra_tai_san_bien_ban_kiem_tra_id_id_tai_san_ban_giao_key" ON "chi_tiet_kiem_tra_tai_san"("bien_ban_kiem_tra_id", "id_tai_san_ban_giao");
CREATE TABLE "new_doi_soat_hoan_coc" (
    "doi_soat_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "yeu_cau_tra_phong_id" INTEGER NOT NULL,
    "bien_ban_kiem_tra_id" INTEGER,
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
    CONSTRAINT "doi_soat_hoan_coc_yeu_cau_tra_phong_id_fkey" FOREIGN KEY ("yeu_cau_tra_phong_id") REFERENCES "yeu_cau_tra_phong" ("yeu_cau_tra_phong_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "doi_soat_hoan_coc_bien_ban_kiem_tra_id_fkey" FOREIGN KEY ("bien_ban_kiem_tra_id") REFERENCES "bien_ban_kiem_tra_tra_phong" ("bien_ban_kiem_tra_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "doi_soat_hoan_coc_ke_toan_id_fkey" FOREIGN KEY ("ke_toan_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_doi_soat_hoan_coc" ("bien_ban_kiem_tra_id", "doi_soat_id", "ke_toan_id", "ngay_doi_soat", "so_tien_can_thu_them", "so_tien_hoan_co_ban", "so_tien_hoan_thuc_nhan", "tien_coc_goc", "tong_khau_tru", "trang_thai", "ty_le_hoan_coc", "xac_nhan_khach_hang") SELECT "bien_ban_kiem_tra_id", "doi_soat_id", "ke_toan_id", "ngay_doi_soat", "so_tien_can_thu_them", "so_tien_hoan_co_ban", "so_tien_hoan_thuc_nhan", "tien_coc_goc", "tong_khau_tru", "trang_thai", "ty_le_hoan_coc", "xac_nhan_khach_hang" FROM "doi_soat_hoan_coc";
DROP TABLE "doi_soat_hoan_coc";
ALTER TABLE "new_doi_soat_hoan_coc" RENAME TO "doi_soat_hoan_coc";
CREATE UNIQUE INDEX "doi_soat_hoan_coc_yeu_cau_tra_phong_id_key" ON "doi_soat_hoan_coc"("yeu_cau_tra_phong_id");
CREATE UNIQUE INDEX "doi_soat_hoan_coc_bien_ban_kiem_tra_id_key" ON "doi_soat_hoan_coc"("bien_ban_kiem_tra_id");
CREATE TABLE "new_ho_so_dat_coc" (
    "ho_so_dat_coc_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ma_ho_so_dat_coc" TEXT NOT NULL,
    "yeu_cau_id" INTEGER NOT NULL,
    "khach_hang_id" INTEGER NOT NULL,
    "nhan_vien_id" INTEGER NOT NULL,
    "hinh_thuc_thue" TEXT NOT NULL,
    "ngay_bat_dau_du_kien" DATETIME NOT NULL,
    "ngay_ket_thuc_du_kien" DATETIME NOT NULL,
    "trang_thai" TEXT NOT NULL DEFAULT 'CHO_XAC_NHAN',
    "ly_do_tu_choi" TEXT,
    "ngay_hen_nhan_phong" DATETIME,
    "gio_hen_nhan_phong" TEXT,
    "ghi_chu_hen_nhan_phong" TEXT,
    "ngay_tao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ho_so_dat_coc_yeu_cau_id_fkey" FOREIGN KEY ("yeu_cau_id") REFERENCES "yeu_cau_thue" ("yeu_cau_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ho_so_dat_coc_khach_hang_id_fkey" FOREIGN KEY ("khach_hang_id") REFERENCES "khach_hang" ("khach_hang_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ho_so_dat_coc_nhan_vien_id_fkey" FOREIGN KEY ("nhan_vien_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ho_so_dat_coc" ("ghi_chu_hen_nhan_phong", "gio_hen_nhan_phong", "hinh_thuc_thue", "ho_so_dat_coc_id", "khach_hang_id", "ly_do_tu_choi", "ngay_hen_nhan_phong", "ngay_tao", "nhan_vien_id", "trang_thai", "yeu_cau_id") SELECT "ghi_chu_hen_nhan_phong", "gio_hen_nhan_phong", "hinh_thuc_thue", "ho_so_dat_coc_id", "khach_hang_id", "ly_do_tu_choi", "ngay_hen_nhan_phong", "ngay_tao", "nhan_vien_id", "trang_thai", "yeu_cau_id" FROM "ho_so_dat_coc";
DROP TABLE "ho_so_dat_coc";
ALTER TABLE "new_ho_so_dat_coc" RENAME TO "ho_so_dat_coc";
CREATE UNIQUE INDEX "ho_so_dat_coc_ma_ho_so_dat_coc_key" ON "ho_so_dat_coc"("ma_ho_so_dat_coc");
CREATE TABLE "new_ho_so_nhan_phong" (
    "ho_so_nhan_phong_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ma_ho_so_nhan_phong" TEXT NOT NULL,
    "ho_so_dat_coc_id" INTEGER NOT NULL,
    "nhan_vien_id" INTEGER NOT NULL,
    "ket_qua_doi_chieu_tong_quat" TEXT,
    "ghi_chu" TEXT,
    "trang_thai" TEXT NOT NULL DEFAULT 'Chờ duyệt điều kiện lưu trú',
    "ngay_tao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ho_so_nhan_phong_ho_so_dat_coc_id_fkey" FOREIGN KEY ("ho_so_dat_coc_id") REFERENCES "ho_so_dat_coc" ("ho_so_dat_coc_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ho_so_nhan_phong_nhan_vien_id_fkey" FOREIGN KEY ("nhan_vien_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ho_so_nhan_phong" ("ghi_chu", "ho_so_dat_coc_id", "ho_so_nhan_phong_id", "ngay_tao", "nhan_vien_id", "trang_thai") SELECT "ghi_chu", "ho_so_dat_coc_id", "ho_so_nhan_phong_id", "ngay_tao", "nhan_vien_id", "trang_thai" FROM "ho_so_nhan_phong";
DROP TABLE "ho_so_nhan_phong";
ALTER TABLE "new_ho_so_nhan_phong" RENAME TO "ho_so_nhan_phong";
CREATE UNIQUE INDEX "ho_so_nhan_phong_ma_ho_so_nhan_phong_key" ON "ho_so_nhan_phong"("ma_ho_so_nhan_phong");
CREATE UNIQUE INDEX "ho_so_nhan_phong_ho_so_dat_coc_id_key" ON "ho_so_nhan_phong"("ho_so_dat_coc_id");
CREATE TABLE "new_hop_dong" (
    "hop_dong_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ma_hop_dong" TEXT NOT NULL,
    "ho_so_nhan_phong_id" INTEGER NOT NULL,
    "khach_hang_id" INTEGER NOT NULL,
    "nhan_vien_id" INTEGER NOT NULL,
    "id_mau_noi_quy" INTEGER NOT NULL,
    "ky_thanh_toan" TEXT,
    "tien_coc_goc" REAL NOT NULL,
    "trang_thai" TEXT NOT NULL DEFAULT 'Chờ ký',
    "ngay_ky" DATETIME,
    CONSTRAINT "hop_dong_ho_so_nhan_phong_id_fkey" FOREIGN KEY ("ho_so_nhan_phong_id") REFERENCES "ho_so_nhan_phong" ("ho_so_nhan_phong_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "hop_dong_khach_hang_id_fkey" FOREIGN KEY ("khach_hang_id") REFERENCES "khach_hang" ("khach_hang_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "hop_dong_nhan_vien_id_fkey" FOREIGN KEY ("nhan_vien_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "hop_dong_id_mau_noi_quy_fkey" FOREIGN KEY ("id_mau_noi_quy") REFERENCES "mau_noi_quy" ("id_mau_noi_quy") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_hop_dong" ("hop_dong_id", "id_mau_noi_quy", "khach_hang_id", "ky_thanh_toan", "ma_hop_dong", "ngay_ky", "nhan_vien_id", "tien_coc_goc", "trang_thai") SELECT "hop_dong_id", "id_mau_noi_quy", "khach_hang_id", "ky_thanh_toan", "ma_hop_dong", "ngay_ky", "nhan_vien_id", "tien_coc_goc", "trang_thai" FROM "hop_dong";
DROP TABLE "hop_dong";
ALTER TABLE "new_hop_dong" RENAME TO "hop_dong";
CREATE UNIQUE INDEX "hop_dong_ma_hop_dong_key" ON "hop_dong"("ma_hop_dong");
CREATE UNIQUE INDEX "hop_dong_ho_so_nhan_phong_id_key" ON "hop_dong"("ho_so_nhan_phong_id");
CREATE TABLE "new_ket_qua_kiem_tra_dieu_kien" (
    "ket_qua_kiem_tra_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ho_so_dat_coc_id" INTEGER,
    "chi_tiet_dat_coc_id" INTEGER,
    "ho_so_nhan_phong_id" INTEGER,
    "thanh_vien_luu_tru_id" INTEGER,
    "quy_dinh_id" INTEGER NOT NULL,
    "nguoi_kiem_tra_id" INTEGER NOT NULL,
    "ket_qua" TEXT NOT NULL,
    "ghi_chu" TEXT,
    "thoi_diem_kiem_tra" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ket_qua_kiem_tra_dieu_kien_ho_so_dat_coc_id_fkey" FOREIGN KEY ("ho_so_dat_coc_id") REFERENCES "ho_so_dat_coc" ("ho_so_dat_coc_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ket_qua_kiem_tra_dieu_kien_chi_tiet_dat_coc_id_fkey" FOREIGN KEY ("chi_tiet_dat_coc_id") REFERENCES "chi_tiet_dat_coc" ("chi_tiet_dat_coc_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ket_qua_kiem_tra_dieu_kien_ho_so_nhan_phong_id_fkey" FOREIGN KEY ("ho_so_nhan_phong_id") REFERENCES "ho_so_nhan_phong" ("ho_so_nhan_phong_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ket_qua_kiem_tra_dieu_kien_thanh_vien_luu_tru_id_fkey" FOREIGN KEY ("thanh_vien_luu_tru_id") REFERENCES "thanh_vien_luu_tru" ("thanh_vien_luu_tru_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ket_qua_kiem_tra_dieu_kien_quy_dinh_id_fkey" FOREIGN KEY ("quy_dinh_id") REFERENCES "quy_dinh_ky_tuc_xa" ("quy_dinh_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ket_qua_kiem_tra_dieu_kien_nguoi_kiem_tra_id_fkey" FOREIGN KEY ("nguoi_kiem_tra_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ket_qua_kiem_tra_dieu_kien" ("ghi_chu", "ho_so_dat_coc_id", "ho_so_nhan_phong_id", "ket_qua", "ket_qua_kiem_tra_id", "nguoi_kiem_tra_id", "quy_dinh_id", "thoi_diem_kiem_tra") SELECT "ghi_chu", "ho_so_dat_coc_id", "ho_so_nhan_phong_id", "ket_qua", "ket_qua_kiem_tra_id", "nguoi_kiem_tra_id", "quy_dinh_id", "thoi_diem_kiem_tra" FROM "ket_qua_kiem_tra_dieu_kien";
DROP TABLE "ket_qua_kiem_tra_dieu_kien";
ALTER TABLE "new_ket_qua_kiem_tra_dieu_kien" RENAME TO "ket_qua_kiem_tra_dieu_kien";
CREATE TABLE "new_khoan_phi_dich_vu" (
    "id_khoan_phi" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ten_loai_phi" TEXT NOT NULL,
    "don_vi_tinh" TEXT,
    "don_gia" REAL NOT NULL,
    "trang_thai" TEXT NOT NULL DEFAULT 'Đang áp dụng'
);
INSERT INTO "new_khoan_phi_dich_vu" ("don_gia", "id_khoan_phi") SELECT "don_gia", "id_khoan_phi" FROM "khoan_phi_dich_vu";
DROP TABLE "khoan_phi_dich_vu";
ALTER TABLE "new_khoan_phi_dich_vu" RENAME TO "khoan_phi_dich_vu";
CREATE UNIQUE INDEX "khoan_phi_dich_vu_ten_loai_phi_key" ON "khoan_phi_dich_vu"("ten_loai_phi");
CREATE TABLE "new_khoan_thu_dau_ky" (
    "khoan_thu_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hop_dong_id" INTEGER NOT NULL,
    "ten_khoan" TEXT NOT NULL,
    "so_tien" REAL NOT NULL,
    "trang_thai" TEXT NOT NULL DEFAULT 'Chưa thu',
    "ke_toan_id" INTEGER,
    "thoi_diem_thu" DATETIME,
    "phuong_thuc_thu" TEXT,
    "id_khoan_phi_hop_dong" INTEGER,
    CONSTRAINT "khoan_thu_dau_ky_hop_dong_id_fkey" FOREIGN KEY ("hop_dong_id") REFERENCES "hop_dong" ("hop_dong_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "khoan_thu_dau_ky_id_khoan_phi_hop_dong_fkey" FOREIGN KEY ("id_khoan_phi_hop_dong") REFERENCES "khoan_phi_hop_dong" ("id_khoan_phi_hop_dong") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "khoan_thu_dau_ky_ke_toan_id_fkey" FOREIGN KEY ("ke_toan_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_khoan_thu_dau_ky" ("hop_dong_id", "ke_toan_id", "khoan_thu_id", "phuong_thuc_thu", "so_tien", "ten_khoan", "thoi_diem_thu", "trang_thai") SELECT "hop_dong_id", "ke_toan_id", "khoan_thu_id", "phuong_thuc_thu", "so_tien", "ten_khoan", "thoi_diem_thu", "trang_thai" FROM "khoan_thu_dau_ky";
DROP TABLE "khoan_thu_dau_ky";
ALTER TABLE "new_khoan_thu_dau_ky" RENAME TO "khoan_thu_dau_ky";
CREATE UNIQUE INDEX "khoan_thu_dau_ky_id_khoan_phi_hop_dong_key" ON "khoan_thu_dau_ky"("id_khoan_phi_hop_dong");
CREATE TABLE "new_phong" (
    "phong_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ma_phong" TEXT NOT NULL,
    "khu" TEXT,
    "tang" INTEGER,
    "id_loai_phong" INTEGER NOT NULL,
    "suc_chua" INTEGER NOT NULL,
    "gioi_tinh_ap_dung" TEXT,
    "tien_ich" TEXT,
    "trang_thai" TEXT NOT NULL DEFAULT 'DANG_HOAT_DONG',
    "ngay_tao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "phong_id_loai_phong_fkey" FOREIGN KEY ("id_loai_phong") REFERENCES "loai_phong" ("id_loai_phong") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_phong" ("gioi_tinh_ap_dung", "id_loai_phong", "khu", "ma_phong", "ngay_tao", "phong_id", "suc_chua", "tang", "tien_ich", "trang_thai") SELECT "gioi_tinh_ap_dung", "id_loai_phong", "khu", "ma_phong", "ngay_tao", "phong_id", "suc_chua", "tang", "tien_ich", "trang_thai" FROM "phong";
DROP TABLE "phong";
ALTER TABLE "new_phong" RENAME TO "phong";
CREATE UNIQUE INDEX "phong_ma_phong_key" ON "phong"("ma_phong");
CREATE TABLE "new_quy_dinh_ky_tuc_xa" (
    "quy_dinh_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ma_quy_dinh" TEXT NOT NULL,
    "ten_quy_dinh" TEXT NOT NULL,
    "nhom_quy_dinh" TEXT NOT NULL,
    "noi_dung" TEXT NOT NULL,
    "tham_so_kiem_tra" TEXT,
    "bat_buoc" BOOLEAN NOT NULL DEFAULT true,
    "ngay_ap_dung" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trang_thai" TEXT NOT NULL DEFAULT 'Đang áp dụng'
);
INSERT INTO "new_quy_dinh_ky_tuc_xa" ("bat_buoc", "ma_quy_dinh", "ngay_ap_dung", "nhom_quy_dinh", "noi_dung", "quy_dinh_id", "ten_quy_dinh", "tham_so_kiem_tra", "trang_thai") SELECT "bat_buoc", "ma_quy_dinh", "ngay_ap_dung", "nhom_quy_dinh", "noi_dung", "quy_dinh_id", "ten_quy_dinh", "tham_so_kiem_tra", "trang_thai" FROM "quy_dinh_ky_tuc_xa";
DROP TABLE "quy_dinh_ky_tuc_xa";
ALTER TABLE "new_quy_dinh_ky_tuc_xa" RENAME TO "quy_dinh_ky_tuc_xa";
CREATE UNIQUE INDEX "quy_dinh_ky_tuc_xa_ma_quy_dinh_key" ON "quy_dinh_ky_tuc_xa"("ma_quy_dinh");
CREATE TABLE "new_tai_san_ban_giao" (
    "id_tai_san_ban_giao" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_tai_san_mac_dinh" INTEGER NOT NULL,
    "bien_ban_ban_giao_id" INTEGER NOT NULL,
    "so_luong" INTEGER NOT NULL DEFAULT 1,
    "tinh_trang" TEXT,
    "ghi_chu" TEXT,
    CONSTRAINT "tai_san_ban_giao_id_tai_san_mac_dinh_fkey" FOREIGN KEY ("id_tai_san_mac_dinh") REFERENCES "tai_san_mac_dinh" ("id_tai_san_mac_dinh") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tai_san_ban_giao_bien_ban_ban_giao_id_fkey" FOREIGN KEY ("bien_ban_ban_giao_id") REFERENCES "bien_ban_ban_giao" ("bien_ban_ban_giao_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_tai_san_ban_giao" ("bien_ban_ban_giao_id", "ghi_chu", "id_tai_san_ban_giao", "so_luong", "tinh_trang") SELECT "bien_ban_ban_giao_id", "ghi_chu", "id_tai_san_ban_giao", "so_luong", "tinh_trang" FROM "tai_san_ban_giao";
DROP TABLE "tai_san_ban_giao";
ALTER TABLE "new_tai_san_ban_giao" RENAME TO "tai_san_ban_giao";
CREATE UNIQUE INDEX "tai_san_ban_giao_bien_ban_ban_giao_id_id_tai_san_mac_dinh_key" ON "tai_san_ban_giao"("bien_ban_ban_giao_id", "id_tai_san_mac_dinh");
CREATE TABLE "new_thanh_vien_luu_tru" (
    "thanh_vien_luu_tru_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ho_so_nhan_phong_id" INTEGER NOT NULL,
    "chi_tiet_dat_coc_id" INTEGER NOT NULL,
    "stt_thanh_vien" INTEGER NOT NULL,
    "ho_ten" TEXT NOT NULL,
    "ngay_sinh" DATETIME,
    "gioi_tinh" TEXT,
    "loai_giay_to" TEXT NOT NULL,
    "so_giay_to" TEXT NOT NULL,
    "so_dien_thoai" TEXT,
    "quan_he" TEXT,
    "la_nguoi_dai_dien" BOOLEAN NOT NULL DEFAULT false,
    "da_xac_minh_giay_to" BOOLEAN NOT NULL DEFAULT false,
    "nguoi_xac_minh_id" INTEGER,
    "thoi_diem_xac_minh" DATETIME,
    "ket_qua_dieu_kien" TEXT NOT NULL DEFAULT 'Chờ duyệt',
    "ly_do_khong_dat" TEXT,
    "trang_thai_tham_gia" TEXT NOT NULL DEFAULT 'THAM_GIA',
    CONSTRAINT "thanh_vien_luu_tru_ho_so_nhan_phong_id_fkey" FOREIGN KEY ("ho_so_nhan_phong_id") REFERENCES "ho_so_nhan_phong" ("ho_so_nhan_phong_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "thanh_vien_luu_tru_chi_tiet_dat_coc_id_fkey" FOREIGN KEY ("chi_tiet_dat_coc_id") REFERENCES "chi_tiet_dat_coc" ("chi_tiet_dat_coc_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "thanh_vien_luu_tru_nguoi_xac_minh_id_fkey" FOREIGN KEY ("nguoi_xac_minh_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_thanh_vien_luu_tru" ("gioi_tinh", "ho_so_nhan_phong_id", "ho_ten", "ket_qua_dieu_kien", "ly_do_khong_dat", "ngay_sinh", "quan_he", "so_dien_thoai", "stt_thanh_vien") SELECT "gioi_tinh", "ho_so_nhan_phong_id", "ho_ten", "ket_qua_dieu_kien", "ly_do_khong_dat", "ngay_sinh", "quan_he", "so_dien_thoai", "stt_thanh_vien" FROM "thanh_vien_luu_tru";
DROP TABLE "thanh_vien_luu_tru";
ALTER TABLE "new_thanh_vien_luu_tru" RENAME TO "thanh_vien_luu_tru";
CREATE UNIQUE INDEX "thanh_vien_luu_tru_ho_so_nhan_phong_id_stt_thanh_vien_key" ON "thanh_vien_luu_tru"("ho_so_nhan_phong_id", "stt_thanh_vien");
CREATE TABLE "new_yeu_cau_thue" (
    "yeu_cau_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "khach_hang_id" INTEGER NOT NULL,
    "nhan_vien_id" INTEGER NOT NULL,
    "loai_thue" TEXT NOT NULL,
    "id_loai_phong_mong_muon" INTEGER,
    "khu_vuc_mong_muon" TEXT,
    "so_nguoi_du_kien" INTEGER NOT NULL,
    "so_luong_giuong_du_kien" INTEGER,
    "muc_gia_mong_muon" REAL,
    "thoi_gian_du_kien_vao_o" DATETIME,
    "thoi_han_thue_thang" INTEGER,
    "tieu_chi_uu_tien" TEXT,
    "trang_thai" TEXT NOT NULL DEFAULT 'Mới tạo',
    "ngay_tao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "yeu_cau_thue_khach_hang_id_fkey" FOREIGN KEY ("khach_hang_id") REFERENCES "khach_hang" ("khach_hang_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "yeu_cau_thue_nhan_vien_id_fkey" FOREIGN KEY ("nhan_vien_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "yeu_cau_thue_id_loai_phong_mong_muon_fkey" FOREIGN KEY ("id_loai_phong_mong_muon") REFERENCES "loai_phong" ("id_loai_phong") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_yeu_cau_thue" ("khach_hang_id", "khu_vuc_mong_muon", "loai_thue", "muc_gia_mong_muon", "ngay_tao", "nhan_vien_id", "so_nguoi_du_kien", "thoi_gian_du_kien_vao_o", "thoi_han_thue_thang", "tieu_chi_uu_tien", "trang_thai", "yeu_cau_id") SELECT "khach_hang_id", "khu_vuc_mong_muon", "loai_thue", "muc_gia_mong_muon", "ngay_tao", "nhan_vien_id", "so_nguoi_du_kien", "thoi_gian_du_kien_vao_o", "thoi_han_thue_thang", "tieu_chi_uu_tien", "trang_thai", "yeu_cau_id" FROM "yeu_cau_thue";
DROP TABLE "yeu_cau_thue";
ALTER TABLE "new_yeu_cau_thue" RENAME TO "yeu_cau_thue";
CREATE TABLE "new_yeu_cau_tra_phong" (
    "yeu_cau_tra_phong_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chi_tiet_hop_dong_id" INTEGER,
    "chi_tiet_dat_coc_id" INTEGER,
    "nhan_vien_id" INTEGER NOT NULL,
    "ngay_tra_phong_du_kien" DATETIME NOT NULL,
    "gio_tra_phong" TEXT,
    "ly_do_tra_phong" TEXT,
    "co_het_han_theo_lich" TEXT NOT NULL DEFAULT 'Không',
    "trang_thai" TEXT NOT NULL DEFAULT 'Chờ quản lý kiểm tra',
    "trang_thai_gui_thong_bao" TEXT NOT NULL DEFAULT 'Chưa gửi',
    "ngay_tao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "yeu_cau_tra_phong_chi_tiet_hop_dong_id_fkey" FOREIGN KEY ("chi_tiet_hop_dong_id") REFERENCES "chi_tiet_hop_dong" ("chi_tiet_hop_dong_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "yeu_cau_tra_phong_chi_tiet_dat_coc_id_fkey" FOREIGN KEY ("chi_tiet_dat_coc_id") REFERENCES "chi_tiet_dat_coc" ("chi_tiet_dat_coc_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "yeu_cau_tra_phong_nhan_vien_id_fkey" FOREIGN KEY ("nhan_vien_id") REFERENCES "nguoi_dung" ("nguoi_dung_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_yeu_cau_tra_phong" ("co_het_han_theo_lich", "gio_tra_phong", "ly_do_tra_phong", "ngay_tao", "ngay_tra_phong_du_kien", "nhan_vien_id", "trang_thai", "trang_thai_gui_thong_bao", "yeu_cau_tra_phong_id") SELECT "co_het_han_theo_lich", "gio_tra_phong", "ly_do_tra_phong", "ngay_tao", "ngay_tra_phong_du_kien", "nhan_vien_id", "trang_thai", "trang_thai_gui_thong_bao", "yeu_cau_tra_phong_id" FROM "yeu_cau_tra_phong";
DROP TABLE "yeu_cau_tra_phong";
ALTER TABLE "new_yeu_cau_tra_phong" RENAME TO "yeu_cau_tra_phong";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "chi_tiet_hop_dong_chi_tiet_dat_coc_id_key" ON "chi_tiet_hop_dong"("chi_tiet_dat_coc_id");

-- CreateIndex
CREATE UNIQUE INDEX "khoan_phi_hop_dong_hop_dong_id_id_khoan_phi_key" ON "khoan_phi_hop_dong"("hop_dong_id", "id_khoan_phi");

-- CreateIndex
CREATE UNIQUE INDEX "tai_san_mac_dinh_ten_tai_san_key" ON "tai_san_mac_dinh"("ten_tai_san");
