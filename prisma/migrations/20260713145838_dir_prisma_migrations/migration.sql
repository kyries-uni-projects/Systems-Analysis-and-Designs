-- CreateTable
CREATE TABLE "chi_tiet_kiem_tra_tai_san" (
    "chi_tiet_kiem_tra_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bien_ban_kiem_tra_id" INTEGER NOT NULL,
    "id_tai_san_ban_giao" INTEGER NOT NULL,
    "so_luong_da_tra" INTEGER NOT NULL,
    "tinh_trang_khi_tra" TEXT NOT NULL,
    "co_hu_hong_mat_mat" TEXT NOT NULL DEFAULT 'Không',
    "chi_phi_boi_thuong" REAL NOT NULL DEFAULT 0,
    "ghi_chu" TEXT,
    CONSTRAINT "chi_tiet_kiem_tra_tai_san_bien_ban_kiem_tra_id_fkey" FOREIGN KEY ("bien_ban_kiem_tra_id") REFERENCES "bien_ban_kiem_tra_tra_phong" ("bien_ban_kiem_tra_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "chi_tiet_kiem_tra_tai_san_id_tai_san_ban_giao_fkey" FOREIGN KEY ("id_tai_san_ban_giao") REFERENCES "tai_san_ban_giao" ("id_tai_san_ban_giao") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "chi_tiet_kiem_tra_tai_san_bien_ban_kiem_tra_id_id_tai_san_ban_giao_key" ON "chi_tiet_kiem_tra_tai_san"("bien_ban_kiem_tra_id", "id_tai_san_ban_giao");
