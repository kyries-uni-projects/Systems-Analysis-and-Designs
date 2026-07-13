// lib/services/yeuCauTraPhong.service.ts
// Tầng Nghiệp vụ (BUS) cho YeuCauTraPhong — ứng với lớp "YeuCauTraPhong"
import { prisma, type Db } from "../prisma";
import { YeuCauTraPhongDB } from "../repositories/yeuCauTraPhong.repository";
import type { HopDongInfo } from "./hopDong.service";

export const YeuCauTraPhong = {
  /**
   * UC1 Màn 3 (Ghi nhận thời gian trả phòng): tạo hồ sơ trả phòng mới.
   * Tự gọi kiểm tra điều kiện (A4) để quyết định coHetHanTheoLich trước khi lưu.
   *
   * SỬA: nhận thêm `hoSoDatCocId?` song song `hoSoNhanPhongId?` để hỗ trợ case "hoàn 80% —
   * đặt cọc nhưng chưa ký hợp đồng" (đúng ràng buộc exclusive-or trong schema_v3.prisma).
   * Validate ở đây: phải truyền ĐÚNG 1 trong 2 khóa, không được cả hai hoặc thiếu cả hai —
   * trước đây không có bước validate này (chỉ nhận hoSoNhanPhongId bắt buộc), nên nếu sau
   * này có luồng tạo theo hoSoDatCocId mà quên validate, có thể tạo ra bản ghi rác.
   *
   * Lưu ý: UI hiện tại (UC1 Màn 1) chỉ tìm kiếm trong bảng HopDong nên luôn truyền
   * `hoSoNhanPhongId` — nhánh `hoSoDatCocId` chưa có màn hình nào gọi tới (cần thêm 1 luồng
   * tìm kiếm riêng theo HoSoDatCoc nếu muốn hỗ trợ đầy đủ, việc này nằm ngoài phạm vi sửa
   * lỗi backend hiện tại). Việc thêm nhánh này vào service chỉ đảm bảo BACKEND không tạo ra
   * dữ liệu sai/rác nếu sau này có nơi gọi tới (vd. seed, hoặc UI bổ sung).
   */
  async taoMoi(
    params: {
      hoSoNhanPhongId?: number;
      hoSoDatCocId?: number;
      hopDong?: Pick<HopDongInfo, "trangThai">; // chỉ có khi tạo theo nhánh hoSoNhanPhongId
      ngayTraPhongDuKien: Date;
      gioTraPhong?: string;
      lyDoTraPhong?: string;
      nhanVienId: number;
    },
    db: Db = prisma,
  ) {
    const coDatHoSoNhanPhong = params.hoSoNhanPhongId != null;
    const coDatHoSoDatCoc = params.hoSoDatCocId != null;
    if (coDatHoSoNhanPhong === coDatHoSoDatCoc) {
      throw new Error(
        "YeuCauTraPhong.taoMoi: phải truyền đúng 1 trong 2 khóa hoSoNhanPhongId/hoSoDatCocId (không được cả hai hoặc thiếu cả hai).",
      );
    }

    // Nhánh "đã hết hạn theo lịch" (A4) chỉ áp dụng khi có hợp đồng thật (nhánh
    // hoSoNhanPhongId); nhánh hoSoDatCocId (chưa ký HĐ) không có khái niệm này — Kế toán tự
    // chọn tỷ lệ hoàn cọc 80% thủ công ở UC3 Màn 1 (xem DoiSoatHoanCoc.deXuatTyLeHoanCoc()).
    const coHetHan = params.hopDong?.trangThai === "Đã hết hạn";

    return YeuCauTraPhongDB.them(
      {
        hoSoNhanPhongId: params.hoSoNhanPhongId,
        hoSoDatCocId: params.hoSoDatCocId,
        nhanVienId: params.nhanVienId,
        ngayTraPhongDuKien: params.ngayTraPhongDuKien,
        gioTraPhong: params.gioTraPhong,
        lyDoTraPhong: params.lyDoTraPhong,
        coHetHanTheoLich: coHetHan ? "Có" : "Không",
        // Lưu ý: schema mặc định "Chờ quản lý kiểm tra" — UI/đặc tả hiện dùng
        // "Đã đăng ký, chờ ngày trả phòng". Cần nhóm thống nhất 1 giá trị (xem
        // BanGiao_GiaoDien_Nhom4.md mục 3). Tạm dùng đúng giá trị UI yêu cầu ở đây.
        trangThai: "Đã đăng ký, chờ ngày trả phòng",
      },
      db,
    );
  },

  /**
   * Cập nhật trạng thái hồ sơ — dùng lại ở UC2/UC3/UC4 (xem repository để biết đủ các giá trị).
   * SỬA: nhận thêm `db` — bắt buộc phải truyền `tx` khi được gọi từ bên trong
   * `prisma.$transaction(async (tx) => ...)` ở service khác, nếu không sẽ không tham gia
   * đúng transaction (xem ghi chú trong lib/prisma.ts).
   */
  async capNhatTrangThai(yeuCauTraPhongId: number, trangThaiMoi: string, db: Db = prisma): Promise<boolean> {
    return YeuCauTraPhongDB.capNhatTrangThai(yeuCauTraPhongId, trangThaiMoi, db);
  },
};
