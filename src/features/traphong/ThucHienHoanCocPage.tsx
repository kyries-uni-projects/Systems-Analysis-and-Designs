"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTraPhongData } from "@/context/TraPhongDataContext";
import { api, ApiError } from "@/lib/apiClient";
import {
  ChevronRight,
  Calendar,
  CheckCircle,
  FileText,
  User,
  BedDouble,
  Hash,
  Wallet,
  Landmark,
  Banknote,
  Upload,
  ArrowRight,
  Loader2,
} from "lucide-react";

/**
 * UC: "Thực hiện hoàn cọc" (Nhóm 4 – Trả phòng & Hoàn cọc)
 * Actor: Kế toán
 * Được extend bởi: "Lập biên bản trả phòng & thanh lý hợp đồng" (ngay sau B6 của UC đó)
 *
 * File này ĐỘC LẬP hoàn toàn — không import từ UC1/UC2/UC3/UC4, có mock data riêng.
 * Giống pattern UC2: có màn "danh sách chờ hoàn cọc" riêng để kế toán tự mở, không
 * phụ thuộc code của UC4. Trong thực tế, UC4 sẽ dẫn kế toán tới đây bằng dữ liệu
 * (mã hồ sơ), không phải bằng cách nhúng component.
 *
 * Dòng sự kiện chính:
 * B1 hệ thống hiển thị thông tin hoàn cọc (số tiền theo bảng đối soát đã xác nhận)
 * → B2 KT xác nhận phương thức hoàn cọc (tiền mặt/chuyển khoản) → B3 KT thực hiện
 * chi trả → B4 KT ghi nhận giao dịch hoàn cọc (số tiền, phương thức, thời điểm) →
 * B5 hệ thống lưu giao dịch, đánh dấu hoàn tất → B6 kết thúc UC.
 *
 * Phụ A3 (chuyển khoản): nhập TK ngân hàng, tải chứng từ, quay lại B4.
 * Phụ A3b (tiền mặt): lập phiếu chi, tải lên/ghi nhận phiếu chi, quay lại B4.
 */

// ─── Types ──────────────────────────────────────────────────────────────────
type ViewState = "queue" | "confirm" | "success";
type PhuongThuc = "" | "tien-mat" | "chuyen-khoan";

type QueueItem = {
  maHoSo: string;
  soHopDong: string;
  khachHang: string;
  phongGiuong: string;
  soTienHoan: number;
};

function formatVND(n: number): string {
  return n.toLocaleString("vi-VN") + " đ";
}

// ─── Stepper ────────────────────────────────────────────────────────────────
const STEPS = ["Thông tin hoàn cọc", "Xác nhận giao dịch"];

function HoanCocStepper({ current }: { current: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center max-w-md">
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
        Thực hiện hoàn cọc
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
      Thực hiện hoàn cọc
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

// ═══════════════════════════════════════════════════════════════════════════
// B1 — Danh sách hồ sơ chờ hoàn cọc
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
      <Card title="Hồ sơ chờ thực hiện hoàn cọc">
        <div className="overflow-x-auto -m-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500 text-xs">
                <th className="px-6 py-3 font-medium">
                  Mã hồ sơ
                </th>
                <th className="px-6 py-3 font-medium">
                  Khách hàng
                </th>
                <th className="px-6 py-3 font-medium">
                  Phòng / Giường
                </th>
                <th className="px-6 py-3 font-medium">
                  Số tiền hoàn cọc
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
                    {item.khachHang}
                  </td>
                  <td className="px-6 py-3.5 text-gray-600">
                    {item.phongGiuong}
                  </td>
                  <td className="px-6 py-3.5 font-medium text-green-700">
                    {formatVND(item.soTienHoan)}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => onOpen(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors ml-auto"
                    >
                      Thực hiện <ArrowRight size={13} />
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
// B1-B4 (+A3, A3b) — Thông tin hoàn cọc, chọn phương thức, ghi nhận giao dịch
// ═══════════════════════════════════════════════════════════════════════════
function ConfirmScreen({
  item,
  onBack,
  onConfirm,
}: {
  item: QueueItem;
  onBack: () => void;
  onConfirm: (data: {
    phuongThuc: PhuongThuc;
    soTaiKhoan: string;
  }) => void;
}) {
  const [phuongThuc, setPhuongThuc] = useState<PhuongThuc>("");
  const [soTaiKhoan, setSoTaiKhoan] = useState("");
  const [tenNganHang, setTenNganHang] = useState("");
  const [daTaiChungTu, setDaTaiChungTu] = useState(false);
  const [daLapPhieuChi, setDaLapPhieuChi] = useState(false);
  const [ngayThucHien, setNgayThucHien] = useState("");
  const ngayThucHienInputRef = useRef<HTMLInputElement>(null);

  const canConfirm =
    !!phuongThuc &&
    !!ngayThucHien &&
    (phuongThuc === "chuyen-khoan"
      ? !!soTaiKhoan && !!tenNganHang && daTaiChungTu
      : daLapPhieuChi);

  return (
    <div>
      <Breadcrumb />
      <PageTitle />
      <HoanCocStepper current={phuongThuc ? 2 : 1} />

      <Card title="Thông tin hoàn cọc" className="mb-4">
        <div className="grid grid-cols-3 gap-x-8 gap-y-4 mb-5">
          <InfoRow
            icon={Hash}
            label="Mã hồ sơ"
            value={item.maHoSo}
          />
          <InfoRow
            icon={FileText}
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
        </div>
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-green-600" />
            <span className="text-sm text-green-800">
              Số tiền hoàn cọc theo bảng đối soát đã xác nhận
            </span>
          </div>
          <span className="text-lg font-bold text-green-700">
            {formatVND(item.soTienHoan)}
          </span>
        </div>
      </Card>

      <Card
        title="Xác nhận phương thức hoàn cọc"
        className="mb-4"
      >
        <p className="text-sm text-gray-500 mb-4">
          Phương thức đã thỏa thuận với khách hàng:
        </p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={() => setPhuongThuc("tien-mat")}
            className={`flex items-center gap-3 border rounded-lg p-4 text-left transition-colors ${
              phuongThuc === "tien-mat"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Banknote
              size={20}
              className={
                phuongThuc === "tien-mat"
                  ? "text-blue-600"
                  : "text-gray-400"
              }
            />
            <div>
              <p className="text-sm font-medium text-gray-800">
                Tiền mặt
              </p>
              <p className="text-xs text-gray-500">
                Chi trả trực tiếp, lập phiếu chi
              </p>
            </div>
          </button>
          <button
            onClick={() => setPhuongThuc("chuyen-khoan")}
            className={`flex items-center gap-3 border rounded-lg p-4 text-left transition-colors ${
              phuongThuc === "chuyen-khoan"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Landmark
              size={20}
              className={
                phuongThuc === "chuyen-khoan"
                  ? "text-blue-600"
                  : "text-gray-400"
              }
            />
            <div>
              <p className="text-sm font-medium text-gray-800">
                Chuyển khoản
              </p>
              <p className="text-xs text-gray-500">
                Chuyển vào tài khoản ngân hàng khách hàng
              </p>
            </div>
          </button>
        </div>

        {phuongThuc === "chuyen-khoan" && (
          <div className="border-t border-gray-100 pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngân hàng{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tenNganHang}
                  onChange={(e) =>
                    setTenNganHang(e.target.value)
                  }
                  placeholder="VD: Vietcombank"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số tài khoản nhận{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={soTaiKhoan}
                  onChange={(e) =>
                    setSoTaiKhoan(
                      e.target.value.replace(/[^\d]/g, ""),
                    )
                  }
                  placeholder="Số tài khoản của khách hàng"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={() => setDaTaiChungTu(true)}
              className={`w-full flex items-center justify-center gap-2 border border-dashed rounded-lg px-3 py-3 text-sm transition-colors ${
                daTaiChungTu
                  ? "border-green-400 bg-green-50 text-green-700"
                  : "border-gray-300 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {daTaiChungTu ? (
                <CheckCircle size={16} />
              ) : (
                <Upload size={16} />
              )}
              {daTaiChungTu
                ? "Đã tải chứng từ chuyển khoản"
                : "Tải lên chứng từ chuyển khoản"}
            </button>
          </div>
        )}

        {phuongThuc === "tien-mat" && (
          <div className="border-t border-gray-100 pt-4">
            <button
              onClick={() => setDaLapPhieuChi(true)}
              className={`w-full flex items-center justify-center gap-2 border border-dashed rounded-lg px-3 py-3 text-sm transition-colors ${
                daLapPhieuChi
                  ? "border-green-400 bg-green-50 text-green-700"
                  : "border-gray-300 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {daLapPhieuChi ? (
                <CheckCircle size={16} />
              ) : (
                <Upload size={16} />
              )}
              {daLapPhieuChi
                ? "Đã lập & ghi nhận phiếu chi"
                : "Lập phiếu chi & ghi nhận"}
            </button>
          </div>
        )}

        {phuongThuc && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thời điểm thực hiện{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                ref={ngayThucHienInputRef}
                type="datetime-local"
                value={ngayThucHien}
                onChange={(e) =>
                  setNgayThucHien(e.target.value)
                }
                className="w-full border border-gray-300 rounded-lg pl-3 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => { try { ngayThucHienInputRef.current?.showPicker?.(); } catch {} }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                <Calendar size={16} />
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
          onClick={() => onConfirm({ phuongThuc, soTaiKhoan })}
          disabled={!canConfirm}
          className={`px-6 py-2.5 rounded-lg text-sm text-white ${
            canConfirm
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          Ghi nhận giao dịch hoàn cọc
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// B5-B6 — Lưu giao dịch, kết thúc UC
// ═══════════════════════════════════════════════════════════════════════════
function SuccessScreen({
  item,
  phuongThuc,
  onBackToThanhLy,
  onBackToQueue,
}: {
  item: QueueItem;
  phuongThuc: PhuongThuc;
  onBackToThanhLy: () => void;
  onBackToQueue: () => void;
}) {
  return (
    <div>
      <Breadcrumb sub="Hoàn tất" />
      <PageTitle />
      <HoanCocStepper current={3} />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm max-w-2xl mx-auto px-10 py-10">
        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 rounded-full border-4 border-green-500 flex items-center justify-center">
            <CheckCircle size={44} className="text-green-500" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">
          Hoàn cọc thành công!
        </h2>
        <p className="text-center text-gray-500 text-sm mb-8">
          Giao dịch hoàn cọc đã được ghi nhận. Bấm nút bên dưới
          để quay lại UC "Lập biên bản trả phòng & thanh lý hợp
          đồng" và tiếp tục thu hồi chìa khóa, cập nhật trạng
          thái phòng/giường.
        </p>

        <div className="border border-gray-200 rounded-lg p-6 mb-8">
          <p className="text-sm font-semibold text-gray-700 mb-4">
            Thông tin giao dịch hoàn cọc
          </p>
          <div className="grid grid-cols-2 gap-x-10 gap-y-4">
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
              label="Số tiền đã hoàn"
              value={formatVND(item.soTienHoan)}
            />
            <InfoRow
              icon={
                phuongThuc === "tien-mat" ? Banknote : Landmark
              }
              label="Phương thức"
              value={
                phuongThuc === "tien-mat"
                  ? "Tiền mặt"
                  : "Chuyển khoản"
              }
            />
            <InfoRow
              icon={CheckCircle}
              label="Trạng thái giao dịch"
              value=""
              badge={{
                text: "Hoàn tất",
                color: "bg-green-100 text-green-700",
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
            onClick={onBackToThanhLy}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Quay lại biên bản thanh lý
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Root
// ═══════════════════════════════════════════════════════════════════════════
export function ThucHienHoanCocPage() {
  const router = useRouter();
  const params = useParams<{ maHoSo?: string }>();
  const maHoSoParam = typeof params?.maHoSo === "string" ? params.maHoSo : undefined;
  const { hoSoList, loading: loadingList, refresh } = useTraPhongData();

  const queueItems: QueueItem[] = hoSoList
    .filter(
      (h) =>
        h.trangThaiHoSo === "Đã xác nhận đối soát" &&
        (h.soTienHoan ?? 0) > 0 &&
        !h.daHoanCoc,
    )
    .map((h) => ({
      maHoSo: h.maHoSo,
      soHopDong: h.soHopDong,
      khachHang: h.khachHang,
      phongGiuong: h.phongGiuong,
      soTienHoan: h.soTienHoan ?? 0,
    }));

  const [view, setView] = useState<ViewState>("queue");
  const [selectedItem, setSelectedItem] =
    useState<QueueItem | null>(null);
  const [phuongThuc, setPhuongThuc] = useState<PhuongThuc>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const openItem = (item: QueueItem) => {
    setSelectedItem(item);
    setPhuongThuc("");
    setSubmitError(null);
    setView("confirm");
  };

  // Tự động mở đúng hồ sơ khi được điều hướng tới từ UC4 (URL có :maHoSo)
  useEffect(() => {
    if (maHoSoParam && !selectedItem) {
      const found = queueItems.find(
        (q) => q.maHoSo === maHoSoParam,
      );
      if (found) openItem(found);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maHoSoParam, loadingList]);

  if (view === "queue") {
    return <QueueScreen items={queueItems} onOpen={openItem} />;
  }

  if (!selectedItem) return null;

  if (view === "confirm") {
    const handleConfirm = async (data: { phuongThuc: PhuongThuc; soTaiKhoan: string }) => {
      setSubmitError(null);
      setSubmitting(true);
      try {
        await api.post(`/api/tra-phong/${selectedItem.maHoSo}/hoan-coc`, {
          phuongThucHoan: data.phuongThuc === "chuyen-khoan" ? "Chuyển khoản" : "Tiền mặt",
          soTaiKhoanNhan: data.soTaiKhoan || undefined,
        });
        setPhuongThuc(data.phuongThuc);
        await refresh();
        setView("success");
      } catch (e) {
        setSubmitError(e instanceof ApiError ? e.message : "Có lỗi xảy ra khi ghi nhận giao dịch hoàn cọc.");
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <>
        <ConfirmScreen item={selectedItem} onBack={() => router.push("/tra-phong")} onConfirm={handleConfirm} />
        {submitting && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl px-6 py-4 flex items-center gap-3 shadow-lg">
              <Loader2 size={18} className="animate-spin text-blue-600" />
              <span className="text-sm text-gray-700">Đang ghi nhận giao dịch...</span>
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
      phuongThuc={phuongThuc}
      onBackToThanhLy={() =>
        router.push(`/tra-phong/lap-bien-ban-thanh-ly/${selectedItem.maHoSo}`)
      }
      onBackToQueue={() => router.push("/tra-phong")}
    />
  );
}

export default ThucHienHoanCocPage;