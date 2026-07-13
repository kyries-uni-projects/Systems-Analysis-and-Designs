// lib/services/hoSoTraPhong.service.ts
// Tầng Nghiệp vụ (BUS) cho lớp tổng hợp "HoSoTraPhong" — dùng ở màn "Danh sách hồ sơ trả
// phòng" và làm nguồn LayThongTin() dùng chung cho phần lớn các màn "tự fetch theo khóa"
// trong UC2/UC3/UC4/UC5 (thay vì mỗi UC tự viết lại 1 bản JOIN riêng).
import { HoSoTraPhongDB } from "../repositories/hoSoTraPhong.repository";
import { formatMaHoSo, formatMaBienBanKiemTra } from "../maHoSo";

export type TrangThaiHoSo =
  | "Đã đăng ký, chờ ngày trả phòng"
  | "Đang xử lý trả phòng"
  | "Đã kiểm tra, chờ đối soát cọc"
  | "Đã xác nhận đối soát"
  | "Hoàn tất"
  | "Chờ giải quyết tranh chấp";

export type HoSoTraPhongInfo = {
  yeuCauTraPhongId: number;
  maHoSo: string; // định dạng hiển thị, xem lib/maHoSo.ts
  hoSoNhanPhongId: number | null;
  soHopDong: string;
  khachHang: string;
  phongGiuong: string;
  phongId: number | null; // khóa thật — cần cho PhongGiuong.capNhatTrangThai() ở UC4 M4
  giuongId: number | null; // khóa thật — null nếu khách thuê nguyên phòng (không theo giường)
  tienCocGoc: number;
  ngayBatDauLuuTru: Date;
  ngayTraPhong: Date;
  trangThaiHopDong: string;
  trangThaiHoSo: TrangThaiHoSo;
  bienBanKiemTraId: number | null; // khóa thật — cần cho DoiSoatHoanCoc.luu()
  maBienBanKiemTra: string | null; // chỉ để hiển thị
  tongKhauTruKiemTra: number | null;
  doiSoatId: number | null; // khóa thật — cần cho BienBanTraPhong.luu() và GiaoDichHoanCoc.luu()/kiemTraDaHoanCoc()
  tyLeHoanCoc: number | null;
  soTienHoan: number | null; // dương = hoàn cho khách; âm = khách cần đóng thêm
  bienBanTraPhongId: number | null; // khóa thật — cần cho BienBanTraPhong.hoanTat()
  daHoanCoc: boolean; // suy ra từ sự TỒN TẠI của GiaoDichHoanCoc, không phải field riêng
  // Nhánh "hoàn 80%" (đặt cọc nhưng chưa ký hợp đồng) — true khi hồ sơ này KHÔNG đi qua
  // HopDong/HoSoNhanPhong mà tạo trực tiếp từ HoSoDatCoc. UI hiện tại chưa có màn nào tạo
  // ra loại hồ sơ này (xem ghi chú ở yeuCauTraPhong.service.ts), field này chỉ để phòng khi
  // có sẵn nếu ai đó hiển thị/lọc theo loại hồ sơ trong tương lai.
  laHoSoDatCocChuaKyHD: boolean;
};

type RawHoSo = NonNullable<Awaited<ReturnType<typeof HoSoTraPhongDB.layThongTin>>>;

function map(hs: RawHoSo): HoSoTraPhongInfo {
  // Nhánh chính: hồ sơ đi qua HopDong đã ký (hoSoNhanPhongId).
  const hopDong = hs.hoSoNhanPhong?.hopDong;
  const hoSoDatCocQuaNhanPhong = hs.hoSoNhanPhong?.hoSoDatCoc;

  // SỬA — Nhánh "hoàn 80%": hồ sơ tạo trực tiếp từ HoSoDatCoc (hoSoDatCocId), CHƯA có
  // HopDong. Trước đây code không đọc nhánh này ở đâu cả, nên khách hàng/phòng/tiền cọc sẽ
  // hiện "—"/0 một cách sai lệch dù bản ghi tồn tại. Giờ đọc trực tiếp hs.hoSoDatCoc.
  const hoSoDatCocTrucTiep = hs.hoSoDatCoc;
  const laHoSoDatCocChuaKyHD = hs.hoSoNhanPhongId == null && hs.hoSoDatCocId != null;

  const khachHang = hopDong?.khachHang ?? hoSoDatCocTrucTiep?.khachHang;
  const phong = hoSoDatCocQuaNhanPhong?.phong ?? hoSoDatCocTrucTiep?.phong;
  const giuong = hoSoDatCocQuaNhanPhong?.giuong ?? hoSoDatCocTrucTiep?.giuong;
  // Nhánh 80% không có HopDong.tienCocGoc — tiền cọc thật nằm ở YeuCauThanhToanCoc.soTienCoc
  // (1-1 với HoSoDatCoc, xem schema_v3.prisma).
  const tienCocGoc = hopDong?.tienCocGoc ?? hoSoDatCocTrucTiep?.yeuCauThanhToanCoc?.soTienCoc ?? 0;

  const bbkt = hs.bienBanKiemTraTraPhong;
  const doiSoat = bbkt?.doiSoatHoanCoc;
  const giaoDich = doiSoat?.giaoDichHoanCoc;
  const bbtp = hs.bienBanTraPhong;

  const soTienHoan = doiSoat
    ? doiSoat.soTienCanThuThem > 0
      ? -doiSoat.soTienCanThuThem
      : doiSoat.soTienHoanThucNhan
    : null;

  return {
    yeuCauTraPhongId: hs.yeuCauTraPhongId,
    maHoSo: formatMaHoSo(hs.yeuCauTraPhongId),
    hoSoNhanPhongId: hs.hoSoNhanPhongId,
    soHopDong: hopDong?.maHopDong ?? "—",
    khachHang: khachHang?.hoTen ?? "—",
    phongGiuong: phong ? `${phong.maPhong}${giuong ? " - " + giuong.maGiuongLocal : ""}` : "—",
    phongId: phong?.phongId ?? null,
    giuongId: giuong?.giuongId ?? null,
    tienCocGoc,
    ngayBatDauLuuTru: hs.hoSoNhanPhong?.ngayBatDauCuTru ?? hopDong?.ngayBatDau ?? hs.ngayTao,
    ngayTraPhong: hs.ngayTraPhongDuKien,
    trangThaiHopDong: hopDong?.trangThai ?? hoSoDatCocTrucTiep?.trangThai ?? "—",
    trangThaiHoSo: hs.trangThai as TrangThaiHoSo,
    bienBanKiemTraId: bbkt?.bienBanKiemTraId ?? null,
    maBienBanKiemTra: bbkt ? formatMaBienBanKiemTra(bbkt.bienBanKiemTraId) : null,
    tongKhauTruKiemTra: null, // tổng từ KhoanKhauTru[], tính riêng ở bienBanKiemTra.service nếu cần
    doiSoatId: doiSoat?.doiSoatId ?? null,
    tyLeHoanCoc: doiSoat?.tyLeHoanCoc ?? null,
    soTienHoan,
    bienBanTraPhongId: bbtp?.bienBanTraPhongId ?? null,
    daHoanCoc: !!giaoDich,
    laHoSoDatCocChuaKyHD,
  };
}

export const HoSoTraPhong = {
  /** Màn "Danh sách hồ sơ trả phòng": lấy toàn bộ hồ sơ, mọi trạng thái. */
  async layDanhSach(): Promise<HoSoTraPhongInfo[]> {
    const list = await HoSoTraPhongDB.layDanhSach();
    return list.map(map);
  },

  /** Dùng ở hầu hết các màn "tự fetch theo khóa" trong UC2-UC5 (HienThi(maHoSo)). */
  async layThongTin(yeuCauTraPhongId: number): Promise<HoSoTraPhongInfo | null> {
    const hs = await HoSoTraPhongDB.layThongTin(yeuCauTraPhongId);
    return hs ? map(hs) : null;
  },
};
