UPDATE "chi_tiet_hop_dong"
SET "so_giuong_quy_doi" = COALESCE(
  (
    SELECT "chi_tiet_dat_coc"."so_giuong_quy_doi"
    FROM "chi_tiet_dat_coc"
    WHERE "chi_tiet_dat_coc"."chi_tiet_dat_coc_id" = "chi_tiet_hop_dong"."chi_tiet_dat_coc_id"
  ),
  1
);
