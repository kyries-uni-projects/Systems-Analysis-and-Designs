"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTraPhongData } from "@/context/TraPhongDataContext";
import { api, ApiError } from "@/lib/apiClient";
import {
  ChevronRight,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  User,
  BedDouble,
  Hash,
  Info,
  Wallet,
  Key,
  PenLine,
  ArrowRight,
  Percent,
  Loader2,
} from "lucide-react";

/**
 * UC: "Lập biên bản trả phòng & thanh lý hợp đồng" (Nhóm 4 – Trả phòng & Hoàn cọc)
 * Actor: Quản lý, Kế toán
 *
 * File này ĐỘC LẬP hoàn toàn — không import từ UC1/UC2/UC3/UC5, có mock data riêng.
 *
 * QUAN TRỌNG về ranh giới với UC5 (Thực hiện hoàn cọc, <<extend>> tại B7):
 * Màn "Hoàn cọc" ở đây CHỈ là một điểm chuyển giao (checkpoint) — hiển thị tóm tắt
 * số tiền cần hoàn và một xác nhận "đã hoàn cọc xong", KHÔNG nhúng lại toàn bộ giao
 * diện chi tiết của UC5 (chọn phương thức, nhập số tài khoản, tải chứng từ...).
 * Điều đó được thiết kế đầy đủ trong file riêng KiemTraTinhTrangPhongGiuongPage-
 * style flow của UC5. Nhờ vậy 2 file không phụ thuộc code lẫn nhau.
 *
 * Dòng sự kiện chính:
 * B1 QL mở hồ sơ đã xác nhận đối soát → B2 hiển thị bảng đối soát + thông tin HĐ →
 * B3 QL kiểm tra KH đã thanh toán đủ khoản phát sinh (+A3) → B4 QL lập biên bản
 * trả phòng (ngày trả, tình trạng thực tế) → B5 hướng dẫn KH ký (+A5) → B6 QL ký
 * xác nhận, lưu biên bản + thanh lý HĐ (HĐ → 'Đã thanh lý') → B7 thực hiện UC
 * 'Thực hiện hoàn cọc' (extend, +A7) → B8 QL thu hồi chìa khóa/thẻ → B9 hệ thống
 * cập nhật bàn giao tài sản, phòng/giường → 'Trống', hồ sơ → 'Hoàn tất' → B10 gửi
 * xác nhận cho KH → B11 kết thúc UC.
 */

// ─── Types ──────────────────────────────────────────────────────────────────
type ViewState = "queue" | "payment" | "handover" | "refund" | "collect" | "success" | "refused";

type QueueItem = {
  maHoSo: string;
  soHopDong: string;
  khachHang: string;
  phongGiuong: string;
  tienCocGoc: number;
  tyLeHoanCoc: number;
  // dương = số tiền hoàn cho khách; âm = số tiền khách cần đóng thêm
  soTienHoan: number;
};

function formatVND(n: number): string {
  return Math.abs(n).toLocaleString("vi-VN") + " đ";
}

// ─── Stepper ────────────────────────────────────────────────────────────────
const STEPS = ["Xác nhận thanh toán", "Lập biên bản & ký thanh lý", "Hoàn cọc", "Thu hồi & hoàn tất"];

function ThanhLyStepper({ current }: { current: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center max-w-3xl">
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
        Lập biên bản trả phòng & thanh lý HĐ
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
      Lập biên bản trả phòng & thanh lý hợp đồng
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
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">{title}</h2>
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

function ActorTag({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium mb-4 ${color}`}>
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// B1 — Danh sách hồ sơ đã xác nhận đối soát, chờ thanh lý
// ═══════════════════════════════════════════════════════════════════════════
function QueueScreen({ items, onOpen }: { items: QueueItem[]; onOpen: (item: QueueItem) => void }) {
  return (
    <div>
      <Breadcrumb />
      <PageTitle />
      <Card title="Hồ sơ đã xác nhận đối soát, chờ lập biên bản thanh lý">
        <div className="overflow-x-auto -m-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500 text-xs">
                <th className="px-6 py-3 font-medium">Mã hồ sơ</th>
                <th className="px-6 py-3 font-medium">Khách hàng</th>
                <th className="px-6 py-3 font-medium">Phòng / Giường</th>
                <th className="px-6 py-3 font-medium">Kết quả đối soát</th>
                <th className="px-6 py-3 font-medium">Trạng thái</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.maHoSo} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-3.5 font-medium text-gray-800">{item.maHoSo}</td>
                  <td className="px-6 py-3.5 text-gray-600">{item.khachHang}</td>
                  <td className="px-6 py-3.5 text-gray-600">{item.phongGiuong}</td>
                  <td className="px-6 py-3.5">
                    {item.soTienHoan >= 0 ? (
                      <span className="text-green-700">Hoàn {formatVND(item.soTienHoan)}</span>
                    ) : (
                      <span className="text-red-600">Thu thêm {formatVND(item.soTienHoan)}</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                      Đã xác nhận đối soát
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => onOpen(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors ml-auto"
                    >
                      Xử lý <ArrowRight size={13} />
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
// B2-B3 (+A3) — Bảng đối soát & kiểm tra thanh toán khoản phát sinh
// ═══════════════════════════════════════════════════════════════════════════
function PaymentScreen({
  item,
  onBack,
  onContinue,
}: {
  item: QueueItem;
  onBack: () => void;
  onContinue: (paymentConfirmed: boolean) => void;
}) {
  const canThanhToanThem = item.soTienHoan < 0;
  const [daThanhToanDu, setDaThanhToanDu] = useState(!canThanhToanThem);

  return (
    <div>
      <Breadcrumb />
      <PageTitle />
      <ThanhLyStepper current={1} />
      <ActorTag label="Quản lý thực hiện" color="bg-indigo-100 text-indigo-700" />

      <Card title="Kết quả đối soát đã xác nhận" className="mb-4">
        <div className="grid grid-cols-3 gap-x-8 gap-y-4 mb-5">
          <InfoRow icon={Hash} label="Mã hồ sơ" value={item.maHoSo} />
          <InfoRow icon={FileText} label="Số hợp đồng" value={item.soHopDong} />
          <InfoRow icon={User} label="Khách hàng" value={item.khachHang} />
          <InfoRow icon={BedDouble} label="Phòng / Giường" value={item.phongGiuong} />
          <InfoRow icon={Percent} label="Tỷ lệ hoàn cọc" value={`${item.tyLeHoanCoc}%`} />
          <InfoRow icon={Wallet} label="Tiền cọc gốc" value={formatVND(item.tienCocGoc)} />
        </div>

        <div
          className={`flex items-center justify-between rounded-lg p-4 border ${
            item.soTienHoan >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
          }`}
        >
          <span className={`text-sm font-medium ${item.soTienHoan >= 0 ? "text-green-800" : "text-red-700"}`}>
            {item.soTienHoan >= 0 ? "Số tiền hoàn cọc cho khách hàng" : "Số tiền khách hàng cần thanh toán thêm"}
          </span>
          <span className={`text-lg font-bold ${item.soTienHoan >= 0 ? "text-green-700" : "text-red-700"}`}>
            {formatVND(item.soTienHoan)}
          </span>
        </div>
      </Card>

      {canThanhToanThem && (
        <Card title="Kiểm tra thanh toán khoản phát sinh" className="mb-4">
          {!daThanhToanDu ? (
            <div>
              <div className="flex gap-3 bg-amber-50 border border-amber-300 rounded-lg p-4 mb-4">
                <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Khách hàng chưa thanh toán đủ khoản phát sinh
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Danh sách khoản chưa thanh toán: {formatVND(item.soTienHoan)} (chênh lệch từ bảng đối soát).
                    Kế toán hướng dẫn khách hàng hoàn tất thanh toán trước khi tiếp tục.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDaThanhToanDu(true)}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Đánh dấu khách hàng đã thanh toán đủ
              </button>
            </div>
          ) : (
            <div className="flex gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
              <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">Khách hàng đã thanh toán đủ các khoản phát sinh.</p>
            </div>
          )}
        </Card>
      )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
        >
          Quay lại
        </button>
        <button
          onClick={() => onContinue(daThanhToanDu)}
          disabled={!daThanhToanDu}
          className={`px-6 py-2.5 rounded-lg text-sm text-white ${
            daThanhToanDu ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// B4-B6 (+A5) — Lập biên bản trả phòng & ký thanh lý hợp đồng
// ═══════════════════════════════════════════════════════════════════════════
function HandoverScreen({
  item,
  onBack,
  onSigned,
  onRefused,
}: {
  item: QueueItem;
  onBack: () => void;
  onSigned: (data: { ngayTra: string; tinhTrang: string }) => void;
  onRefused: (reason: string) => void;
}) {
  const [ngayTra, setNgayTra] = useState("");
  const [tinhTrang, setTinhTrang] = useState("");
  const ngayTraInputRef = useRef<HTMLInputElement>(null);
  const [khachKy, setKhachKy] = useState<"chua" | "da-ky" | "tu-choi">("chua");
  const [refuseReason, setRefuseReason] = useState("");

  const canSign = !!ngayTra && !!tinhTrang;

  return (
    <div>
      <Breadcrumb />
      <PageTitle />
      <ThanhLyStepper current={2} />
      <ActorTag label="Quản lý thực hiện" color="bg-indigo-100 text-indigo-700" />

      <Card title="Thông tin hồ sơ" className="mb-4">
        <div className="grid grid-cols-3 gap-x-8 gap-y-4">
          <InfoRow icon={Hash} label="Mã hồ sơ" value={item.maHoSo} />
          <InfoRow icon={User} label="Khách hàng" value={item.khachHang} />
          <InfoRow icon={BedDouble} label="Phòng / Giường" value={item.phongGiuong} />
        </div>
      </Card>

      <Card title="Lập biên bản trả phòng" className="mb-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày trả phòng thực tế <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                ref={ngayTraInputRef}
                type="date"
                value={ngayTra}
                onChange={(e) => setNgayTra(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-3 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => { try { ngayTraInputRef.current?.showPicker?.(); } catch {} }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                <Calendar size={16} />
              </button>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tình trạng bàn giao cuối cùng <span className="text-red-500">*</span>
          </label>
          <textarea
            value={tinhTrang}
            onChange={(e) => setTinhTrang(e.target.value)}
            rows={2}
            placeholder="Mô tả tình trạng phòng khi bàn giao lại..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </Card>

      <Card title="Ký xác nhận biên bản trả phòng & thanh lý hợp đồng" className="mb-4">
        <p className="text-sm text-gray-600 mb-4 flex items-center gap-2">
          <PenLine size={16} className="text-gray-400" />
          Hướng dẫn khách hàng ký xác nhận vào biên bản trả phòng và thanh lý hợp đồng.
        </p>

        {khachKy !== "tu-choi" && (
          <div className="flex gap-3">
            <button
              disabled={!canSign}
              onClick={() => setKhachKy("da-ky")}
              className={`flex-1 flex items-center justify-center gap-2 border rounded-lg py-3 text-sm font-medium transition-colors ${
                !canSign
                  ? "border-gray-200 text-gray-300 cursor-not-allowed"
                  : khachKy === "da-ky"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <CheckCircle size={16} /> Khách hàng đã ký xác nhận
            </button>
            <button
              disabled={!canSign}
              onClick={() => setKhachKy("tu-choi")}
              className={`flex-1 flex items-center justify-center gap-2 border rounded-lg py-3 text-sm font-medium transition-colors ${
                !canSign ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <XCircle size={16} /> Khách hàng từ chối ký
            </button>
          </div>
        )}

        {khachKy === "tu-choi" && (
          <div className="border-t border-gray-100 pt-4 mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Lý do từ chối ký</label>
            <textarea
              value={refuseReason}
              onChange={(e) => setRefuseReason(e.target.value)}
              rows={2}
              placeholder="Ghi nhận lý do khách hàng từ chối ký biên bản..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">
                Trường hợp này không quay lại được — vấn đề sẽ được chuyển lên cấp trên xử lý theo
                quy định, Use-Case kết thúc.
              </p>
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
        {khachKy === "tu-choi" ? (
          <button
            onClick={() => onRefused(refuseReason)}
            disabled={!refuseReason.trim()}
            className={`px-6 py-2.5 rounded-lg text-sm text-white ${
              refuseReason.trim() ? "bg-red-600 hover:bg-red-700" : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Chuyển cấp trên xử lý
          </button>
        ) : (
          <button
            onClick={() => onSigned({ ngayTra, tinhTrang })}
            disabled={khachKy !== "da-ky"}
            className={`px-6 py-2.5 rounded-lg text-sm text-white ${
              khachKy === "da-ky" ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Ký xác nhận & lưu (HĐ → Đã thanh lý)
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// B7 (+A7) — Checkpoint hoàn cọc (extend UC "Thực hiện hoàn cọc")
// ═══════════════════════════════════════════════════════════════════════════
function RefundCheckpointScreen({
  item,
  daHoanCoc,
  onBack,
  onContinue,
}: {
  item: QueueItem;
  daHoanCoc: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  const needsRefund = item.soTienHoan > 0;

  return (
    <div>
      <Breadcrumb />
      <PageTitle />
      <ThanhLyStepper current={3} />
      <ActorTag label="Kế toán thực hiện (extend)" color="bg-teal-100 text-teal-700" />

      {needsRefund ? (
        <Card title="Hoàn cọc cho khách hàng" className="mb-4">
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <Wallet size={18} className="text-blue-500" />
              <span className="text-sm text-blue-800">Số tiền cần hoàn cọc theo bảng đối soát</span>
            </div>
            <span className="text-lg font-bold text-blue-800">{formatVND(item.soTienHoan)}</span>
          </div>

          <div className="flex gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
            <Info size={16} className="text-gray-400 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600">
              Đây là điểm kích hoạt UC <strong>&ldquo;Thực hiện hoàn cọc&rdquo;</strong> (extend) — do{" "}
              <strong>Kế toán</strong> tự thực hiện ở màn riêng của họ (không phải Quản lý làm
              thay). Khi Kế toán hoàn tất, bước này sẽ tự động cập nhật để bạn tiếp tục.
            </p>
          </div>

          {daHoanCoc ? (
            <div className="flex items-center gap-3 border border-green-300 bg-green-50 rounded-lg p-3.5">
              <CheckCircle size={18} className="text-green-600" />
              <span className="text-sm text-green-800 font-medium">
                Đã hoàn cọc xong (UC &ldquo;Thực hiện hoàn cọc&rdquo; đã hoàn tất)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 border border-amber-300 bg-amber-50 rounded-lg p-3.5">
              <AlertTriangle size={18} className="text-amber-500" />
              <span className="text-sm text-amber-800 font-medium">
                Đang chờ Kế toán thực hiện hoàn cọc — vui lòng quay lại kiểm tra sau
              </span>
            </div>
          )}
        </Card>
      ) : (
        <Card title="Hoàn cọc cho khách hàng" className="mb-4">
          <div className="flex gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <Info size={18} className="text-gray-400 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600">
              Khách hàng không cần thực hiện hoàn cọc (kết quả đối soát không có số dư hoàn cọc). Bỏ
              qua UC &ldquo;Thực hiện hoàn cọc&rdquo;, tiếp tục các bước còn lại.
            </p>
          </div>
        </Card>
      )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
        >
          Quay lại
        </button>
        <button
          onClick={onContinue}
          disabled={needsRefund && !daHoanCoc}
          className={`px-6 py-2.5 rounded-lg text-sm text-white ${
            !needsRefund || daHoanCoc ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// B8-B10 — Thu hồi chìa khóa, cập nhật phòng trống, hoàn tất
// ═══════════════════════════════════════════════════════════════════════════
function CollectKeysScreen({
  item,
  onBack,
  onFinish,
}: {
  item: QueueItem;
  onBack: () => void;
  onFinish: () => void;
}) {
  const [daThuHoi, setDaThuHoi] = useState(false);

  return (
    <div>
      <Breadcrumb />
      <PageTitle />
      <ThanhLyStepper current={4} />
      <ActorTag label="Quản lý thực hiện" color="bg-indigo-100 text-indigo-700" />

      <Card title="Thu hồi chìa khóa / thẻ ra vào" className="mb-4">
        <label className="flex items-center gap-3 border border-gray-200 rounded-lg p-3.5 cursor-pointer hover:bg-gray-50 mb-5">
          <input
            type="checkbox"
            checked={daThuHoi}
            onChange={(e) => setDaThuHoi(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-700 flex items-center gap-2">
            <Key size={15} className="text-gray-400" />
            Đã thu hồi chìa khóa/thẻ ra vào từ khách hàng
          </span>
        </label>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 mb-2 font-medium">Sau khi xác nhận, hệ thống sẽ tự động:</p>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Đánh dấu đã thu hồi chìa khóa/thẻ ra vào trong biên bản trả phòng</li>
            <li>
              Chuyển trạng thái phòng/giường <strong>{item.phongGiuong}</strong> sang &ldquo;Trống&rdquo;
            </li>
            <li>Chuyển trạng thái hồ sơ trả phòng sang &ldquo;Hoàn tất&rdquo;</li>
            <li>Gửi xác nhận hoàn tất thủ tục trả phòng cho khách hàng</li>
          </ul>
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
          onClick={onFinish}
          disabled={!daThuHoi}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm text-white ${
            daThuHoi ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          <CheckCircle size={16} /> Hoàn tất thủ tục trả phòng
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// B11 — Kết thúc UC thành công
// ═══════════════════════════════════════════════════════════════════════════
function SuccessScreen({ item, onBackToQueue }: { item: QueueItem; onBackToQueue: () => void }) {
  return (
    <div>
      <Breadcrumb sub="Hoàn tất" />
      <PageTitle />
      <ThanhLyStepper current={5} />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm max-w-2xl mx-auto px-10 py-10">
        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 rounded-full border-4 border-green-500 flex items-center justify-center">
            <CheckCircle size={44} className="text-green-500" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">
          Hoàn tất thủ tục trả phòng!
        </h2>
        <p className="text-center text-gray-500 text-sm mb-8">
          Xác nhận hoàn tất thủ tục trả phòng đã được gửi cho khách hàng.
        </p>

        <div className="border border-gray-200 rounded-lg p-6 mb-8">
          <p className="text-sm font-semibold text-gray-700 mb-4">Tổng kết</p>
          <div className="grid grid-cols-2 gap-x-10 gap-y-4">
            <InfoRow icon={Hash} label="Mã hồ sơ trả phòng" value={item.maHoSo} />
            <InfoRow icon={User} label="Khách hàng" value={item.khachHang} />
            <InfoRow icon={FileText} label="Hợp đồng" value="" badge={{ text: "Đã thanh lý", color: "bg-blue-100 text-blue-700" }} />
            <InfoRow icon={BedDouble} label="Phòng / Giường" value="" badge={{ text: "Trống", color: "bg-green-100 text-green-700" }} />
            <InfoRow icon={CheckCircle} label="Trạng thái hồ sơ" value="" badge={{ text: "Hoàn tất", color: "bg-green-100 text-green-700" }} />
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
// A5 — Khách hàng từ chối ký, kết thúc UC (chờ giải quyết tranh chấp)
// ═══════════════════════════════════════════════════════════════════════════
function RefusedScreen({
  item,
  reason,
  onBackToQueue,
}: {
  item: QueueItem;
  reason: string;
  onBackToQueue: () => void;
}) {
  return (
    <div>
      <Breadcrumb sub="Chuyển cấp trên" />
      <PageTitle />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm max-w-2xl mx-auto px-10 py-10">
        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 rounded-full border-4 border-amber-400 flex items-center justify-center">
            <AlertTriangle size={40} className="text-amber-500" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">
          Đã chuyển lên cấp trên xử lý
        </h2>
        <p className="text-center text-gray-500 text-sm mb-6">
          Khách hàng từ chối ký biên bản trả phòng & thanh lý hợp đồng. Use-Case kết thúc, chờ
          giải quyết tranh chấp.
        </p>

        <div className="border border-gray-200 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-2 gap-x-10 gap-y-4 mb-4">
            <InfoRow icon={Hash} label="Mã hồ sơ trả phòng" value={item.maHoSo} />
            <InfoRow icon={User} label="Khách hàng" value={item.khachHang} />
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Lý do từ chối ký</p>
            <p className="text-sm text-gray-700">{reason}</p>
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
export function LapBienBanTraPhongThanhLyPage() {
  const router = useRouter();
  const params = useParams<{ maHoSo?: string }>();
  const maHoSoParam = typeof params?.maHoSo === "string" ? params.maHoSo : undefined;
  const { hoSoList, loading: loadingList, refresh } = useTraPhongData();

  const queueItems: QueueItem[] = hoSoList
    .filter((h) => h.trangThaiHoSo === "Đã xác nhận đối soát")
    .map((h) => ({
      maHoSo: h.maHoSo,
      soHopDong: h.soHopDong,
      khachHang: h.khachHang,
      phongGiuong: h.phongGiuong,
      tienCocGoc: h.tienCocGoc,
      tyLeHoanCoc: h.tyLeHoanCoc ?? 0,
      soTienHoan: h.soTienHoan ?? 0,
    }));

  const [view, setView] = useState<ViewState>("queue");
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [refuseReason, setRefuseReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const liveHoSo = selectedItem ? hoSoList.find((h) => h.maHoSo === selectedItem.maHoSo) : undefined;
  const daHoanCoc = liveHoSo?.daHoanCoc ?? false;

  const openItem = (item: QueueItem) => {
    setSelectedItem(item);
	setPaymentConfirmed(item.soTienHoan >= 0);
    setRefuseReason("");
    setSubmitError(null);
    const hoSo = hoSoList.find((h) => h.maHoSo === item.maHoSo);
    // Nếu HĐ đã ký thanh lý trước đó (đang quay lại từ UC "Thực hiện hoàn cọc"),
    // resume đúng bước thay vì bắt đầu lại từ đầu
    if (hoSo?.trangThaiHopDong === "Đã thanh lý") {
      const needsRefund = (hoSo.soTienHoan ?? 0) > 0;
      setView(needsRefund && !hoSo.daHoanCoc ? "refund" : "collect");
    } else {
      setView("payment");
    }
  };

  // Tự động mở đúng hồ sơ khi được điều hướng tới (URL có :maHoSo)
  useEffect(() => {
    if (!maHoSoParam || selectedItem) return;
    const timer = window.setTimeout(() => {
      const found = queueItems.find((q) => q.maHoSo === maHoSoParam);
      if (found) openItem(found);
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maHoSoParam, loadingList]);

  const handleSigned = async (data: { ngayTra: string; tinhTrang: string }) => {
    if (!selectedItem) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await api.post(`/api/tra-phong/${selectedItem.maHoSo}/thanh-ly`, {
        ngayTraPhongThucTe: data.ngayTra,
        tinhTrangBanGiaoCuoi: data.tinhTrang || undefined,
		daThanhToanPhatSinh: paymentConfirmed,
      });
      await refresh();
      setView("refund");
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : "Có lỗi xảy ra khi lưu biên bản thanh lý.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefused = async (reason: string) => {
    if (!selectedItem) return;
    setRefuseReason(reason);
    setSubmitError(null);
    setSubmitting(true);
    try {
      await api.post(`/api/tra-phong/${selectedItem.maHoSo}/thanh-ly/tu-choi`, { lyDo: reason });
      await refresh();
      setView("refused");
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : "Có lỗi xảy ra.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = async () => {
    if (!selectedItem) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await api.post(`/api/tra-phong/${selectedItem.maHoSo}/hoan-tat`);
      await refresh();
      setView("success");
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : "Có lỗi xảy ra khi hoàn tất thủ tục trả phòng.");
    } finally {
      setSubmitting(false);
    }
  };

  if (view === "queue") {
    return <QueueScreen items={queueItems} onOpen={openItem} />;
  }

  if (!selectedItem) return null;

  const overlay = (
    <>
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

  if (view === "payment") {
    return (
      <PaymentScreen item={selectedItem} onBack={() => setView("queue")} onContinue={(confirmed) => { setPaymentConfirmed(confirmed); setView("handover"); }} />
    );
  }

  if (view === "handover") {
    return (
      <>
        <HandoverScreen
          item={selectedItem}
          onBack={() => setView("payment")}
          onSigned={handleSigned}
          onRefused={handleRefused}
        />
        {overlay}
      </>
    );
  }

  if (view === "refund") {
    return (
      <RefundCheckpointScreen
        item={selectedItem}
        daHoanCoc={daHoanCoc}
        onBack={() => setView("handover")}
        onContinue={() => setView("collect")}
      />
    );
  }

  if (view === "collect") {
    return (
      <>
        <CollectKeysScreen item={selectedItem} onBack={() => setView("refund")} onFinish={handleFinish} />
        {overlay}
      </>
    );
  }

  if (view === "refused") {
    return <RefusedScreen item={selectedItem} reason={refuseReason} onBackToQueue={() => router.push("/tra-phong")} />;
  }

  return <SuccessScreen item={selectedItem} onBackToQueue={() => router.push("/tra-phong")} />;
}

export default LapBienBanTraPhongThanhLyPage;
