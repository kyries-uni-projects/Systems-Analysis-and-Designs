"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTraPhongData } from "@/context/TraPhongDataContext";
import { api, ApiError } from "@/lib/apiClient";
import {
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  User,
  BedDouble,
  Hash,
  Info,
  Plus,
  Trash2,
  Wallet,
  Percent,
  Calendar,
  ArrowRight,
  Loader2,
} from "lucide-react";

/**
 * UC: "Tính toán đối soát hoàn cọc" (Nhóm 4 – Trả phòng & Hoàn cọc)
 * Actor: Kế toán, Quản lý
 *
 * File này ĐỘC LẬP hoàn toàn — không import từ UC1/UC2, có mock data riêng.
 *
 * Dòng sự kiện chính:
 * B1 KT mở hồ sơ + biên bản kiểm tra → B2 hiển thị thông tin HĐ, tiền cọc gốc,
 * ngày lưu trú → B3 KT xác định tỷ lệ hoàn cọc → B4 hệ thống tính tiền cọc hoàn
 * theo tỷ lệ → B5 KT nhập khoản khấu trừ phát sinh → B6 hệ thống tính tiền hoàn
 * thực tế → B7 KT lập bảng đối soát, chuyển QL → B8 QL thông báo KH → B9 QL ghi
 * nhận KH đồng ý → B10 hệ thống cập nhật 'Đã xác nhận đối soát' → B11 kết thúc.
 *
 * Phụ A3: 4 mức tỷ lệ hoàn cọc cơ bản.
 * Phụ A6: khấu trừ > tiền cọc hoàn → yêu cầu khách thanh toán thêm.
 * Phụ A9: khách không đồng ý → điều chỉnh lại (quay B8) hoặc chuyển cấp trên (kết thúc).
 */

// ─── Types ──────────────────────────────────────────────────────────────────
type ViewState =
  | "queue"
  | "rate"
  | "deduction"
  | "settle"
  | "success"
  | "disputed";

type QueueItem = {
  maHoSo: string;
  maBienBanKiemTra: string;
  soHopDong: string;
  khachHang: string;
  phongGiuong: string;
  tienCocGoc: number;
  ngayBatDauLuuTru: string;
  ngayTraPhong: string;
  trangThaiHopDong: "Đang cho thuê" | "Đã hết hạn";
  soThangLuuTru: number;
};

type KhoanKhauTru = {
  id: string;
  loai: string;
  moTa: string;
  soTien: string;
};

// ─── Mock data (độc lập, không phụ thuộc file UC khác) ────────────────────
const RATE_OPTIONS: { value: number; dieuKien: string }[] = [
  {
    value: 80,
    dieuKien:
      "Đã đặt cọc nhưng chưa ký hợp đồng (không đạt điều kiện hoặc khách hủy)",
  },
  {
    value: 50,
    dieuKien:
      "Đã ký hợp đồng, chưa hết hạn, lưu trú dưới 6 tháng",
  },
  {
    value: 70,
    dieuKien:
      "Đã ký hợp đồng, chưa hết hạn, lưu trú trên 6 tháng",
  },
  { value: 100, dieuKien: "Hợp đồng đã hết hạn" },
];

const LOAI_KHAU_TRU_OPTIONS = [
  "Tiền thuê còn nợ",
  "Phí điện nước/dịch vụ còn nợ",
  "Chi phí sửa chữa/bồi thường hư hỏng",
  "Tiền phạt vi phạm nội quy",
  "Khác",
];

function suggestRate(item: QueueItem): number {
  if (item.trangThaiHopDong === "Đã hết hạn") return 100;
  return item.soThangLuuTru >= 6 ? 70 : 50;
}

function formatVND(n: number): string {
  return Math.abs(n).toLocaleString("vi-VN") + " đ";
}

function parseVND(value: string): number {
  return Number(value.replace(/[^\d]/g, "")) || 0;
}

function sumVND(items: { soTien: string }[]): number {
  return items.reduce(
    (acc, it) => acc + parseVND(it.soTien),
    0,
  );
}

let idCounter = 0;
function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

// ─── Stepper ────────────────────────────────────────────────────────────────
const STEPS = [
  "Tỷ lệ hoàn cọc",
  "Khấu trừ phát sinh",
  "Lập phiếu & thông báo KH",
  "Xác nhận",
];

function DoiSoatStepper({ current }: { current: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center max-w-3xl">
        {STEPS.map((label, i) => {
          const step = i + 1;
          const done = step < current;
          const active = step === current;
          return (
            <div
              key={step}
              className="flex items-center flex-1"
            >
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
                    <CheckCircle
                      size={18}
                      className="text-white"
                    />
                  ) : (
                    <span
                      className={`text-sm font-medium ${active ? "text-white" : "text-gray-400"}`}
                    >
                      {step}
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs mt-1.5 text-center whitespace-nowrap ${
                    done || active
                      ? "text-gray-800 font-medium"
                      : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-3 mb-4 ${done ? "bg-teal-500" : "bg-gray-200"}`}
                />
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
      <span
        className={
          sub ? "text-gray-500" : "text-gray-800 font-medium"
        }
      >
        Tính toán đối soát hoàn cọc
      </span>
      {sub && (
        <>
          <ChevronRight size={15} className="mx-1.5" />
          <span className="text-gray-800 font-medium">
            {sub}
          </span>
        </>
      )}
    </div>
  );
}

function PageTitle() {
  return (
    <h1 className="text-2xl font-bold text-gray-900 mb-6">
      Tính toán đối soát hoàn cọc
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
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}
    >
      {title && (
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">
            {title}
          </h2>
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
        {value && (
          <span className="text-sm font-medium text-gray-800">
            {value}
          </span>
        )}
        {badge && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}
          >
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
}

function ActorTag({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <span
      className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium mb-4 ${color}`}
    >
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// B1 — Danh sách hồ sơ chờ đối soát hoàn cọc
// ═══════════════════════════════════════════════════════════════════════════
function QueueScreen({
  items,
  onOpen,
}: {
  items: QueueItem[];
  onOpen: (item: QueueItem) => void;
}) {
  return (
    <div>
      <Breadcrumb />
      <PageTitle />

      <Card title="Hồ sơ đã kiểm tra, chờ đối soát hoàn cọc">
        <div className="overflow-x-auto -m-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500 text-xs">
                <th className="px-6 py-3 font-medium">
                  Mã hồ sơ
                </th>
                <th className="px-6 py-3 font-medium">
                  Mã biên bản kiểm tra
                </th>
                <th className="px-6 py-3 font-medium">
                  Khách hàng
                </th>
                <th className="px-6 py-3 font-medium">
                  Phòng / Giường
                </th>
                <th className="px-6 py-3 font-medium">
                  Tiền cọc gốc
                </th>
                <th className="px-6 py-3 font-medium">
                  Trạng thái
                </th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.maHoSo}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                >
                  <td className="px-6 py-3.5 font-medium text-gray-800">
                    {item.maHoSo}
                  </td>
                  <td className="px-6 py-3.5 text-gray-600">
                    {item.maBienBanKiemTra}
                  </td>
                  <td className="px-6 py-3.5 text-gray-600">
                    {item.khachHang}
                  </td>
                  <td className="px-6 py-3.5 text-gray-600">
                    {item.phongGiuong}
                  </td>
                  <td className="px-6 py-3.5 text-gray-600">
                    {formatVND(item.tienCocGoc)}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                      Đã kiểm tra, chờ đối soát cọc
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => onOpen(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors ml-auto"
                    >
                      Đối soát <ArrowRight size={13} />
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
// B2-B4 (+A3) — Thông tin hợp đồng & xác định tỷ lệ hoàn cọc
// ═══════════════════════════════════════════════════════════════════════════
function RateScreen({
  item,
  rate,
  onRateChange,
  onContinue,
}: {
  item: QueueItem;
  rate: number;
  onRateChange: (v: number) => void;
  onContinue: () => void;
}) {
  const suggested = suggestRate(item);
  const soTienHoanCoBan = Math.round(
    (item.tienCocGoc * rate) / 100,
  );

  return (
    <div>
      <Breadcrumb />
      <PageTitle />
      <DoiSoatStepper current={1} />
      <ActorTag
        label="Kế toán thực hiện"
        color="bg-teal-100 text-teal-700"
      />

      <Card title="Thông tin hợp đồng" className="mb-4">
        <div className="grid grid-cols-3 gap-x-8 gap-y-4">
          <InfoRow
            icon={Hash}
            label="Số hợp đồng"
            value={item.soHopDong}
          />
          <InfoRow
            icon={User}
            label="Khách hàng"
            value={item.khachHang}
          />
          <InfoRow
            icon={BedDouble}
            label="Phòng / Giường"
            value={item.phongGiuong}
          />
          <InfoRow
            icon={Calendar}
            label="Ngày bắt đầu lưu trú"
            value={item.ngayBatDauLuuTru}
          />
          <InfoRow
            icon={Calendar}
            label="Ngày trả phòng"
            value={item.ngayTraPhong}
          />
          <InfoRow
            icon={FileText}
            label="Tình trạng hợp đồng"
            value=""
            badge={
              item.trangThaiHopDong === "Đang cho thuê"
                ? {
                    text: "Đang cho thuê",
                    color: "bg-green-100 text-green-700",
                  }
                : {
                    text: "Đã hết hạn",
                    color: "bg-amber-100 text-amber-700",
                  }
            }
          />
          <InfoRow
            icon={Wallet}
            label="Tiền cọc gốc"
            value={formatVND(item.tienCocGoc)}
          />
          <InfoRow
            icon={Calendar}
            label="Thời gian lưu trú thực tế"
            value={`~${item.soThangLuuTru} tháng`}
          />
        </div>
      </Card>

      <Card
        title="Xác định tỷ lệ hoàn cọc cơ bản"
        className="mb-4"
      >
        <div className="space-y-2.5">
          {RATE_OPTIONS.map((opt) => {
            const active = rate === opt.value;
            const isSuggested = suggested === opt.value;
            return (
              <label
                key={opt.value}
                className={`flex items-start gap-3 border rounded-lg p-3.5 cursor-pointer transition-colors ${
                  active
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="tyle"
                  className="mt-1"
                  checked={active}
                  onChange={() => onRateChange(opt.value)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">
                      {opt.value}%
                    </span>
                    {isSuggested && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium">
                        Gợi ý hệ thống
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {opt.dieuKien}
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Percent size={18} className="text-blue-500" />
            <span className="text-sm text-blue-800">
              Số tiền cọc được hoàn theo tỷ lệ ({rate}%)
            </span>
          </div>
          <span className="text-lg font-bold text-blue-800">
            {formatVND(soTienHoanCoBan)}
          </span>
        </div>
      </Card>

      <div className="flex justify-end">
        <button
          onClick={onContinue}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// B5-B6 (+A6) — Nhập khoản khấu trừ & tính tiền hoàn thực tế
// ═══════════════════════════════════════════════════════════════════════════
function DeductionScreen({
  item,
  rate,
  khauTruList,
  onKhauTruChange,
  onAddKhauTru,
  onRemoveKhauTru,
  onBack,
  onContinue,
}: {
  item: QueueItem;
  rate: number;
  khauTruList: KhoanKhauTru[];
  onKhauTruChange: (
    id: string,
    field: keyof KhoanKhauTru,
    value: string,
  ) => void;
  onAddKhauTru: () => void;
  onRemoveKhauTru: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const soTienHoanCoBan = Math.round(
    (item.tienCocGoc * rate) / 100,
  );
  const tongKhauTru = sumVND(khauTruList);
  const chenhLech = soTienHoanCoBan - tongKhauTru;
  const isThuThem = chenhLech < 0;

  return (
    <div>
      <Breadcrumb />
      <PageTitle />
      <DoiSoatStepper current={2} />
      <ActorTag
        label="Kế toán thực hiện"
        color="bg-teal-100 text-teal-700"
      />

      <Card title="Thông tin hồ sơ" className="mb-4">
        <div className="grid grid-cols-4 gap-4">
          <InfoRow
            icon={Hash}
            label="Mã hồ sơ"
            value={item.maHoSo}
          />
          <InfoRow
            icon={User}
            label="Khách hàng"
            value={item.khachHang}
          />
          <InfoRow
            icon={Wallet}
            label="Tiền cọc được hoàn (theo tỷ lệ)"
            value={formatVND(soTienHoanCoBan)}
          />
          <InfoRow
            icon={Percent}
            label="Tỷ lệ đã chọn"
            value={`${rate}%`}
          />
        </div>
      </Card>

      <Card
        title="Các khoản khấu trừ phát sinh"
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
        {khauTruList.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            Không có khoản khấu trừ nào (tiền thuê còn nợ, phí
            điện nước/dịch vụ, chi phí sửa chữa/bồi thường, tiền
            phạt vi phạm...).
          </p>
        ) : (
          <div className="space-y-3">
            {khauTruList.map((kt) => (
              <div
                key={kt.id}
                className="grid grid-cols-12 gap-3 items-start"
              >
                <div className="col-span-3 relative">
                  <select
                    value={kt.loai}
                    onChange={(e) =>
                      onKhauTruChange(
                        kt.id,
                        "loai",
                        e.target.value,
                      )
                    }
                    className="w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {LOAI_KHAU_TRU_OPTIONS.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
                <input
                  type="text"
                  value={kt.moTa}
                  onChange={(e) =>
                    onKhauTruChange(
                      kt.id,
                      "moTa",
                      e.target.value,
                    )
                  }
                  placeholder="Mô tả chi tiết"
                  className="col-span-6 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={kt.soTien}
                  onChange={(e) =>
                    onKhauTruChange(
                      kt.id,
                      "soTien",
                      e.target.value.replace(/[^\d]/g, ""),
                    )
                  }
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
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tiền cọc được hoàn (theo tỷ lệ)</span>
            <span>{formatVND(soTienHoanCoBan)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tổng khấu trừ</span>
            <span>- {formatVND(tongKhauTru)}</span>
          </div>
        </div>

        {isThuThem ? (
          <div className="mt-4 flex gap-3 bg-red-50 border border-red-300 rounded-lg p-4">
            <AlertCircle
              size={20}
              className="text-red-500 shrink-0 mt-0.5"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700">
                Chi phí khấu trừ lớn hơn số tiền cọc được hoàn
              </p>
              <p className="text-xs text-red-600 mt-0.5 mb-2">
                Khách hàng cần thanh toán thêm khoản chênh lệch
                sau:
              </p>
              <p className="text-xl font-bold text-red-700">
                {formatVND(chenhLech)}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
            <span className="text-sm text-green-800">
              Số tiền hoàn thực tế cho khách hàng
            </span>
            <span className="text-xl font-bold text-green-700">
              {formatVND(chenhLech)}
            </span>
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
          Lập bảng đối soát
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// B7-B9 (+A9) — Bảng đối soát & thông báo khách hàng
// ═══════════════════════════════════════════════════════════════════════════
function SettleScreen({
  item,
  rate,
  khauTruList,
  disputeNote,
  onDisputeNoteChange,
  onBack,
  onAgree,
  onAdjust,
  onEscalate,
}: {
  item: QueueItem;
  rate: number;
  khauTruList: KhoanKhauTru[];
  disputeNote: string;
  onDisputeNoteChange: (v: string) => void;
  onBack: () => void;
  onAgree: () => void;
  onAdjust: () => void;
  onEscalate: () => void;
}) {
  const [khachDongY, setKhachDongY] = useState<
    "chua" | "dong-y" | "khong-dong-y"
  >("chua");
  const soTienHoanCoBan = Math.round(
    (item.tienCocGoc * rate) / 100,
  );
  const tongKhauTru = sumVND(khauTruList);
  const chenhLech = soTienHoanCoBan - tongKhauTru;
  const isThuThem = chenhLech < 0;

  return (
    <div>
      <Breadcrumb />
      <PageTitle />
      <DoiSoatStepper current={3} />

      <ActorTag
        label="Kế toán lập phiếu"
        color="bg-teal-100 text-teal-700"
      />
      <Card
        title="Bảng đối soát / phiếu thanh toán"
        className="mb-4"
      >
        <div className="grid grid-cols-3 gap-x-8 gap-y-4 mb-5">
          <InfoRow
            icon={Hash}
            label="Mã hồ sơ"
            value={item.maHoSo}
          />
          <InfoRow
            icon={User}
            label="Khách hàng"
            value={item.khachHang}
          />
          <InfoRow
            icon={BedDouble}
            label="Phòng / Giường"
            value={item.phongGiuong}
          />
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex justify-between px-4 py-2.5 text-sm bg-gray-50">
            <span className="text-gray-500">Tiền cọc gốc</span>
            <span className="font-medium text-gray-800">
              {formatVND(item.tienCocGoc)}
            </span>
          </div>
          <div className="flex justify-between px-4 py-2.5 text-sm border-t border-gray-100">
            <span className="text-gray-500">
              Tỷ lệ hoàn cọc áp dụng
            </span>
            <span className="font-medium text-gray-800">
              {rate}%
            </span>
          </div>
          <div className="flex justify-between px-4 py-2.5 text-sm border-t border-gray-100">
            <span className="text-gray-500">
              Tiền cọc được hoàn (theo tỷ lệ)
            </span>
            <span className="font-medium text-gray-800">
              {formatVND(soTienHoanCoBan)}
            </span>
          </div>
          {khauTruList.map((kt) => (
            <div
              key={kt.id}
              className="flex justify-between px-4 py-2.5 text-sm border-t border-gray-100"
            >
              <span className="text-gray-500">
                {kt.loai}
                {kt.moTa ? ` - ${kt.moTa}` : ""}
              </span>
              <span className="font-medium text-red-500">
                - {formatVND(parseVND(kt.soTien))}
              </span>
            </div>
          ))}
          <div
            className={`flex justify-between px-4 py-3 text-sm border-t border-gray-200 ${
              isThuThem ? "bg-red-50" : "bg-green-50"
            }`}
          >
            <span
              className={`font-semibold ${isThuThem ? "text-red-700" : "text-green-700"}`}
            >
              {isThuThem
                ? "Số tiền khách cần thanh toán thêm"
                : "Số tiền hoàn thực nhận"}
            </span>
            <span
              className={`font-bold text-lg ${isThuThem ? "text-red-700" : "text-green-700"}`}
            >
              {formatVND(chenhLech)}
            </span>
          </div>
        </div>
      </Card>

      <ActorTag
        label="Quản lý thực hiện"
        color="bg-indigo-100 text-indigo-700"
      />
      <Card
        title="Thông báo kết quả đối soát cho khách hàng"
        className="mb-4"
      >
        <p className="text-sm text-gray-600 mb-4">
          Quản lý thông báo chi tiết từng khoản khấu trừ và số
          tiền {isThuThem ? "cần thanh toán thêm" : "hoàn cọc"}{" "}
          cho khách hàng, sau đó ghi nhận phản hồi bên dưới.
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => setKhachDongY("dong-y")}
            className={`flex-1 flex items-center justify-center gap-2 border rounded-lg py-3 text-sm font-medium transition-colors ${
              khachDongY === "dong-y"
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <CheckCircle size={16} /> Khách hàng đồng ý
          </button>
          <button
            onClick={() => setKhachDongY("khong-dong-y")}
            className={`flex-1 flex items-center justify-center gap-2 border rounded-lg py-3 text-sm font-medium transition-colors ${
              khachDongY === "khong-dong-y"
                ? "border-red-500 bg-red-50 text-red-700"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <XCircle size={16} /> Khách hàng không đồng ý
          </button>
        </div>

        {khachDongY === "khong-dong-y" && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nội dung phản đối của khách hàng
            </label>
            <textarea
              value={disputeNote}
              onChange={(e) =>
                onDisputeNoteChange(e.target.value)
              }
              rows={2}
              placeholder="Ghi nhận lý do khách hàng không đồng ý với kết quả đối soát..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <Info
                size={16}
                className="text-amber-500 shrink-0 mt-0.5"
              />
              <p className="text-xs text-amber-700">
                Trao đổi và cung cấp bằng chứng cụ thể cho từng
                khoản khấu trừ. Nếu hai bên thống nhất → điều
                chỉnh lại bảng đối soát. Nếu không thống nhất →
                chuyển lên cấp trên xử lý.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onAdjust}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Đã thống nhất — điều chỉnh lại bảng đối soát
              </button>
              <button
                onClick={onEscalate}
                disabled={!disputeNote.trim()}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm text-white ${
                  disputeNote.trim()
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                Không thống nhất — chuyển cấp trên
              </button>
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
          onClick={onAgree}
          disabled={khachDongY !== "dong-y"}
          className={`px-6 py-2.5 rounded-lg text-sm text-white ${
            khachDongY === "dong-y"
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          Xác nhận đối soát
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// B10-B11 — Xác nhận đối soát thành công
// ═══════════════════════════════════════════════════════════════════════════
function SuccessScreen({
  item,
  ketQua,
  onBackToQueue,
  onContinueThanhLy,
}: {
  item: QueueItem;
  ketQua: {
    tyLeHoanCoc: number;
    soTienHoanThucNhan: number;
    soTienCanThuThem: number;
  };
  onBackToQueue: () => void;
  onContinueThanhLy: () => void;
}) {
  // Dùng đúng kết quả server đã lưu (bảng DoiSoatHoanCoc), không tính lại từ state client —
  // tránh lệch nếu BUS làm tròn/tính khác đi so với client trong tương lai.
  const chenhLech = ketQua.soTienCanThuThem > 0 ? -ketQua.soTienCanThuThem : ketQua.soTienHoanThucNhan;
  const isThuThem = chenhLech < 0;

  return (
    <div>
      <Breadcrumb sub="Hoàn tất" />
      <PageTitle />
      <DoiSoatStepper current={4} />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm max-w-2xl mx-auto px-10 py-10">
        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 rounded-full border-4 border-green-500 flex items-center justify-center">
            <CheckCircle size={44} className="text-green-500" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">
          Xác nhận đối soát thành công!
        </h2>
        <p className="text-center text-gray-500 text-sm mb-8">
          Khách hàng đã đồng ý với kết quả đối soát. Hồ sơ sẵn
          sàng cho bước lập biên bản trả phòng & thanh lý hợp
          đồng.
        </p>

        <div className="border border-gray-200 rounded-lg p-6 mb-8">
          <p className="text-sm font-semibold text-gray-700 mb-4">
            Kết quả đối soát
          </p>
          <div className="grid grid-cols-2 gap-x-10 gap-y-4">
            <InfoRow
              icon={Hash}
              label="Mã hồ sơ trả phòng"
              value={item.maHoSo}
            />
            <InfoRow
              icon={User}
              label="Khách hàng"
              value={item.khachHang}
            />
            <InfoRow
              icon={Percent}
              label="Tỷ lệ hoàn cọc áp dụng"
              value={`${ketQua.tyLeHoanCoc}%`}
            />
            <InfoRow
              icon={Wallet}
              label={
                isThuThem
                  ? "Số tiền cần thanh toán thêm"
                  : "Số tiền hoàn thực nhận"
              }
              value={formatVND(chenhLech)}
            />
            <InfoRow
              icon={CheckCircle}
              label="Trạng thái hồ sơ"
              value=""
              badge={{
                text: "Đã xác nhận đối soát",
                color: "bg-blue-100 text-blue-700",
              }}
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
            onClick={onContinueThanhLy}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Lập biên bản thanh lý ngay
          </button>
        </div>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// A9 (nhánh không thống nhất) — Chuyển cấp trên, kết thúc UC
// ═══════════════════════════════════════════════════════════════════════════
function DisputedScreen({
  item,
  onBackToQueue,
}: {
  item: QueueItem;
  onBackToQueue: () => void;
}) {
  return (
    <div>
      <Breadcrumb sub="Chuyển cấp trên" />
      <PageTitle />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm max-w-2xl mx-auto px-10 py-10">
        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 rounded-full border-4 border-amber-400 flex items-center justify-center">
            <AlertTriangle
              size={40}
              className="text-amber-500"
            />
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">
          Đã chuyển lên cấp trên xử lý
        </h2>
        <p className="text-center text-gray-500 text-sm mb-8">
          Khách hàng và quản lý không thống nhất được kết quả
          đối soát. Use-case kết thúc, chờ giải quyết tranh chấp
          từ cấp trên.
        </p>

        <div className="border border-gray-200 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-2 gap-x-10 gap-y-4">
            <InfoRow
              icon={Hash}
              label="Mã hồ sơ trả phòng"
              value={item.maHoSo}
            />
            <InfoRow
              icon={User}
              label="Khách hàng"
              value={item.khachHang}
            />
            <InfoRow
              icon={AlertTriangle}
              label="Trạng thái hồ sơ"
              value=""
              badge={{
                text: "Chờ giải quyết tranh chấp",
                color: "bg-amber-100 text-amber-700",
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-center">
          <button
            onClick={onBackToQueue}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Quay về danh sách
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Root
// ═══════════════════════════════════════════════════════════════════════════
export function TinhToanDoiSoatHoanCocPage() {
  const router = useRouter();
  const params = useParams<{ maHoSo?: string }>();
  const maHoSoParam = typeof params?.maHoSo === "string" ? params.maHoSo : undefined;
  const { hoSoList, loading: loadingList, refresh } = useTraPhongData();

  const queueItems: QueueItem[] = hoSoList
    .filter((h) => h.trangThaiHoSo === "Đã kiểm tra, chờ đối soát cọc")
    .map((h) => ({
      maHoSo: h.maHoSo,
      maBienBanKiemTra: h.maBienBanKiemTra ?? "—",
      soHopDong: h.soHopDong,
      khachHang: h.khachHang,
      phongGiuong: h.phongGiuong,
      tienCocGoc: h.tienCocGoc,
      ngayBatDauLuuTru: h.ngayBatDauLuuTru,
      ngayTraPhong: h.ngayTraPhong,
      trangThaiHopDong: (h.trangThaiHopDong === "Đã thanh lý" ? "Đã hết hạn" : h.trangThaiHopDong) as
        | "Đang cho thuê"
        | "Đã hết hạn",
      soThangLuuTru: h.soThangLuuTru,
    }));

  const [view, setView] = useState<ViewState>("queue");
  const [selectedItem, setSelectedItem] =
    useState<QueueItem | null>(null);
  const [rate, setRate] = useState(50);
  const [, setLoadingKhauTru] = useState(false);
  const [khauTruList, setKhauTruList] = useState<
    KhoanKhauTru[]
  >([]);
  const [disputeNote, setDisputeNote] = useState("");
  const [ketQuaDoiSoat, setKetQuaDoiSoat] = useState<{
    tyLeHoanCoc: number;
    soTienHoanThucNhan: number;
    soTienCanThuThem: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const openItem = async (item: QueueItem) => {
    setSelectedItem(item);
    setRate(suggestRate(item));
    setKhauTruList([]);
    setDisputeNote("");
    setKetQuaDoiSoat(null);
    setSubmitError(null);
    setView("rate");

    // SỬA: trước đây màn "Khấu trừ phát sinh" luôn bắt đầu trống — Kế toán phải tự gõ lại
    // từ đầu, dễ bỏ sót khoản Quản lý đã ghi nhận ở UC2. Giờ tự fetch lại đúng danh sách đó.
    setLoadingKhauTru(true);
    try {
      const raw = await api.get<{ sttKhauTru: number; loaiKhoanKhauTru: string; moTa: string | null; soTien: number }[]>(
        `/api/tra-phong/${item.maHoSo}/khau-tru`,
      );
      setKhauTruList(
        raw.map((kt) => ({
          id: nextId("kt"),
          loai: kt.loaiKhoanKhauTru,
          moTa: kt.moTa ?? "",
          soTien: String(kt.soTien),
        })),
      );
    } catch {
      setKhauTruList([]);
    } finally {
      setLoadingKhauTru(false);
    }
  };

  // Tự động mở đúng hồ sơ khi được điều hướng tới từ UC2 (URL có :maHoSo)
  useEffect(() => {
    if (!maHoSoParam || selectedItem) return;
    const timer = window.setTimeout(() => {
      const found = queueItems.find((q) => q.maHoSo === maHoSoParam);
      if (found) openItem(found);
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maHoSoParam, loadingList]);

  const addKhauTru = () =>
    setKhauTruList((prev) => [
      ...prev,
      {
        id: nextId("kt"),
        loai: LOAI_KHAU_TRU_OPTIONS[0],
        moTa: "",
        soTien: "",
      },
    ]);
  const updateKhauTru = (
    id: string,
    field: keyof KhoanKhauTru,
    value: string,
  ) =>
    setKhauTruList((prev) =>
      prev.map((kt) =>
        kt.id === id ? { ...kt, [field]: value } : kt,
      ),
    );
  const removeKhauTru = (id: string) =>
    setKhauTruList((prev) => prev.filter((kt) => kt.id !== id));

  const agreeAndConfirm = async () => {
    if (!selectedItem) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const doiSoat = await api.post<{ tyLeHoanCoc: number; soTienHoanThucNhan: number; soTienCanThuThem: number }>(
        `/api/tra-phong/${selectedItem.maHoSo}/doi-soat`,
        {
          tyLeHoanCoc: rate,
          dsKhauTru: khauTruList.map((kt) => ({
            loaiKhoanKhauTru: kt.loai,
            moTa: kt.moTa || undefined,
            soTien: Number(kt.soTien.replace(/[^\d]/g, "")) || 0,
          })),
        },
      );
      setKetQuaDoiSoat(doiSoat);
      await refresh();
      setView("success");
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : "Có lỗi xảy ra khi xác nhận đối soát.");
    } finally {
      setSubmitting(false);
    }
  };

  const escalateDispute = async () => {
    if (!selectedItem) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await api.post(`/api/tra-phong/${selectedItem.maHoSo}/doi-soat/tranh-chap`);
      await refresh();
      setView("disputed");
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : "Có lỗi xảy ra khi chuyển cấp trên.");
    } finally {
      setSubmitting(false);
    }
  };

  if (view === "queue") {
    return <QueueScreen items={queueItems} onOpen={openItem} />;
  }

  if (!selectedItem) return null;

  if (view === "rate") {
    return (
      <RateScreen
        item={selectedItem}
        rate={rate}
        onRateChange={setRate}
        onContinue={() => setView("deduction")}
      />
    );
  }

  if (view === "deduction") {
    return (
      <DeductionScreen
        item={selectedItem}
        rate={rate}
        khauTruList={khauTruList}
        onKhauTruChange={updateKhauTru}
        onAddKhauTru={addKhauTru}
        onRemoveKhauTru={removeKhauTru}
        onBack={() => setView("rate")}
        onContinue={() => setView("settle")}
      />
    );
  }

  if (view === "settle") {
    return (
      <>
        <SettleScreen
          item={selectedItem}
          rate={rate}
          khauTruList={khauTruList}
          disputeNote={disputeNote}
          onDisputeNoteChange={setDisputeNote}
          onBack={() => setView("deduction")}
          onAgree={agreeAndConfirm}
          onAdjust={() => setView("deduction")}
          onEscalate={escalateDispute}
        />
        {submitting && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl px-6 py-4 flex items-center gap-3 shadow-lg">
              <Loader2 size={18} className="animate-spin text-blue-600" />
              <span className="text-sm text-gray-700">Đang xử lý...</span>
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

  if (view === "disputed") {
    return (
      <DisputedScreen
        item={selectedItem}
        onBackToQueue={() => router.push("/tra-phong")}
      />
    );
  }

  if (!ketQuaDoiSoat) return null;

  return (
    <SuccessScreen
      item={selectedItem}
      ketQua={ketQuaDoiSoat}
      onBackToQueue={() => router.push("/tra-phong")}
      onContinueThanhLy={() => router.push(`/tra-phong/lap-bien-ban-thanh-ly/${selectedItem.maHoSo}`)}
    />
  );
}

export default TinhToanDoiSoatHoanCocPage;
