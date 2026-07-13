"use client";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, Hash, FileText, Lock } from "lucide-react";
import { useTraPhongData, HoSoTraPhong, TrangThaiHoSo } from "@/context/TraPhongDataContext";
import { useAuth } from "@/components/providers/AuthProvider";

/**
 * Trang trung tâm "Danh sách hồ sơ trả phòng" — thay thế cho việc gõ URL tay.
 * Đây là điểm vào chính của menu "Trả phòng", điều phối tới đúng UC tiếp theo
 * dựa theo trạng thái hiện tại của từng hồ sơ. Mỗi hồ sơ chỉ hiện nút hành
 * động cho ĐÚNG vai trò phụ trách bước đó (admin luôn thấy được hết).
 */

const STATUS_COLOR: Record<TrangThaiHoSo, string> = {
  "Đã đăng ký, chờ ngày trả phòng": "bg-blue-100 text-blue-700",
  "Đang xử lý trả phòng": "bg-blue-100 text-blue-700",
  "Đã kiểm tra, chờ đối soát cọc": "bg-purple-100 text-purple-700",
  "Đã xác nhận đối soát": "bg-amber-100 text-amber-700",
  "Hoàn tất": "bg-green-100 text-green-700",
  "Chờ giải quyết tranh chấp": "bg-red-100 text-red-700",
};

const ROLE_LABEL: Record<string, string> = {
  nhanvien: "nhân viên",
  quanly: "quản lý",
  ketoan: "kế toán",
  admin: "quản trị",
};

function formatVND(n: number): string {
  return Math.abs(n).toLocaleString("vi-VN") + " đ";
}

type PendingAction = { label: string; path: string; role: string };

function pendingActions(hoSo: HoSoTraPhong): PendingAction[] {
  const actions: PendingAction[] = [];
  switch (hoSo.trangThaiHoSo) {
    case "Đã đăng ký, chờ ngày trả phòng":
    case "Đang xử lý trả phòng":
      actions.push({ label: "Kiểm tra phòng/giường", path: `/tra-phong/kiem-tra-tinh-trang/${hoSo.maHoSo}`, role: "quanly" });
      break;
    case "Đã kiểm tra, chờ đối soát cọc":
      actions.push({ label: "Đối soát hoàn cọc", path: `/tra-phong/doi-soat-hoan-coc/${hoSo.maHoSo}`, role: "ketoan" });
      break;
    case "Đã xác nhận đối soát":
      actions.push({ label: "Lập biên bản thanh lý", path: `/tra-phong/lap-bien-ban-thanh-ly/${hoSo.maHoSo}`, role: "quanly" });
      // Song song: nếu hồ sơ có số dư hoàn cọc dương và chưa hoàn, kế toán có thể tự
      // vào "Thực hiện hoàn cọc" độc lập (không cần Quản lý điều hướng hộ, vì UC5 là
      // extend của UC4 nhưng do MỘT NGƯỜI KHÁC — kế toán — thực hiện).
      if ((hoSo.soTienHoan ?? 0) > 0 && !hoSo.daHoanCoc) {
        actions.push({ label: "Thực hiện hoàn cọc", path: `/tra-phong/thuc-hien-hoan-coc/${hoSo.maHoSo}`, role: "ketoan" });
      }
      break;
    default:
      break;
  }
  return actions;
}

export default function DanhSachTraPhongPage() {
  const router = useRouter();
  const { hoSoList, loading } = useTraPhongData();
  const { sessionUser } = useAuth();
  const role = sessionUser?.role ?? "";
  const canRegister = role === "nhanvien" || role === "admin";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Trả phòng & Hoàn cọc</h1>
        {canRegister && (
          <button
            onClick={() => router.push("/tra-phong/dang-ky-tra-phong")}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} /> Đăng ký trả phòng mới
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Đang tải danh sách hồ sơ...</div>
      ) : (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500 text-xs">
                <th className="px-6 py-3 font-medium">Mã hồ sơ</th>
                <th className="px-6 py-3 font-medium">Số hợp đồng</th>
                <th className="px-6 py-3 font-medium">Khách hàng</th>
                <th className="px-6 py-3 font-medium">Phòng / Giường</th>
                <th className="px-6 py-3 font-medium">Kết quả hoàn cọc</th>
                <th className="px-6 py-3 font-medium">Trạng thái</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {hoSoList.map((hoSo) => {
                const actions = pendingActions(hoSo);
                const myActions = actions.filter((a) => a.role === role || role === "admin");
                const othersActions = actions.filter((a) => a.role !== role && role !== "admin");
                return (
                  <tr key={hoSo.maHoSo} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-3.5 font-medium text-gray-800 flex items-center gap-1.5">
                      <Hash size={13} className="text-gray-400" />
                      {hoSo.maHoSo}
                    </td>
                    <td className="px-6 py-3.5 text-gray-600 flex items-center gap-1.5">
                      <FileText size={13} className="text-gray-400" />
                      {hoSo.soHopDong}
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">{hoSo.khachHang}</td>
                    <td className="px-6 py-3.5 text-gray-600">{hoSo.phongGiuong}</td>
                    <td className="px-6 py-3.5">
                      {hoSo.soTienHoan == null ? (
                        <span className="text-gray-400">—</span>
                      ) : hoSo.soTienHoan >= 0 ? (
                        <span className="text-green-700">Hoàn {formatVND(hoSo.soTienHoan)}</span>
                      ) : (
                        <span className="text-red-600">Thu thêm {formatVND(hoSo.soTienHoan)}</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[hoSo.trangThaiHoSo]}`}
                      >
                        {hoSo.trangThaiHoSo}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {myActions.length > 0 ? (
                        <div className="flex flex-col gap-1.5 items-end">
                          {myActions.map((action) => (
                            <button
                              key={action.path}
                              onClick={() => router.push(action.path)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors"
                            >
                              {action.label} <ArrowRight size={13} />
                            </button>
                          ))}
                        </div>
                      ) : othersActions.length > 0 ? (
                        <span className="flex items-center justify-end gap-1.5 text-xs text-gray-400">
                          <Lock size={12} />
                          Chờ {othersActions.map((a) => ROLE_LABEL[a.role]).join(" / ")} xử lý
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Không có thao tác</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}