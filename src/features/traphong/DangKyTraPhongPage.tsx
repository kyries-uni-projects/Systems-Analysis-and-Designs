"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/apiClient";
import {
  ChevronRight,
  Search,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Clock,
  FileText,
  User,
  BedDouble,
  Hash,
  ChevronDown,
  Info,
  Wallet,
  Loader2,
} from "lucide-react";

/**
 * UC: "Đăng ký trả phòng" (Nhóm 4 – Trả phòng & Hoàn cọc)
 * Actor: Nhân viên (Sale)
 * Include: Kiểm tra tình trạng phòng/giường khi trả (được Quản lý mở riêng
 *          vào đúng ngày trả phòng — KHÔNG include ngay lập tức)
 *
 * Dòng sự kiện chính: B1 hiển thị màn tìm kiếm → B2 tìm hợp đồng → B3 hiển thị
 * thông tin hợp đồng → B4 xác nhận + ghi nhận thời gian trả phòng → B5 tạo hồ sơ,
 * trạng thái "Đã đăng ký, chờ ngày trả phòng" → B6 kết thúc UC.
 *
 * Phụ A2: Không tìm thấy hợp đồng → quay lại B1.
 * Phụ A4: Hợp đồng đã hết hạn theo lịch (rẽ nhánh tại B4) → ghi nhận để tính
 *         tỷ lệ hoàn cọc 100%, quay lại B5.
 */

// ─── Types ──────────────────────────────────────────────────────────────────
type ViewState =
  | "search"
  | "found"
  | "not-found"
  | "record-time"
  | "success";

type HopDongInfo = {
  chiTietHopDongId: number; // khóa thật — cần để tạo hồ sơ trả phòng (YeuCauTraPhong.taoMoi)
  soHopDong: string;
  khachHang: string;
  phongGiuong: string;
  ngayBatDau: string;
  thoiHanThue: string;
  trangThai: "Đang cho thuê" | "Đã hết hạn" | string;
  tienCocGoc: string;
};

// Shape thô trả về từ GET /api/hop-dong/tim-kiem (HopDongInfo ở tầng BUS, số/ngày thật).
type HopDongApiRaw = {
  maHopDong: string;
  chiTietHopDongId: number | null;
  khachHang: string;
  phongGiuong: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  trangThai: string;
  tienCocGoc: number;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

function toDisplayContract(raw: HopDongApiRaw): HopDongInfo | null {
  if (raw.chiTietHopDongId == null) return null; // hợp đồng lỗi dữ liệu, chưa gán phòng nào
  return {
    chiTietHopDongId: raw.chiTietHopDongId,
    soHopDong: raw.maHopDong,
    khachHang: raw.khachHang,
    phongGiuong: raw.phongGiuong,
    ngayBatDau: formatDate(raw.ngayBatDau),
    thoiHanThue: `${formatDate(raw.ngayBatDau)} - ${formatDate(raw.ngayKetThuc)}`,
    trangThai: raw.trangThai,
    tienCocGoc: raw.tienCocGoc.toLocaleString("vi-VN") + " đ",
  };
}

// ─── Stepper ────────────────────────────────────────────────────────────────
const STEPS = [
  "Thông tin hợp đồng",
  "Ghi nhận thời gian",
  "Xác nhận",
];

function TraPhongStepper({ current }: { current: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center max-w-2xl">
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
        Đăng ký trả phòng
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
      Đăng ký trả phòng
    </h1>
  );
}

function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}
    >
      {title && (
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            {title}
          </h2>
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

function NoteCard() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
      <Info
        size={18}
        className="text-blue-500 shrink-0 mt-0.5"
      />
      <div>
        <p className="text-sm font-medium text-blue-800 mb-1">
          Lưu ý
        </p>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>
            Vui lòng kiểm tra thông tin hợp đồng trước khi tiếp
            tục.
          </li>
          <li>
            Chỉ các hợp đồng đang ở trạng thái{" "}
            <strong>"Đang cho thuê"</strong> hoặc{" "}
            <strong>"Đã hết hạn"</strong> mới được phép trả
            phòng.
          </li>
        </ul>
      </div>
    </div>
  );
}

function ContractStatusBadge({
  trangThai,
}: {
  trangThai: HopDongInfo["trangThai"];
}) {
  return trangThai === "Đang cho thuê" ? (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
      Đang cho thuê
    </span>
  ) : (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
      Đã hết hạn
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// B1 — Màn hình tìm kiếm hợp đồng thuê
// ═══════════════════════════════════════════════════════════════════════════
function SearchScreen({
  query,
  onQueryChange,
  sdt,
  onSdtChange,
  hoTen,
  onHoTenChange,
  onSearch,
  loading,
  error,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  sdt: string;
  onSdtChange: (v: string) => void;
  hoTen: string;
  onHoTenChange: (v: string) => void;
  onSearch: () => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div>
      <Breadcrumb />
      <PageTitle />
      <TraPhongStepper current={1} />

      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 mb-4">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Card title="Tìm kiếm hợp đồng" className="mb-4">
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            placeholder="Số hợp đồng"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={onSearch}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Tìm kiếm
          </button>
        </div>

        <div className="border-t border-gray-100 pt-4 mt-2">
          <p className="text-xs text-gray-500 mb-3 font-medium">
            Hoặc lọc theo khách hàng
          </p>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={sdt}
              onChange={(e) => onSdtChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
              placeholder="Số điện thoại"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={hoTen}
              onChange={(e) => onHoTenChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
              placeholder="Họ và tên"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Card>

      <NoteCard />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// B3 — Hiển thị thông tin hợp đồng (tìm thấy)
// ═══════════════════════════════════════════════════════════════════════════
function FoundScreen({
  query,
  contract,
  onContinue,
}: {
  query: string;
  contract: HopDongInfo;
  onContinue: () => void;
}) {
  return (
    <div>
      <Breadcrumb />
      <PageTitle />
      <TraPhongStepper current={1} />

      <Card title="Tìm kiếm hợp đồng" className="mb-4">
        <div className="flex gap-3">
          <input
            type="text"
            defaultValue={query}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
            <Search size={16} /> Tìm kiếm
          </button>
        </div>
      </Card>

      <Card title="Thông tin hợp đồng" className="mb-4">
        <div className="grid grid-cols-2 gap-x-10 gap-y-4">
          <InfoRow
            icon={Hash}
            label="Số hợp đồng"
            value={contract.soHopDong}
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              <FileText size={13} className="text-gray-400" />
              Trạng thái hợp đồng
            </span>
            <ContractStatusBadge
              trangThai={contract.trangThai}
            />
          </div>
          <InfoRow
            icon={User}
            label="Khách hàng"
            value={contract.khachHang}
          />
          <InfoRow
            icon={BedDouble}
            label="Phòng / Giường"
            value={contract.phongGiuong}
          />
          <InfoRow
            icon={Calendar}
            label="Ngày bắt đầu thuê"
            value={contract.ngayBatDau}
          />
          <InfoRow
            icon={Calendar}
            label="Thời hạn thuê"
            value={contract.thoiHanThue}
          />
          <InfoRow
            icon={Wallet}
            label="Tiền cọc gốc"
            value={contract.tienCocGoc}
          />
        </div>

        {contract.trangThai === "Đã hết hạn" && (
          <div className="mt-5 flex gap-3 bg-amber-50 border border-amber-300 rounded-lg p-3">
            <AlertTriangle
              size={18}
              className="text-amber-500 shrink-0 mt-0.5"
            />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Hợp đồng đã hết hạn theo lịch
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Khách hàng sẽ được áp dụng tỷ lệ hoàn cọc 100%
                nếu không có chi phí phát sinh cấn trừ.
              </p>
            </div>
          </div>
        )}

        <div className="mt-5 bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
          <Info
            size={16}
            className="text-blue-500 shrink-0 mt-0.5"
          />
          <p className="text-sm text-blue-700">
            Vui lòng xác nhận thông tin hợp đồng và ghi nhận
            thời gian trả phòng.
          </p>
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
// A2 — Không tìm thấy hợp đồng (quay lại B1)
// ═══════════════════════════════════════════════════════════════════════════
function NotFoundScreen({
  query,
  onSearchAgain,
}: {
  query: string;
  onSearchAgain: () => void;
}) {
  return (
    <div>
      <Breadcrumb />
      <PageTitle />
      <TraPhongStepper current={1} />

      <Card title="Tìm kiếm hợp đồng" className="mb-4">
        <div className="flex gap-3 mb-3">
          <input
            type="text"
            defaultValue={query}
            className="flex-1 border border-red-400 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
          />
          <button
            onClick={onSearchAgain}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            <Search size={16} /> Tìm kiếm
          </button>
        </div>

        <div className="flex gap-3 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <AlertCircle
            size={18}
            className="text-red-500 shrink-0 mt-0.5"
          />
          <div>
            <p className="text-sm font-medium text-red-700">
              Không tìm thấy hợp đồng phù hợp
            </p>
            <p className="text-xs text-red-500 mt-0.5">
              Vui lòng kiểm tra lại thông tin hoặc liên hệ khách
              hàng để xác nhận.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-500 mb-3 font-medium">
            Hoặc lọc theo khách hàng
          </p>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Số điện thoại"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Họ và tên"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Card>
      <NoteCard />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// B4 (+ A4) — Ghi nhận thời gian trả phòng
// ═══════════════════════════════════════════════════════════════════════════
function RecordTimeScreen({
  contract,
  onBack,
  onContinue,
}: {
  contract: HopDongInfo;
  onBack: () => void;
  onContinue: (data: {
    ngay: string;
    gio: string;
    lyDo: string;
  }) => void;
}) {
  const isExpired = contract.trangThai === "Đã hết hạn";
  const [ngay, setNgay] = useState("");
  const [gio, setGio] = useState("");
  const [lyDo, setLyDo] = useState(
    isExpired ? "Hết hạn thuê" : "Chọn lý do",
  );
  const [touched, setTouched] = useState(false);
  const ngayInputRef = useRef<HTMLInputElement>(null);
  const gioInputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().slice(0, 10);
  const ngayError =
    touched && !ngay
      ? "Vui lòng chọn ngày trả phòng"
      : touched && ngay < today
        ? "Ngày trả phòng phải lớn hơn hoặc bằng ngày hiện tại"
        : undefined;
  const gioError =
    touched && !gio ? "Vui lòng chọn giờ trả phòng" : undefined;
  const canContinue = !!ngay && !!gio && ngay >= today;

  const reasons = [
    "Chọn lý do",
    "Hết hạn thuê",
    "Chuyển phòng",
    "Không có nhu cầu tiếp tục thuê",
    "Lý do khác",
  ];

  return (
    <div>
      <Breadcrumb />
      <PageTitle />
      <TraPhongStepper current={2} />

      {isExpired && (
        <div className="flex gap-3 bg-amber-50 border border-amber-300 rounded-xl p-4 mb-4">
          <AlertTriangle
            size={20}
            className="text-amber-500 shrink-0 mt-0.5"
          />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Hợp đồng đã hết hạn theo lịch
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Thông tin này sẽ được lưu vào hồ sơ trả phòng để
              phục vụ tính tỷ lệ hoàn cọc 100%.
            </p>
          </div>
        </div>
      )}

      <Card title="Thông tin hợp đồng" className="mb-4">
        <div className="grid grid-cols-4 gap-4">
          <InfoRow
            icon={Hash}
            label="Số hợp đồng"
            value={contract.soHopDong}
          />
          <InfoRow
            icon={User}
            label="Khách hàng"
            value={contract.khachHang}
          />
          <InfoRow
            icon={BedDouble}
            label="Phòng / Giường"
            value={contract.phongGiuong}
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              <FileText size={13} className="text-gray-400" />
              Trạng thái
            </span>
            <ContractStatusBadge
              trangThai={contract.trangThai}
            />
          </div>
        </div>
      </Card>

      <Card
        title="Ghi nhận thời gian trả phòng"
        className="mb-4"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày trả phòng{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  ref={ngayInputRef}
                  type="date"
                  value={ngay}
                  onChange={(e) => setNgay(e.target.value)}
                  className={`w-full border rounded-lg pl-3 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                    ngayError
                      ? "border-red-400 focus:ring-red-300"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => { try { ngayInputRef.current?.showPicker?.(); } catch {} }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  <Calendar size={16} />
                </button>
              </div>
              {ngayError && (
                <p className="text-xs text-red-500 mt-1">
                  {ngayError}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giờ trả phòng{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  ref={gioInputRef}
                  type="time"
                  value={gio}
                  onChange={(e) => setGio(e.target.value)}
                  className={`w-full border rounded-lg pl-3 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                    gioError
                      ? "border-red-400 focus:ring-red-300"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => { try { gioInputRef.current?.showPicker?.(); } catch {} }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  <Clock size={16} />
                </button>
              </div>
              {gioError && (
                <p className="text-xs text-red-500 mt-1">
                  {gioError}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lý do trả phòng{" "}
              <span className="text-gray-400 font-normal">
                (tùy chọn)
              </span>
            </label>
            <div className="relative">
              <select
                value={lyDo}
                onChange={(e) => setLyDo(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {reasons.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <Info
            size={18}
            className="text-blue-500 shrink-0 mt-0.5"
          />
          <p className="text-sm text-blue-800">
            Sau khi xác nhận, hồ sơ sẽ chuyển sang trạng thái{" "}
            <strong>"Đã đăng ký, chờ ngày trả phòng"</strong>.
            Đến đúng ngày trả phòng, quản lý sẽ mở hồ sơ để kiểm
            tra tình trạng phòng/giường.
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
          onClick={() => {
            setTouched(true);
            if (canContinue) onContinue({ ngay, gio, lyDo });
          }}
          className="px-6 py-2.5 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// B5-B6 — Tạo hồ sơ trả phòng, kết thúc UC
// ═══════════════════════════════════════════════════════════════════════════
function SuccessScreen({
  maHoSo,
  contract,
  timeData,
  onBackToList,
}: {
  maHoSo: string;
  contract: HopDongInfo;
  timeData: { ngay: string; gio: string; lyDo: string };
  onBackToList: () => void;
}) {
  const isExpired = contract.trangThai === "Đã hết hạn";
  const ngayGioHienThi = timeData.ngay
    ? `${timeData.ngay.split("-").reverse().join("/")} – ${timeData.gio || "--:--"}`
    : "--";

  return (
    <div>
      <Breadcrumb sub="Hoàn tất" />
      <PageTitle />
      <TraPhongStepper current={4} />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm max-w-2xl mx-auto px-10 py-10">
        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 rounded-full border-4 border-green-500 flex items-center justify-center">
            <CheckCircle size={44} className="text-green-500" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">
          Đăng ký trả phòng thành công!
        </h2>
        <p className="text-center text-gray-500 text-sm mb-8">
          Hồ sơ trả phòng đã được tạo. Đến ngày trả phòng, quản
          lý sẽ mở hồ sơ để kiểm tra tình trạng phòng/giường.
        </p>

        <div className="border border-gray-200 rounded-lg p-6 mb-8">
          <p className="text-sm font-semibold text-gray-700 mb-4">
            Thông tin hồ sơ trả phòng
          </p>
          <div className="grid grid-cols-2 gap-x-10 gap-y-4">
            <InfoRow
              icon={Hash}
              label="Mã hồ sơ trả phòng"
              value={maHoSo}
            />
            <InfoRow
              icon={FileText}
              label="Số hợp đồng"
              value={contract.soHopDong}
            />
            <InfoRow
              icon={User}
              label="Khách hàng"
              value={contract.khachHang}
            />
            <InfoRow
              icon={BedDouble}
              label="Phòng / Giường"
              value={contract.phongGiuong}
            />
            <InfoRow
              icon={Calendar}
              label="Ngày giờ trả phòng dự kiến"
              value={ngayGioHienThi}
            />
            <InfoRow
              icon={AlertTriangle}
              label="Trạng thái hiện tại"
              value=""
              badge={{
                text: "Đã đăng ký, chờ ngày trả phòng",
                color: "bg-blue-100 text-blue-700",
              }}
            />
            {timeData.lyDo &&
              timeData.lyDo !== "Chọn lý do" && (
                <InfoRow
                  icon={FileText}
                  label="Lý do trả phòng"
                  value={timeData.lyDo}
                />
              )}
            {isExpired && (
              <InfoRow
                icon={Wallet}
                label="Tỷ lệ hoàn cọc dự kiến"
                value=""
                badge={{
                  text: "100% (hợp đồng hết hạn)",
                  color: "bg-amber-100 text-amber-700",
                }}
              />
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onBackToList}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            Quay về danh sách
          </button>
          <button className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            Xem chi tiết hồ sơ
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Root
// ═══════════════════════════════════════════════════════════════════════════
export function DangKyTraPhongPage() {
  const router = useRouter();
  const [view, setView] = useState<ViewState>("search");
  const [query, setQuery] = useState("");
  const [sdt, setSdt] = useState("");
  const [hoTen, setHoTen] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [foundContract, setFoundContract] = useState<HopDongInfo | null>(null);
  const [timeData, setTimeData] = useState({ ngay: "", gio: "", lyDo: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdMaHoSo, setCreatedMaHoSo] = useState("");

  const handleSearch = async () => {
    if (!query.trim() && !sdt.trim() && !hoTen.trim()) {
      setSearchError("Vui lòng nhập ít nhất 1 tiêu chí tìm kiếm.");
      return;
    }
    setSearchError(null);
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("tuKhoa", query.trim());
      if (sdt.trim()) params.set("sdt", sdt.trim());
      if (hoTen.trim()) params.set("hoTen", hoTen.trim());
      const data = await api.get<HopDongApiRaw | null>(`/api/hop-dong/tim-kiem?${params.toString()}`);
      const contract = data ? toDisplayContract(data) : null;
      if (!contract) {
        setView("not-found");
      } else {
        setFoundContract(contract);
        setView("found");
      }
    } catch (e) {
      setSearchError(e instanceof ApiError ? e.message : "Có lỗi xảy ra khi tìm kiếm.");
    } finally {
      setSearching(false);
    }
  };

  const handleCreate = async (data: { ngay: string; gio: string; lyDo: string }) => {
    if (!foundContract) return;
    setTimeData(data);
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await api.post<{ maHoSo: string }>("/api/tra-phong", {
        maHopDong: foundContract.soHopDong,
        ngayTraPhongDuKien: data.ngay,
        gioTraPhong: data.gio || undefined,
        lyDoTraPhong: data.lyDo && data.lyDo !== "Chọn lý do" ? data.lyDo : undefined,
      });
      setCreatedMaHoSo(res.maHoSo);
      setView("success");
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : "Có lỗi xảy ra khi tạo hồ sơ trả phòng.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {view === "search" && (
        <SearchScreen
          query={query}
          onQueryChange={setQuery}
          sdt={sdt}
          onSdtChange={setSdt}
          hoTen={hoTen}
          onHoTenChange={setHoTen}
          onSearch={handleSearch}
          loading={searching}
          error={searchError}
        />
      )}
      {view === "found" && foundContract && (
        <FoundScreen query={query} contract={foundContract} onContinue={() => setView("record-time")} />
      )}
      {view === "not-found" && (
        <NotFoundScreen
          query={query}
          onSearchAgain={() => {
            // A2.3: quay lại B1
            setQuery("");
            setView("search");
          }}
        />
      )}
      {view === "record-time" && foundContract && (
        <RecordTimeScreen
          contract={foundContract}
          onBack={() => setView("found")}
          onContinue={handleCreate}
        />
      )}
      {view === "success" && foundContract && (
        <SuccessScreen
          maHoSo={createdMaHoSo}
          contract={foundContract}
          timeData={timeData}
          onBackToList={() => router.push("/tra-phong")}
        />
      )}
      {submitting && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl px-6 py-4 flex items-center gap-3 shadow-lg">
            <Loader2 size={18} className="animate-spin text-blue-600" />
            <span className="text-sm text-gray-700">Đang tạo hồ sơ trả phòng...</span>
          </div>
        </div>
      )}
      {submitError && (
        <div className="fixed bottom-6 right-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3 shadow-lg max-w-sm z-50">
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}
    </div>
  );
}

export default DangKyTraPhongPage;