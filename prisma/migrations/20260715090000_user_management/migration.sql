-- Add fields required by the Admin user-management use case.
ALTER TABLE "nguoi_dung" ADD COLUMN "chi_nhan" TEXT;
ALTER TABLE "nguoi_dung" ADD COLUMN "phien_ban_xac_thuc" INTEGER NOT NULL DEFAULT 1;
