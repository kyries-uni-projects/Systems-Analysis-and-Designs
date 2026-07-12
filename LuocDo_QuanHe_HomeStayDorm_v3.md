# LƯỢC ĐỒ QUAN HỆ — HỆ THỐNG HOMESTAY DORM (PHIÊN BẢN CẬP NHẬT)

CSC12004 — Nhóm 9

Tài liệu này mô tả lược đồ quan hệ sau khi áp dụng các thay đổi đã được nhóm thống nhất, dựa trên lược đồ gốc (LuocDo_QuanHe_HomeStayDorm.md).

---

## Danh sách thay đổi so với bản gốc

1. Bỏ bảng CHI_NHANH. Xóa cột chi_nhanh_id khỏi PHONG và NGUOI_DUNG.
2. Bảng TAI_SAN_BAN_GIAO: thêm cột so_luong, đổi khóa chính từ (bien_ban_ban_giao_id, stt_tai_san) sang khóa surrogate id_tai_san_ban_giao, giữ ràng buộc duy nhất trên (bien_ban_ban_giao_id, ten_tai_san).
3. Tách KHOAN_PHI_DICH_VU thành hai bảng: LOAI_PHI_DICH_VU (danh mục dùng chung) và KHOAN_PHI_DICH_VU (áp dụng cho từng phòng trong hợp đồng, có khóa chính surrogate).
4. Hỗ trợ một hợp đồng thuê nhiều phòng hoặc giường. HOP_DONG trở thành bảng thông tin chung của hợp đồng. HO_SO_NHAN_PHONG đóng vai trò đại diện cho từng phòng cụ thể trong hợp đồng, thay vì quan hệ một-một cũ.
5. Không thêm cột xac_nhan_ky vào HOP_DONG.
6. Thêm bảng MAU_NOI_QUY để tái sử dụng nội quy, quy định hoàn cọc và điều khoản xử lý vi phạm cho nhiều hợp đồng. HOP_DONG tham chiếu đến MAU_NOI_QUY thay vì lưu văn bản trực tiếp.
7. Them bang QUY_DINH_KY_TUC_XA va KET_QUA_KIEM_TRA_DIEU_KIEN de quan ly bo quy dinh/ dieu kien luu tru dang ap dung va luu ket qua doi chieu tung dieu kien trong quy trinh dat coc, xac nhan thue va nhan phong.

Vì thay đổi 4 làm hợp đồng có thể gồm nhiều phòng, ba bảng sau phải đổi điểm tham chiếu từ HOP_DONG sang HO_SO_NHAN_PHONG để mỗi phòng trong hợp đồng có thể quản lý độc lập: KHOAN_PHI_DICH_VU, BIEN_BAN_BAN_GIAO, YEU_CAU_TRA_PHONG.

---

## NHÓM 0 — DANH MỤC DÙNG CHUNG

### NGUOI_DUNG

```
NGUOI_DUNG(nguoi_dung_id, ho_ten, ten_dang_nhap, mat_khau_hash, email,
           so_dien_thoai, vai_tro, trang_thai, ngay_tao)
```

Khóa chính: nguoi_dung_id.
Không còn tham chiếu đến chi nhánh sau khi bỏ bảng CHI_NHANH.

### KHACH_HANG

```
KHACH_HANG(khach_hang_id, ho_ten, cccd_passport, gioi_tinh, quoc_tich,
           so_dien_thoai, email, ghi_chu, ngay_tao)
```

Khóa chính: khach_hang_id. Không thay đổi so với bản gốc.

### LOAI_PHONG (bảng mới)

```
LOAI_PHONG(id_loai_phong, ten_loai_phong, don_gia)
```

Khóa chính: id_loai_phong.
Bảng danh mục loại phòng, ví dụ phòng đơn, phòng đôi, phòng bốn người. Cột don_gia là giá thuê áp dụng chung cho toàn bộ các phòng thuộc loại này.

Bảng này tách ra từ PHONG theo nguyên tắc thuộc tính phụ thuộc bắc cầu: giá thuê thực chất phụ thuộc vào loại phòng chứ không phải là thuộc tính độc lập của từng phòng cụ thể. Nhiều phòng có thể thuộc cùng một loại phòng.

### PHONG

```
PHONG(phong_id, ma_phong, khu, tang, id_loai_phong, suc_chua,
      gioi_tinh_ap_dung, tien_ich, trang_thai, ngay_tao)
```

Khóa chính: phong_id.
Khóa ngoại: id_loai_phong tham chiếu LOAI_PHONG, bắt buộc, thể hiện quan hệ nhiều phòng thuộc một loại phòng.
Đã xóa cột chi_nhanh_id sau khi bỏ bảng CHI_NHANH.
Đã xóa cột loai_phong dạng văn bản và cột gia_thue_thang, thay bằng khóa ngoại id_loai_phong tham chiếu đến LOAI_PHONG. Giá thuê hiện tại đọc được thông qua liên kết PHONG đến LOAI_PHONG.don_gia.
Cột suc_chua vẫn giữ lại ở PHONG, vì sức chứa vật lý của từng phòng có thể khác nhau dù cùng một loại phòng, tùy theo cách bố trí thực tế.

### GIUONG

```
GIUONG(giuong_id, phong_id, ma_giuong_local, trang_thai)
```

Khóa chính: giuong_id (khóa surrogate).
Khóa ngoại: phong_id tham chiếu PHONG.
Ràng buộc duy nhất: (phong_id, ma_giuong_local), giữ nguyên bản chất thực thể yếu theo lý thuyết dù dùng surrogate key cho mục đích triển khai.

### MAU_NOI_QUY (bảng mới)

```
MAU_NOI_QUY(id_mau_noi_quy, ten_mau, noi_quy, quy_dinh_hoan_coc,
            dieu_khoan_vi_pham, ngay_ap_dung, trang_thai)
```

Khóa chính: id_mau_noi_quy.
Một mẫu nội quy được nhiều hợp đồng tham chiếu đến, cho phép tái sử dụng và không cần copy văn bản mỗi lần lập hợp đồng.


### QUY_DINH_KY_TUC_XA (bảng mới)

```
QUY_DINH_KY_TUC_XA(quy_dinh_id, ma_quy_dinh, ten_quy_dinh,
                   nhom_quy_dinh, noi_dung, tham_so_kiem_tra,
                   bat_buoc, ngay_ap_dung, trang_thai)
```

Khóa chính: quy_dinh_id. Khóa ứng viên: ma_quy_dinh.
Bảng này lưu các quy định/ điều kiện lưu trú của ký túc xá được dùng để đối chiếu trước khi cho khách đặt cọc hoặc nhận phòng, ví dụ giới tính phù hợp khu phòng, quốc tịch, giấy tờ tùy thân, sức chứa phòng, mức giá, khả năng tài chính và các tiêu chí ưu tiên.



---

## NHÓM 1 — ĐĂNG KÝ THUÊ PHÒNG

### YEU_CAU_THUE

```
YEU_CAU_THUE(yeu_cau_id, khach_hang_id, nhan_vien_id, loai_thue,
             khu_vuc_mong_muon, so_nguoi_du_kien, muc_gia_mong_muon,
             thoi_gian_du_kien_vao_o, thoi_han_thue_thang,
             tieu_chi_uu_tien, trang_thai, ngay_tao)
```

Khóa chính: yeu_cau_id.
Khóa ngoại: khach_hang_id tham chiếu KHACH_HANG, nhan_vien_id tham chiếu NGUOI_DUNG.
Không thay đổi so với bản gốc.

### LICH_HEN_XEM_PHONG

```
LICH_HEN_XEM_PHONG(lich_hen_id, yeu_cau_id, phong_id, giuong_id,
                   nhan_vien_id, ngay_xem, gio_bat_dau, gio_ket_thuc,
                   phuong_thuc_thong_bao, trang_thai_gui_thong_bao,
                   trang_thai, ngay_tao)
```

Khóa chính: lich_hen_id.
Khóa ngoại: yeu_cau_id, phong_id, nhan_vien_id bắt buộc. giuong_id được phép rỗng khi khách xem để thuê nguyên phòng.
Không thay đổi so với bản gốc.

---

## NHÓM 2 — ĐẶT CỌC VÀ XÁC NHẬN THUÊ

### HO_SO_DAT_COC

```
HO_SO_DAT_COC(ho_so_dat_coc_id, yeu_cau_id, khach_hang_id, phong_id,
              giuong_id, hinh_thuc_thue, so_giuong_thue,
              nhan_vien_id, quan_ly_xac_nhan_id, trang_thai,
              ly_do_tu_choi, ngay_hen_nhan_phong, gio_hen_nhan_phong,
              ghi_chu_hen_nhan_phong, ngay_tao)
```

Khóa chính: ho_so_dat_coc_id.
Mỗi hồ sơ đặt cọc vẫn ứng với một phòng hoặc một giường cụ thể. Trường hợp khách đặt cọc nhiều phòng hoặc giường trong cùng một lần xem, hệ thống tạo nhiều hồ sơ đặt cọc riêng biệt, mỗi hồ sơ một phòng hoặc giường. Đây là điểm không thay đổi so với bản gốc dù hợp đồng phía sau đã hỗ trợ nhiều phòng.


### KET_QUA_KIEM_TRA_DIEU_KIEN (bang moi)

```
KET_QUA_KIEM_TRA_DIEU_KIEN(ket_qua_kiem_tra_id, ho_so_dat_coc_id,
                           ho_so_nhan_phong_id, quy_dinh_id,
                           nguoi_kiem_tra_id, ket_qua, ghi_chu,
                           thoi_diem_kiem_tra)
```

Khóa chính: ket_qua_kiem_tra_id.
Khóa ngoại: ho_so_dat_coc_id tham chiếu HO_SO_DAT_COC, ho_so_nhan_phong_id tham chiếu HO_SO_NHAN_PHONG, quy_dinh_id tham chiếu QUY_DINH_KY_TUC_XA, nguoi_kiem_tra_id tham chiếu NGUOI_DUNG.

Bảng này lưu kết quả đối chiếu từng quy định với từng hồ sơ. Trong use case Đặt cọc và xác nhận thuê, bảng này gắn với HO_SO_DAT_COC để Sale/Quản lý biết điều kiện nào đạt, không đạt hoặc cần bổ sung. Trong use case Nhận phòng và phê duyệt lưu trú, bảng này có thể gắn với HO_SO_NHAN_PHONG để lưu lại kết quả kiểm tra sau khi đối chiếu giấy tờ và danh sách thành viên lưu trú.

Ràng buộc nghiệp vụ: mỗi dòng kết quả chỉ nên gắn với một trong hai đối tượng ho_so_dat_coc_id hoặc ho_so_nhan_phong_id. Do SQLite/Prisma không enforce CHECK/XOR on định, ràng buộc này được validate ở tầng ứng dụng.
### YEU_CAU_THANH_TOAN_COC

```
YEU_CAU_THANH_TOAN_COC(yeu_cau_thanh_toan_id, ho_so_dat_coc_id,
                       so_tien_coc, ke_toan_id, thoi_diem_phat_hanh,
                       han_thanh_toan, so_tai_khoan_nhan, trang_thai)
```

Khóa chính: yeu_cau_thanh_toan_id.
Khóa ngoại ho_so_dat_coc_id duy nhất, thể hiện quan hệ một-một với HO_SO_DAT_COC.
Không thay đổi so với bản gốc.

### CHUNG_TU_THANH_TOAN

```
CHUNG_TU_THANH_TOAN(chung_tu_id, yeu_cau_thanh_toan_id, duong_dan_file,
                    so_tien_thuc_nhan, kenh_thanh_toan, thoi_diem_nhan,
                    quan_ly_xac_nhan_id, trang_thai_xac_nhan,
                    ly_do_tu_choi, ngay_tao)
```

Không thay đổi so với bản gốc.

---

## NHÓM 3 — NHẬN PHÒNG VÀ HỢP ĐỒNG

### HOP_DONG (đã cấu trúc lại)

```
HOP_DONG(hop_dong_id, ma_hop_dong, khach_hang_id, nhan_vien_id,
         id_mau_noi_quy, ky_thanh_toan, ngay_bat_dau, ngay_ket_thuc,
         tien_coc_goc, trang_thai, ngay_ky)
```

Khóa chính: hop_dong_id.
Khóa ngoại: khach_hang_id tham chiếu KHACH_HANG, nhan_vien_id tham chiếu NGUOI_DUNG, id_mau_noi_quy tham chiếu MAU_NOI_QUY.

So với bản gốc, HOP_DONG không còn lưu trực tiếp phong_id, giuong_id, hinh_thuc_thue, so_giuong_thue, gia_thue và noi_dung_dieu_khoan. Các thông tin liên quan đến từng phòng trong hợp đồng chuyển sang HO_SO_NHAN_PHONG. Nội dung điều khoản chuyển sang tham chiếu MAU_NOI_QUY. Cột tien_coc_goc giữ lại ở mức hợp đồng, là tổng số tiền cọc của tất cả các phòng thuộc hợp đồng.

### HO_SO_NHAN_PHONG (đã cấu trúc lại)

```
HO_SO_NHAN_PHONG(ho_so_nhan_phong_id, ho_so_dat_coc_id, hop_dong_id,
                 nhan_vien_id, so_cccd_doi_chieu, ket_qua_doi_chieu,
                 ngay_bat_dau_cu_tru, thoi_han_thue_thang,
                 gia_thue_thoa_thuan, ghi_chu, trang_thai, ngay_tao)
```

Khóa chính: ho_so_nhan_phong_id.
Khóa ngoại: ho_so_dat_coc_id duy nhất, thể hiện quan hệ một-một với HO_SO_DAT_COC. hop_dong_id tham chiếu HOP_DONG, được phép rỗng cho đến khi hợp đồng được lập, và không còn là khóa ngoại duy nhất, vì một hợp đồng có thể có nhiều bản ghi HO_SO_NHAN_PHONG tương ứng nhiều phòng.

Cột gia_thue_thoa_thuan là cột mới, lưu giá thuê đã chốt cho phòng này tại thời điểm lập hợp đồng, vì mỗi phòng trong cùng một hợp đồng có thể có mức giá khác nhau.

Thông tin về phòng, giường, hình thức thuê và số giường thuê của từng dòng HO_SO_NHAN_PHONG được lấy gián tiếp thông qua ho_so_dat_coc_id, không lưu trùng lặp tại đây.

### THANH_VIEN_LUU_TRU

```
THANH_VIEN_LUU_TRU(ho_so_nhan_phong_id, stt_thanh_vien, ho_ten,
                   ngay_sinh, gioi_tinh, cccd, so_dien_thoai,
                   quan_he, ket_qua_dieu_kien, ly_do_khong_dat)
```

Khóa chính: (ho_so_nhan_phong_id, stt_thanh_vien).
Không thay đổi cấu trúc so với bản gốc. Do HO_SO_NHAN_PHONG nay đại diện một phòng cụ thể trong hợp đồng, danh sách thành viên lưu trú tự nhiên được quản lý theo từng phòng.

### PHE_DUYET_LUU_TRU

```
PHE_DUYET_LUU_TRU(phe_duyet_id, ho_so_nhan_phong_id, quan_ly_id,
                  ket_qua, ly_do_tu_choi, thoi_diem_phe_duyet)
```

Không thay đổi so với bản gốc.

### LOAI_PHI_DICH_VU (bảng mới, danh mục)

```
LOAI_PHI_DICH_VU(id_loai_phi, ten_loai_phi, don_vi_tinh)
```

Khóa chính: id_loai_phi.
Danh mục các loại phí dùng chung cho toàn hệ thống, ví dụ điện, nước, wifi, gửi xe.

### KHOAN_PHI_DICH_VU (đã cấu trúc lại)

```
KHOAN_PHI_DICH_VU(id_khoan_phi, ho_so_nhan_phong_id, id_loai_phi, don_gia)
```

Khóa chính: id_khoan_phi.
Khóa ngoại: ho_so_nhan_phong_id tham chiếu HO_SO_NHAN_PHONG, id_loai_phi tham chiếu LOAI_PHI_DICH_VU.
Ràng buộc duy nhất trên (ho_so_nhan_phong_id, id_loai_phi).

So với bản gốc, khóa chính đổi từ (hop_dong_id, ten_khoan_phi) sang khóa surrogate id_khoan_phi, và điểm tham chiếu đổi từ HOP_DONG sang HO_SO_NHAN_PHONG, vì mỗi phòng trong hợp đồng có mức tiêu thụ điện nước khác nhau. Cột don_gia là giá trị chốt tại thời điểm áp dụng cho phòng đó, không thay đổi khi giá thị trường biến động.

### KHOAN_THU_DAU_KY

```
KHOAN_THU_DAU_KY(khoan_thu_id, hop_dong_id, ten_khoan, so_tien,
                 trang_thai, ke_toan_id, thoi_diem_thu, phuong_thuc_thu)
```

Giữ nguyên tham chiếu đến HOP_DONG ở mức tổng, vì các khoản thu đầu kỳ thường được khách thanh toán gộp một lần cho toàn bộ hợp đồng.

### BIEN_BAN_BAN_GIAO (đã cấu trúc lại)

```
BIEN_BAN_BAN_GIAO(bien_ban_ban_giao_id, ho_so_nhan_phong_id, quan_ly_id,
                  tinh_trang_ve_sinh, ghi_chu_kiem_tra, xac_nhan_ky_khach,
                  trang_thai, ngay_ban_giao)
```

Khóa ngoại ho_so_nhan_phong_id duy nhất, thể hiện quan hệ một-một với HO_SO_NHAN_PHONG.
So với bản gốc, điểm tham chiếu đổi từ HOP_DONG sang HO_SO_NHAN_PHONG, vì việc bàn giao tài sản và kiểm tra hiện trạng thực hiện riêng cho từng phòng.

### TAI_SAN_BAN_GIAO (đã cấu trúc lại)

```
TAI_SAN_BAN_GIAO(id_tai_san_ban_giao, bien_ban_ban_giao_id, ten_tai_san,
                 so_luong, tinh_trang, ghi_chu)
```

Khóa chính: id_tai_san_ban_giao, là khóa surrogate.
Ràng buộc duy nhất trên (bien_ban_ban_giao_id, ten_tai_san), thay thế cho khóa chính phức hợp cũ (bien_ban_ban_giao_id, stt_tai_san).
Cột so_luong là cột mới, cho phép ghi nhận số lượng của cùng một loại tài sản trong một dòng, ví dụ hai cái nệm, thay vì phải tạo nhiều dòng lặp lại.

---

## NHÓM 4 — TRẢ PHÒNG VÀ HOÀN CỌC

### YEU_CAU_TRA_PHONG (đã cấu trúc lại)

```
YEU_CAU_TRA_PHONG(yeu_cau_tra_phong_id, ho_so_nhan_phong_id,
                  ho_so_dat_coc_id, nhan_vien_id,
                  ngay_tra_phong_du_kien, gio_tra_phong,
                  ly_do_tra_phong, co_het_han_theo_lich, trang_thai,
                  trang_thai_gui_thong_bao, ngay_tao)
```

Khóa chính: yeu_cau_tra_phong_id.
Hai khóa ngoại ho_so_nhan_phong_id và ho_so_dat_coc_id đều được phép rỗng, nhưng đúng một trong hai phải có giá trị.

Trường hợp ho_so_dat_coc_id có giá trị và ho_so_nhan_phong_id rỗng: khách đã đặt cọc nhưng chưa ký hợp đồng, áp dụng mức hoàn tám mươi phần trăm.
Trường hợp ho_so_nhan_phong_id có giá trị và ho_so_dat_coc_id rỗng: khách đã ký hợp đồng và đang trả một phòng cụ thể trong hợp đồng, áp dụng mức hoàn theo thời gian lưu trú.

So với bản gốc, điểm tham chiếu đổi từ hop_dong_id sang ho_so_nhan_phong_id, vì một hợp đồng nay có thể có nhiều phòng và khách có thể trả từng phòng vào thời điểm khác nhau, không nhất thiết trả toàn bộ hợp đồng cùng lúc.

Ràng buộc kiểm tra cần bổ sung ở tầng ứng dụng, vì không thể diễn đạt đầy đủ bằng ràng buộc khóa ngoại thông thường:

```
(ho_so_nhan_phong_id khác rỗng và ho_so_dat_coc_id rỗng)
hoặc
(ho_so_nhan_phong_id rỗng và ho_so_dat_coc_id khác rỗng)
```

### BIEN_BAN_KIEM_TRA_TRA_PHONG

```
BIEN_BAN_KIEM_TRA_TRA_PHONG(bien_ban_kiem_tra_id, yeu_cau_tra_phong_id,
                             quan_ly_id, tinh_trang_ve_sinh,
                             ghi_chu_kiem_tra, duong_dan_hinh_anh,
                             co_hu_hong, trang_thai, ngay_kiem_tra)
```

Không thay đổi cấu trúc so với bản gốc.

### KHOAN_KHAU_TRU

```
KHOAN_KHAU_TRU(bien_ban_kiem_tra_id, stt_khau_tru,
               loai_khoan_khau_tru, mo_ta, so_tien)
```

Không thay đổi so với bản gốc.

### NGHIA_VU_CON_LAI

```
NGHIA_VU_CON_LAI(bien_ban_kiem_tra_id, stt_nghia_vu,
                 loai_nghia_vu, so_tien_con_no, ghi_chu)
```

Không thay đổi so với bản gốc.

### DOI_SOAT_HOAN_COC

```
DOI_SOAT_HOAN_COC(doi_soat_id, bien_ban_kiem_tra_id, ke_toan_id,
                  tien_coc_goc, ty_le_hoan_coc, so_tien_hoan_co_ban,
                  tong_khau_tru, so_tien_hoan_thuc_nhan,
                  so_tien_can_thu_them, trang_thai,
                  xac_nhan_khach_hang, ngay_doi_soat)
```

Không thay đổi so với bản gốc. Tính toán riêng cho từng phòng được trả, phù hợp với việc YEU_CAU_TRA_PHONG nay gắn theo từng phòng.

### BIEN_BAN_TRA_PHONG

```
BIEN_BAN_TRA_PHONG(bien_ban_tra_phong_id, yeu_cau_tra_phong_id,
                   doi_soat_id, quan_ly_id, ngay_tra_phong_thuc_te,
                   tinh_trang_ban_giao_cuoi, da_thu_hoi_chia_khoa,
                   xac_nhan_ky_khach, trang_thai, ngay_lap)
```

Không thay đổi so với bản gốc.

### GIAO_DICH_HOAN_COC

```
GIAO_DICH_HOAN_COC(giao_dich_hoan_coc_id, doi_soat_id, ke_toan_id,
                   so_tien_hoan, phuong_thuc_hoan, so_tai_khoan_nhan,
                   duong_dan_chung_tu, thoi_diem_thuc_hien, trang_thai)
```

Không thay đổi so với bản gốc.

---

## Ghi chú kết thúc quy trình nhiều phòng trong một hợp đồng

Khi khách thuê nhiều phòng, mỗi phòng đi qua đầy đủ quy trình đặt cọc, xác nhận, phê duyệt lưu trú riêng biệt, thể hiện qua các bản ghi HO_SO_DAT_COC và HO_SO_NHAN_PHONG riêng cho từng phòng. Khi tất cả các phòng đã sẵn sàng ký kết, nhân viên tạo một bản ghi HOP_DONG, sau đó cập nhật hop_dong_id cho từng bản ghi HO_SO_NHAN_PHONG liên quan để gộp chúng vào cùng một hợp đồng.

Việc trả phòng có thể diễn ra độc lập theo từng HO_SO_NHAN_PHONG. Hợp đồng chỉ được xem là hoàn tất khi toàn bộ các HO_SO_NHAN_PHONG thuộc hợp đồng đó đã hoàn tất thủ tục trả phòng, đây là ràng buộc nghiệp vụ cần kiểm tra ở tầng ứng dụng.

---

## Bảng tổng hợp toàn bộ quan hệ sau cập nhật

| Bảng | Loại thay đổi |
|---|---|
| NGUOI_DUNG | Bỏ cột chi_nhanh_id |
| KHACH_HANG | Không đổi |
| LOAI_PHONG | Bảng mới |
| PHONG | Bỏ cột chi_nhanh_id; tách loai_phong và gia_thue_thang sang bảng LOAI_PHONG, thêm khóa ngoại id_loai_phong |
| GIUONG | Không đổi |
| MAU_NOI_QUY | Bảng mới |
| QUY_DINH_KY_TUC_XA | Bang moi |
| YEU_CAU_THUE | Không đổi |
| LICH_HEN_XEM_PHONG | Không đổi |
| HO_SO_DAT_COC | Không đổi |
| KET_QUA_KIEM_TRA_DIEU_KIEN | Bang moi |
| YEU_CAU_THANH_TOAN_COC | Không đổi |
| CHUNG_TU_THANH_TOAN | Không đổi |
| HOP_DONG | Cấu trúc lại, bỏ thông tin phòng cụ thể và văn bản điều khoản |
| HO_SO_NHAN_PHONG | Cấu trúc lại, thêm hop_dong_id và gia_thue_thoa_thuan |
| THANH_VIEN_LUU_TRU | Không đổi |
| PHE_DUYET_LUU_TRU | Không đổi |
| LOAI_PHI_DICH_VU | Bảng mới |
| KHOAN_PHI_DICH_VU | Cấu trúc lại, đổi điểm tham chiếu và khóa chính |
| KHOAN_THU_DAU_KY | Không đổi |
| BIEN_BAN_BAN_GIAO | Đổi điểm tham chiếu sang HO_SO_NHAN_PHONG |
| TAI_SAN_BAN_GIAO | Cấu trúc lại, thêm so_luong và khóa surrogate |
| YEU_CAU_TRA_PHONG | Đổi điểm tham chiếu sang HO_SO_NHAN_PHONG |
| BIEN_BAN_KIEM_TRA_TRA_PHONG | Không đổi |
| KHOAN_KHAU_TRU | Không đổi |
| NGHIA_VU_CON_LAI | Không đổi |
| DOI_SOAT_HOAN_COC | Không đổi |
| BIEN_BAN_TRA_PHONG | Không đổi |
| GIAO_DICH_HOAN_COC | Không đổi |

Bảng CHI_NHANH đã được loại bỏ hoàn toàn khỏi lược đồ.

Tong so bang sau cap nhat: hai muoi chin bang (bang goc hai muoi lam bang, tru mot bang CHI_NHANH bi loai bo, cong nam bang moi la MAU_NOI_QUY, LOAI_PHI_DICH_VU, QUY_DINH_KY_TUC_XA, KET_QUA_KIEM_TRA_DIEU_KIEN va LOAI_PHONG).
