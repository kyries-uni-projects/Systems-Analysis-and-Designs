"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/apiClient";
import type {
  BanGiaoPhongDetail,
  BanGiaoPhongListItem,
  KiemTraThongTinDetail,
  KiemTraThongTinListItem,
  LapHopDongDetail,
  LapHopDongListItem,
  LuuBienBanBanGiaoResult,
  LuuKiemTraThongTinResult,
  LuuHopDongResult,
  LuuThanhToanDauKyResult,
  LuuPheDuyetHoSoResult,
  PheDuyetHoSoDetail,
  PheDuyetHoSoListItem,
  ThanhToanDauKyDetail,
  ThanhToanDauKyListItem,
  ThanhToanKhoanThu,
} from "@/types/nhan-phong";
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  DoorOpen,
  LogOut,
  BedDouble,
  HelpCircle,
  Bell,
  Search,
  Calendar,
  ChevronRight,
  X,
  User,
  CreditCard,
  Phone,
  Users,
  Trash2,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileSignature,
  RotateCcw,
  ScrollText,
  Banknote,
  Wifi,
  Car,
  Zap,
  Droplets,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type NhanPhongScreen = "check-in" | "approve-list" | "handover" | "contract" | "payment";
type Screen = NhanPhongScreen;
type MemberStatus = "pending" | "approved" | "rejected";
type DialogType =
  | null
  | "confirm-approve"
  | "confirm-cancel"
  | "mixed-result"
  | "confirm-stop-all"
  | "error"
  | "success-approve"
  | "success-reject";

interface Member {
  id: string;
  name: string;
  cccd: string;
  gender: string;
  phone: string;
  dob: string;
  conditions: { label: string; met: boolean }[];
}

interface Profile {
  id: string;
  code: string;
  customer: string;
  room: string;
  submittedAt: string;
  members: Member[];
}

// ─── Sample data ─────────────────────────────────────────────────────────────

type BookingRecord = KiemTraThongTinListItem;

const SAMPLE_PROFILES: Profile[] = [
  {
    id: "1",
    code: "HS2026-0001",
    customer: "Trần Thị Bình",
    room: "A105 – Giường 2",
    submittedAt: "05/06/2026",
    members: [
      {
        id: "m1",
        name: "Trần Thị Bình",
        cccd: "079201012345",
        gender: "Nữ",
        phone: "0985763421",
        dob: "15/03/2003",
        conditions: [
          { label: "Đủ 18 tuổi", met: true },
          { label: "Không tiền án tiền sự", met: true },
          { label: "Có CCCD hợp lệ", met: true },
        ],
      },
      {
        id: "m2",
        name: "Nguyễn Thị Lan",
        cccd: "079201098765",
        gender: "Nữ",
        phone: "0912345678",
        dob: "22/07/2004",
        conditions: [
          { label: "Đủ 18 tuổi", met: true },
          { label: "Không tiền án tiền sự", met: true },
          { label: "Có CCCD hợp lệ", met: true },
        ],
      },
      {
        id: "m3",
        name: "Lê Văn Dũng",
        cccd: "079201055512",
        gender: "Nam",
        phone: "0978123456",
        dob: "10/01/2000",
        conditions: [
          { label: "Đủ 18 tuổi", met: true },
          { label: "Không tiền án tiền sự", met: false },
          { label: "Có CCCD hợp lệ", met: true },
        ],
      },
    ],
  },
  {
    id: "2",
    code: "HS2026-0002",
    customer: "Phạm Văn Minh",
    room: "B203 – Giường 1",
    submittedAt: "06/06/2026",
    members: [
      {
        id: "m4",
        name: "Phạm Văn Minh",
        cccd: "034201056781",
        gender: "Nam",
        phone: "0934567890",
        dob: "08/11/2002",
        conditions: [
          { label: "Đủ 18 tuổi", met: true },
          { label: "Không tiền án tiền sự", met: true },
          { label: "Có CCCD hợp lệ", met: true },
        ],
      },
    ],
  },
  {
    id: "3",
    code: "HS2026-0003",
    customer: "Hoàng Thị Mai",
    room: "C301 – Giường 4",
    submittedAt: "07/06/2026",
    members: [
      {
        id: "m5",
        name: "Hoàng Thị Mai",
        cccd: "027201088812",
        gender: "Nữ",
        phone: "0965432100",
        dob: "30/09/2003",
        conditions: [
          { label: "Đủ 18 tuổi", met: true },
          { label: "Không tiền án tiền sự", met: true },
          { label: "Có CCCD hợp lệ", met: true },
        ],
      },
      {
        id: "m6",
        name: "Vũ Thị Hoa",
        cccd: "027201077733",
        gender: "Nữ",
        phone: "0901234567",
        dob: "14/02/2005",
        conditions: [
          { label: "Đủ 18 tuổi", met: false },
          { label: "Không tiền án tiền sự", met: true },
          { label: "Có CCCD hợp lệ", met: true },
        ],
      },
    ],
  },
];

// ─── Sidebar ─────────────────────────────────────────────────────────────────

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Tổng quan", id: "overview" },
  { icon: FileText, label: "Đăng ký thuê phòng", id: "register" },
  { icon: CheckSquare, label: "Đặt cọc và xác nhận thuê", id: "deposit" },
  { icon: DoorOpen, label: "Nhận phòng", id: "check-in", hasChildren: true },
  { icon: LogOut, label: "Trả phòng", id: "checkout" },
  { icon: HelpCircle, label: "Trợ giúp", id: "help" },
];

// ─── Shared layout components ────────────────────────────────────────────────

const SUB_SCREENS: { id: Screen; label: string }[] = [
  { id: "check-in",    label: "Kiểm tra thông tin" },
  { id: "approve-list", label: "Phê duyệt hồ sơ" },
  { id: "handover",    label: "Bàn giao phòng" },
  { id: "contract",    label: "Lập hợp đồng" },
  { id: "payment",     label: "Thanh toán đầu kỳ" },
];

const CHECK_IN_SCREENS = new Set<Screen>(["check-in", "approve-list", "handover", "contract", "payment"]);

function Sidebar({ screen, onNavigate }: { screen: Screen; onNavigate: (s: Screen) => void }) {
  const [expanded, setExpanded] = useState<boolean>(() => CHECK_IN_SCREENS.has(screen));

  const isParentActive = CHECK_IN_SCREENS.has(screen);

  return (
    <aside className="w-52 flex-shrink-0 bg-[#2D4F7A] flex flex-col">
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">H</span>
          </div>
          <div>
            <div className="text-white text-sm font-semibold leading-tight">HomeSay Dorm</div>
            <div className="text-white/50 text-[10px]">Quản lý ký túc xá</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {SIDEBAR_ITEMS.map(({ icon: Icon, label, id, hasChildren }) => {
          const isCheckIn = id === "check-in";

          return (
            <div key={id}>
              <button
                onClick={() => {
                  if (isCheckIn) setExpanded((prev) => !prev);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  isCheckIn && isParentActive
                    ? "bg-[#155DFC] text-white font-medium"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={16} />
                <span className="flex-1">{label}</span>
                {hasChildren && (expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
              </button>

              {/* Sub-items under Nhận phòng */}
              {isCheckIn && expanded && (
                <div className="bg-[#243f62] pb-1">
                  {SUB_SCREENS.map(({ id: subId, label: subLabel }) => (
                    <button
                      key={subId}
                      onClick={() => onNavigate(subId)}
                      className={`w-full flex items-center gap-2.5 pl-10 pr-4 py-2 text-left text-xs transition-colors ${
                        screen === subId ? "text-white font-semibold" : "text-white/55 hover:text-white"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
                        screen === subId ? "bg-[#155DFC]" : "bg-white/25"
                      }`} />
                      {subLabel}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function Header() {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <>
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-end px-6 gap-4 flex-shrink-0">
        {/* Bell */}
        <button className="relative p-1.5 text-gray-500 hover:text-gray-700 transition-colors">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-[18px] h-[18px] bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">3</span>
        </button>

        {/* Avatar + name */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
            <User size={18} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800 leading-tight">Phạm Thị Dung</div>
            <div className="text-xs text-gray-400 leading-tight">Nhân Viên Sale</div>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          <LogOut size={15} />
          Đăng xuất
        </button>
      </header>

      {/* Logout confirm dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-5 py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <LogOut size={22} className="text-red-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-800 mb-2">Đăng xuất</h3>
              <p className="text-sm text-gray-500">Bạn có chắc muốn đăng xuất khỏi hệ thống không?</p>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">Hủy</button>
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors">Đăng xuất</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Check-in screen ─────────────────────────────────────────────────────────

function CheckInScreen() {
  const [step, setStep] = useState<"list" | "detail">("list");
  const [selected, setSelected] = useState<BookingRecord | null>(null);
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState<BookingRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadRecords = useCallback(async (keyword = "", options?: { showLoading?: boolean }) => {
    if (options?.showLoading !== false) setIsLoading(true);
    setErrorMessage("");
    try {
      const params = new URLSearchParams();
      if (keyword.trim()) params.set("q", keyword.trim());
      const data = await api.get<{ total: number; items: BookingRecord[] }>(
        `/api/nhan-phong/kiem-tra-thong-tin${params.size ? `?${params.toString()}` : ""}`,
      );
      setRecords(data.items);
      setTotalRecords(data.total);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Không thể tải danh sách hồ sơ chờ nhận phòng.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRecords("", { showLoading: false });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRecords]);

  if (step === "list") {
    return (
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
          <span>Nhận phòng</span>
          <ChevronRight size={12} />
          <span className="text-gray-700">Kiểm tra thông tin nhận phòng</span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-800">Kiểm tra thông tin nhận phòng</h1>
          <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-medium">
            {totalRecords} hồ sơ chờ nhận phòng
          </span>
        </div>

        {/* Search */}
        <div className="mb-5">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm hồ sơ đặt cọc (Mã đặt cọc, tên khách hàng...)"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
            </div>
            <button
              onClick={() => void loadRecords(search)}
              disabled={isLoading}
              className="px-5 py-2 bg-[#155DFC] text-white text-sm font-medium rounded-md hover:bg-[#1250d4] disabled:opacity-60 transition-colors"
            >
              Tìm kiếm
            </button>
          </div>
          {errorMessage && <p className="mt-2 text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={12} />{errorMessage}</p>}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Mã đặt cọc", "Khách hàng", "Lịch hẹn nhận phòng", "Thao tác"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">Đang tải danh sách hồ sơ...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">Không tìm thấy hồ sơ phù hợp</td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-blue-600">{r.code}</td>
                    <td className="px-4 py-3 text-gray-800">{r.customer}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="text-blue-600 font-medium">{r.appointmentTime}</span>
                      <span className="text-gray-400 mx-1">–</span>
                      <span>{r.appointmentDate}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setSelected(r); setStep("detail"); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#155DFC] text-white text-xs font-medium rounded-md hover:bg-[#1250d4] transition-colors"
                      >
                        <DoorOpen size={13} />Chọn &amp; Kiểm tra
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    );
  }

  // ── Detail step ──
  return <CheckInDetail record={selected!} onBack={() => { setStep("list"); setSelected(null); }} />;
}

function CheckInDetail({ record, onBack }: { record: BookingRecord; onBack: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [detail, setDetail] = useState<KiemTraThongTinDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [members, setMembers] = useState<{ id: number; name: string; cccd: string; gender: string; phone: string }[]>([]);
  const [form, setForm] = useState({ name: "", cccd: "", gender: "", phone: "" });
  const [errors, setErrors] = useState<{ name?: string; cccd?: string; gender?: string; phone?: string }>({});
  const [residenceForm, setResidenceForm] = useState({
    ngayBatDauCuTru: record.appointmentDate,
    thoiHanThueThang: 12,
    ghiChu: "",
    daXacMinhGiayTo: true,
  });

  useEffect(() => {
    let alive = true;
    const loadDetail = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const data = await api.get<KiemTraThongTinDetail>(`/api/nhan-phong/kiem-tra-thong-tin/${encodeURIComponent(record.code)}`);
        if (!alive) return;
        setDetail(data);
        setMembers(data.members.map((member, index) => ({ id: index + 1, ...member })));
        setResidenceForm({
          ngayBatDauCuTru: data.ngayBatDauCuTru || data.appointmentDate,
          thoiHanThueThang: data.thoiHanThueThang || 12,
          ghiChu: data.ghiChu,
          daXacMinhGiayTo: data.daXacMinhGiayTo,
        });
      } catch (error) {
        if (alive) setErrorMessage(error instanceof ApiError ? error.message : "Không thể tải chi tiết hồ sơ nhận phòng.");
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    void loadDetail();
    return () => {
      alive = false;
    };
  }, [record.code]);

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Vui lòng nhập họ và tên";
    if (!form.cccd.trim()) e.cccd = "Vui lòng nhập số CCCD";
    else if (!/^\d{12}$/.test(form.cccd.trim())) e.cccd = "Số CCCD phải gồm 12 chữ số";
    else if (record.cccd === form.cccd.trim() || members.some((member) => member.cccd === form.cccd.trim())) e.cccd = "Số CCCD đã tồn tại trong hồ sơ";
    if (!form.gender) e.gender = "Vui lòng chọn giới tính";
    if (!form.phone.trim()) e.phone = "Vui lòng nhập số điện thoại";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = () => {
    if (!validate()) return;
    setMembers((prev) => [...prev, { id: Date.now(), ...form }]);
    setForm({ name: "", cccd: "", gender: "", phone: "" });
    setErrors({});
    setShowModal(false);
  };

  const handleClose = () => {
    setShowModal(false);
    setForm({ name: "", cccd: "", gender: "", phone: "" });
    setErrors({});
  };

  const handleConfirmCancel = () => {
    setMembers([]);
    setForm({ name: "", cccd: "", gender: "", phone: "" });
    setErrors({});
    setShowModal(false);
    setShowCancelConfirm(false);
    onBack();
  };

  const handleSave = async () => {
    setErrorMessage("");
    setIsSaving(true);
    try {
      await api.post<LuuKiemTraThongTinResult>(
        `/api/nhan-phong/kiem-tra-thong-tin/${encodeURIComponent(record.code)}`,
        {
          ...residenceForm,
          members: members.map(({ name, cccd, gender, phone }) => ({ name, cccd, gender, phone })),
        },
      );
      onBack();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Không thể lưu thông tin nhận phòng.");
    } finally {
      setIsSaving(false);
    }
  };

  const display = detail ?? record;

  return (
    <>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
          <span>Nhận phòng</span>
          <ChevronRight size={12} />
          <button onClick={onBack} className="hover:text-orange-500 transition-colors">Kiểm tra thông tin nhận phòng</button>
          <ChevronRight size={12} />
          <span className="text-gray-700">{record.code}</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-800 mb-4">Kiểm tra thông tin nhận phòng</h1>
        {errorMessage && <p className="mb-3 text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={12} />{errorMessage}</p>}
        {isLoading && <div className="bg-white rounded-lg border border-gray-200 p-6 text-sm text-gray-400">Đang tải chi tiết hồ sơ...</div>}

        {!isLoading && <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Thông tin đặt cọc</h3>
            <div className="space-y-2 text-sm">
              {([
                ["Mã đặt cọc", display.code, false, false],
                ["Khách hàng", display.customer, false, false],
                ["Phòng/Giường", display.room, false, false],
                ["Lịch hẹn nhận phòng", `${display.appointmentTime} – ${display.appointmentDate}`, true, false],
                ["Trạng thái", display.status, false, true],
              ] as [string, string, boolean, boolean][]).map(([label, value, isBlue, isGreen]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className={`font-medium ${isBlue ? "text-blue-600" : isGreen ? "text-green-600" : "text-gray-800"}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Đối chiếu giấy tờ tùy thân</h3>
            <div className="space-y-2 text-sm">
              {([
                ["Họ và tên", display.customer],
                ["Số CCCD", display.cccd],
                ["Giới tính", display.gender],
                ["Số điện thoại", display.phone],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-800">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={residenceForm.daXacMinhGiayTo}
                  onChange={(event) => setResidenceForm((prev) => ({ ...prev, daXacMinhGiayTo: event.target.checked }))}
                  className="w-4 h-4 accent-[#155DFC] cursor-pointer"
                />
                <span className="text-xs text-gray-600">Đã xác minh giấy tờ</span>
              </label>
            </div>
          </div>
        </div>}

        {!isLoading && <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Cập nhật thông tin cư trú</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ngày bắt đầu cư trú <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="text"
                  value={residenceForm.ngayBatDauCuTru}
                  onChange={(event) => setResidenceForm((prev) => ({ ...prev, ngayBatDauCuTru: event.target.value }))}
                  className="w-full pr-8 pl-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
                <Calendar size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Thời hạn thuê <span className="text-red-500">*</span></label>
              <select
                value={residenceForm.thoiHanThueThang}
                onChange={(event) => setResidenceForm((prev) => ({ ...prev, thoiHanThueThang: Number(event.target.value) }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-400 bg-white"
              >
                <option value={12}>12 tháng</option><option value={6}>6 tháng</option><option value={3}>3 tháng</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ghi chú</label>
              <input
                type="text"
                value={residenceForm.ghiChu}
                onChange={(event) => setResidenceForm((prev) => ({ ...prev, ghiChu: event.target.value }))}
                placeholder="Nhập ghi chú..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-8 mb-4 text-sm">
            <div><span className="text-gray-500">Hình thức thuê</span><span className="ml-2 font-medium text-gray-800">{detail?.hinhThucThue ?? "Thuê phòng"}</span></div>
            <div><span className="text-gray-500">Số người ở</span><span className="ml-2 font-medium text-gray-800">{members.length + 1} người</span></div>
          </div>
          {members.length > 0 && (
            <div className="mb-3 space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm">
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-gray-800">{m.name}</span>
                    <span className="text-gray-500">CCCD: {m.cccd}</span>
                    <span className="text-gray-500">{m.gender}</span>
                    <span className="text-gray-500">{m.phone}</span>
                  </div>
                  <button onClick={() => setMembers((p) => p.filter((x) => x.id !== m.id))} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-4 py-2 border border-[#155DFC] text-[#155DFC] bg-white text-sm font-medium rounded-md hover:bg-blue-50 transition-colors">
            <span className="text-base leading-none">+</span>Thêm thành viên
          </button>
        </div>}
      </main>

      <footer className="h-16 bg-white border-t border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
        <button onClick={() => setShowCancelConfirm(true)} className="px-6 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">Hủy</button>
        <button
          onClick={handleSave}
          disabled={isLoading || isSaving}
          className="px-6 py-2 bg-[#155DFC] text-white text-sm font-medium rounded-md hover:bg-[#1250d4] disabled:opacity-60 transition-colors"
        >
          {isSaving ? "Đang lưu..." : "Lưu & chuyển sang kiểm tra điều kiện"}
        </button>
      </footer>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center"><Users size={14} className="text-orange-500" /></div>
                <h2 className="text-base font-semibold text-gray-800">Thêm thành viên</h2>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div>
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1.5"><User size={13} className="text-gray-400" />Họ và tên <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={(e) => { setForm((f) => ({...f,name:e.target.value})); setErrors((er) => ({...er,name:""})); }} placeholder="Nhập họ và tên đầy đủ" className={`w-full px-3 py-2.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition ${errors.name?"border-red-400 bg-red-50":"border-gray-300"}`} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1.5"><CreditCard size={13} className="text-gray-400" />Số CCCD <span className="text-red-500">*</span></label>
                <input type="text" value={form.cccd} onChange={(e) => { setForm((f) => ({...f,cccd:e.target.value})); setErrors((er) => ({...er,cccd:""})); }} placeholder="Nhập 12 số CCCD" maxLength={12} className={`w-full px-3 py-2.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition ${errors.cccd?"border-red-400 bg-red-50":"border-gray-300"}`} />
                {errors.cccd && <p className="text-xs text-red-500 mt-1">{errors.cccd}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Giới tính <span className="text-red-500">*</span></label>
                <div className="flex gap-3">
                  {["Nam","Nữ","Khác"].map((g) => (
                    <button key={g} type="button" onClick={() => { setForm((f) => ({...f,gender:g})); setErrors((er) => ({...er,gender:""})); }} className={`flex-1 py-2.5 text-sm font-medium rounded-md border transition-colors ${form.gender===g?"bg-orange-500 border-orange-500 text-white":"border-gray-300 text-gray-600 hover:border-orange-300 hover:text-orange-500"}`}>{g}</button>
                  ))}
                </div>
                {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
              </div>
              <div>
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1.5"><Phone size={13} className="text-gray-400" />Số điện thoại <span className="text-red-500">*</span></label>
                <input type="tel" value={form.phone} onChange={(e) => { setForm((f) => ({...f,phone:e.target.value})); setErrors((er) => ({...er,phone:""})); }} placeholder="Nhập số điện thoại" className={`w-full px-3 py-2.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition ${errors.phone?"border-red-400 bg-red-50":"border-gray-300"}`} />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>
            <div className="flex gap-3 px-5 py-4 bg-gray-50 border-t border-gray-200">
              <button onClick={handleClose} className="flex-1 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors">Hủy</button>
              <button onClick={handleAdd} className="flex-1 py-2.5 text-sm font-medium text-white bg-[#155DFC] rounded-md hover:bg-[#1250d4] transition-colors">Thêm thành viên</button>
            </div>
          </div>
        </div>
      )}

      {showCancelConfirm && (
        <ConfirmDialog
          icon={<AlertTriangle size={22} className="text-yellow-500" />}
          iconBg="bg-yellow-100"
          title="Hủy thao tác"
          message="Bạn có chắc muốn hủy thao tác? Các thông tin vừa nhập sẽ không được lưu."
          confirmLabel="Đồng ý"
          confirmClass="bg-gray-700 hover:bg-gray-800 text-white"
          onConfirm={handleConfirmCancel}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}
    </>
  );
}

// ─── Approve screen ───────────────────────────────────────────────────────────

function ApproveScreen() {
  const [profiles, setProfiles] = useState<PheDuyetHoSoListItem[]>([]);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<PheDuyetHoSoDetail | null>(null);
  const [memberStatuses, setMemberStatuses] = useState<Record<string, MemberStatus>>({});
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [dialog, setDialog] = useState<DialogType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadProfiles = useCallback(async (keyword = "") => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const params = new URLSearchParams();
      if (keyword.trim()) params.set("q", keyword.trim());
      const data = await api.get<{ total: number; items: PheDuyetHoSoListItem[] }>(
        `/api/nhan-phong/phe-duyet-ho-so${params.size ? `?${params.toString()}` : ""}`,
      );
      setProfiles(data.items);
      setTotalProfiles(data.total);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Khong the tai danh sach ho so cho duyet.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProfiles("");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadProfiles]);

  const openProfile = async (p: PheDuyetHoSoListItem) => {
    setIsDetailLoading(true);
    setErrorMessage("");
    try {
      const detail = await api.get<PheDuyetHoSoDetail>(`/api/nhan-phong/phe-duyet-ho-so/${encodeURIComponent(p.code)}`);
      setSelectedProfile(detail);
      const init: Record<string, MemberStatus> = {};
      const reasons: Record<string, string> = {};
      detail.members.forEach((m) => {
        init[m.id] = m.status;
        if (m.rejectReason) reasons[m.id] = m.rejectReason;
      });
      setMemberStatuses(init);
      setRejectReasons(reasons);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Khong the tai chi tiet ho so phe duyet.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeProfile = () => {
    setSelectedProfile(null);
    setMemberStatuses({});
    setRejectReasons({});
    setDialog(null);
  };

  const setMemberStatus = (id: string, status: MemberStatus) => {
    setMemberStatuses((prev) => ({ ...prev, [id]: status }));
    if (status !== "rejected") {
      setRejectReasons((prev) => { const n = { ...prev }; delete n[id]; return n; });
    }
  };

  const allDecided = selectedProfile
    ? selectedProfile.members.every((m) => memberStatuses[m.id] !== "pending")
    : false;

  const approvedMembers = selectedProfile?.members.filter((m) => memberStatuses[m.id] === "approved") ?? [];
  const rejectedMembers = selectedProfile?.members.filter((m) => memberStatuses[m.id] === "rejected") ?? [];
  const hasRejected = rejectedMembers.length > 0;
  const hasApproved = approvedMembers.length > 0;

  const buildPayload = (groupOption?: "continue" | "stop") => ({
    groupOption,
    members: selectedProfile!.members.map((m) => ({
      thanhVienLuuTruId: m.thanhVienLuuTruId,
      status: memberStatuses[m.id] as "approved" | "rejected",
      rejectReason: rejectReasons[m.id],
    })),
  });

  const saveResult = async (groupOption?: "continue" | "stop") => {
    if (!selectedProfile) return;
    setIsSaving(true);
    setErrorMessage("");
    try {
      await api.post<LuuPheDuyetHoSoResult>(
        `/api/nhan-phong/phe-duyet-ho-so/${encodeURIComponent(selectedProfile.code)}`,
        buildPayload(groupOption),
      );
      setProfiles((prev) => prev.filter((p) => p.id !== selectedProfile.id));
      setTotalProfiles((prev) => Math.max(0, prev - 1));
      setDialog(groupOption === "stop" || !hasApproved ? "success-reject" : "success-approve");
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Khong the luu ket qua phe duyet. Vui long thu lai.");
      setDialog("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    if (!allDecided) return;
    const missingReason = selectedProfile?.members.some((m) => memberStatuses[m.id] === "rejected" && !rejectReasons[m.id]?.trim());
    if (missingReason) {
      setErrorMessage("Vui long nhap ly do tu choi cho thanh vien khong dat.");
      return;
    }
    setDialog("confirm-approve");
  };

  const handleConfirmApprove = () => {
    if (hasRejected && hasApproved) {
      setDialog("mixed-result");
      return;
    }
    void saveResult();
  };

  const handleMixedChoice = (choice: "continue" | "stop") => {
    if (choice === "continue") {
      void saveResult("continue");
    } else {
      setDialog("confirm-stop-all");
    }
  };

  const handleConfirmStopAll = () => {
    void saveResult("stop");
  };

  const handleSuccessClose = () => {
    closeProfile();
  };

  const handleCancelAttempt = () => setDialog("confirm-cancel");

  const handleConfirmCancel = () => {
    closeProfile();
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
          <span>Nhận phòng</span>
          <ChevronRight size={12} />
          <span className="text-gray-700">Phê duyệt hồ sơ lưu trú</span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-800">Phê duyệt hồ sơ lưu trú</h1>
          <span className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-200 px-2.5 py-1 rounded-full font-medium">
            {totalProfiles} hồ sơ chờ duyệt
          </span>
        </div>

        {/* Search */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã hồ sơ hoặc tên khách hàng..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>
          <button
            onClick={() => void loadProfiles(search)}
            disabled={isLoading}
            className="px-5 py-2 bg-[#155DFC] text-white text-sm font-medium rounded-md hover:bg-[#1250d4] disabled:opacity-60 transition-colors"
          >
            Tìm kiếm
          </button>
        </div>
        {errorMessage && dialog !== "error" && <p className="mb-3 text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={12} />{errorMessage}</p>}

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Mã hồ sơ", "Khách hàng", "Ngày nộp", "Số thành viên", "Thao tác"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">Đang tải danh sách hồ sơ...</td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">Không có hồ sơ nào chờ duyệt</td>
                </tr>
              ) : (
                profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-blue-600">{p.code}</td>
                    <td className="px-4 py-3 text-gray-800">{p.customer}</td>
                    <td className="px-4 py-3 text-gray-500">{p.submittedAt}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <Users size={13} />{p.memberCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => void openProfile(p)}
                        disabled={isDetailLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#155DFC] text-white text-xs font-medium rounded-md hover:bg-[#1250d4] disabled:opacity-60 transition-colors"
                      >
                        <ClipboardCheck size={13} />Xem &amp; Duyệt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* ── Member detail modal ── */}
      {selectedProfile && dialog === null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <ClipboardCheck size={16} className="text-blue-600" />
                  <h2 className="text-base font-semibold text-gray-800">Phê duyệt hồ sơ – {selectedProfile.code}</h2>
                </div>
                <p className="text-xs text-gray-500">Khách hàng: {selectedProfile.customer}</p>
              </div>
              <button onClick={handleCancelAttempt} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
            </div>

            {/* Member list */}
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {selectedProfile.members.map((m, idx) => {
                const status = memberStatuses[m.id] ?? "pending";
                return (
                  <div key={m.id} className={`rounded-lg border p-4 transition-colors ${
                    status === "approved" ? "border-green-200 bg-green-50" :
                    status === "rejected" ? "border-red-200 bg-red-50" :
                    "border-gray-200 bg-white"
                  }`}>
                    {/* Member header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          status === "approved" ? "bg-green-500" :
                          status === "rejected" ? "bg-red-500" : "bg-gray-400"
                        }`}>{idx + 1}</div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{m.name}</p>
                          <p className="text-xs text-gray-500">CCCD: {m.cccd} · {m.gender}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {status === "approved" && <span className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded-full"><CheckCircle2 size={11} />Đã phê duyệt</span>}
                        {status === "rejected" && <span className="flex items-center gap-1 text-xs text-red-500 font-medium bg-red-100 px-2 py-0.5 rounded-full"><XCircle size={11} />Đã từ chối</span>}
                        {status === "pending" && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Chờ xét</span>}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-start gap-2">
                      <button
                        onClick={() => setMemberStatus(m.id, "approved")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                          status === "approved"
                            ? "bg-[#155DFC] border-green-600 text-white"
                            : "border-green-400 text-green-600 hover:bg-green-50"
                        }`}
                      >
                        <CheckCircle2 size={13} />Phê duyệt
                      </button>
                      <button
                        onClick={() => setMemberStatus(m.id, "rejected")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                          status === "rejected"
                            ? "bg-red-500 border-red-500 text-white"
                            : "border-red-300 text-red-500 hover:bg-red-50"
                        }`}
                      >
                        <XCircle size={13} />Từ chối
                      </button>
                    </div>

                    {/* Reject reason */}
                    {status === "rejected" && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Lý do từ chối <span className="text-red-500">*</span></label>
                        <textarea
                          value={rejectReasons[m.id] ?? ""}
                          onChange={(e) => setRejectReasons((prev) => ({ ...prev, [m.id]: e.target.value }))}
                          placeholder="Nhập lý do từ chối..."
                          rows={2}
                          className="w-full px-3 py-2 text-xs border border-red-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-400 bg-white resize-none"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 px-5 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
              <button onClick={handleCancelAttempt} className="flex-1 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors">
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={!allDecided || isSaving}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  allDecided && !isSaving
                    ? "bg-[#155DFC] text-white hover:bg-[#1250d4]"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isSaving ? "Đang lưu..." : allDecided ? "Lưu kết quả" : `Còn ${selectedProfile.members.filter(m => memberStatuses[m.id] === "pending").length} thành viên chưa xét`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm approve dialog ── */}
      {dialog === "confirm-approve" && (
        <ConfirmDialog
          icon={<ClipboardCheck size={22} className="text-blue-600" />}
          iconBg="bg-blue-100"
          title="Xác nhận phê duyệt"
          message="Bạn có chắc muốn phê duyệt hồ sơ này không?"
          confirmLabel="Đồng ý"
          confirmClass="bg-[#155DFC] hover:bg-[#1250d4] text-white"
          onConfirm={handleConfirmApprove}
          onCancel={() => setDialog(null)}
        />
      )}

      {/* ── Mixed result dialog ── */}
      {dialog === "mixed-result" && selectedProfile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
              <AlertTriangle size={18} className="text-yellow-500" />
              <h3 className="text-base font-semibold text-gray-800">Kết quả xét duyệt</h3>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1"><CheckCircle2 size={12} />Thành viên đủ điều kiện ({approvedMembers.length})</p>
                {approvedMembers.map((m) => <p key={m.id} className="text-xs text-green-600 pl-4">• {m.name}</p>)}
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-600 mb-1 flex items-center gap-1"><XCircle size={12} />Thành viên không đủ điều kiện ({rejectedMembers.length})</p>
                {rejectedMembers.map((m) => <p key={m.id} className="text-xs text-red-500 pl-4">• {m.name}</p>)}
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500">Số thành viên đăng ký: <span className="font-medium text-gray-700">{selectedProfile.memberCount}</span></p>
              </div>
              <p className="text-sm text-gray-700 font-medium">Bạn muốn xử lý như thế nào?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleMixedChoice("continue")}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-[#155DFC] rounded-md hover:bg-[#1250d4] transition-colors"
                >
                  Tiếp tục thuê
                </button>
                <button
                  onClick={() => handleMixedChoice("stop")}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
                >
                  Không tiếp tục thuê
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm stop all dialog ── */}
      {dialog === "confirm-stop-all" && (
        <ConfirmDialog
          icon={<AlertTriangle size={22} className="text-red-500" />}
          iconBg="bg-red-100"
          title="Dừng toàn bộ thủ tục"
          message="Bạn có chắc muốn dừng toàn bộ thủ tục thuê của nhóm này không?"
          confirmLabel="Đồng ý"
          confirmClass="bg-red-500 hover:bg-red-600 text-white"
          onConfirm={handleConfirmStopAll}
          onCancel={() => setDialog("mixed-result")}
        />
      )}

      {/* ── Confirm cancel dialog ── */}
      {dialog === "confirm-cancel" && (
        <ConfirmDialog
          icon={<AlertTriangle size={22} className="text-yellow-500" />}
          iconBg="bg-yellow-100"
          title="Hủy thao tác"
          message="Bạn có chắc muốn hủy thao tác? Các thay đổi chưa lưu sẽ bị xóa."
          confirmLabel="Đồng ý"
          confirmClass="bg-gray-700 hover:bg-gray-800 text-white"
          onConfirm={handleConfirmCancel}
          onCancel={() => setDialog(null)}
        />
      )}

      {/* ── Error dialog ── */}
      {dialog === "error" && (
        <ResultDialog
          icon={<AlertTriangle size={28} className="text-red-500" />}
          iconBg="bg-red-100"
          title="Không thể lưu kết quả"
          message={errorMessage || "Không thể lưu kết quả phê duyệt. Vui lòng thử lại."}
          onClose={() => setDialog(null)}
        />
      )}

      {/* ── Success approve ── */}
      {dialog === "success-approve" && (
        <ResultDialog
          icon={<CheckCircle2 size={28} className="text-green-500" />}
          iconBg="bg-green-100"
          title="Phê duyệt thành công"
          message="Hồ sơ lưu trú đã được phê duyệt. Hồ sơ chuyển sang trạng thái &quot;Chờ ký hợp đồng&quot;."
          onClose={handleSuccessClose}
        />
      )}

      {/* ── Success reject ── */}
      {dialog === "success-reject" && (
        <ResultDialog
          icon={<XCircle size={28} className="text-red-500" />}
          iconBg="bg-red-100"
          title="Hồ sơ đã bị từ chối"
          message="Hồ sơ lưu trú đã bị từ chối. Thủ tục nhận phòng dừng lại theo quy định."
          onClose={handleSuccessClose}
        />
      )}
    </>
  );
}

// ─── Shared dialog components ─────────────────────────────────────────────────

function ConfirmDialog({
  icon, iconBg, title, message, confirmLabel, confirmClass, onConfirm, onCancel,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-5 py-6 text-center">
          <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center mx-auto mb-3`}>{icon}</div>
          <h3 className="text-base font-semibold text-gray-800 mb-2">{title}</h3>
          <p className="text-sm text-gray-600">{message}</p>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onCancel} className="flex-1 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">Hủy</button>
          <button onClick={onConfirm} className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${confirmClass}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function ResultDialog({ icon, iconBg, title, message, onClose }: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-5 py-6 text-center">
          <div className={`w-14 h-14 rounded-full ${iconBg} flex items-center justify-center mx-auto mb-3`}>{icon}</div>
          <h3 className="text-base font-semibold text-gray-800 mb-2">{title}</h3>
          <p className="text-sm text-gray-500" dangerouslySetInnerHTML={{ __html: message }} />
        </div>
        <div className="px-5 pb-5">
          <button onClick={onClose} className="w-full py-2.5 text-sm font-medium text-white bg-[#155DFC] rounded-md hover:bg-[#1250d4] transition-colors">Đóng</button>
        </div>
      </div>
    </div>
  );
}

// ─── Handover screen ─────────────────────────────────────────────────────────

type HandoverStep = "list" | "checklist" | "document";
type HandoverDialog = null | "confirm-cancel" | "save-error" | "save-success" | "unsigned-warning";

type HandoverAssetState = { checked: boolean; quantity: number; note: string };

function HandoverScreen() {
  const [step, setStep] = useState<HandoverStep>("list");
  const [selected, setSelected] = useState<BanGiaoPhongDetail | null>(null);
  const [search, setSearch] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [notEligible, setNotEligible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedResult, setSavedResult] = useState<LuuBienBanBanGiaoResult | null>(null);
  const [totalProfiles, setTotalProfiles] = useState(0);

  const [assetStates, setAssetStates] = useState<Record<string, HandoverAssetState>>({});
  const [dialog, setDialog] = useState<HandoverDialog>(null);
  const [customerSigned, setCustomerSigned] = useState(false);
  const [profiles, setProfiles] = useState<BanGiaoPhongListItem[]>([]);

  const loadProfiles = useCallback(async (keyword = "") => {
    setLoading(true);
    setNotFound(false);
    setNotEligible(false);
    setErrorMessage("");
    try {
      const query = keyword.trim() ? `?q=${encodeURIComponent(keyword.trim())}` : "";
      const data = await api.get<{ total: number; items: BanGiaoPhongListItem[] }>(`/api/nhan-phong/ban-giao-phong${query}`);
      setProfiles(data.items);
      setTotalProfiles(data.total);
      setNotFound(Boolean(keyword.trim()) && data.items.length === 0);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Đã xảy ra lỗi khi tải danh sách hồ sơ.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void api.get<{ total: number; items: BanGiaoPhongListItem[] }>("/api/nhan-phong/ban-giao-phong")
      .then((data) => {
        if (!active) return;
        setProfiles(data.items);
        setTotalProfiles(data.total);
      })
      .catch((error) => {
        if (!active) return;
        setErrorMessage(error instanceof ApiError ? error.message : "Đã xảy ra lỗi khi tải danh sách hồ sơ.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const initAssets = (detail: BanGiaoPhongDetail) => {
    const init: Record<string, HandoverAssetState> = {};
    detail.assets.forEach((asset) => {
      init[String(asset.id)] = { checked: false, quantity: asset.defaultQuantity, note: "" };
    });
    setAssetStates(init);
  };

  const selectProfile = async (profile: Pick<BanGiaoPhongListItem, "code">) => {
    setLoading(true);
    setNotFound(false);
    setNotEligible(false);
    setErrorMessage("");
    try {
      const detail = await api.get<BanGiaoPhongDetail>(`/api/nhan-phong/ban-giao-phong/${encodeURIComponent(profile.code)}`);
      setSelected(detail);
      initAssets(detail);
      setCustomerSigned(false);
      setDialog(null);
      setStep("checklist");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Đã xảy ra lỗi khi tải hồ sơ.";
      const normalized = message.toLowerCase();
      setNotFound(normalized.includes("không tồn tại") || normalized.includes("khong ton tai"));
      setNotEligible(normalized.includes("điều kiện") || normalized.includes("dieu kien"));
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const checkedCount = Object.values(assetStates).filter((v) => v.checked).length;

  const handleCreateDocument = () => setStep("document");

  const handleSave = async () => {
    if (!selected || saving) return;
    if (!customerSigned) { setDialog("unsigned-warning"); return; }
    setSaving(true);
    try {
      const result = await api.post<LuuBienBanBanGiaoResult>(
        `/api/nhan-phong/ban-giao-phong/${encodeURIComponent(selected.code)}`,
        {
          customerSigned,
          assets: selected.assets
            .filter((asset) => assetStates[String(asset.id)]?.checked)
            .map((asset) => ({
              assetId: asset.id,
              quantity: assetStates[String(asset.id)].quantity,
              note: assetStates[String(asset.id)].note.trim() || undefined,
            })),
        }
      );
      setSavedResult(result);
      setDialog("save-success");
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Đã xảy ra lỗi trong quá trình lưu. Vui lòng thử lại sau.");
      setDialog("save-error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAttempt = () => setDialog("confirm-cancel");

  const handleConfirmCancel = () => {
    setStep("list");
    setSelected(null);
    setAssetStates({});
    setCustomerSigned(false);
    setDialog(null);
    void loadProfiles();
  };

  const resetAll = () => {
    setStep("list");
    setSelected(null);
    setAssetStates({});
    setCustomerSigned(false);
    setDialog(null);
    setSavedResult(null);
    void loadProfiles();
  };

  // ── List step ──
  if (step === "list") {
    return (
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
          <span>Nhận phòng</span><ChevronRight size={12} /><span className="text-gray-700">Bàn giao phòng</span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-800">Bàn giao phòng</h1>
          <span className="text-xs bg-purple-100 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full font-medium">
            {totalProfiles} hồ sơ chờ bàn giao
          </span>
        </div>

        {/* Search */}
        <div className="mb-5">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setNotFound(false); setNotEligible(false); setErrorMessage(""); }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  if (search.trim()) void selectProfile({ code: search.trim() });
                  else void loadProfiles();
                }}
                placeholder="Nhập mã hồ sơ để tìm kiếm (VD: HS2026-0001)"
                className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-orange-400 ${notFound ? "border-red-400" : "border-gray-300"}`}
              />
            </div>
            <button
              onClick={() => search.trim() ? void selectProfile({ code: search.trim() }) : void loadProfiles()}
              disabled={loading}
              className="px-5 py-2 bg-[#155DFC] text-white text-sm font-medium rounded-md hover:bg-[#1250d4] disabled:opacity-60 transition-colors"
            >
              Tìm kiếm
            </button>
          </div>
          {notFound && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
              <AlertTriangle size={12} />Hồ sơ không tồn tại. Vui lòng nhập lại mã hồ sơ.
            </p>
          )}
          {notEligible && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
              <AlertTriangle size={12} />Hồ sơ chưa đủ điều kiện để lập biên bản bàn giao. Vui lòng nhập lại mã hồ sơ.
            </p>
          )}
          {errorMessage && !notFound && !notEligible && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={12} />{errorMessage}</p>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Mã hồ sơ", "Khách hàng", "Số thành viên", "Thao tác"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">Đang tải danh sách...</td></tr>
              ) : profiles.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">Không có hồ sơ nào chờ bàn giao</td></tr>
              ) : (
                profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-blue-600">{p.code}</td>
                    <td className="px-4 py-3 text-gray-800">{p.customer}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-gray-600"><Users size={13} />{p.memberCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => void selectProfile(p)}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#155DFC] text-white text-xs font-medium rounded-md hover:bg-[#1250d4] disabled:opacity-60 transition-colors"
                      >
                        <ClipboardList size={13} />Lập biên bản
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    );
  }

  // ── Checklist step ──
  if (step === "checklist") {
    return (
      <>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <span>Nhận phòng</span><ChevronRight size={12} />
            <button onClick={resetAll} className="hover:text-orange-500 transition-colors">Bàn giao phòng</button>
            <ChevronRight size={12} /><span className="text-gray-700">{selected!.code}</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-800 mb-1">Lập biên bản bàn giao</h1>
          <p className="text-sm text-gray-500 mb-5">{selected!.customer}</p>

          {/* Asset checklist */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList size={15} className="text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-700">Danh sách tài sản bàn giao</h3>
              </div>
              <span className="text-xs text-gray-500">{checkedCount}/{selected!.assets.length} tài sản đã xác nhận</span>
            </div>
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 w-10">✓</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Tên tài sản</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 w-24">Số lượng</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 w-20">Đơn vị</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Ghi chú (nếu có lỗi)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {selected!.assets.map((asset) => {
                  const assetKey = String(asset.id);
                  const state = assetStates[assetKey] ?? { checked: false, quantity: asset.defaultQuantity, note: "" };
                  return (
                    <tr key={asset.id} className={`transition-colors ${state.checked ? "bg-green-50/60" : "hover:bg-gray-50"}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={state.checked}
                          onChange={(e) => setAssetStates((prev) => ({ ...prev, [assetKey]: { ...prev[assetKey], checked: e.target.checked } }))}
                          className="w-4 h-4 accent-[#155DFC] cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${state.checked ? "text-gray-800" : "text-gray-600"}`}>{asset.name}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <input
                          type="number"
                          min={1}
                          value={state.quantity}
                          onChange={(e) => setAssetStates((prev) => ({
                            ...prev,
                            [assetKey]: { ...prev[assetKey], quantity: Math.max(1, Number.parseInt(e.target.value, 10) || 1) },
                          }))}
                          className="w-16 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-orange-400"
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-500">{asset.unit}</td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={state.note}
                          onChange={(e) => setAssetStates((prev) => ({ ...prev, [assetKey]: { ...prev[assetKey], note: e.target.value } }))}
                          placeholder="Nhập ghi chú nếu tài sản bị lỗi..."
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-orange-400 bg-white"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Quick-select bar */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
              <button
                onClick={() => setAssetStates((prev) => { const n = { ...prev }; selected!.assets.forEach((asset) => { const key = String(asset.id); n[key] = { ...n[key], checked: true }; }); return n; })}
                className="text-xs text-blue-600 hover:underline"
              >Chọn tất cả</button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setAssetStates((prev) => { const n = { ...prev }; selected!.assets.forEach((asset) => { const key = String(asset.id); n[key] = { ...n[key], checked: false }; }); return n; })}
                className="text-xs text-gray-500 hover:underline"
              >Bỏ chọn tất cả</button>
            </div>
          </div>
        </main>

        <footer className="h-16 bg-white border-t border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <button onClick={handleCancelAttempt} className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">Hủy</button>
          <button
            onClick={handleCreateDocument}
            disabled={checkedCount === 0}
            className={`flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-md transition-colors ${checkedCount > 0 ? "bg-[#155DFC] text-white hover:bg-[#1250d4]" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
          >
            <FileSignature size={15} />Tạo biên bản
          </button>
        </footer>

        {dialog === "confirm-cancel" && (
          <ConfirmDialog
            icon={<AlertTriangle size={22} className="text-yellow-500" />}
            iconBg="bg-yellow-100"
            title="Hủy thao tác"
            message="Bạn có chắc muốn hủy thao tác? Các thay đổi chưa lưu sẽ bị xóa."
            confirmLabel="Đồng ý"
            confirmClass="bg-gray-700 hover:bg-gray-800 text-white"
            onConfirm={handleConfirmCancel}
            onCancel={() => setDialog(null)}
          />
        )}
      </>
    );
  }

  // ── Document step ──
  const handedAssets = selected!.assets.filter((asset) => assetStates[String(asset.id)]?.checked);
  const notedAssets = handedAssets.filter((asset) => assetStates[String(asset.id)]?.note.trim());

  return (
    <>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
          <span>Nhận phòng</span><ChevronRight size={12} />
          <button onClick={resetAll} className="hover:text-orange-500 transition-colors">Bàn giao phòng</button>
          <ChevronRight size={12} /><span className="text-gray-700">Biên bản bàn giao</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-800 mb-5">Biên bản bàn giao tài sản</h1>

        {/* Document card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-3xl">
          {/* Header */}
          <div className="text-center border-b border-gray-200 pb-4 mb-5">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">HomeSay Dorm</p>
            <h2 className="text-lg font-bold text-gray-800">BIÊN BẢN BÀN GIAO TÀI SẢN</h2>
            <p className="text-xs text-gray-500 mt-1">Ngày: {selected!.handoverDate}</p>
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-5">
            {[
              ["Mã hồ sơ", selected!.code],
              ["Khách hàng", selected!.customer],
              ["Phòng/Giường", selected!.room],
              ["Vị trí", selected!.location],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <span className="text-gray-500 w-28 flex-shrink-0">{label}:</span>
                <span className="font-medium text-gray-800">{value}</span>
              </div>
            ))}
          </div>

          {/* Asset table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden mb-5">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 w-8">STT</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Tên tài sản</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 w-20">SL</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 w-16">ĐVT</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Tình trạng / Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {handedAssets.map((asset, i) => (
                  <tr key={asset.id} className={assetStates[String(asset.id)]?.note ? "bg-yellow-50" : ""}>
                    <td className="px-3 py-2.5 text-gray-500 text-center">{i + 1}</td>
                    <td className="px-3 py-2.5 text-gray-800 font-medium">{asset.name}</td>
                    <td className="px-3 py-2.5 text-gray-600">{assetStates[String(asset.id)]?.quantity}</td>
                    <td className="px-3 py-2.5 text-gray-500">{asset.unit}</td>
                    <td className="px-3 py-2.5">
                      {assetStates[String(asset.id)]?.note ? (
                        <span className="text-yellow-700 text-xs">⚠ {assetStates[String(asset.id)].note}</span>
                      ) : (
                        <span className="text-green-600 text-xs flex items-center gap-1"><CheckCircle2 size={11} />Tốt</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {notedAssets.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-5 text-xs text-yellow-800">
              <p className="font-semibold mb-1 flex items-center gap-1"><AlertTriangle size={12} />Lưu ý tài sản có vấn đề:</p>
              {notedAssets.map((asset) => <p key={asset.id} className="pl-4">• {asset.name}: {assetStates[String(asset.id)].note}</p>)}
            </div>
          )}

          {/* Signature confirmation */}
          <div className={`rounded-lg border p-4 transition-colors ${customerSigned ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={customerSigned}
                onChange={(e) => setCustomerSigned(e.target.checked)}
                className="w-4 h-4 accent-[#155DFC] cursor-pointer mt-0.5 flex-shrink-0"
              />
              <div>
                <p className={`text-sm font-medium ${customerSigned ? "text-green-700" : "text-gray-700"}`}>
                  Xác nhận khách hàng đã ký biên bản bàn giao
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Tick vào ô này sau khi khách hàng đã ký xác nhận vào biên bản in ra.</p>
              </div>
            </label>
          </div>
        </div>
      </main>

      <footer className="h-16 bg-white border-t border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex gap-3">
          <button onClick={() => setStep("checklist")} className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">
            <RotateCcw size={14} />Sửa danh sách
          </button>
          <button onClick={handleCancelAttempt} className="px-4 py-2 border border-red-200 text-red-500 text-sm font-medium rounded-md hover:bg-red-50 transition-colors">Hủy</button>
        </div>
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-[#155DFC] text-white text-sm font-medium rounded-md hover:bg-[#1250d4] disabled:opacity-60 transition-colors"
        >
          <CheckCircle2 size={15} />{saving ? "Đang lưu..." : "Lưu biên bản bàn giao"}
        </button>
      </footer>

      {/* Unsigned warning */}
      {dialog === "unsigned-warning" && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-5 py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={22} className="text-yellow-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-800 mb-2">Chưa xác nhận chữ ký</h3>
              <p className="text-sm text-gray-600">Chưa xác nhận khách hàng đã ký biên bản. Vui lòng xác nhận trước khi lưu.</p>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => { setDialog("confirm-cancel"); }} className="flex-1 py-2.5 text-sm font-medium text-red-500 border border-red-200 rounded-md hover:bg-red-50 transition-colors">Hủy bàn giao</button>
              <button onClick={() => setDialog(null)} className="flex-1 py-2.5 text-sm font-medium text-white bg-[#155DFC] rounded-md hover:bg-[#1250d4] transition-colors">Quay lại xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {dialog === "confirm-cancel" && (
        <ConfirmDialog
          icon={<AlertTriangle size={22} className="text-yellow-500" />}
          iconBg="bg-yellow-100"
          title="Hủy thao tác"
          message="Bạn có chắc muốn hủy thao tác? Các thay đổi chưa lưu sẽ bị xóa."
          confirmLabel="Đồng ý"
          confirmClass="bg-gray-700 hover:bg-gray-800 text-white"
          onConfirm={handleConfirmCancel}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog === "save-success" && (
        <ResultDialog
          icon={<CheckCircle2 size={28} className="text-green-500" />}
          iconBg="bg-green-100"
          title="Bàn giao thành công!"
          message={`Biên bản bàn giao <strong>#${savedResult?.bienBanBanGiaoId ?? ""}</strong> đã được lưu với <strong>${savedResult?.soTaiSan ?? handedAssets.length}</strong> tài sản. Phòng/giường chuyển sang <strong>Đang sử dụng</strong>, hồ sơ <strong>${savedResult?.maHoSoNhanPhong ?? selected!.code}</strong> chuyển sang <strong>Hoàn tất</strong>.`}
          onClose={resetAll}
        />
      )}
      {dialog === "save-error" && (
        <ConfirmDialog
          icon={<AlertTriangle size={22} className="text-red-500" />}
          iconBg="bg-red-100"
          title="Không thể lưu biên bản"
          message={errorMessage || "Đã xảy ra lỗi trong quá trình lưu. Vui lòng thử lại sau."}
          confirmLabel="Thử lại"
          confirmClass="bg-[#155DFC] hover:bg-[#1250d4] text-white"
          onConfirm={() => void handleSave()}
          onCancel={() => setDialog(null)}
        />
      )}
    </>
  );
}

// ─── Contract screen ──────────────────────────────────────────────────────────

interface ContractProfile {
  id: string;
  code: string;
  customer: string;
  cccd: string;
  dob: string;
  phone: string;
  address: string;
  room: string;
  floor: string;
  rentType: "giường" | "phòng";
  bedCount: number;
  pricePerBed: number;
  duration: string;
  startDate: string;
  endDate: string;
  deposit: number;
  members: { name: string; cccd: string }[];
}

const CONTRACT_PROFILES: ContractProfile[] = [
  {
    id: "cp1", code: "HS2026-0001", customer: "Trần Thị Bình",
    cccd: "079201012345", dob: "15/03/2003", phone: "0985763421",
    address: "12 Lê Lợi, Q.1, TP.HCM",
    room: "A105", floor: "Tầng 1 – Dãy A",
    rentType: "giường", bedCount: 1, pricePerBed: 1800000,
    duration: "12 tháng", startDate: "05/06/2026", endDate: "04/06/2027",
    deposit: 1800000,
    members: [
      { name: "Nguyễn Thị Lan", cccd: "079201098765" },
      { name: "Lê Văn Dũng", cccd: "079201055512" },
    ],
  },
  {
    id: "cp2", code: "HS2026-0002", customer: "Phạm Văn Minh",
    cccd: "034201056781", dob: "08/11/2002", phone: "0934567890",
    address: "45 Nguyễn Huệ, Q.1, TP.HCM",
    room: "B203", floor: "Tầng 2 – Dãy B",
    rentType: "giường", bedCount: 1, pricePerBed: 1600000,
    duration: "6 tháng", startDate: "06/06/2026", endDate: "05/12/2026",
    deposit: 1600000,
    members: [],
  },
  {
    id: "cp3", code: "HS2026-0005", customer: "Lý Minh Tuấn",
    cccd: "056201033321", dob: "20/07/2001", phone: "0911223344",
    address: "78 Trần Hưng Đạo, Q.5, TP.HCM",
    room: "C401", floor: "Tầng 4 – Dãy C",
    rentType: "phòng", bedCount: 4, pricePerBed: 1500000,
    duration: "12 tháng", startDate: "07/06/2026", endDate: "06/06/2027",
    deposit: 6000000,
    members: [
      { name: "Ngô Quang Hải", cccd: "056201044432" },
      { name: "Đinh Thị Thu", cccd: "056201055543" },
    ],
  },
];

type ContractStep = "list" | "info" | "document";
type ContractDialog = null | "confirm-cancel" | "unsigned-warning" | "save-success" | "save-error";

function fmt(n: number) {
  return n.toLocaleString("vi-VN") + " đ";
}

function ContractScreen() {
  const [step, setStep] = useState<ContractStep>("list");
  const [profiles, setProfiles] = useState<LapHopDongListItem[]>([]);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [selected, setSelected] = useState<LapHopDongDetail | null>(null);
  const [search, setSearch] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [notEligible, setNotEligible] = useState(false);
  const [customerSigned, setCustomerSigned] = useState(false);
  const [dialog, setDialog] = useState<ContractDialog>(null);
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedContractCode, setSavedContractCode] = useState("");

  const loadProfiles = useCallback(async (keyword = "", options?: { showLoading?: boolean }) => {
    if (options?.showLoading !== false) setIsLoading(true);
    setErrorMessage("");
    setNotFound(false);
    setNotEligible(false);
    try {
      const params = new URLSearchParams();
      if (keyword.trim()) params.set("q", keyword.trim());
      const data = await api.get<{ total: number; items: LapHopDongListItem[] }>(
        `/api/nhan-phong/lap-hop-dong${params.size ? `?${params.toString()}` : ""}`,
      );
      setProfiles(data.items);
      setTotalProfiles(data.total);
      if (keyword.trim() && data.items.length === 0) setNotFound(true);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Không thể tải danh sách hồ sơ chờ ký hợp đồng.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProfiles("", { showLoading: false });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadProfiles]);

  const selectProfile = async (p: LapHopDongListItem) => {
    setIsDetailLoading(true);
    setErrorMessage("");
    setNotFound(false);
    setNotEligible(false);
    try {
      const detail = await api.get<LapHopDongDetail>(`/api/nhan-phong/lap-hop-dong/${encodeURIComponent(p.code)}`);
      setSelected(detail);
      setCustomerSigned(false);
      setSaveAttempted(false);
      setStep("info");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Không thể tải thông tin hồ sơ lập hợp đồng.";
      if (message.includes("chua du dieu kien")) setNotEligible(true);
      else if (message.includes("khong ton tai")) setNotFound(true);
      setErrorMessage(message);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleSearch = () => {
    void loadProfiles(search);
  };

  const handleSave = async () => {
    setSaveAttempted(true);
    if (!customerSigned) { setDialog("unsigned-warning"); return; }
    if (!selected) return;
    setIsSaving(true);
    setErrorMessage("");
    try {
      const result = await api.post<LuuHopDongResult>(
        `/api/nhan-phong/lap-hop-dong/${encodeURIComponent(selected.code)}`,
        { daXacNhanKhachDaKy: customerSigned },
      );
      setSavedContractCode(result.maHopDong);
      setProfiles((prev) => prev.filter((p) => p.id !== selected.id));
      setTotalProfiles((prev) => Math.max(0, prev - 1));
      setDialog("save-success");
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Đã xảy ra lỗi trong quá trình lưu. Vui lòng thử lại sau.");
      setDialog("save-error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmCancel = () => {
    setStep("list");
    setSelected(null);
    setCustomerSigned(false);
    setDialog(null);
    setSaveAttempted(false);
    setErrorMessage("");
  };

  // ── List step ──
  if (step === "list") {
    return (
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
          <span>Nhận phòng</span><ChevronRight size={12} /><span className="text-gray-700">Lập hợp đồng cho thuê</span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-800">Lập hợp đồng cho thuê</h1>
          <span className="text-xs bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full font-medium">
            {totalProfiles} hồ sơ chờ ký hợp đồng
          </span>
        </div>

        <div className="mb-5">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setNotFound(false); setNotEligible(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Nhập mã hồ sơ hoặc tên khách hàng..."
                className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-orange-400 ${notFound || notEligible ? "border-red-400" : "border-gray-300"}`}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-5 py-2 bg-[#155DFC] text-white text-sm font-medium rounded-md hover:bg-[#1250d4] disabled:opacity-60 transition-colors"
            >
              Tìm kiếm
            </button>
          </div>
          {notFound && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={12} />Hồ sơ không tồn tại. Vui lòng nhập lại mã hồ sơ.</p>}
          {notEligible && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={12} />Hồ sơ chưa đủ điều kiện để lập hợp đồng.</p>}
          {errorMessage && !notFound && !notEligible && dialog !== "save-error" && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={12} />{errorMessage}</p>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Mã hồ sơ", "Khách hàng", "Hình thức thuê", "Thời hạn", "Thao tác"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">Đang tải danh sách hồ sơ...</td></tr>
              ) : profiles.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">Không có hồ sơ nào chờ ký hợp đồng</td></tr>
              ) : profiles.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-blue-600">{p.code}</td>
                  <td className="px-4 py-3 text-gray-800">{p.customer}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">Thuê {p.rentType}</td>
                  <td className="px-4 py-3 text-gray-600">{p.duration}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => void selectProfile(p)}
                      disabled={isDetailLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#155DFC] text-white text-xs font-medium rounded-md hover:bg-[#1250d4] disabled:opacity-60 transition-colors"
                    >
                      <ScrollText size={13} />Lập hợp đồng
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    );
  }

  // ── Info step ──
  if (step === "info" && selected) {
    const totalRent = selected.totalRent;
    return (
      <>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <span>Nhận phòng</span><ChevronRight size={12} />
            <button onClick={() => setStep("list")} className="hover:text-orange-500 transition-colors">Lập hợp đồng</button>
            <ChevronRight size={12} /><span className="text-gray-700">{selected.code}</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-800 mb-5">Thông tin hồ sơ</h1>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Khách hàng */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><User size={14} className="text-indigo-500" />Thông tin khách hàng</h3>
              <div className="space-y-2 text-sm">
                {[["Họ và tên", selected.customer], ["Số CCCD", selected.cccd], ["Ngày sinh", selected.dob], ["Số điện thoại", selected.phone]].map(([l, v]) => (
                  <div key={l} className="flex justify-between gap-4">
                    <span className="text-gray-500 flex-shrink-0">{l}</span>
                    <span className="font-medium text-gray-800 text-right">{v}</span>
                  </div>
                ))}
              </div>
              {selected.members.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Thành viên cùng lưu trú</p>
                  {selected.members.map((m) => (
                    <div key={m.cccd} className="flex justify-between text-xs py-1">
                      <span className="text-gray-700">{m.name}</span>
                      <span className="text-gray-400">CCCD: {m.cccd}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Thông tin thuê */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><BedDouble size={14} className="text-indigo-500" />Thông tin thuê phòng</h3>
              <div className="space-y-2 text-sm">
                {[
                  ["Phòng/Giường", selected.room],
                  ["Vị trí", selected.floor],
                  ["Hình thức thuê", `Thuê ${selected.rentType}`],
                  ["Số giường thuê", `${selected.bedCount} giường`],
                  ["Đơn giá/giường", fmt(selected.pricePerBed) + "/tháng"],
                  ["Tổng tiền thuê", fmt(totalRent) + "/tháng"],
                  ["Thời hạn thuê", selected.duration],
                  ["Ngày bắt đầu", selected.startDate],
                  ["Ngày kết thúc", selected.endDate],
                  ["Tiền cọc", fmt(selected.deposit)],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between gap-4">
                    <span className="text-gray-500 flex-shrink-0">{l}</span>
                    <span className="font-medium text-gray-800 text-right">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        <footer className="h-16 bg-white border-t border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <button onClick={() => setStep("list")} className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">Hủy</button>
          <button onClick={() => setStep("document")} className="flex items-center gap-2 px-6 py-2 bg-[#155DFC] text-white text-sm font-medium rounded-md hover:bg-[#1250d4] transition-colors">
            <ScrollText size={15} />Tạo hợp đồng
          </button>
        </footer>
      </>
    );
  }

  // ── Document step ──
  if (step === "document" && selected) {
    const totalRent = selected.totalRent;
    const allMembers = [{ name: selected.customer, cccd: selected.cccd }, ...selected.members];

    return (
      <>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <span>Nhận phòng</span><ChevronRight size={12} />
            <button onClick={() => setStep("list")} className="hover:text-orange-500 transition-colors">Lập hợp đồng</button>
            <ChevronRight size={12} />
            <button onClick={() => setStep("info")} className="hover:text-orange-500 transition-colors">{selected.code}</button>
            <ChevronRight size={12} /><span className="text-gray-700">Hợp đồng</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-800 mb-5">Dự thảo hợp đồng cho thuê</h1>

          {/* Contract document */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-3xl shadow-sm">
            {/* Header */}
            <div className="text-center mb-6 pb-5 border-b-2 border-indigo-100">
              <p className="text-xs tracking-widest text-gray-400 uppercase mb-1">HomeSay Dorm – Hệ thống quản lý ký túc xá</p>
              <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">Hợp đồng cho thuê phòng</h2>
              <p className="text-xs text-gray-500 mt-1">Mã hợp đồng: {selected.contractCode} · Ngày lập: {selected.startDate}</p>
            </div>

            {/* Parties */}
            <section className="mb-5">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-indigo-500 rounded-full inline-block" />Các bên tham gia hợp đồng
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50 rounded-lg p-3 text-xs space-y-1">
                  <p className="font-semibold text-indigo-700 mb-1.5">Bên cho thuê (Bên A)</p>
                  <p><span className="text-gray-500">Đơn vị:</span> <span className="font-medium">HomeSay Dorm</span></p>
                  <p><span className="text-gray-500">Địa chỉ:</span> <span className="font-medium">123 Nguyễn Văn Cừ, Q.5, TP.HCM</span></p>
                  <p><span className="text-gray-500">Đại diện:</span> <span className="font-medium">Nguyễn Thị Quản Lý</span></p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-xs space-y-1">
                  <p className="font-semibold text-orange-700 mb-1.5">Bên thuê (Bên B)</p>
                  <p><span className="text-gray-500">Họ tên:</span> <span className="font-medium">{selected.customer}</span></p>
                  <p><span className="text-gray-500">CCCD:</span> <span className="font-medium">{selected.cccd}</span></p>
                  <p><span className="text-gray-500">SĐT:</span> <span className="font-medium">{selected.phone}</span></p>
                  <p><span className="text-gray-500">Địa chỉ:</span> <span className="font-medium">{selected.address}</span></p>
                  {allMembers.length > 1 && (
                    <div className="mt-1.5 pt-1.5 border-t border-orange-200">
                      <p className="text-gray-500 mb-1">Thành viên cùng lưu trú:</p>
                      {selected.members.map((m) => <p key={m.cccd} className="font-medium">• {m.name} ({m.cccd})</p>)}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Room info */}
            <section className="mb-5">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-indigo-500 rounded-full inline-block" />Thông tin phòng & giá thuê
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full">
                  <tbody className="divide-y divide-gray-100">
                    {[
                      ["Phòng", `${selected.room} – ${selected.floor}`],
                      ["Hình thức", `Thuê ${selected.rentType}`],
                      ["Số giường", `${selected.bedCount} giường`],
                      ["Đơn giá/giường/tháng", fmt(selected.pricePerBed)],
                      ["Tổng tiền thuê/tháng", fmt(totalRent)],
                      ["Thời hạn", selected.duration],
                      ["Từ ngày", selected.startDate],
                      ["Đến ngày", selected.endDate],
                      ["Kỳ thanh toán", selected.paymentCycle],
                    ].map(([l, v]) => (
                      <tr key={l}>
                        <td className="px-3 py-2 bg-gray-50 text-gray-500 w-44">{l}</td>
                        <td className="px-3 py-2 font-medium text-gray-800">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Service fees */}
            <section className="mb-5">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-indigo-500 rounded-full inline-block" />Các khoản phí dịch vụ
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {selected.serviceFees.length === 0 ? (
                  <div className="col-span-2 bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
                    Chưa có khoản phí dịch vụ đang áp dụng.
                  </div>
                ) : selected.serviceFees.map(({ idKhoanPhi, label, value }, index) => (
                  <div key={idKhoanPhi} className="flex items-start gap-2 bg-gray-50 rounded-lg p-3 text-xs">
                    <span className="mt-0.5">{index === 0 ? <Zap size={13} className="text-yellow-500" /> : index === 1 ? <Droplets size={13} className="text-blue-500" /> : index === 2 ? <Wifi size={13} className="text-indigo-500" /> : <Car size={13} className="text-gray-500" />}</span>
                    <div>
                      <p className="font-semibold text-gray-700">{label}</p>
                      <p className="text-gray-500">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Deposit */}
            <section className="mb-5">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-indigo-500 rounded-full inline-block" />Tiền cọc & hoàn trả
              </h3>
              <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1.5 text-gray-700">
                {selected.depositRules.length === 0 ? (
                  <>
                    <p>• Tiền đặt cọc: <span className="font-bold text-gray-900">{fmt(selected.deposit)}</span>.</p>
                    <p>• Tiền cọc sẽ được hoàn trả sau khi kết thúc hợp đồng, sau khi kiểm tra tài sản.</p>
                    <p>• Tiền cọc bị khấu trừ nếu có hư hỏng tài sản hoặc tiền thuê còn nợ.</p>
                  </>
                ) : selected.depositRules.map((rule) => <p key={rule}>• {rule}</p>)}
              </div>
            </section>

            {/* Rules */}
            <section className="mb-5">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-indigo-500 rounded-full inline-block" />Nội quy ký túc xá
              </h3>
              <div className="text-xs text-gray-600 space-y-1.5 bg-gray-50 rounded-lg p-3">
                {(selected.dormRules.length > 0 ? selected.dormRules : [
                  "Giờ giới nghiêm: 23:00 – 05:00. Khách ra vào cần đăng ký với bảo vệ.",
                  "Không được hút thuốc, sử dụng ma túy hoặc rượu bia trong khuôn viên.",
                  "Không được tự ý sửa chữa, thay đổi cơ sở vật chất phòng.",
                  "Bên thuê chịu trách nhiệm bồi thường thiệt hại tài sản do mình gây ra.",
                  "Giữ vệ sinh chung, không gây ồn ào ảnh hưởng đến người khác.",
                ]).map((rule) => <p key={rule}>• {rule}</p>)}
              </div>
            </section>

            {/* Violations */}
            <section className="mb-6">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-red-400 rounded-full inline-block" />Điều khoản xử lý vi phạm
              </h3>
              <div className="text-xs text-gray-600 space-y-1.5 bg-red-50 rounded-lg p-3 border border-red-100">
                {(selected.violationRules.length > 0 ? selected.violationRules : [
                  "Vi phạm lần 1: Nhắc nhở bằng văn bản.",
                  "Vi phạm lần 2: Phạt hành chính 500.000 đ và ghi vào hồ sơ.",
                  "Vi phạm lần 3 hoặc nghiêm trọng: Chấm dứt hợp đồng, không hoàn cọc.",
                  "Chấm dứt hợp đồng trước hạn cần báo trước ít nhất 30 ngày.",
                ]).map((rule) => <p key={rule}>• {rule}</p>)}
              </div>
            </section>

            {/* Signature confirmation */}
            <div className={`rounded-xl border-2 p-4 transition-all ${customerSigned ? "border-green-400 bg-green-50" : saveAttempted && !customerSigned ? "border-red-400 bg-red-50" : "border-dashed border-gray-300 bg-gray-50"}`}>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={customerSigned}
                  onChange={(e) => { setCustomerSigned(e.target.checked); if (e.target.checked) setDialog(null); }}
                  className="w-4 h-4 accent-[#155DFC] cursor-pointer mt-0.5 flex-shrink-0"
                />
                <div>
                  <p className={`text-sm font-semibold ${customerSigned ? "text-green-700" : saveAttempted && !customerSigned ? "text-red-600" : "text-gray-700"}`}>
                    Xác nhận khách hàng đã ký hợp đồng
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Tick vào ô này sau khi {selected.customer} đã ký tên vào bản hợp đồng in ra. Hành động này không thể hoàn tác.
                  </p>
                  {saveAttempted && !customerSigned && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle size={11} />Bạn chưa xác nhận khách hàng đã ký vào hợp đồng.</p>
                  )}
                </div>
              </label>
            </div>
          </div>
        </main>

        <footer className="h-16 bg-white border-t border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex gap-3">
            <button onClick={() => setDialog("confirm-cancel")} className="px-4 py-2 border border-red-200 text-red-500 text-sm font-medium rounded-md hover:bg-red-50 transition-colors">Hủy</button>
          </div>
          <button
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-[#155DFC] text-white text-sm font-medium rounded-md hover:bg-[#1250d4] disabled:opacity-60 transition-colors"
          >
            <Banknote size={15} />{isSaving ? "Đang lưu..." : "Lưu hợp đồng"}
          </button>
        </footer>

        {/* Unsigned warning */}
        {dialog === "unsigned-warning" && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="px-5 py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-3"><AlertTriangle size={22} className="text-yellow-500" /></div>
                <h3 className="text-base font-semibold text-gray-800 mb-2">Chưa xác nhận chữ ký</h3>
                <p className="text-sm text-gray-600">Bạn chưa xác nhận khách hàng đã ký vào hợp đồng. Vui lòng xác nhận trước khi lưu.</p>
              </div>
              <div className="flex gap-3 px-5 pb-5">
                <button onClick={() => setDialog("confirm-cancel")} className="flex-1 py-2.5 text-sm font-medium text-red-500 border border-red-200 rounded-md hover:bg-red-50 transition-colors">Hủy hợp đồng</button>
                <button onClick={() => setDialog(null)} className="flex-1 py-2.5 text-sm font-medium text-white bg-[#155DFC] rounded-md hover:bg-[#1250d4] transition-colors">Quay lại xác nhận</button>
              </div>
            </div>
          </div>
        )}

        {dialog === "confirm-cancel" && (
          <ConfirmDialog
            icon={<AlertTriangle size={22} className="text-yellow-500" />}
            iconBg="bg-yellow-100"
            title="Hủy thao tác"
            message="Bạn có chắc muốn hủy thao tác? Các thay đổi chưa lưu sẽ bị xóa."
            confirmLabel="Đồng ý"
            confirmClass="bg-gray-700 hover:bg-gray-800 text-white"
            onConfirm={handleConfirmCancel}
            onCancel={() => setDialog(null)}
          />
        )}

        {dialog === "save-error" && (
          <ConfirmDialog
            icon={<AlertTriangle size={22} className="text-red-500" />}
            iconBg="bg-red-100"
            title="Không thể lưu hợp đồng"
            message={errorMessage || "Đã xảy ra lỗi trong quá trình lưu. Vui lòng thử lại sau."}
            confirmLabel="Thử lại"
            confirmClass="bg-[#155DFC] hover:bg-[#1250d4] text-white"
            onConfirm={() => void handleSave()}
            onCancel={handleConfirmCancel}
          />
        )}

        {dialog === "save-success" && (
          <ResultDialog
            icon={<CheckCircle2 size={28} className="text-green-500" />}
            iconBg="bg-green-100"
            title="Lưu hợp đồng thành công!"
            message={`Hợp đồng <strong>${savedContractCode || selected.contractCode}</strong> đã được lưu. Trạng thái hợp đồng chuyển sang <strong>Đã ký</strong>. Hồ sơ chuyển sang <strong>Chờ thanh toán đầu kỳ</strong>.`}
            onClose={() => { setDialog(null); setStep("list"); setSelected(null); }}
          />
        )}
      </>
    );
  }

  return null;
}

// ─── Payment screen ───────────────────────────────────────────────────────────

type PaymentStep = "list" | "fees" | "receipt";
type PaymentDialog = null | "confirm-cancel" | "save-success" | "save-error";

interface ExtraFee { id: number; label: string; amount: string }

function PaymentScreen() {
  const [step, setStep] = useState<PaymentStep>("list");
  const [profiles, setProfiles] = useState<ThanhToanDauKyListItem[]>([]);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [selected, setSelected] = useState<ThanhToanDauKyDetail | null>(null);
  const [search, setSearch] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [notEligible, setNotEligible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedResult, setSavedResult] = useState<LuuThanhToanDauKyResult | null>(null);
  const [extraFees, setExtraFees] = useState<ExtraFee[]>([]);
  const [newFeeLabel, setNewFeeLabel] = useState("");
  const [newFeeAmount, setNewFeeAmount] = useState("");
  const [dialog, setDialog] = useState<PaymentDialog>(null);
  const loadProfiles = useCallback(async (keyword = "") => {
    setLoading(true);
    setNotFound(false);
    setNotEligible(false);
    try {
      const query = keyword.trim() ? `?q=${encodeURIComponent(keyword.trim())}` : "";
      const data = await api.get<{ total: number; items: ThanhToanDauKyListItem[] }>(`/api/nhan-phong/thanh-toan-dau-ky${query}`);
      setProfiles(data.items);
      setTotalProfiles(data.total);
      setNotFound(Boolean(keyword.trim()) && data.items.length === 0);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Đã xảy ra lỗi khi tải danh sách hồ sơ.");
      setDialog("save-error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void api.get<{ total: number; items: ThanhToanDauKyListItem[] }>("/api/nhan-phong/thanh-toan-dau-ky")
      .then((data) => {
        if (!active) return;
        setProfiles(data.items);
        setTotalProfiles(data.total);
      })
      .catch((error) => {
        if (!active) return;
        setErrorMessage(error instanceof ApiError ? error.message : "Đã xảy ra lỗi khi tải danh sách hồ sơ.");
        setDialog("save-error");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const selectProfile = async (profile: ThanhToanDauKyListItem) => {
    setLoading(true);
    setNotEligible(false);
    try {
      const detail = await api.get<ThanhToanDauKyDetail>(`/api/nhan-phong/thanh-toan-dau-ky/${encodeURIComponent(profile.code)}`);
      setSelected(detail);
      setExtraFees([]);
      setNewFeeLabel("");
      setNewFeeAmount("");
      setDialog(null);
      setStep("fees");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Đã xảy ra lỗi khi tải hồ sơ.";
      setNotEligible(message.toLowerCase().includes("điều kiện") || message.toLowerCase().includes("dieu kien"));
      setErrorMessage(message);
      if (!message.toLowerCase().includes("điều kiện") && !message.toLowerCase().includes("dieu kien")) setDialog("save-error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => { void loadProfiles(search); };

  const handleAddExtraFee = () => {
    const amt = parseInt(newFeeAmount.replace(/\D/g, ""), 10);
    if (!newFeeLabel.trim() || !amt) return;
    setExtraFees((prev) => [...prev, { id: Date.now(), label: newFeeLabel.trim(), amount: newFeeAmount.trim() }]);
    setNewFeeLabel("");
    setNewFeeAmount("");
  };

  const handleRemoveExtraFee = (id: number) => setExtraFees((prev) => prev.filter((f) => f.id !== id));

  const handleConfirmCancel = () => {
    setStep("list");
    setSelected(null);
    setExtraFees([]);
    setDialog(null);
    void loadProfiles(search);
  };

  const handleComplete = async () => {
    if (!selected || saving) return;
    const extraCharges: ThanhToanKhoanThu[] = extraFees.map((fee) => ({
      id: `extra-${fee.id}`,
      source: "extra",
      label: fee.label,
      description: "Khoản phí bổ sung",
      amount: parseInt(fee.amount.replace(/\D/g, ""), 10),
    }));
    setSaving(true);
    try {
      const result = await api.post<LuuThanhToanDauKyResult>(
        `/api/nhan-phong/thanh-toan-dau-ky/${encodeURIComponent(selected.code)}`,
        { charges: [...selected.charges, ...extraCharges], phuongThucThu: "Tien mat" }
      );
      setSavedResult(result);
      setDialog("save-success");
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Đã xảy ra lỗi trong quá trình lưu. Vui lòng thử lại sau.");
      setDialog("save-error");
    } finally {
      setSaving(false);
    }
  };

  if (!selected) {
    // ── List step ──
    return (
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
          <span>Nhận phòng</span><ChevronRight size={12} /><span className="text-gray-700">Thanh toán đầu kỳ</span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-800">Thanh toán đầu kỳ</h1>
          <span className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
            {totalProfiles} hồ sơ chờ thanh toán
          </span>
        </div>

        <div className="mb-5">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setNotFound(false); setNotEligible(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Nhập mã hồ sơ hoặc tên khách hàng..."
                className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-orange-400 ${notFound || notEligible ? "border-red-400" : "border-gray-300"}`}
              />
            </div>
            <button onClick={handleSearch} className="px-5 py-2 bg-[#155DFC] text-white text-sm font-medium rounded-md hover:bg-[#1250d4] transition-colors">Tìm kiếm</button>
          </div>
          {notFound   && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={12} />Hồ sơ không tồn tại. Vui lòng nhập lại mã hồ sơ.</p>}
          {notEligible && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={12} />Hồ sơ chưa đủ điều kiện để thanh toán.</p>}
          {errorMessage && dialog === "save-error" && !notEligible && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={12} />{errorMessage}</p>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Mã hồ sơ", "Khách hàng", "Hình thức thuê", "Ngày bắt đầu", "Thao tác"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">Đang tải danh sách...</td></tr>
              ) : profiles.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">Không có hồ sơ nào chờ thanh toán đầu kỳ</td></tr>
              ) : profiles.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-blue-600">{p.code}</td>
                  <td className="px-4 py-3 text-gray-800">{p.customer}</td>
                  <td className="px-4 py-3 text-gray-600">{p.rentType}</td>
                  <td className="px-4 py-3 text-gray-600">{p.startDate}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => void selectProfile(p)} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#155DFC] text-white text-xs font-medium rounded-md hover:bg-[#1250d4] disabled:opacity-60 transition-colors">
                      <Banknote size={13} />Thanh toán
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    );
  }

  // ── Fees calculation step ──
  const extraTotal = extraFees.reduce((sum, f) => sum + parseInt(f.amount.replace(/\D/g, ""), 10) || 0, 0);
  const grandTotal = selected.total + extraTotal;
  const feeRows = selected.charges.map((charge) => ({
    ...charge,
    desc: charge.description,
  }));

  if (step === "fees") {
    return (
      <>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <span>Nhận phòng</span><ChevronRight size={12} />
            <button onClick={() => { setSelected(null); setStep("list"); }} className="hover:text-orange-500 transition-colors">Thanh toán đầu kỳ</button>
            <ChevronRight size={12} /><span className="text-gray-700">{selected.code}</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-800 mb-5">Tính toán khoản thu đầu kỳ</h1>

          <div className="grid grid-cols-3 gap-4 mb-4">
            {/* Profile summary */}
            <div className="col-span-1 bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Thông tin hồ sơ</h3>
              <div className="space-y-2 text-xs">
                {[["Mã hồ sơ", selected.code], ["Hợp đồng", selected.contractCode], ["Khách hàng", selected.customer], ["Phòng", selected.room], ["Hình thức", selected.rentType], ["Thời hạn", selected.duration], ["Ngày bắt đầu", selected.startDate]].map(([l, v]) => (
                  <div key={l} className="flex justify-between gap-2">
                    <span className="text-gray-500">{l}</span>
                    <span className="font-medium text-gray-800 text-right">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fee breakdown */}
            <div className="col-span-2 bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                <Banknote size={15} className="text-emerald-600" />
                <h3 className="text-sm font-semibold text-gray-700">Các khoản thu đầu kỳ</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Khoản thu</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Diễn giải</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">Số tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {feeRows.map((row) => (
                    <tr key={row.label}>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{row.label}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">{row.desc}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-gray-800">{fmt(row.amount)}</td>
                    </tr>
                  ))}
                  {extraFees.map((f) => (
                    <tr key={f.id} className="bg-yellow-50/60">
                      <td className="px-4 py-2.5 font-medium text-yellow-800">{f.label}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">Phí bổ sung</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-medium text-yellow-800">{fmt(parseInt(f.amount.replace(/\D/g, ""), 10) || 0)}</span>
                          <button onClick={() => handleRemoveExtraFee(f.id)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {/* Add extra fee row */}
                  <tr className="border-t border-dashed border-gray-200 bg-gray-50/50">
                    <td colSpan={3} className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2">+ Bổ sung khoản phí khác (A5)</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newFeeLabel}
                          onChange={(e) => setNewFeeLabel(e.target.value)}
                          placeholder="Tên khoản phí..."
                          className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-400"
                        />
                        <input
                          type="text"
                          value={newFeeAmount}
                          onChange={(e) => setNewFeeAmount(e.target.value)}
                          placeholder="Số tiền (VD: 200000)"
                          className="w-40 px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-400"
                        />
                        <button onClick={handleAddExtraFee} className="px-3 py-1.5 bg-[#155DFC] text-white text-xs font-medium rounded-md hover:bg-[#1250d4] transition-colors">Thêm</button>
                      </div>
                    </td>
                  </tr>
                  {/* Grand total */}
                  <tr className="border-t-2 border-emerald-200 bg-emerald-50">
                    <td colSpan={2} className="px-4 py-3 text-sm font-bold text-emerald-800">Tổng số tiền cần thanh toán</td>
                    <td className="px-4 py-3 text-right text-lg font-bold text-emerald-700">{fmt(grandTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </main>

        <footer className="h-16 bg-white border-t border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <button onClick={() => setDialog("confirm-cancel")} className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">Hủy</button>
          <button onClick={() => setStep("receipt")} className="flex items-center gap-2 px-6 py-2 bg-[#155DFC] text-white text-sm font-medium rounded-md hover:bg-[#1250d4] transition-colors">
            <FileSignature size={15} />Tạo phiếu thu
          </button>
        </footer>

        {dialog === "confirm-cancel" && (
          <ConfirmDialog
            icon={<AlertTriangle size={22} className="text-yellow-500" />}
            iconBg="bg-yellow-100"
            title="Hủy thao tác"
            message="Bạn có chắc muốn hủy thao tác? Các thay đổi chưa lưu sẽ bị xóa."
            confirmLabel="Đồng ý"
            confirmClass="bg-gray-700 hover:bg-gray-800 text-white"
            onConfirm={handleConfirmCancel}
            onCancel={() => setDialog(null)}
          />
        )}
      </>
    );
  }

  // ── Receipt step ──
  return (
    <>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
          <span>Nhận phòng</span><ChevronRight size={12} />
          <button onClick={() => { setSelected(null); setStep("list"); }} className="hover:text-orange-500 transition-colors">Thanh toán đầu kỳ</button>
          <ChevronRight size={12} />
          <button onClick={() => setStep("fees")} className="hover:text-orange-500 transition-colors">{selected.code}</button>
          <ChevronRight size={12} /><span className="text-gray-700">Phiếu thu</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-800 mb-5">Phiếu thu đầu kỳ</h1>

        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-2xl shadow-sm">
          {/* Header */}
          <div className="flex items-start justify-between pb-5 border-b-2 border-emerald-100 mb-5">
            <div>
              <p className="text-xs tracking-widest text-gray-400 uppercase mb-1">HomeSay Dorm</p>
              <h2 className="text-xl font-bold text-gray-900">PHIẾU THU ĐẦU KỲ</h2>
              <p className="text-xs text-gray-500 mt-1">Ngày lập: {selected.paymentTime}</p>
            </div>
            <div className="text-right">
              <div className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                Chờ xác nhận
              </div>
              <p className="text-xs text-gray-400 mt-1">Mã HĐ: {selected.contractCode}</p>
            </div>
          </div>

          {/* Customer info */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm mb-5 pb-5 border-b border-gray-100">
            {[["Mã hồ sơ", selected.code], ["Khách hàng", selected.customer], ["Phòng/Giường", selected.room], ["Hình thức thuê", selected.rentType], ["Kỳ thanh toán", `Tháng 1 – ${selected.startDate}`]].map(([l, v]) => (
              <div key={l} className="flex gap-2">
                <span className="text-gray-500 w-28 flex-shrink-0">{l}:</span>
                <span className="font-medium text-gray-800">{v}</span>
              </div>
            ))}
          </div>

          {/* Fee table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden mb-5">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 w-8">STT</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Khoản thu</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500">Số tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {feeRows.map((row, i) => (
                  <tr key={row.label}>
                    <td className="px-3 py-2.5 text-gray-400 text-center">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-gray-800">{row.label}</p>
                      <p className="text-xs text-gray-400">{row.desc}</p>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-800">{fmt(row.amount)}</td>
                  </tr>
                ))}
                {extraFees.map((f, i) => (
                  <tr key={f.id} className="bg-yellow-50/40">
                    <td className="px-3 py-2.5 text-gray-400 text-center">{feeRows.length + i + 1}</td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-yellow-800">{f.label}</p>
                      <p className="text-xs text-gray-400">Phí bổ sung</p>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-yellow-800">{fmt(parseInt(f.amount.replace(/\D/g, ""), 10) || 0)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-emerald-200 bg-emerald-50">
                  <td colSpan={2} className="px-3 py-3 text-sm font-bold text-emerald-800">Tổng cộng</td>
                  <td className="px-3 py-3 text-right text-base font-bold text-emerald-700">{fmt(grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Staff confirmation */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-600 mb-3 flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-500" />Xác nhận thu tiền – Nhân viên kế toán
            </p>
            <div className="flex items-center justify-between text-xs">
              <div className="space-y-1 text-gray-600">
                <p>Nhân viên: <span className="font-medium text-gray-800">Nguyễn Văn An</span></p>
                <p>Thời điểm: <span className="font-medium text-gray-800">{selected.paymentTime}</span></p>
                <p>Phương thức: <span className="font-medium text-gray-800">Tiền mặt</span></p>
              </div>
              <div className="text-center">
                <div className="w-20 h-14 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-300 text-xs">Ký tên</div>
                <p className="text-gray-400 mt-1">Kế toán viên</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="h-16 bg-white border-t border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex gap-3">
          <button onClick={() => setStep("fees")} className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">
            <RotateCcw size={14} />Sửa khoản thu
          </button>
          <button onClick={() => setDialog("confirm-cancel")} className="px-4 py-2 border border-red-200 text-red-500 text-sm font-medium rounded-md hover:bg-red-50 transition-colors">Hủy</button>
        </div>
        <button onClick={() => void handleComplete()} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-[#155DFC] text-white text-sm font-medium rounded-md hover:bg-[#1250d4] disabled:opacity-60 transition-colors">
          <CheckCircle2 size={15} />{saving ? "Đang lưu..." : "Hoàn tất thanh toán"}
        </button>
      </footer>

      {dialog === "confirm-cancel" && (
        <ConfirmDialog
          icon={<AlertTriangle size={22} className="text-yellow-500" />}
          iconBg="bg-yellow-100"
          title="Hủy thao tác"
          message="Bạn có chắc muốn hủy thao tác? Các thay đổi chưa lưu sẽ bị xóa."
          confirmLabel="Đồng ý"
          confirmClass="bg-gray-700 hover:bg-gray-800 text-white"
          onConfirm={handleConfirmCancel}
          onCancel={() => setDialog(null)}
        />
      )}

      {dialog === "save-success" && (
        <ResultDialog
          icon={<CheckCircle2 size={28} className="text-green-500" />}
          iconBg="bg-green-100"
          title="Thanh toán thành công!"
          message={`Phiếu thu <strong>${savedResult?.maHopDong ?? selected.contractCode}</strong> đã được lưu với tổng tiền <strong>${fmt(savedResult?.soTien ?? grandTotal)}</strong>. Hồ sơ <strong>${savedResult?.maHoSoNhanPhong ?? selected.code}</strong> chuyển sang trạng thái <strong>Đang thuê</strong>.`}
          onClose={() => { setDialog(null); setStep("list"); setSelected(null); setSavedResult(null); void loadProfiles(search); }}
        />
      )}

      {dialog === "save-error" && (
        <ConfirmDialog
          icon={<AlertTriangle size={22} className="text-red-500" />}
          iconBg="bg-red-100"
          title="Không thể hoàn tất thanh toán"
          message={errorMessage || "Đã xảy ra lỗi trong quá trình lưu. Vui lòng thử lại sau."}
          confirmLabel="Thử lại"
          confirmClass="bg-[#155DFC] hover:bg-[#1250d4] text-white"
          onConfirm={() => void handleComplete()}
          onCancel={() => setDialog(null)}
        />
      )}
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function NhanPhongMockApp({ initialScreen = "check-in" }: { initialScreen?: NhanPhongScreen }) {
  return (
    <div className="flex min-h-[calc(100vh-4.25rem)] min-w-0 flex-1 flex-col overflow-hidden bg-gray-100 font-sans">
      {initialScreen === "check-in" ? <CheckInScreen /> : initialScreen === "approve-list" ? <ApproveScreen /> : initialScreen === "handover" ? <HandoverScreen /> : initialScreen === "contract" ? <ContractScreen /> : <PaymentScreen />}
    </div>
  );
}
