"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTraPhongData } from "@/context/TraPhongDataContext";
import { api, ApiError } from "@/lib/apiClient";
import { formatMaBienBanKiemTra } from "@/lib/maHoSo";
import {
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  FileText,
  User,
  BedDouble,
  Hash,
  Info,
  Plus,
  Trash2,
  Camera,
  ClipboardCheck,
  Wallet,
  ArrowRight,
  Loader2,
} from "lucide-react";

/**
 * UC: "Kiểm tra tình trạng phòng/giường khi trả" (Nhóm 4 – Trả phòng & Hoàn cọc)
 * Actor: Quản lý
 *
 * Trigger: Đến ngày trả phòng đã đăng ký, quản lý mở hồ sơ trả phòng tương ứng
 *          (hồ sơ đang ở trạng thái "Đang xử lý trả phòng") để tiến hành kiểm tra.
 *
 * Dòng sự kiện chính:
 * B1 mở hồ sơ trả phòng → B2 hệ thống hiển thị thông tin HĐ + ds tài sản đã bàn
 * giao (theo biên bản bàn giao ban đầu) → B3 kiểm tra hiện trạng thực tế (tài sản,
 * vệ sinh, hư hỏng phát sinh) → B4 lập biên bản kiểm tra, ghi nhận hiện trạng →
 * B5 đối chiếu nghĩa vụ còn lại (tiền thuê nợ, phí điện nước/dịch vụ nợ, vi phạm
 * nội quy) → B6 xác nhận hoàn tất & tổng hợp → B7 hệ thống lưu biên bản, chuyển
 * thông tin cho kế toán → B8 kết thúc UC.
 *
 * Phụ A3: Phát hiện hư hỏng/mất mát tài sản (tại B3, quay lại B4) → chụp ảnh/ghi
 *         chú, xác định chi phí, hệ thống ghi vào danh sách khấu trừ.
 */

// ─── Types ──────────────────────────────────────────────────────────────────
type ViewState = "queue" | "assets" | "inspect" | "review" | "success";

type QueueItem = {
  maHoSo: string;
  soHopDong: string;
  khachHang: string;
  phongGiuong: string;
  ngayTraPhongDuKien: string;
};

type TaiSan = {
  id: string;
  tenTaiSan: string;
  soLuong: number;
  tinhTrangBanDau: string;
  tinhTrangKhiTra: string;
  soLuongDaTra: string;
  chiPhiBoiThuong: string;
  ghiChu: string;
};

type KhoanKhauTru = {
  id: string;
  loai: string;
  moTa: string;
  soTien: string;
};

type NghiaVuConLai = {
  id: string;
  loai: string;
  soTien: string;
  ghiChu: string;
};

// Shape thô trả về từ GET /api/tra-phong/[maHoSo]/tai-san (TaiSanBanGiaoInfo ở tầng BUS).
type TaiSanApiRaw = { idTaiSanBanGiao: number; tenTaiSan: string; soLuong: number; tinhTrang: string | null };

function mapTaiSan(raw: TaiSanApiRaw): Omit<TaiSan, "tinhTrangKhiTra" | "ghiChu" | "soLuongDaTra" | "chiPhiBoiThuong"> {
  return {
    id: String(raw.idTaiSanBanGiao),
    tenTaiSan: raw.tenTaiSan,
    soLuong: raw.soLuong,
    tinhTrangBanDau: raw.tinhTrang ?? "—",
  };
}

const TINH_TRANG_OPTIONS = ["Tốt", "Hư hỏng nhẹ", "Hư hỏng nặng", "Mất"];
const LOAI_KHAU_TRU_OPTIONS = ["Hư hỏng tài sản", "Vệ sinh", "Mất tài sản", "Khác"];
const LOAI_NGHIA_VU_OPTIONS = ["Tiền thuê còn nợ", "Phí điện nước/dịch vụ còn nợ", "Vi phạm nội quy", "Khác"];

function formatVND(value: string): string {
  const n = Number(value.replace(/[^\d]/g, ""));
  if (!n) return "0 đ";
  return n.toLocaleString("vi-VN") + " đ";
}

function sumVND(items: { soTien: string }[]): string {
  const total = items.reduce((acc, it) => acc + (Number(it.soTien.replace(/[^\d]/g, "")) || 0), 0);
  return total.toLocaleString("vi-VN") + " đ";
}

function hasReachedReturnDate(value: string) {
  const [day, month, year] = value.split("/").map(Number);
  if (!day || !month || !year) return false;
  const returnDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return returnDate <= today;
}

// ─── Stepper ────────────────────────────────────────────────────────────────
const STEPS = ["Thông tin & tài sản", "Kiểm tra hiện trạng", "Xác nhận"];

function KiemTraStepper({ current }: { current: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center max-w-2xl">
        {STEPS.map((label, i) => {
          const step = i + 1;
          const done = step < current;
          const active = step === current;
          return (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                    done
                      ? "bg-teal-500 border-teal-500"
                      : active
                        ? "bg-blue-600 border-blue-600"
                        : "bg-white border-gray-300"
                  }`}
                >
                  {done ? (
                    <CheckCircle size={18} className="text-white" />
                  ) : (
                    <span className={`text-sm font-medium ${active ? "text-white" : "text-gray-400"}`}>
                      {step}
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs mt-1.5 text-center whitespace-nowrap ${
                    done || active ? "text-gray-800 font-medium" : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-3 mb-4 ${done ? "bg-teal-500" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Shared pieces ──────────────────────────────────────────────────────────
function Breadcrumb({ sub }: { sub?: string }) {
  return (
    <div className="flex items-center text-sm text-gray-500 mb-4">
      <span>Trả phòng</span>
      <ChevronRight size={15} className="mx-1.5" />
      <span className={sub ? "text-gray-500" : "text-gray-800 font-medium"}>
        Kiểm tra tình trạng phòng/giường
      </span>
      {sub && (
        <>
          <ChevronRight size={15} className="mx-1.5" />
          <span className="text-gray-800 font-medium">{sub}</span>
        </>
      )}
    </div>
  );
}

function PageTitle() {
  return (
    <h1 className="text-2xl font-bold text-gray-900 mb-6">
      Kiểm tra tình trạng phòng/giường khi trả
    </h1>
  );
}

function Card({
  title,
  children,
  className = "",
  action,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  badge?: { text: string; color: string };
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500 flex items-center gap-1.5">
        <Icon size={13} className="text-gray-400" />
        {label}
      </span>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm font-medium text-gray-800">{value}</span>}
        {badge && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// B1 — Danh sách hồ sơ trả phòng đang chờ kiểm tra
// ═══════════════════════════════════════════════════════════════════════════
function QueueScreen({ items, onOpen }: { items: QueueItem[]; onOpen: (item: QueueItem) => void }) {
  return (
    <div>
      <Breadcrumb />
      <PageTitle />

      <Card title="Hồ sơ trả phòng đang chờ kiểm tra">
        <div className="overflow-x-auto -m-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500 text-xs">
                <th className="px-6 py-3 font-medium">Mã hồ sơ</th>
                <th className="px-6 py-3 font-medium">Số hợp đồng</th>
                <th className="px-6 py-3 font-medium">Khách hàng</th>
                <th className="px-6 py-3 font-medium">Phòng / Giường</th>
                <th className="px-6 py-3 font-medium">Ngày trả phòng dự kiến</th>
                <th className="px-6 py-3 font-medium">Trạng thái</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.maHoSo} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-3.5 font-medium text-gray-800">{item.maHoSo}</td>
                  <td className="px-6 py-3.5 text-gray-600">{item.soHopDong}</td>
                  <td className="px-6 py-3.5 text-gray-600">{item.khachHang}</td>
                  <td className="px-6 py-3.5 text-gray-600">{item.phongGiuong}</td>
                  <td className="px-6 py-3.5 text-gray-600">{item.ngayTraPhongDuKien}</td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                      Đang xử lý trả phòng
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => onOpen(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors ml-auto"
                    >
                      Kiểm tra <ArrowRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// B2 — Thông tin hợp đồng + danh sách tài sản đã bàn giao
// ═══════════════════════════════════════════════════════════════════════════
function AssetsScreen({
  item,
  taiSanList,
  onContinue,
}: {
  item: QueueItem;
  taiSanList: TaiSan[];
  onContinue: () => void;
}) {
  return (
    <div>
      <Breadcrumb />
      <PageTitle />
      <KiemTraStepper current={1} />

      <Card title="Thông tin hồ sơ trả phòng" className="mb-4">
        <div className="grid grid-cols-4 gap-4">
          <InfoRow icon={Hash} label="Mã hồ sơ trả phòng" value={item.maHoSo} />
          <InfoRow icon={FileText} label="Số hợp đồng" value={item.soHopDong} />
          <InfoRow icon={User} label="Khách hàng" value={item.khachHang} />
          <InfoRow icon={BedDouble} label="Phòng / Giường" value={item.phongGiuong} />
        </div>
      </Card>

      <Card title="Danh sách tài sản đã bàn giao (theo biên bản bàn giao ban đầu)" className="mb-4">
        <div className="overflow-x-auto -mx-6 -mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500 text-xs">
                <th className="px-6 py-3 font-medium">Tên tài sản</th>
                <th className="px-6 py-3 font-medium">Số lượng</th>
                <th className="px-6 py-3 font-medium">Tình trạng bàn giao ban đầu</th>
              </tr>
            </thead>
            <tbody>
              {taiSanList.map((ts) => (
                <tr key={ts.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-6 py-3 text-gray-800">{ts.tenTaiSan}</td>
                  <td className="px-6 py-3 text-gray-600">{ts.soLuong}</td>
                  <td className="px-6 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                      {ts.tinhTrangBanDau}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex justify-end">
        <button
          onClick={onContinue}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          Bắt đầu kiểm tra
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// B3-B5 (+A3) — Kiểm tra hiện trạng + lập biên bản + đối chiếu nghĩa vụ còn lại
// ═══════════════════════════════════════════════════════════════════════════
function InspectScreen({
  item,
  taiSanList,
  onTaiSanChange,
  tinhTrangVeSinh,
  onTinhTrangVeSinhChange,
  ghiChuKiemTra,
  onGhiChuKiemTraChange,
  anhHienTrang,
  onAnhHienTrangChange,
  khauTruList,
  onKhauTruChange,
  onAddKhauTru,
  onRemoveKhauTru,
  nghiaVuList,
  onNghiaVuChange,
  onAddNghiaVu,
  onRemoveNghiaVu,
  onBack,
  onContinue,
}: {
  item: QueueItem;
  taiSanList: TaiSan[];
  onTaiSanChange: (id: string, field: "tinhTrangKhiTra" | "ghiChu" | "soLuongDaTra" | "chiPhiBoiThuong", value: string) => void;
  tinhTrangVeSinh: string;
  onTinhTrangVeSinhChange: (v: string) => void;
  ghiChuKiemTra: string;
  onGhiChuKiemTraChange: (v: string) => void;
  anhHienTrang: string | null;
  onAnhHienTrangChange: (v: string | null) => void;
  khauTruList: KhoanKhauTru[];
  onKhauTruChange: (id: string, field: keyof KhoanKhauTru, value: string) => void;
  onAddKhauTru: () => void;
  onRemoveKhauTru: (id: string) => void;
  nghiaVuList: NghiaVuConLai[];
  onNghiaVuChange: (id: string, field: keyof NghiaVuConLai, value: string) => void;
  onAddNghiaVu: () => void;
  onRemoveNghiaVu: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const hasDamage = taiSanList.some(
    (ts) => ts.tinhTrangKhiTra && ts.tinhTrangKhiTra !== "Tốt",
  );
  const anhInputRef = useRef<HTMLInputElement>(null);
  const handleAnhChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onAnhHienTrangChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <Breadcrumb />
      <PageTitle />
      <KiemTraStepper current={2} />

      <Card title="Thông tin hồ sơ trả phòng" className="mb-4">
        <div className="grid grid-cols-4 gap-4">
          <InfoRow icon={Hash} label="Mã hồ sơ trả phòng" value={item.maHoSo} />
          <InfoRow icon={User} label="Khách hàng" value={item.khachHang} />
          <InfoRow icon={BedDouble} label="Phòng / Giường" value={item.phongGiuong} />
        </div>
      </Card>

      {/* Kiểm tra hiện trạng tài sản */}
      <Card title="Kiểm tra hiện trạng tài sản" className="mb-4">
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500 text-xs">
                <th className="px-6 py-3 font-medium">Tên tài sản</th>
                <th className="px-6 py-3 font-medium w-52">Tình trạng khi trả</th>
                <th className="px-6 py-3 font-medium w-28">SL đã trả</th>
                <th className="px-6 py-3 font-medium w-36">Chi phí bồi thường</th>
                <th className="px-6 py-3 font-medium">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {taiSanList.map((ts) => (
                <tr key={ts.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-6 py-3 text-gray-800">
                    {ts.tenTaiSan} <span className="text-gray-400 text-xs">(bàn giao {ts.soLuong})</span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="relative">
                      <select
                        value={ts.tinhTrangKhiTra}
                        onChange={(e) => onTaiSanChange(ts.id, "tinhTrangKhiTra", e.target.value)}
                        className={`w-full border rounded-lg pl-3 pr-8 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          ts.tinhTrangKhiTra && ts.tinhTrangKhiTra !== "Tốt"
                            ? "border-amber-300 text-amber-700 bg-amber-50"
                            : "border-gray-300"
                        }`}
                      >
                        <option value="">Chưa kiểm tra</option>
                        {TINH_TRANG_OPTIONS.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="number"
                      min={0}
                      value={ts.soLuongDaTra}
                      onChange={(e) => onTaiSanChange(ts.id, "soLuongDaTra", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="text"
                      value={ts.chiPhiBoiThuong}
                      onChange={(e) => onTaiSanChange(ts.id, "chiPhiBoiThuong", e.target.value)}
                      placeholder="0 đ"
                      disabled={!ts.tinhTrangKhiTra || ts.tinhTrangKhiTra === "Tốt"}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="text"
                      value={ts.ghiChu}
                      onChange={(e) => onTaiSanChange(ts.id, "ghiChu", e.target.value)}
                      placeholder="Ghi chú (nếu có)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tình trạng vệ sinh chung</label>
            <div className="relative">
              <select
                value={tinhTrangVeSinh}
                onChange={(e) => onTinhTrangVeSinhChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn tình trạng</option>
                <option>Sạch sẽ</option>
                <option>Cần dọn nhẹ</option>
                <option>Cần dọn kỹ / tổng vệ sinh</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hình ảnh hiện trạng <span className="text-gray-400 font-normal">(tùy chọn)</span>
            </label>
            <input
              ref={anhInputRef}
              type="file"
              accept="image/*"
              onChange={handleAnhChange}
              className="hidden"
            />
            <button
              onClick={() => anhInputRef.current?.click()}
              className={`w-full flex items-center justify-center gap-2 border border-dashed rounded-lg px-3 py-2.5 text-sm transition-colors ${
                anhHienTrang
                  ? "border-green-400 bg-green-50 text-green-700"
                  : "border-gray-300 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {anhHienTrang ? <CheckCircle size={16} /> : <Camera size={16} />}
              {anhHienTrang ? "Đã chọn ảnh hiện trạng" : "Tải ảnh lên"}
            </button>
            {anhHienTrang && (
              <img
                src={anhHienTrang}
                alt="Ảnh hiện trạng"
                className="mt-2 h-20 w-20 rounded-lg object-cover border border-gray-200"
              />
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ghi chú kiểm tra <span className="text-gray-400 font-normal">(tùy chọn)</span>
          </label>
          <textarea
            value={ghiChuKiemTra}
            onChange={(e) => onGhiChuKiemTraChange(e.target.value)}
            rows={2}
            placeholder="Mô tả chi tiết hiện trạng phòng/giường..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </Card>

      {/* A3 — Khoản khấu trừ do hư hỏng/mất mát */}
      <Card
        title="Khoản khấu trừ do hư hỏng / mất mát tài sản"
        className="mb-4"
        action={
          <button
            onClick={onAddKhauTru}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            <Plus size={14} /> Thêm khoản khấu trừ
          </button>
        }
      >
        {hasDamage && khauTruList.length === 0 && (
          <div className="flex gap-3 bg-amber-50 border border-amber-300 rounded-lg p-3 mb-4">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Phát hiện tài sản không ở tình trạng &ldquo;Tốt&rdquo; — vui lòng thêm khoản khấu trừ tương ứng
              (chi phí sửa chữa/bồi thường) bên dưới.
            </p>
          </div>
        )}
        {khauTruList.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Chưa có khoản khấu trừ nào.</p>
        ) : (
          <div className="space-y-3">
            {khauTruList.map((kt) => (
              <div key={kt.id} className="grid grid-cols-12 gap-3 items-start">
                <div className="col-span-3 relative">
                  <select
                    value={kt.loai}
                    onChange={(e) => onKhauTruChange(kt.id, "loai", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {LOAI_KHAU_TRU_OPTIONS.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <input
                  type="text"
                  value={kt.moTa}
                  onChange={(e) => onKhauTruChange(kt.id, "moTa", e.target.value)}
                  placeholder="Mô tả (vd: vỡ kính cửa sổ)"
                  className="col-span-6 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={kt.soTien}
                  onChange={(e) => onKhauTruChange(kt.id, "soTien", e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="Số tiền"
                  className="col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => onRemoveKhauTru(kt.id)}
                  className="col-span-1 flex items-center justify-center text-gray-400 hover:text-red-500 py-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <div className="flex justify-end pt-2 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                Tổng khấu trừ: <strong className="text-gray-800">{sumVND(khauTruList)}</strong>
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* B5 — Nghĩa vụ còn lại */}
      <Card
        title="Đối chiếu nghĩa vụ còn lại của khách thuê"
        className="mb-4"
        action={
          <button
            onClick={onAddNghiaVu}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            <Plus size={14} /> Thêm nghĩa vụ
          </button>
        }
      >
        {nghiaVuList.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            Không có nghĩa vụ còn lại nào được ghi nhận (tiền thuê, phí điện nước/dịch vụ, vi phạm
            nội quy...).
          </p>
        ) : (
          <div className="space-y-3">
            {nghiaVuList.map((nv) => (
              <div key={nv.id} className="grid grid-cols-12 gap-3 items-start">
                <div className="col-span-4 relative">
                  <select
                    value={nv.loai}
                    onChange={(e) => onNghiaVuChange(nv.id, "loai", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {LOAI_NGHIA_VU_OPTIONS.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <input
                  type="text"
                  value={nv.ghiChu}
                  onChange={(e) => onNghiaVuChange(nv.id, "ghiChu", e.target.value)}
                  placeholder="Ghi chú"
                  className="col-span-5 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={nv.soTien}
                  onChange={(e) => onNghiaVuChange(nv.id, "soTien", e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="Số tiền còn nợ"
                  className="col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => onRemoveNghiaVu(nv.id)}
                  className="col-span-1 flex items-center justify-center text-gray-400 hover:text-red-500 py-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <div className="flex justify-end pt-2 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                Tổng nghĩa vụ còn lại: <strong className="text-gray-800">{sumVND(nghiaVuList)}</strong>
              </span>
            </div>
          </div>
        )}
      </Card>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
        >
          Quay lại
        </button>
        <button
          onClick={onContinue}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// B6 — Xác nhận hoàn tất & tổng hợp kết quả
// ═══════════════════════════════════════════════════════════════════════════
function ReviewScreen({
  item,
  taiSanList,
  tinhTrangVeSinh,
  ghiChuKiemTra,
  khauTruList,
  nghiaVuList,
  onBack,
  onConfirm,
}: {
  item: QueueItem;
  taiSanList: TaiSan[];
  tinhTrangVeSinh: string;
  ghiChuKiemTra: string;
  khauTruList: KhoanKhauTru[];
  nghiaVuList: NghiaVuConLai[];
  onBack: () => void;
  onConfirm: () => void;
}) {
  const damagedAssets = taiSanList.filter((ts) => ts.tinhTrangKhiTra && ts.tinhTrangKhiTra !== "Tốt");
  const hasDamage = damagedAssets.length > 0;

  return (
    <div>
      <Breadcrumb />
      <PageTitle />
      <KiemTraStepper current={3} />

      <Card title="Thông tin hồ sơ trả phòng" className="mb-4">
        <div className="grid grid-cols-4 gap-4">
          <InfoRow icon={Hash} label="Mã hồ sơ trả phòng" value={item.maHoSo} />
          <InfoRow icon={FileText} label="Số hợp đồng" value={item.soHopDong} />
          <InfoRow icon={User} label="Khách hàng" value={item.khachHang} />
          <InfoRow icon={BedDouble} label="Phòng / Giường" value={item.phongGiuong} />
        </div>
      </Card>

      <Card title="Tổng hợp kết quả kiểm tra" className="mb-4">
        <div className="grid grid-cols-2 gap-x-10 gap-y-4 mb-5">
          <InfoRow
            icon={ClipboardCheck}
            label="Tình trạng hư hỏng"
            value=""
            badge={
              hasDamage
                ? { text: `Có (${damagedAssets.length} tài sản)`, color: "bg-amber-100 text-amber-700" }
                : { text: "Không", color: "bg-green-100 text-green-700" }
            }
          />
          <InfoRow icon={Info} label="Tình trạng vệ sinh" value={tinhTrangVeSinh || "Chưa ghi nhận"} />
        </div>

        {ghiChuKiemTra && (
          <div className="mb-5 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Ghi chú kiểm tra</p>
            <p className="text-sm text-gray-700">{ghiChuKiemTra}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-2">Khoản khấu trừ ({khauTruList.length})</p>
            {khauTruList.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Không có</p>
            ) : (
              <ul className="space-y-1 mb-2">
                {khauTruList.map((kt) => (
                  <li key={kt.id} className="text-sm text-gray-700 flex justify-between">
                    <span>{kt.loai}{kt.moTa ? ` - ${kt.moTa}` : ""}</span>
                    <span className="font-medium">{formatVND(kt.soTien)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="pt-2 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-gray-500">Tổng</span>
              <span className="font-semibold text-gray-800">{sumVND(khauTruList)}</span>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-2">Nghĩa vụ còn lại ({nghiaVuList.length})</p>
            {nghiaVuList.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Không có</p>
            ) : (
              <ul className="space-y-1 mb-2">
                {nghiaVuList.map((nv) => (
                  <li key={nv.id} className="text-sm text-gray-700 flex justify-between">
                    <span>{nv.loai}</span>
                    <span className="font-medium">{formatVND(nv.soTien)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="pt-2 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-gray-500">Tổng</span>
              <span className="font-semibold text-gray-800">{sumVND(nghiaVuList)}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Sau khi xác nhận, biên bản kiểm tra sẽ được lưu và toàn bộ thông tin sẽ tự động chuyển
            cho bộ phận <strong>kế toán</strong> để tính toán đối soát hoàn cọc.
          </p>
        </div>
      </Card>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
        >
          Quay lại
        </button>
        <button
          onClick={onConfirm}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          <CheckCircle size={16} /> Xác nhận hoàn tất kiểm tra
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// B7-B8 — Lưu biên bản, chuyển kế toán, kết thúc UC
// ═══════════════════════════════════════════════════════════════════════════
function SuccessScreen({
  item,
  maBienBanKiemTra,
  khauTruList,
  nghiaVuList,
  onBackToQueue,
  onContinueDoiSoat,
}: {
  item: QueueItem;
  maBienBanKiemTra: string;
  khauTruList: KhoanKhauTru[];
  nghiaVuList: NghiaVuConLai[];
  onBackToQueue: () => void;
  onContinueDoiSoat: () => void;
}) {
  // SỬA: trước đây chỉ cộng khauTruList — bỏ sót nghiaVuList (nghĩa vụ còn lại), trong khi
  // UC3 (đối soát) đòi hỏi Kế toán phải nhập đủ TỔNG của cả 2 khoản này mới được xác nhận.
  // Hiển thị thiếu khiến Quản lý tưởng nhầm số tiền cần chuyển cho kế toán thấp hơn thực tế.
  // Lưu ý: sumVND() trả về CHUỖI đã định dạng ("500.000 đ") — không được nối 2 chuỗi lại,
  // phải cộng số thô của cả 2 danh sách rồi format 1 lần duy nhất.
  const tongSoTho = [...khauTruList, ...nghiaVuList].reduce(
    (acc, it) => acc + (Number(it.soTien.replace(/[^\d]/g, "")) || 0),
    0,
  );
  const tongKhauTruVaNghiaVu = tongSoTho.toLocaleString("vi-VN") + " đ";
  return (
    <div>
      <Breadcrumb sub="Hoàn tất" />
      <PageTitle />
      <KiemTraStepper current={4} />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm max-w-2xl mx-auto px-10 py-10">
        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 rounded-full border-4 border-green-500 flex items-center justify-center">
            <CheckCircle size={44} className="text-green-500" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">
          Lưu biên bản kiểm tra thành công!
        </h2>
        <p className="text-center text-gray-500 text-sm mb-8">
          Thông tin đã được chuyển cho bộ phận kế toán để tính toán đối soát hoàn cọc.
        </p>

        <div className="border border-gray-200 rounded-lg p-6 mb-8">
          <p className="text-sm font-semibold text-gray-700 mb-4">Thông tin biên bản kiểm tra</p>
          <div className="grid grid-cols-2 gap-x-10 gap-y-4">
            <InfoRow icon={Hash} label="Mã biên bản kiểm tra" value={maBienBanKiemTra} />
            <InfoRow icon={FileText} label="Mã hồ sơ trả phòng" value={item.maHoSo} />
            <InfoRow icon={User} label="Khách hàng" value={item.khachHang} />
            <InfoRow icon={BedDouble} label="Phòng / Giường" value={item.phongGiuong} />
            <InfoRow icon={Wallet} label="Tổng khấu trừ & nghĩa vụ ghi nhận" value={tongKhauTruVaNghiaVu} />
            <InfoRow
              icon={ClipboardCheck}
              label="Trạng thái hồ sơ"
              value=""
              badge={{ text: "Đã kiểm tra, chờ đối soát cọc", color: "bg-blue-100 text-blue-700" }}
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onBackToQueue}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            Quay về danh sách
          </button>
          <button
            onClick={onContinueDoiSoat}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Đối soát hoàn cọc ngay
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Root
// ═══════════════════════════════════════════════════════════════════════════
let idCounter = 0;
function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export function KiemTraTinhTrangPhongGiuongPage() {
  const router = useRouter();
  const params = useParams<{ maHoSo?: string }>();
  const maHoSoParam = typeof params?.maHoSo === "string" ? params.maHoSo : undefined;
  const { hoSoList, loading: loadingList, refresh } = useTraPhongData();

  const queueItems: QueueItem[] = hoSoList
    .filter((h) => (h.trangThaiHoSo === "Đã đăng ký, chờ ngày trả phòng" && hasReachedReturnDate(h.ngayTraPhong)) || h.trangThaiHoSo === "Đang xử lý trả phòng")
    .map((h) => ({
      maHoSo: h.maHoSo,
      soHopDong: h.soHopDong,
      khachHang: h.khachHang,
      phongGiuong: h.phongGiuong,
      ngayTraPhongDuKien: h.ngayTraPhong,
    }));

  const [view, setView] = useState<ViewState>("queue");
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [loadingTaiSan, setLoadingTaiSan] = useState(false);
  const [taiSanList, setTaiSanList] = useState<TaiSan[]>([]);
  const [tinhTrangVeSinh, setTinhTrangVeSinh] = useState("");
  const [ghiChuKiemTra, setGhiChuKiemTra] = useState("");
  const [anhHienTrang, setAnhHienTrang] = useState<string | null>(null);
  const [khauTruList, setKhauTruList] = useState<KhoanKhauTru[]>([]);
  const [nghiaVuList, setNghiaVuList] = useState<NghiaVuConLai[]>([]);
  const [bienBanKiemTraId, setBienBanKiemTraId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const openItem = async (item: QueueItem) => {
    setSelectedItem(item);
    setTinhTrangVeSinh("");
    setGhiChuKiemTra("");
    setKhauTruList([]);
    setNghiaVuList([]);
    setBienBanKiemTraId(null);
    setAnhHienTrang(null);
    setSubmitError(null);
    setView("assets");
    setLoadingTaiSan(true);
    try {
      const data = await api.get<TaiSanApiRaw[]>(`/api/tra-phong/${item.maHoSo}/tai-san`);
      setTaiSanList(
        data.map((t) => {
          const mapped = mapTaiSan(t);
          return { ...mapped, tinhTrangKhiTra: "", ghiChu: "", soLuongDaTra: String(mapped.soLuong), chiPhiBoiThuong: "" };
        }),
      );
    } catch {
      setTaiSanList([]);
    } finally {
      setLoadingTaiSan(false);
    }
  };

  // Tự động mở đúng hồ sơ khi được điều hướng tới từ màn khác (URL có :maHoSo)
  useEffect(() => {
    if (!maHoSoParam || selectedItem) return;
    const timer = window.setTimeout(() => {
      const found = queueItems.find((q) => q.maHoSo === maHoSoParam);
      if (found) openItem(found);
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maHoSoParam, loadingList]);

  const updateTaiSan = (id: string, field: "tinhTrangKhiTra" | "ghiChu" | "soLuongDaTra" | "chiPhiBoiThuong", value: string) => {
    setTaiSanList((prev) => prev.map((ts) => (ts.id === id ? { ...ts, [field]: value } : ts)));
  };

  const addKhauTru = () =>
    setKhauTruList((prev) => [...prev, { id: nextId("kt"), loai: LOAI_KHAU_TRU_OPTIONS[0], moTa: "", soTien: "" }]);
  const updateKhauTru = (id: string, field: keyof KhoanKhauTru, value: string) =>
    setKhauTruList((prev) => prev.map((kt) => (kt.id === id ? { ...kt, [field]: value } : kt)));
  const removeKhauTru = (id: string) => setKhauTruList((prev) => prev.filter((kt) => kt.id !== id));

  const addNghiaVu = () =>
    setNghiaVuList((prev) => [...prev, { id: nextId("nv"), loai: LOAI_NGHIA_VU_OPTIONS[0], soTien: "", ghiChu: "" }]);
  const updateNghiaVu = (id: string, field: keyof NghiaVuConLai, value: string) =>
    setNghiaVuList((prev) => prev.map((nv) => (nv.id === id ? { ...nv, [field]: value } : nv)));
  const removeNghiaVu = (id: string) => setNghiaVuList((prev) => prev.filter((nv) => nv.id !== id));

  const finishInspection = async () => {
    if (!selectedItem) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const coHuHong = taiSanList.some((ts) => ts.tinhTrangKhiTra && ts.tinhTrangKhiTra !== "Tốt") || khauTruList.length > 0;
      const bienBan = await api.post<{ bienBanKiemTraId: number }>(
        `/api/tra-phong/${selectedItem.maHoSo}/kiem-tra`,
        {
          tinhTrangVeSinh: tinhTrangVeSinh || undefined,
          ghiChuKiemTra: ghiChuKiemTra || undefined,
          duongDanHinhAnh: anhHienTrang || undefined,
          coHuHong,
          dsChiTietTaiSan: taiSanList.map((ts) => ({
            idTaiSanBanGiao: Number(ts.id),
            soLuongDaTra: Number(ts.soLuongDaTra) || 0,
            tinhTrangKhiTra: ts.tinhTrangKhiTra || "Chưa kiểm tra",
            coHuHongMatMat: !!ts.tinhTrangKhiTra && ts.tinhTrangKhiTra !== "Tốt",
            chiPhiBoiThuong: Number(ts.chiPhiBoiThuong.replace(/[^\d]/g, "")) || 0,
            ghiChu: ts.ghiChu || undefined,
          })),
          dsKhauTru: khauTruList.map((kt) => ({
            loaiKhoanKhauTru: kt.loai,
            moTa: kt.moTa || undefined,
            soTien: Number(kt.soTien.replace(/[^\d]/g, "")) || 0,
          })),
          dsNghiaVu: nghiaVuList.map((nv) => ({
            loaiNghiaVu: nv.loai,
            soTienConNo: Number(nv.soTien.replace(/[^\d]/g, "")) || 0,
            ghiChu: nv.ghiChu || undefined,
          })),
        },
      );
      setBienBanKiemTraId(bienBan.bienBanKiemTraId);
      await refresh();
      setView("success");
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : "Có lỗi xảy ra khi lưu biên bản kiểm tra.");
    } finally {
      setSubmitting(false);
    }
  };

  if (view === "queue") {
    return <QueueScreen items={queueItems} onOpen={openItem} />;
  }

  if (!selectedItem) return null;

  if (view === "assets") {
    if (loadingTaiSan) {
      return (
        <div className="flex items-center justify-center py-24 text-gray-400 text-sm gap-2">
          <Loader2 size={18} className="animate-spin" /> Đang tải danh sách tài sản...
        </div>
      );
    }
    return (
      <AssetsScreen item={selectedItem} taiSanList={taiSanList} onContinue={() => setView("inspect")} />
    );
  }

  if (view === "inspect") {
    return (
      <InspectScreen
        item={selectedItem}
        taiSanList={taiSanList}
        onTaiSanChange={updateTaiSan}
        tinhTrangVeSinh={tinhTrangVeSinh}
        onTinhTrangVeSinhChange={setTinhTrangVeSinh}
        ghiChuKiemTra={ghiChuKiemTra}
        onGhiChuKiemTraChange={setGhiChuKiemTra}
        anhHienTrang={anhHienTrang}
        onAnhHienTrangChange={setAnhHienTrang}
        khauTruList={khauTruList}
        onKhauTruChange={updateKhauTru}
        onAddKhauTru={addKhauTru}
        onRemoveKhauTru={removeKhauTru}
        nghiaVuList={nghiaVuList}
        onNghiaVuChange={updateNghiaVu}
        onAddNghiaVu={addNghiaVu}
        onRemoveNghiaVu={removeNghiaVu}
        onBack={() => setView("assets")}
        onContinue={() => setView("review")}
      />
    );
  }

  if (view === "review") {
    return (
      <>
        <ReviewScreen
          item={selectedItem}
          taiSanList={taiSanList}
          tinhTrangVeSinh={tinhTrangVeSinh}
          ghiChuKiemTra={ghiChuKiemTra}
          khauTruList={khauTruList}
          nghiaVuList={nghiaVuList}
          onBack={() => setView("inspect")}
          onConfirm={finishInspection}
        />
        {submitting && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl px-6 py-4 flex items-center gap-3 shadow-lg">
              <Loader2 size={18} className="animate-spin text-blue-600" />
              <span className="text-sm text-gray-700">Đang lưu biên bản kiểm tra...</span>
            </div>
          </div>
        )}
        {submitError && (
          <div className="fixed bottom-6 right-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3 shadow-lg max-w-sm z-50">
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}
      </>
    );
  }

  return (
    <SuccessScreen
      item={selectedItem}
      maBienBanKiemTra={bienBanKiemTraId != null ? formatMaBienBanKiemTra(bienBanKiemTraId) : "—"}
      khauTruList={khauTruList}
      nghiaVuList={nghiaVuList}
      onBackToQueue={() => router.push("/tra-phong")}
      onContinueDoiSoat={() => router.push(`/tra-phong/doi-soat-hoan-coc/${selectedItem.maHoSo}`)}
    />
  );
}

export default KiemTraTinhTrangPhongGiuongPage;
