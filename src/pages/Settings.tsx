import {
  ArrowLeft,
  Bell,
  Car,
  Check,
  ChevronRight,
  Clock,
  Hash,
  Info,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  Moon,
  Palette,
  Pencil,
  Phone,
  Plus,
  Search,
  Sun,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import Footer from "../layout/Footer";
import {
  addCrew,
  deleteCrew,
  fetchCrew,
  updateCrew,
  type Crew,
} from "../services/crew";
import {
  addDriver,
  deleteDriver,
  fetchDrivers,
  updateDriver,
  type Driver,
} from "../services/drivers";
import { THEME_COLORS, THEME_OPTIONS, useTheme } from "../theme/ThemeContext";
import {
  PrimaryButton,
  ThemedBadge,
  ThemedToggle,
} from "../theme/Themedcomponents";
import { useAdminPin } from "./UseAdminPin";

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
type View = "main" | "crew" | "drivers" | "about";
interface ConfirmState {
  open: boolean;
  name: string;
  onConfirm: () => void;
}
interface NotifSettings {
  notifyNewBooking: boolean;
  notifyReminder: boolean;
}
interface PrefSettings {
  defaultLeadTime: string;
  currency: string;
}

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
const initials = (n: string) =>
  n
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const avatarBg = (n: string) => {
  const palette = [
    "#00a884",
    "#009de2",
    "#5b5ea6",
    "#e06c75",
    "#e5a02a",
    "#56b4d3",
    "#2e7d32",
    "#7b1fa2",
  ];
  let h = 0;
  for (let i = 0; i < n.length; i++) h = n.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
};

/* ─────────────────────────────────────────
   Avatar
───────────────────────────────────────── */
const Avatar = ({ name, size = 44 }: { name: string; size?: number }) => (
  <div
    style={{
      width: size,
      height: size,
      background: avatarBg(name),
      borderRadius: "50%",
      flexShrink: 0,
    }}
    className="flex items-center justify-center text-white font-bold select-none"
  >
    <span style={{ fontSize: size * 0.36 }}>{initials(name)}</span>
  </div>
);

/* ─────────────────────────────────────────
   Bottom Sheet
───────────────────────────────────────── */
const Sheet = ({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-black/50"
        style={{ backdropFilter: "blur(3px)" }}
        onClick={onClose}
      />
      <div
        className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col"
        style={{
          maxHeight: "90vh",
          animation: "sheetUp .3s cubic-bezier(.32,1.2,.64,1) both",
        }}
      >
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
          <h2 className="font-semibold text-gray-900 text-base">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
          >
            <X size={17} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
          {children}
        </div>
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
          {footer}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   Confirm
───────────────────────────────────────── */
const Confirm = ({
  name,
  onConfirm,
  onCancel,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-5">
    <div
      className="absolute inset-0 bg-black/40"
      style={{ backdropFilter: "blur(3px)" }}
      onClick={onCancel}
    />
    <div
      className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 space-y-5"
      style={{ animation: "popIn .22s cubic-bezier(.34,1.56,.64,1) both" }}
    >
      <div className="flex flex-col items-center text-center gap-3">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-[15px]">
            Delete "{name}"?
          </p>
          <p className="text-sm text-gray-400 mt-1">This cannot be undone.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onCancel}
          className="py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────
   Field  (focus ring uses theme accent)
───────────────────────────────────────── */
const Field = ({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  icon: React.ReactNode;
  value: string | number | undefined;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) => {
  const { tokens } = useTheme();
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
        {icon} {label}
        {required && (
          <span className="text-red-400 normal-case tracking-normal">*</span>
        )}
      </label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ "--ta": tokens.accent } as React.CSSProperties}
        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent text-[15px] text-gray-900 placeholder-gray-400
          focus:outline-none focus:bg-white focus:border-[var(--ta)] focus:ring-2 focus:ring-[var(--ta)]/15 transition-all"
      />
    </div>
  );
};

/* ─────────────────────────────────────────
   SelectField
───────────────────────────────────────── */
const SelectField = ({
  label,
  icon,
  value,
  onChange,
  options,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => {
  const { tokens } = useTheme();
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
        {icon} {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ "--ta": tokens.accent } as React.CSSProperties}
        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent text-[15px] text-gray-900 appearance-none
          focus:outline-none focus:bg-white focus:border-[var(--ta)] focus:ring-2 focus:ring-[var(--ta)]/15 transition-all"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
};

/* ─────────────────────────────────────────
   Person Row
───────────────────────────────────────── */
const PersonRow = ({
  name,
  line1,
  line2,
  onEdit,
  onDelete,
  delay = 0,
}: {
  name: string;
  line1?: string;
  line2?: string;
  onEdit: () => void;
  onDelete: () => void;
  delay?: number;
}) => {
  const { tokens } = useTheme();
  return (
    <div
      className="group bg-white flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,.06)] hover:shadow-[0_2px_8px_rgba(0,0,0,.1)] transition-all"
      style={{ animation: `fadeSlide .3s ${delay}ms both` }}
    >
      <Avatar name={name} size={46} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[15px] text-gray-900 truncate">
          {name}
        </p>
        {line1 && (
          <p className="text-[13px] text-gray-500 truncate mt-0.5">{line1}</p>
        )}
        {line2 && (
          <p
            className="text-[12px] font-semibold mt-0.5 truncate"
            style={{ color: tokens.accent }}
          >
            {line2}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 sm:flex transition-all">
        <button
          onClick={onEdit}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 transition-colors"
          style={{ color: tokens.accent }}
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={onDelete}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="flex items-center gap-1 sm:hidden">
        <button
          onClick={onEdit}
          className="w-8 h-8 flex items-center justify-center rounded-full"
          style={{ color: tokens.accent }}
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={onDelete}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   Settings Row
───────────────────────────────────────── */
const SettingRow = ({
  icon,
  bg,
  label,
  sub,
  onClick,
  right,
  danger,
  delay = 0,
}: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  sub?: string;
  onClick?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
  delay?: number;
}) => (
  <button
    onClick={onClick}
    disabled={!onClick && !danger}
    className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
    style={{ animation: `fadeSlide .3s ${delay}ms both` }}
  >
    <div
      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg}`}
    >
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p
        className={`text-[15px] font-medium ${danger ? "text-red-500" : "text-gray-900"}`}
      >
        {label}
      </p>
      {sub && (
        <p className="text-[12px] text-gray-400 truncate mt-0.5">{sub}</p>
      )}
    </div>
    {right !== undefined ? (
      right
    ) : (
      <ChevronRight size={15} className="text-gray-300 shrink-0" />
    )}
  </button>
);

const SectionLabel = ({ children }: { children: string }) => (
  <p className="px-1 pt-5 pb-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
    {children}
  </p>
);
const Divider = () => <div className="h-px bg-gray-100 mx-4" />;
const Card = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => (
  <div
    className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,.06)]"
    style={{ animation: `fadeSlide .35s ${delay}ms both` }}
  >
    {children}
  </div>
);

/* ─────────────────────────────────────────
   Sub-page header  (accent comes from context)
───────────────────────────────────────── */
const SubHeader = ({
  title,
  subtitle,
  onBack,
  right,
  search,
  onSearchChange,
  searchPlaceholder,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  right?: React.ReactNode;
  search?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
}) => {
  const { tokens } = useTheme();
  return (
    <div className="text-white shrink-0" style={{ background: tokens.header }}>
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-[18px] tracking-tight">{title}</h1>
          {subtitle && <p className="text-[12px] text-white/65">{subtitle}</p>}
        </div>
        {right}
      </div>
      {search !== undefined && onSearchChange && (
        <div className="px-4 pb-4">
          <div
            className="flex items-center gap-2.5 rounded-xl px-4 py-2.5"
            style={{ background: "rgba(0,0,0,0.15)" }}
          >
            <Search size={15} className="text-white/60 shrink-0" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder ?? "Search…"}
              className="flex-1 bg-transparent text-white placeholder-white/50 text-sm focus:outline-none"
            />
            {search && (
              <button onClick={() => onSearchChange("")}>
                <X size={13} className="text-white/60" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────
   Crew Management
───────────────────────────────────────── */
const CREW_FIELDS: {
  key: keyof Omit<Crew, "id">;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  type?: string;
  required?: boolean;
}[] = [
  {
    key: "name",
    label: "Full Name",
    placeholder: "Ravi Naik",
    icon: <Users size={12} />,
    required: true,
  },
  {
    key: "phone",
    label: "Phone",
    placeholder: "9876543210",
    icon: <Phone size={12} />,
    required: true,
  },
  {
    key: "designation",
    label: "Designation",
    placeholder: "Manager / Executive",
    icon: <Hash size={12} />,
  },
  {
    key: "location",
    label: "Location",
    placeholder: "Panaji, Goa",
    icon: <MapPin size={12} />,
  },
  {
    key: "address",
    label: "Full Address",
    placeholder: "H.No 5, Near Church…",
    icon: <MapPin size={12} />,
  },
  {
    key: "bookingLeadTime",
    label: "Booking Lead Time",
    placeholder: "2 hours / 1 day",
    icon: <Clock size={12} />,
  },
  {
    key: "lat",
    label: "Latitude",
    placeholder: "15.4989",
    icon: <MapPin size={12} />,
    type: "number",
  },
  {
    key: "lng",
    label: "Longitude",
    placeholder: "73.8278",
    icon: <MapPin size={12} />,
    type: "number",
  },
];
const emptyCrew = (): Omit<Crew, "id"> => ({
  name: "",
  phone: "",
  address: "",
  location: "",
  designation: "",
  bookingLeadTime: "",
});

const CrewView = ({ onBack }: { onBack: () => void }) => {
  const { tokens } = useTheme();
  const [list, setList] = useState<Crew[]>([]);
  const [loading, setLoad] = useState(true);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [editing, setEdit] = useState<Crew | null>(null);
  const [draft, setDraft] = useState<Omit<Crew, "id">>(emptyCrew());
  const [confirm, setConf] = useState<ConfirmState>({
    open: false,
    name: "",
    onConfirm: () => {},
  });
  const { guardedDelete, PinGate } = useAdminPin();

  useEffect(() => {
    fetchCrew().then((d) => {
      setList(d);
      setLoad(false);
    });
  }, []);

  const filtered = list.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.designation ?? "").toLowerCase().includes(q)
    );
  });

  const openAdd = () => {
    setEdit(null);
    setDraft(emptyCrew());
    setSheet(true);
  };
  const openEdit = (c: Crew) => {
    setEdit(c);
    setDraft({ ...c });
    setSheet(true);
  };
  const setF = (k: keyof Crew, v: string) =>
    setDraft((p) => ({
      ...p,
      [k]: k === "lat" || k === "lng" ? (v === "" ? undefined : +v) : v,
    }));

  const save = async () => {
    if (!draft.name.trim() || !draft.phone.trim()) return;
    setSaving(true);
    try {
      if (editing?.id) {
        await updateCrew(editing.id, draft);
        setList((p) =>
          p.map((c) => (c.id === editing.id ? { ...c, ...draft } : c)),
        );
      } else {
        const r = await addCrew(draft as Crew);
        if (r?.[0]) setList((p) => [...p, r[0]]);
      }
      setSheet(false);
    } finally {
      setSaving(false);
    }
  };

  const askDel = (c: Crew) =>
    guardedDelete(() =>
      setConf({
        open: true,
        name: c.name,
        onConfirm: async () => {
          if (!c.id) return;
          await deleteCrew(c.id);
          setList((p) => p.filter((x) => x.id !== c.id));
          setConf((s) => ({ ...s, open: false }));
        },
      }),
    );

  return (
    <div className="flex flex-col h-full bg-[#efeae2]">
      {PinGate}
      <SubHeader
        title="Crew Members"
        subtitle={loading ? "Loading…" : `${list.length} total members`}
        onBack={onBack}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, phone, role…"
        right={
          <button
            onClick={openAdd}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
          >
            <Plus size={18} />
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2
              size={24}
              className="animate-spin"
              style={{ color: tokens.accent }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 gap-3">
            <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center">
              <Users size={26} className="text-gray-300" />
            </div>
            <p className="text-sm text-gray-500 font-medium">
              {search ? "No results found" : "No crew members yet"}
            </p>
            {!search && (
              <button
                onClick={openAdd}
                className="text-sm font-bold hover:underline"
                style={{ color: tokens.accent }}
              >
                + Add first member
              </button>
            )}
          </div>
        ) : (
          filtered.map((c, i) => (
            <PersonRow
              key={c.id}
              name={c.name}
              delay={i * 25}
              line1={[c.designation, c.location].filter(Boolean).join(" · ")}
              line2={
                c.bookingLeadTime
                  ? `⏱ Book ${c.bookingLeadTime} prior`
                  : undefined
              }
              onEdit={() => openEdit(c)}
              onDelete={() => askDel(c)}
            />
          ))
        )}
      </div>
      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        title={editing ? `Edit — ${editing.name}` : "Add Crew Member"}
        footer={
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSheet(false)}
              className="py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <PrimaryButton onClick={save} disabled={saving} className="py-3">
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Check size={15} />
              )}
              {saving ? "Saving…" : "Save"}
            </PrimaryButton>
          </div>
        }
      >
        {CREW_FIELDS.map((f) => (
          <Field
            key={f.key}
            label={f.label}
            icon={f.icon}
            value={draft[f.key] as string | number | undefined}
            onChange={(v) => setF(f.key, v)}
            placeholder={f.placeholder}
            type={f.type}
            required={f.required}
          />
        ))}
      </Sheet>
      {confirm.open && (
        <Confirm
          name={confirm.name}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConf((s) => ({ ...s, open: false }))}
        />
      )}
    </div>
  );
};

/* ─────────────────────────────────────────
   Drivers Management
───────────────────────────────────────── */
const DRIVER_FIELDS: {
  key: keyof Omit<Driver, "id" | "isPrimary">;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  required?: boolean;
}[] = [
  {
    key: "name",
    label: "Full Name",
    placeholder: "Suresh Kamat",
    icon: <Users size={12} />,
    required: true,
  },
  {
    key: "phone",
    label: "Phone",
    placeholder: "9876543210",
    icon: <Phone size={12} />,
    required: true,
  },
  {
    key: "vehicleNumber",
    label: "Vehicle Number",
    placeholder: "GA 01 AB 1234",
    icon: <Car size={12} />,
  },
  {
    key: "vehicleType",
    label: "Vehicle Type",
    placeholder: "SUV / Sedan / Hatchback",
    icon: <Car size={12} />,
  },
];
const emptyDriver = (): Omit<Driver, "id"> => ({
  name: "",
  phone: "",
  vehicleNumber: "",
  vehicleType: "",
  isPrimary: false,
});

const DriversView = ({ onBack }: { onBack: () => void }) => {
  const { tokens } = useTheme();
  const [list, setList] = useState<Driver[]>([]);
  const [loading, setLoad] = useState(true);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [editing, setEdit] = useState<Driver | null>(null);
  const [draft, setDraft] = useState<Omit<Driver, "id">>(emptyDriver());
  const [confirm, setConf] = useState<ConfirmState>({
    open: false,
    name: "",
    onConfirm: () => {},
  });
  const { guardedDelete, PinGate } = useAdminPin();

  useEffect(() => {
    fetchDrivers().then((d) => {
      setList(d);
      setLoad(false);
    });
  }, []);

  const filtered = list.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.phone.includes(q) ||
      (d.vehicleNumber ?? "").toLowerCase().includes(q)
    );
  });

  const openAdd = () => {
    setEdit(null);
    setDraft(emptyDriver());
    setSheet(true);
  };
  const openEdit = (d: Driver) => {
    setEdit(d);
    setDraft({ ...d });
    setSheet(true);
  };

  const save = async () => {
    if (!draft.name.trim() || !draft.phone.trim()) return;
    setSaving(true);
    try {
      if (editing?.id) {
        await updateDriver(editing.id, draft);
        setList((p) =>
          p.map((d) => (d.id === editing.id ? { ...d, ...draft } : d)),
        );
      } else {
        const r = await addDriver(draft as Driver);
        if (r?.[0]) setList((p) => [...p, r[0]]);
      }
      setSheet(false);
    } finally {
      setSaving(false);
    }
  };

  const askDel = (d: Driver) =>
    guardedDelete(() =>
      setConf({
        open: true,
        name: d.name,
        onConfirm: async () => {
          if (!d.id) return;
          await deleteDriver(d.id);
          setList((p) => p.filter((x) => x.id !== d.id));
          setConf((s) => ({ ...s, open: false }));
        },
      }),
    );

  return (
    <div className="flex flex-col h-full bg-[#efeae2]">
      {PinGate}
      <SubHeader
        title="Drivers"
        subtitle={loading ? "Loading…" : `${list.length} total drivers`}
        onBack={onBack}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, phone, vehicle…"
        right={
          <button
            onClick={openAdd}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
          >
            <Plus size={18} />
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2
              size={24}
              className="animate-spin"
              style={{ color: tokens.accent }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 gap-3">
            <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center">
              <Car size={26} className="text-gray-300" />
            </div>
            <p className="text-sm text-gray-500 font-medium">
              {search ? "No results found" : "No drivers yet"}
            </p>
            {!search && (
              <button
                onClick={openAdd}
                className="text-sm font-bold hover:underline"
                style={{ color: tokens.accent }}
              >
                + Add first driver
              </button>
            )}
          </div>
        ) : (
          filtered.map((d, i) => (
            <PersonRow
              key={d.id}
              name={d.name}
              delay={i * 25}
              line1={[d.vehicleNumber, d.vehicleType, d.phone]
                .filter(Boolean)
                .join(" · ")}
              line2={d.isPrimary ? "★ Prime Driver" : undefined}
              onEdit={() => openEdit(d)}
              onDelete={() => askDel(d)}
            />
          ))
        )}
      </div>
      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        title={editing ? `Edit — ${editing.name}` : "Add Driver"}
        footer={
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSheet(false)}
              className="py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <PrimaryButton onClick={save} disabled={saving} className="py-3">
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Check size={15} />
              )}
              {saving ? "Saving…" : "Save"}
            </PrimaryButton>
          </div>
        }
      >
        {DRIVER_FIELDS.map((f) => (
          <Field
            key={f.key}
            label={f.label}
            icon={f.icon}
            value={draft[f.key] as string}
            onChange={(v) => setDraft((p) => ({ ...p, [f.key]: v }))}
            placeholder={f.placeholder}
            required={f.required}
          />
        ))}
        <div className="flex items-center justify-between bg-gray-50 px-4 py-3.5 rounded-xl mt-1">
          <div>
            <p className="text-sm font-semibold text-gray-800">Prime Driver</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Gets priority in driver suggestions
            </p>
          </div>
          <ThemedToggle
            on={!!draft.isPrimary}
            toggle={() => setDraft((p) => ({ ...p, isPrimary: !p.isPrimary }))}
          />
        </div>
      </Sheet>
      {confirm.open && (
        <Confirm
          name={confirm.name}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConf((s) => ({ ...s, open: false }))}
        />
      )}
    </div>
  );
};

/* ─────────────────────────────────────────
   About View
───────────────────────────────────────── */
const AboutView = ({ onBack }: { onBack: () => void }) => {
  const { tokens } = useTheme();
  return (
    <div className="flex flex-col h-full bg-[#efeae2]">
      <SubHeader title="About" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        <div
          className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,.06)] overflow-hidden"
          style={{ animation: "fadeSlide .3s both" }}
        >
          <div className="flex flex-col items-center py-8 gap-3">
            <div
              className="w-20 h-20 rounded-[22px] flex items-center justify-center shadow-lg"
              style={{
                background: "white",
              }}
            >
              <img src="/logo.png" alt="Tripmint Logo" className="w-10 h-10" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900 text-xl">Tripmint</p>
              <p className="text-sm text-gray-400 mt-1">
                Smart Infomatio Sharing Platform
              </p>
            </div>
            <ThemedBadge>Version 2.1.0</ThemedBadge>
          </div>
          <div className="h-px bg-gray-100 mx-4" />
          {/* {[
            { label: "Environment", value: "Production" },
            { label: "Region", value: "ap-south-1 (Mumbai)" },
          ].map(({ label, value }, i) => (
            <div key={label}>
              {i > 0 && <div className="h-px bg-gray-100 mx-4" />}
              <div className="flex items-center justify-between px-5 py-3.5">
                <p className="text-[14px] text-gray-500">{label}</p>
                <p className="text-[14px] font-semibold text-gray-800">
                  {value}
                </p>
              </div>
            </div>
          ))} */}
        </div>

        <p className="px-1 pt-3 pb-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          What's New in v2.1.0
        </p>
        <div
          className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,.06)] px-5 py-4 space-y-3.5"
          style={{ animation: "fadeSlide .3s 60ms both" }}
        >
          {[
            {
              dot: tokens.accent,
              text: "Dark mode support across all screens",
            },
            {
              dot: "#0284c7",
              text: "Theme colour",
            },
            { dot: "#d97706", text: "Default booking lead time setting" },
            { dot: "#10b981", text: "Admin PIN management & guarded deletes" },
            { dot: "#e11d48", text: "Currency selector for billing display" },
          ].map(({ dot, text }) => (
            <div key={text} className="flex items-start gap-3">
              <span
                className="mt-[6px] w-2 h-2 rounded-full shrink-0"
                style={{ background: dot }}
              />
              <p className="text-[14px] text-gray-700 leading-snug">{text}</p>
            </div>
          ))}
        </div>

        <p className="px-1 pt-3 pb-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          Legal
        </p>
        <Card delay={120}>
          {["Terms of Service", "Privacy Policy", "Open-source Licences"].map(
            (label, i) => (
              <div key={label}>
                {i > 0 && <Divider />}
                <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 text-left">
                  <p className="text-[15px] font-medium text-gray-900">
                    {label}
                  </p>
                  <ChevronRight size={15} className="text-gray-300" />
                </button>
              </div>
            ),
          )}
        </Card>

        <Footer />
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   Notifications Sheet
───────────────────────────────────────── */
const NotifSheet = ({
  open,
  onClose,
  settings,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  settings: NotifSettings;
  onChange: (k: keyof NotifSettings, v: boolean) => void;
}) => (
  <Sheet
    open={open}
    onClose={onClose}
    title="Notification Preferences"
    footer={
      <PrimaryButton onClick={onClose} className="w-full py-3">
        Done
      </PrimaryButton>
    }
  >
    {[
      {
        key: "notifyNewBooking" as keyof NotifSettings,
        label: "New Booking Alerts",
        sub: "Get notified when a new booking is created",
      },
      {
        key: "notifyReminder" as keyof NotifSettings,
        label: "Booking Reminders",
        sub: "Remind before upcoming bookings are due",
      },
    ].map(({ key, label, sub }, i) => (
      <div key={key}>
        {i > 0 && <div className="h-px bg-gray-100" />}
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-[15px] font-medium text-gray-900">{label}</p>
            <p className="text-[12px] text-gray-400 mt-0.5">{sub}</p>
          </div>
          <ThemedToggle
            on={settings[key]}
            toggle={() => onChange(key, !settings[key])}
          />
        </div>
      </div>
    ))}
  </Sheet>
);

/* ─────────────────────────────────────────
   App Preferences Sheet
───────────────────────────────────────── */
const PrefsSheet = ({
  open,
  onClose,
  settings,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  settings: PrefSettings;
  onChange: <K extends keyof PrefSettings>(k: K, v: PrefSettings[K]) => void;
}) => (
  <Sheet
    open={open}
    onClose={onClose}
    title="App Preferences"
    footer={
      <PrimaryButton onClick={onClose} className="w-full py-3">
        Done
      </PrimaryButton>
    }
  >
    <SelectField
      label="Default Booking Lead Time"
      icon={<Clock size={12} />}
      value={settings.defaultLeadTime}
      onChange={(v) => onChange("defaultLeadTime", v)}
      options={[
        { value: "30 minutes", label: "30 minutes" },
        { value: "1 hour", label: "1 hour" },
        { value: "2 hours", label: "2 hours" },
        { value: "4 hours", label: "4 hours" },
        { value: "1 day", label: "1 day" },
        { value: "2 days", label: "2 days" },
      ]}
    />
    <SelectField
      label="Currency"
      icon={<Info size={12} />}
      value={settings.currency}
      onChange={(v) => onChange("currency", v)}
      options={[
        { value: "INR", label: "₹ Indian Rupee (INR)" },
        { value: "USD", label: "$ US Dollar (USD)" },
        { value: "EUR", label: "€ Euro (EUR)" },
        { value: "GBP", label: "£ British Pound (GBP)" },
        { value: "AED", label: "د.إ UAE Dirham (AED)" },
      ]}
    />
  </Sheet>
);

/* ─────────────────────────────────────────
   Theme Sheet  — reads/writes ThemeContext → localStorage
───────────────────────────────────────── */
const ThemeSheet = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const { color, setColor, tokens } = useTheme();
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="App Theme Colour"
      footer={
        <PrimaryButton onClick={onClose} className="w-full py-3">
          Done
        </PrimaryButton>
      }
    >
      <div className="space-y-2">
        {THEME_OPTIONS.map(({ key, label }) => {
          const col = THEME_COLORS[key];
          const selected = color === key;
          return (
            <button
              key={key}
              onClick={() => setColor(key)}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all"
              style={{
                background: selected ? col.accentLight : "#f9fafb",
                border: `2px solid ${selected ? col.accent : "transparent"}`,
              }}
            >
              <span
                className="w-8 h-8 rounded-full shrink-0 shadow-sm"
                style={{ background: col.accent }}
              />
              <p className="flex-1 text-left text-[15px] font-medium text-gray-900">
                {label}
              </p>
              {selected && <Check size={16} style={{ color: tokens.accent }} />}
            </button>
          );
        })}
      </div>
    </Sheet>
  );
};

/* ─────────────────────────────────────────
   Admin PIN Sheet
───────────────────────────────────────── */
const PinSheet = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const submit = () => {
    setError("");
    if (next.length < 4) {
      setError("PIN must be at least 4 digits.");
      return;
    }
    if (next !== confirm) {
      setError("PINs do not match.");
      return;
    }
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
      setCurrent("");
      setNext("");
      setConfirm("");
    }, 1400);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Change Admin PIN"
      footer={
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <PrimaryButton onClick={submit} className="py-3">
            {success ? <Check size={15} /> : <Lock size={15} />}
            {success ? "Saved!" : "Update PIN"}
          </PrimaryButton>
        </div>
      }
    >
      <Field
        label="Current PIN"
        icon={<Lock size={12} />}
        value={current}
        onChange={setCurrent}
        placeholder="Enter current PIN"
        type="password"
      />
      <Field
        label="New PIN"
        icon={<Lock size={12} />}
        value={next}
        onChange={setNext}
        placeholder="Min 4 digits"
        type="password"
      />
      <Field
        label="Confirm PIN"
        icon={<Lock size={12} />}
        value={confirm}
        onChange={setConfirm}
        placeholder="Repeat new PIN"
        type="password"
      />
      {error && (
        <p className="text-sm text-red-500 font-medium px-1">{error}</p>
      )}
    </Sheet>
  );
};

/* ─────────────────────────────────────────
   Main Settings Page
───────────────────────────────────────── */
const SettingsPage = ({
  onClose,
  onLogout,
}: {
  onClose?: () => void;
  onLogout?: () => void;
}) => {
  const { tokens, color, darkMode, setDark } = useTheme();

  const [view, setView] = useState<View>("main");
  const [notif, setNotif] = useState<NotifSettings>({
    notifyNewBooking: true,
    notifyReminder: true,
  });
  const [prefs, setPrefs] = useState<PrefSettings>({
    defaultLeadTime: "2 hours",
    currency: "INR",
  });
  const [notifSheet, setNotifSheet] = useState(false);
  const [prefsSheet, setPrefsSheet] = useState(false);
  const [themeSheet, setThemeSheet] = useState(false);
  const [pinSheet, setPinSheet] = useState(false);

  if (view === "crew") return <CrewView onBack={() => setView("main")} />;
  if (view === "drivers") return <DriversView onBack={() => setView("main")} />;
  if (view === "about") return <AboutView onBack={() => setView("main")} />;

  const notifSummary =
    [
      notif.notifyNewBooking && "New bookings",
      notif.notifyReminder && "Reminders",
    ]
      .filter(Boolean)
      .join(", ") || "All muted";
  const prefsSummary = `Lead: ${prefs.defaultLeadTime} · ${prefs.currency}`;

  return (
    <div
      className={`flex flex-col h-full ${darkMode ? "bg-[#1a1a1a]" : "bg-[#efeae2]"}`}
    >
      <NotifSheet
        open={notifSheet}
        onClose={() => setNotifSheet(false)}
        settings={notif}
        onChange={(k, v) => setNotif((p) => ({ ...p, [k]: v }))}
      />
      <PrefsSheet
        open={prefsSheet}
        onClose={() => setPrefsSheet(false)}
        settings={prefs}
        onChange={(k, v) => setPrefs((p) => ({ ...p, [k]: v }))}
      />
      <ThemeSheet open={themeSheet} onClose={() => setThemeSheet(false)} />
      <PinSheet open={pinSheet} onClose={() => setPinSheet(false)} />

      {/* Header */}
      <div className="shrink-0" style={{ background: tokens.header }}>
        <div className="flex items-center gap-3 px-4 pt-12 pb-3">
          {onClose && (
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors shrink-0"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
          )}
          <h1
            className="text-[22px] font-bold text-white tracking-tight flex-1"
            style={{ animation: "fadeSlide .3s both" }}
          >
            Settings
          </h1>
        </div>
        {/* Profile card */}
        <div className="px-3 pb-3">
          <div
            className="bg-white rounded-2xl flex items-center gap-4 px-4 py-4 shadow-lg cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
            style={{ animation: "fadeSlide .35s 40ms both" }}
          >
            <div
              className="w-[58px] h-[58px] rounded-full flex items-center justify-center shadow-md shrink-0"
              style={{
                background: `linear-gradient(135deg, ${tokens.accent}, ${tokens.headerDark})`,
              }}
            >
              <span className="text-white font-black text-xl">T</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-[16px]">Tripmint</p>
              <p className="text-[13px] text-gray-500 truncate mt-0.5">
                Smart Information Sharing Platform
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <ThemedBadge>Active</ThemedBadge>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <SectionLabel>Data Management</SectionLabel>
        <Card delay={60}>
          <SettingRow
            icon={<Users size={16} className="text-white" />}
            bg="bg-[#00a884]"
            label="Crew Members"
            sub="Add, edit and remove crew"
            onClick={() => setView("crew")}
            delay={60}
          />
          <Divider />
          <SettingRow
            icon={<Car size={16} className="text-white" />}
            bg="bg-[#0284c7]"
            label="Drivers"
            sub="Manage driver profiles & vehicles"
            onClick={() => setView("drivers")}
            delay={80}
          />
        </Card>

        <SectionLabel>Appearance</SectionLabel>
        <Card delay={130}>
          <SettingRow
            icon={
              darkMode ? (
                <Moon size={16} className="text-white" />
              ) : (
                <Sun size={16} className="text-white" />
              )
            }
            bg={darkMode ? "bg-[#6366f1]" : "bg-[#f59e0b]"}
            label="Dark Mode"
            sub={darkMode ? "Dark theme active" : "Light theme"}
            right={
              <ThemedToggle on={darkMode} toggle={() => setDark(!darkMode)} />
            }
            delay={130}
          />
          <Divider />
          <SettingRow
            icon={<Palette size={16} className="text-white" />}
            bg="bg-[#ec4899]"
            label="Theme Colour"
            sub={THEME_OPTIONS.find((o) => o.key === color)?.label ?? "Teal"}
            onClick={() => setThemeSheet(true)}
            right={
              <div className="flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-full shadow-sm"
                  style={{ background: tokens.accent }}
                />
                <ChevronRight size={15} className="text-gray-300" />
              </div>
            }
            delay={145}
          />
        </Card>

        <SectionLabel>Notifications</SectionLabel>
        <Card delay={190}>
          <SettingRow
            icon={<Bell size={16} className="text-white" />}
            bg="bg-[#f59e0b]"
            label="Notification Preferences"
            sub={notifSummary}
            onClick={() => setNotifSheet(true)}
            delay={190}
          />
        </Card>

        <SectionLabel>Booking Defaults</SectionLabel>
        <Card delay={240}>
          <SettingRow
            icon={<Clock size={16} className="text-white" />}
            bg="bg-[#10b981]"
            label="App Preferences"
            sub={prefsSummary}
            onClick={() => setPrefsSheet(true)}
            delay={240}
          />
        </Card>

        <SectionLabel>Security</SectionLabel>
        <Card delay={290}>
          <SettingRow
            icon={<Lock size={16} className="text-white" />}
            bg="bg-[#3b82f6]"
            label="Change Admin PIN"
            sub="Update the guarded-delete PIN"
            onClick={() => setPinSheet(true)}
            delay={290}
          />
        </Card>

        <SectionLabel>App</SectionLabel>
        <Card delay={335}>
          <SettingRow
            icon={<Info size={16} className="text-white" />}
            bg="bg-gray-400"
            label="About"
            sub="Version, changelog & legal"
            onClick={() => setView("about")}
            delay={335}
            right={
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                  v2.1.0
                </span>
                <ChevronRight size={15} className="text-gray-300" />
              </div>
            }
          />
        </Card>

        <div
          className="mt-4 mb-2"
          style={{ animation: "fadeSlide .35s 360ms both" }}
        >
          <Card>
            <SettingRow
              icon={<LogOut size={16} className="text-white" />}
              bg="bg-red-500"
              label="Log Out"
              danger
              right={null}
              onClick={onLogout}
            />
          </Card>
        </div>
        <Footer />
      </div>

      <style>{`
        @keyframes fadeSlide { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sheetUp   { from{opacity:0;transform:translateY(50px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn     { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }
      `}</style>
    </div>
  );
};

export default SettingsPage;
