import {
  AlertCircle,
  ArrowRight,
  BarChart2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  FileText,
  MapPin,
  Search,
  Trash2,
  Truck,
  Upload,
  Users,
  X,
} from "lucide-react";
import Papa from "papaparse";
import { useRef, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
interface GroupPassenger {
  name: string;
  pickupPoint: string;
  pickupTime: string;
}

interface Trip {
  id: string;
  sheetName: string;
  sheetType: "fly91" | "newstaff" | "airport_ops";
  passengerName: string;
  passengerContact?: string;
  pickupTime: string;
  pickupTimeSortable: number;
  pickupLocation: string;
  dropLocation: string;
  vehicle: string;
  driverName: string;
  driverContact: string;
  direction: "to_airport" | "from_airport" | "to_drop" | "from_drop";
  reportingTime?: string;
  remarks?: string;
  isGroupTrip?: boolean;
  groupPassengers?: GroupPassenger[];
  rawRow: Record<string, string>;
}

interface UploadedFile {
  name: string;
  trips: Trip[];
  type: "fly91" | "newstaff" | "airport_ops";
}

// ── Helpers ────────────────────────────────────────────────────────────────
function toMinutes(timeStr: string): number {
  if (!timeStr) return -1;
  const match = timeStr.trim().match(/(\d{1,2})[;:](\d{2})/);
  if (!match) return -1;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

function normalizeTime(raw: string): string {
  if (!raw) return "";
  const first = raw.split("/")[0].trim();
  const match = first.match(/(\d{1,2})[;:](\d{2})/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function normalizeLocation(raw: string): string {
  if (!raw) return "";
  const map: Record<string, string> = {
    GOX: "Mopa Airport (GOX)",
    GOI: "Dabolim Airport (GOI)",
    "MOPA AIRPORT": "Mopa Airport (GOX)",
    MOPA: "Mopa Airport (GOX)",
    "FLY 91 HQ": "FLY91 HQ",
    "FLY91 HQ": "FLY91 HQ",
  };
  const upper = raw.trim().toUpperCase();
  return map[upper] || raw.trim();
}

function cleanCell(val: string): string {
  if (!val) return "";
  return val.replace(/\xa0/g, "").trim();
}

function isBlankRow(row: Record<string, string>): boolean {
  return Object.values(row).every((v) => {
    const c = cleanCell(v);
    return !c || c === "" || c.charCodeAt(0) === 160;
  });
}

// ── Sheet Type Detector ────────────────────────────────────────────────────
function detectSheetType(
  rows: Record<string, string>[],
): "fly91" | "newstaff" | "airport_ops" {
  if (!rows.length) return "fly91";
  const keys = Object.keys(rows[0]).join(" ").toLowerCase();
  if (
    keys.includes("pick up point") ||
    keys.includes("pickup point") ||
    keys.includes("date and shift")
  )
    return "airport_ops";
  if (
    keys.includes("pickup location") ||
    keys.includes("drop location") ||
    keys.includes("contact")
  )
    return "newstaff";
  return "fly91";
}

// ── FLY91 Sheet Parser ─────────────────────────────────────────────────────
// Columns: Reporting Time | Names | Pickup Time | Location | Vehicle | Driver Name | Driver Number | Remarks | Remark | Drop Time | Vehicle | Driver Name | Driver Number
// Left (Pickup Time + Location filled) → Resident → Mopa Airport
// Right (Drop Time filled) → Mopa Airport → Resident  (Drop Time = pickup time FROM airport)
function parseFly91Sheet(
  rows: Record<string, string>[],
  sheetName: string,
): Trip[] {
  const trips: Trip[] = [];
  if (!rows.length) return trips;

  const keys = Object.keys(rows[0]);
  const findKey = (patterns: string[]) =>
    keys.find((k) =>
      patterns.some((p) =>
        k
          .toLowerCase()
          .replace(/\s/g, "")
          .includes(p.toLowerCase().replace(/\s/g, "")),
      ),
    );

  const nameKey = findKey(["names", "name"]) || keys[1];
  const pickupTimeKey = findKey(["pickuptime"]) || keys[2];
  const locationKey = findKey(["location"]) || keys[3];
  const reportingKey = findKey(["reportingtime", "reporting"]) || keys[0];
  const remarkKey = findKey(["remarks", "remark"]) || "";
  const dropTimeKey = findKey(["droptime"]) || "";

  const vehicleKeys = keys.filter((k) => k.toLowerCase().includes("vehicle"));
  const driverNameKeys = keys.filter(
    (k) =>
      k.toLowerCase().includes("driver name") ||
      k.toLowerCase().includes("drivername"),
  );
  const driverNumKeys = keys.filter(
    (k) =>
      k.toLowerCase().includes("driver number") ||
      k.toLowerCase().includes("driver contact") ||
      k.toLowerCase().includes("drivernumber"),
  );

  rows.forEach((row, idx) => {
    if (isBlankRow(row)) return;
    const name = cleanCell(row[nameKey] || "");
    if (!name || name.match(/^[-=]+$/)) return;

    const pickupTime = normalizeTime(cleanCell(row[pickupTimeKey] || ""));
    const pickupLoc = normalizeLocation(cleanCell(row[locationKey] || ""));
    const dropTime = normalizeTime(
      cleanCell(row[dropTimeKey ? dropTimeKey : ""] || ""),
    );
    const reportingTime = normalizeTime(cleanCell(row[reportingKey] || ""));
    const remarks = remarkKey ? cleanCell(row[remarkKey] || "") : "";

    // Left side: Resident → Airport
    if (pickupTime && pickupLoc) {
      trips.push({
        id: `${sheetName}-${idx}-out`,
        sheetName,
        sheetType: "fly91",
        passengerName: name,
        pickupTime,
        pickupTimeSortable: toMinutes(pickupTime),
        pickupLocation: pickupLoc,
        dropLocation: "Mopa Airport (GOX)",
        vehicle: cleanCell(row[vehicleKeys[0]] || ""),
        driverName: cleanCell(row[driverNameKeys[0]] || ""),
        driverContact: cleanCell(row[driverNumKeys[0]] || ""),
        direction: "to_airport",
        reportingTime,
        remarks,
        rawRow: row,
      });
    }

    // Right side: Airport → Resident
    if (dropTime) {
      trips.push({
        id: `${sheetName}-${idx}-in`,
        sheetName,
        sheetType: "fly91",
        passengerName: name,
        pickupTime: dropTime,
        pickupTimeSortable: toMinutes(dropTime),
        pickupLocation: "Mopa Airport (GOX)",
        dropLocation: pickupLoc || "Residence",
        vehicle: cleanCell(row[vehicleKeys[1] || vehicleKeys[0]] || ""),
        driverName: cleanCell(
          row[driverNameKeys[1] || driverNameKeys[0]] || "",
        ),
        driverContact: cleanCell(
          row[driverNumKeys[1] || driverNumKeys[0]] || "",
        ),
        direction: "from_airport",
        reportingTime,
        remarks,
        rawRow: row,
      });
    }
  });

  return trips;
}

// ── New Staff Sheet Parser ─────────────────────────────────────────────────
// Columns: Agent | Verified by | Names | Contact | Pickup location | Drop Location | Pickup Time | Vehicle | Driver Name | Driver Contact | Vehicle Category | Drop Time | Vehicle | Driver Name | Driver Contact
// Left (Pickup Time) → Pickup Location → Drop Location
// Right (Drop Time) → Drop Location → Pickup Location  (Drop Time = time to PICKUP from drop location)
function parseNewStaffSheet(
  rows: Record<string, string>[],
  sheetName: string,
): Trip[] {
  const trips: Trip[] = [];
  if (!rows.length) return trips;

  const keys = Object.keys(rows[0]);
  const findKey = (patterns: string[]) =>
    keys.find((k) =>
      patterns.some((p) =>
        k
          .toLowerCase()
          .replace(/\s/g, "")
          .includes(p.toLowerCase().replace(/\s/g, "")),
      ),
    );

  const nameKey = findKey(["names", "name"]) || keys[2];
  const contactKey = findKey(["contact"]) || "";
  const pickupLocKey = findKey(["pickuplocation"]) || keys[4];
  const dropLocKey = findKey(["droplocation"]) || keys[5];
  const pickupTimeKey = findKey(["pickuptime"]) || keys[6];
  const dropTimeKey = findKey(["droptime"]) || "";

  const vehicleKeys = keys.filter(
    (k) =>
      k.toLowerCase().replace(/\s/g, "").includes("vehicle") &&
      !k.toLowerCase().includes("category"),
  );
  const driverNameKeys = keys.filter(
    (k) =>
      k.toLowerCase().includes("driver name") ||
      k.toLowerCase().includes("drivername"),
  );
  const driverContactKeys = keys.filter(
    (k) =>
      k.toLowerCase().includes("driver contact") ||
      k.toLowerCase().includes("driver number"),
  );

  rows.forEach((row, idx) => {
    if (isBlankRow(row)) return;
    const name = cleanCell(row[nameKey] || "");
    if (!name || name.match(/^[-=]+$/)) return;

    const pickupTime = normalizeTime(cleanCell(row[pickupTimeKey] || ""));
    const pickupLoc = normalizeLocation(cleanCell(row[pickupLocKey] || ""));
    const dropLoc = normalizeLocation(cleanCell(row[dropLocKey] || ""));
    const dropTime = normalizeTime(
      cleanCell(row[dropTimeKey ? dropTimeKey : ""] || ""),
    );
    const contact = contactKey ? cleanCell(row[contactKey] || "") : "";

    // Left side: Pickup Location → Drop Location
    if (pickupTime) {
      trips.push({
        id: `${sheetName}-${idx}-out`,
        sheetName,
        sheetType: "newstaff",
        passengerName: name,
        passengerContact: contact,
        pickupTime,
        pickupTimeSortable: toMinutes(pickupTime),
        pickupLocation: pickupLoc || "Residence",
        dropLocation: dropLoc || "Mopa Airport (GOX)",
        vehicle: cleanCell(row[vehicleKeys[0]] || ""),
        driverName: cleanCell(row[driverNameKeys[0]] || ""),
        driverContact: cleanCell(row[driverContactKeys[0]] || ""),
        direction: "to_drop",
        rawRow: row,
      });
    }

    // Right side: Drop Location → Pickup Location
    if (dropTime && dropLoc) {
      trips.push({
        id: `${sheetName}-${idx}-in`,
        sheetName,
        sheetType: "newstaff",
        passengerName: name,
        passengerContact: contact,
        pickupTime: dropTime,
        pickupTimeSortable: toMinutes(dropTime),
        pickupLocation: dropLoc,
        dropLocation: pickupLoc || "Residence",
        vehicle: cleanCell(row[vehicleKeys[1] || vehicleKeys[0]] || ""),
        driverName: cleanCell(
          row[driverNameKeys[1] || driverNameKeys[0]] || "",
        ),
        driverContact: cleanCell(
          row[driverContactKeys[1] || driverContactKeys[0]] || "",
        ),
        direction: "from_drop",
        rawRow: row,
      });
    }
  });

  return trips;
}

// ── Airport Ops / Transfers Sheet Parser ──────────────────────────────────
// Columns: Date and shift Time | Name | Pick Up Point | Pick Up Time | Vehicle No | Driver Name | Driver Contact | (empty) | Drop Time | Vehicle No | Driver Name | Driver Contact
//
// Logic:
//   - Rows are grouped into shift blocks (row with date in col 0 starts a new block)
//   - Multiple passengers share one shift; driver may be same or different per passenger
//   - Passengers sharing the SAME driver on outbound = 1 trip entry (group trip)
//   - Passengers sharing the SAME driver on return  = 1 trip entry (group trip)
//   - Pickup Time = time to collect from their individual pickup point → Airport
//   - Drop Time   = time to collect FROM airport → back to residence
function parseAirportOpsSheet(
  rows: Record<string, string>[],
  sheetName: string,
): Trip[] {
  const trips: Trip[] = [];
  const cleanRows = rows.filter((r) => !isBlankRow(r));
  if (!cleanRows.length) return trips;

  const keys = Object.keys(cleanRows[0]);

  // Positional column accessor (handles duplicate header names like two "Vehicle No" columns)
  const col = (row: Record<string, string>, idx: number): string =>
    cleanCell(row[keys[idx]] || "");

  // Collect all passenger rows, tracking which shift block they belong to
  interface RawRow {
    name: string;
    pickupPoint: string;
    pickupTime: string;
    outVehicle: string;
    outDriver: string;
    outContact: string;
    dropTime: string;
    retVehicle: string;
    retDriver: string;
    retContact: string;
    shiftLabel: string;
  }

  let currentShiftLabel = "";
  const passengerRows: RawRow[] = [];

  cleanRows.forEach((row) => {
    const dateShift = col(row, 0);
    if (dateShift && /\d/.test(dateShift)) {
      currentShiftLabel = dateShift;
    }

    const name = col(row, 1);
    if (!name) return;

    passengerRows.push({
      name,
      pickupPoint: col(row, 2),
      pickupTime: normalizeTime(col(row, 3)),
      outVehicle: col(row, 4),
      outDriver: col(row, 5),
      outContact: col(row, 6),
      dropTime: normalizeTime(col(row, 8)),
      retVehicle: col(row, 9),
      retDriver: col(row, 10),
      retContact: col(row, 11),
      shiftLabel: currentShiftLabel,
    });
  });

  // ── Outbound grouping: same driver + vehicle + shift = 1 trip ──
  const outGroups = new Map<string, RawRow[]>();
  passengerRows.forEach((p) => {
    if (!p.outDriver) return;
    const key = `${p.shiftLabel}||OUT||${p.outDriver}||${p.outVehicle}`;
    if (!outGroups.has(key)) outGroups.set(key, []);
    outGroups.get(key)!.push(p);
  });

  outGroups.forEach((passengers, key) => {
    const sorted = [...passengers].sort(
      (a, b) => toMinutes(a.pickupTime) - toMinutes(b.pickupTime),
    );
    const first = sorted[0];
    const isGroup = passengers.length > 1;

    const groupPassengers: GroupPassenger[] = sorted.map((p) => ({
      name: p.name,
      pickupPoint: p.pickupPoint || "—",
      pickupTime: p.pickupTime || "—",
    }));

    trips.push({
      id: `${sheetName}-${key}-out`,
      sheetName,
      sheetType: "airport_ops",
      passengerName: isGroup
        ? `${first.name} +${passengers.length - 1} others`
        : first.name,
      pickupTime: first.pickupTime,
      pickupTimeSortable: toMinutes(first.pickupTime),
      pickupLocation: isGroup
        ? `${passengers.length} pickup stops`
        : first.pickupPoint || "Residence",
      dropLocation: "Mopa Airport (GOX)",
      vehicle: first.outVehicle,
      driverName: first.outDriver,
      driverContact: first.outContact,
      direction: "to_airport",
      isGroupTrip: isGroup,
      groupPassengers,
      remarks: first.shiftLabel,
      rawRow: first as unknown as Record<string, string>,
    });
  });

  // ── Return grouping: same driver + vehicle + dropTime + shift = 1 trip ──
  const retGroups = new Map<string, RawRow[]>();
  passengerRows.forEach((p) => {
    if (!p.retDriver || !p.dropTime) return;
    const key = `${p.shiftLabel}||RET||${p.retDriver}||${p.retVehicle}||${p.dropTime}`;
    if (!retGroups.has(key)) retGroups.set(key, []);
    retGroups.get(key)!.push(p);
  });

  retGroups.forEach((passengers, key) => {
    const first = passengers[0];
    const isGroup = passengers.length > 1;

    const groupPassengers: GroupPassenger[] = passengers.map((p) => ({
      name: p.name,
      pickupPoint: p.pickupPoint || "—",
      pickupTime: p.dropTime,
    }));

    trips.push({
      id: `${sheetName}-${key}-ret`,
      sheetName,
      sheetType: "airport_ops",
      passengerName: isGroup
        ? `${first.name} +${passengers.length - 1} others`
        : first.name,
      pickupTime: first.dropTime,
      pickupTimeSortable: toMinutes(first.dropTime),
      pickupLocation: "Mopa Airport (GOX)",
      dropLocation: isGroup
        ? `${passengers.length} drop stops`
        : first.pickupPoint || "Residence",
      vehicle: first.retVehicle,
      driverName: first.retDriver,
      driverContact: first.retContact,
      direction: "from_airport",
      isGroupTrip: isGroup,
      groupPassengers,
      remarks: first.shiftLabel,
      rawRow: first as unknown as Record<string, string>,
    });
  });

  return trips;
}

// ── Direction Badge ────────────────────────────────────────────────────────
function DirectionBadge({ direction }: { direction: Trip["direction"] }) {
  const config = {
    to_airport: {
      label: "→ Airport",
      cls: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    },
    from_airport: {
      label: "← Airport",
      cls: "bg-green-500/20 text-green-300 border-green-500/30",
    },
    to_drop: {
      label: "→ Drop",
      cls: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    },
    from_drop: {
      label: "← Return",
      cls: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    },
  };
  const c = config[direction];
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${c.cls}`}
    >
      {c.label}
    </span>
  );
}

// ── Sheet Type Badge ───────────────────────────────────────────────────────
function SheetBadge({ type }: { type: UploadedFile["type"] }) {
  const config = {
    fly91: { label: "FLY91 Crew", cls: "text-blue-400" },
    newstaff: { label: "New Staff", cls: "text-purple-400" },
    airport_ops: { label: "Airport Ops", cls: "text-yellow-400" },
  };
  const c = config[type];
  return <span className={`text-xs ${c.cls}`}>{c.label}</span>;
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ScheduleAnalytics() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [view, setView] = useState<"upload" | "dashboard">("upload");
  const [activeTab, setActiveTab] = useState<
    "timeline" | "drivers" | "availability"
  >("timeline");
  const [search, setSearch] = useState("");
  const [availabilityQuery, setAvailabilityQuery] = useState("");
  const [availabilityHours, setAvailabilityHours] = useState(3);
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File processing ──────────────────────────────────────────────────────
  const processFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const rows = result.data as Record<string, string>[];
          const type = detectSheetType(rows);
          const sheetName = file.name.replace(/\.(csv|xlsx|xls)$/i, "");

          const trips =
            type === "fly91"
              ? parseFly91Sheet(rows, sheetName)
              : type === "newstaff"
                ? parseNewStaffSheet(rows, sheetName)
                : parseAirportOpsSheet(rows, sheetName);

          setUploadedFiles((prev) =>
            prev.find((f) => f.name === file.name)
              ? prev
              : [...prev, { name: file.name, trips, type }],
          );
          setAllTrips((prev) => {
            const ids = new Set(prev.map((t) => t.id));
            return [...prev, ...trips.filter((t) => !ids.has(t.id))];
          });
        },
      });
    });
  };

  const removeFile = (fileName: string) => {
    const file = uploadedFiles.find((f) => f.name === fileName);
    if (!file) return;
    const ids = new Set(file.trips.map((t) => t.id));
    setUploadedFiles((prev) => prev.filter((f) => f.name !== fileName));
    setAllTrips((prev) => prev.filter((t) => !ids.has(t.id)));
  };

  // ── Derived data ─────────────────────────────────────────────────────────
  const sortedTrips = [...allTrips]
    .filter((t) => t.pickupTimeSortable >= 0)
    .sort((a, b) => a.pickupTimeSortable - b.pickupTimeSortable);

  const filteredTrips = sortedTrips.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [
      t.passengerName,
      t.driverName,
      t.pickupLocation,
      t.dropLocation,
      t.vehicle,
      t.passengerContact || "",
      ...(t.groupPassengers?.map((p) => p.name) || []),
      ...(t.groupPassengers?.map((p) => p.pickupPoint) || []),
    ].some((s) => s.toLowerCase().includes(q));
  });

  // Driver stats — group trips count as 1 ride per driver
  const driverMap = new Map<string, Trip[]>();
  allTrips.forEach((t) => {
    if (!t.driverName) return;
    if (!driverMap.has(t.driverName)) driverMap.set(t.driverName, []);
    driverMap.get(t.driverName)!.push(t);
  });
  const driverStats = Array.from(driverMap.entries())
    .map(([name, trips]) => ({
      name,
      trips: trips.sort((a, b) => a.pickupTimeSortable - b.pickupTimeSortable),
      count: trips.length,
    }))
    .sort((a, b) => b.count - a.count);

  // Availability
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const windowEnd = currentMinutes + availabilityHours * 60;

  const relevantTrips = availabilityQuery
    ? sortedTrips.filter(
        (t) =>
          t.pickupLocation
            .toLowerCase()
            .includes(availabilityQuery.toLowerCase()) &&
          t.pickupTimeSortable >= currentMinutes &&
          t.pickupTimeSortable <= windowEnd,
      )
    : [];
  const busyDrivers = new Set(
    relevantTrips.map((t) => t.driverName).filter(Boolean),
  );
  const availableDrivers = driverStats.filter((d) => !busyDrivers.has(d.name));

  const totalPassengers = allTrips.reduce((acc, t) => {
    return (
      acc + (t.isGroupTrip && t.groupPassengers ? t.groupPassengers.length : 1)
    );
  }, 0);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-[#0f1117] text-white"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Header ── */}
      <div className="border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 bg-[#0f1117]/95 backdrop-blur z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#25D366] rounded-lg flex items-center justify-center">
            <BarChart2 size={14} className="text-black" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-none">
              Schedule Analytics
            </h1>
            <p className="text-[10px] text-white/30 mt-0.5">FLY91 Operations</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setView("upload")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              view === "upload"
                ? "bg-white/10 text-white"
                : "text-white/30 hover:text-white"
            }`}
          >
            <Upload size={11} className="inline mr-1" />
            Files ({uploadedFiles.length})
          </button>
          {allTrips.length > 0 && (
            <button
              onClick={() => setView("dashboard")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                view === "dashboard"
                  ? "bg-[#25D366] text-black"
                  : "text-white/30 hover:text-white"
              }`}
            >
              Dashboard
            </button>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          UPLOAD VIEW
      ════════════════════════════════════════════════════════════ */}
      {view === "upload" && (
        <div className="max-w-xl mx-auto px-4 py-10">
          <h2 className="text-xl font-bold mb-1">Schedule Sheets</h2>
          <p className="text-white/40 text-sm mb-8">
            Upload CSV exports. Supports FLY91 crew sheets, New Staff sheets,
            and Airport Ops/Transfers sheets. Files stay loaded until manually
            removed.
          </p>

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              processFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-[#25D366] bg-[#25D366]/5"
                : "border-white/15 hover:border-white/30 hover:bg-white/[0.02]"
            }`}
          >
            <Upload size={28} className="mx-auto mb-3 text-white/25" />
            <p className="font-semibold text-white/60 text-sm">
              Drop CSV files here
            </p>
            <p className="text-xs text-white/25 mt-1">
              or click to browse · multiple files supported
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && processFiles(e.target.files)}
            />
          </div>

          {/* Sheet type legend */}
          <div className="mt-5 flex gap-4 text-xs text-white/30">
            <span>
              <span className="text-blue-400">●</span> FLY91 Crew
            </span>
            <span>
              <span className="text-purple-400">●</span> New Staff
            </span>
            <span>
              <span className="text-yellow-400">●</span> Airport Ops
            </span>
          </div>

          {/* Loaded files */}
          {uploadedFiles.length > 0 && (
            <div className="mt-5 space-y-2">
              <p className="text-[11px] text-white/30 uppercase tracking-wider font-semibold mb-3">
                Loaded Files
              </p>
              {uploadedFiles.map((f) => (
                <div
                  key={f.name}
                  className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10"
                >
                  <FileText size={14} className="text-[#25D366] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-xs text-white/35">
                      {f.trips.length} trip entries ·{" "}
                      <SheetBadge type={f.type} />
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(f.name)}
                    className="text-white/25 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              <button
                onClick={() => setView("dashboard")}
                className="w-full mt-3 py-3 bg-[#25D366] hover:bg-[#20c45a] text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <BarChart2 size={15} /> Open Dashboard
              </button>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          DASHBOARD VIEW
      ════════════════════════════════════════════════════════════ */}
      {view === "dashboard" && (
        <div className="px-4 py-5 max-w-4xl mx-auto">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {[
              {
                icon: <Clock size={14} />,
                label: "Trip Entries",
                value: allTrips.length,
                color: "text-blue-400",
              },
              {
                icon: <Users size={14} />,
                label: "Passengers",
                value: totalPassengers,
                color: "text-[#25D366]",
              },
              {
                icon: <Truck size={14} />,
                label: "Drivers",
                value: driverMap.size,
                color: "text-orange-400",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/5 rounded-xl p-3.5 border border-white/10"
              >
                <div className={`${s.color} mb-1.5`}>{s.icon}</div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-[10px] text-white/35">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl mb-5 border border-white/10">
            {(["timeline", "drivers", "availability"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-[#25D366] text-black"
                    : "text-white/40 hover:text-white"
                }`}
              >
                {tab === "timeline"
                  ? "🕐 Timeline"
                  : tab === "drivers"
                    ? "🚗 Drivers"
                    : "📍 Availability"}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════
              TIMELINE TAB
          ══════════════════════════════════════════ */}
          {activeTab === "timeline" && (
            <div>
              {/* Search */}
              <div className="relative mb-3">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, driver, location, vehicle..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#25D366]/40"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Trip cards */}
              <div className="space-y-2">
                {filteredTrips.length === 0 && (
                  <div className="text-center py-14 text-white/25">
                    <AlertCircle size={22} className="mx-auto mb-2" />
                    <p className="text-sm">
                      {search
                        ? "No trips match your search"
                        : "No trips with valid times found"}
                    </p>
                  </div>
                )}

                {filteredTrips.map((trip) => {
                  const isExpanded = expandedTrip === trip.id;
                  return (
                    <div
                      key={trip.id}
                      className="bg-white/[0.04] border border-white/10 rounded-xl overflow-hidden hover:bg-white/[0.06] transition-colors"
                    >
                      <div className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          {/* Time column */}
                          <div className="text-center shrink-0 w-12">
                            <p className="text-base font-bold text-[#25D366] leading-none">
                              {trip.pickupTime}
                            </p>
                            {trip.reportingTime && (
                              <p className="text-[10px] text-white/25 mt-0.5">
                                rpt {trip.reportingTime}
                              </p>
                            )}
                          </div>

                          {/* Main info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <DirectionBadge direction={trip.direction} />
                              {trip.isGroupTrip && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-yellow-500/15 text-yellow-300 border-yellow-500/30">
                                  Group
                                </span>
                              )}
                              <span className="text-[10px] text-white/20 bg-white/5 px-1.5 py-0.5 rounded">
                                {trip.sheetName}
                              </span>
                            </div>
                            <p className="font-semibold text-sm text-white leading-snug">
                              {trip.passengerName}
                            </p>
                            {trip.passengerContact && (
                              <p className="text-xs text-white/35">
                                {trip.passengerContact}
                              </p>
                            )}
                            <div className="flex items-center gap-1 mt-1 text-[11px] text-white/40 flex-wrap">
                              <MapPin size={10} className="shrink-0" />
                              <span className="truncate max-w-[130px]">
                                {trip.pickupLocation}
                              </span>
                              <ArrowRight size={10} className="shrink-0" />
                              <span className="truncate max-w-[130px]">
                                {trip.dropLocation}
                              </span>
                            </div>
                          </div>

                          {/* Driver / vehicle */}
                          <div className="text-right shrink-0 space-y-1">
                            {trip.vehicle && (
                              <p className="text-[11px] font-mono bg-white/8 px-2 py-0.5 rounded text-white/70">
                                {trip.vehicle}
                              </p>
                            )}
                            {trip.driverName && (
                              <p className="text-[11px] text-white/45">
                                {trip.driverName}
                              </p>
                            )}
                            {trip.driverContact && (
                              <p className="text-[10px] text-white/25">
                                {trip.driverContact}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Shift label / remarks */}
                        {trip.remarks && (
                          <p className="mt-2 text-xs text-yellow-300/70 bg-yellow-400/5 border border-yellow-400/10 rounded-lg px-3 py-1.5">
                            ⚠ {trip.remarks}
                          </p>
                        )}

                        {/* Expand toggle for group trips */}
                        {trip.isGroupTrip && trip.groupPassengers && (
                          <button
                            onClick={() =>
                              setExpandedTrip(isExpanded ? null : trip.id)
                            }
                            className="mt-2 flex items-center gap-1 text-[11px] text-[#25D366]/70 hover:text-[#25D366] transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp size={12} />
                            ) : (
                              <ChevronRight size={12} />
                            )}
                            {isExpanded ? "Hide" : "Show"}{" "}
                            {trip.groupPassengers.length} passengers
                          </button>
                        )}
                      </div>

                      {/* Expanded group passengers */}
                      {trip.isGroupTrip &&
                        trip.groupPassengers &&
                        isExpanded && (
                          <div className="border-t border-white/10 bg-black/20 px-4 py-3 space-y-2">
                            <p className="text-[10px] text-white/25 uppercase tracking-wider font-semibold mb-2">
                              Passengers in this group
                            </p>
                            {trip.groupPassengers.map((p, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-3 text-xs"
                              >
                                <span className="text-[#25D366] font-mono w-11 shrink-0 text-right">
                                  {p.pickupTime !== "—" ? p.pickupTime : ""}
                                </span>
                                <span className="font-medium text-white/80">
                                  {p.name}
                                </span>
                                {p.pickupPoint !== "—" && (
                                  <span className="text-white/35 truncate">
                                    · {p.pickupPoint}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════
              DRIVERS TAB
          ══════════════════════════════════════════ */}
          {activeTab === "drivers" && (
            <div className="space-y-2">
              {driverStats.map((d) => {
                const isOpen = expandedDriver === d.name;
                const uniqueRoutes = [
                  ...new Set(
                    d.trips.map(
                      (t) => `${t.pickupLocation} → ${t.dropLocation}`,
                    ),
                  ),
                ];
                // Total actual passengers this driver handled
                const totalPax = d.trips.reduce(
                  (acc, t) =>
                    acc +
                    (t.isGroupTrip && t.groupPassengers
                      ? t.groupPassengers.length
                      : 1),
                  0,
                );

                return (
                  <div
                    key={d.name}
                    className="bg-white/[0.04] border border-white/10 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedDriver(isOpen ? null : d.name)}
                      className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#25D366]/15 flex items-center justify-center shrink-0">
                        <Truck size={13} className="text-[#25D366]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{d.name}</p>
                        <p className="text-[11px] text-white/35 truncate">
                          {uniqueRoutes.slice(0, 2).join(" · ")}
                          {uniqueRoutes.length > 2
                            ? ` +${uniqueRoutes.length - 2} more`
                            : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <div>
                          <p className="text-lg font-bold text-[#25D366]">
                            {d.count}
                          </p>
                          <p className="text-[10px] text-white/25">
                            rides · {totalPax} pax
                          </p>
                        </div>
                        {isOpen ? (
                          <ChevronUp size={14} className="text-white/25" />
                        ) : (
                          <ChevronDown size={14} className="text-white/25" />
                        )}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-white/10 divide-y divide-white/5 bg-black/15">
                        {d.trips.map((trip) => (
                          <div key={trip.id} className="px-4 py-2.5">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-[#25D366] w-11 shrink-0 text-right">
                                {trip.pickupTime}
                              </span>
                              <DirectionBadge direction={trip.direction} />
                              {trip.isGroupTrip && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">
                                  Group
                                </span>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white/80 truncate">
                                  {trip.passengerName}
                                </p>
                                <div className="flex items-center gap-1 text-[11px] text-white/35">
                                  <span className="truncate max-w-[100px]">
                                    {trip.pickupLocation}
                                  </span>
                                  <ArrowRight size={9} />
                                  <span className="truncate max-w-[100px]">
                                    {trip.dropLocation}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[11px] font-mono text-white/25 shrink-0">
                                {trip.vehicle}
                              </span>
                            </div>

                            {/* Group passengers inline inside driver view */}
                            {trip.isGroupTrip && trip.groupPassengers && (
                              <div className="mt-2 ml-14 space-y-1">
                                {trip.groupPassengers.map((p, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-2 text-[11px] text-white/40"
                                  >
                                    <span className="font-mono w-9 shrink-0 text-right text-white/25">
                                      {p.pickupTime !== "—" ? p.pickupTime : ""}
                                    </span>
                                    <span className="font-medium text-white/60">
                                      {p.name}
                                    </span>
                                    {p.pickupPoint !== "—" && (
                                      <span className="text-white/25 truncate">
                                        · {p.pickupPoint}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ══════════════════════════════════════════
              AVAILABILITY TAB
          ══════════════════════════════════════════ */}
          {activeTab === "availability" && (
            <div>
              <p className="text-xs text-white/40 mb-4 leading-relaxed">
                Enter an area to see which drivers have upcoming pickups there
                and who might be free for a new booking.
              </p>

              <div className="flex gap-2 mb-5">
                <div className="relative flex-1">
                  <MapPin
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                  />
                  <input
                    value={availabilityQuery}
                    onChange={(e) => setAvailabilityQuery(e.target.value)}
                    placeholder="Enter area (e.g. Mapusa, Old Goa, Porvorim...)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#25D366]/40"
                  />
                </div>
                <select
                  value={availabilityHours}
                  onChange={(e) => setAvailabilityHours(Number(e.target.value))}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 6].map((h) => (
                    <option key={h} value={h} className="bg-[#1a1f2e]">
                      {h}hr
                    </option>
                  ))}
                </select>
              </div>

              {availabilityQuery && (
                <div className="space-y-5">
                  {/* Upcoming pickups from that area */}
                  <div>
                    <p className="text-[11px] text-white/30 uppercase tracking-wider font-semibold mb-2">
                      Upcoming pickups from "{availabilityQuery}" · next{" "}
                      {availabilityHours}h
                    </p>
                    {relevantTrips.length === 0 ? (
                      <p className="text-sm text-white/30 bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                        No scheduled pickups from this area in the next{" "}
                        {availabilityHours} hours
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {relevantTrips.map((trip) => (
                          <div
                            key={trip.id}
                            className="bg-orange-500/8 border border-orange-500/20 rounded-xl px-4 py-3"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-sm">
                                  {trip.passengerName}
                                </p>
                                <div className="flex items-center gap-1 text-[11px] text-white/40 mt-0.5">
                                  <span>{trip.pickupLocation}</span>
                                  <ArrowRight size={9} />
                                  <span>{trip.dropLocation}</span>
                                </div>
                                <p className="text-[11px] text-white/30 mt-0.5">
                                  {trip.driverName} · {trip.vehicle}
                                </p>
                              </div>
                              <p className="text-base font-bold text-orange-300 shrink-0">
                                {trip.pickupTime}
                              </p>
                            </div>
                            {/* Group passengers in availability view too */}
                            {trip.isGroupTrip && trip.groupPassengers && (
                              <div className="mt-2 pt-2 border-t border-orange-500/10 space-y-1">
                                {trip.groupPassengers.map((p, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-2 text-[11px] text-white/40"
                                  >
                                    <span className="font-mono w-9 text-right text-white/25">
                                      {p.pickupTime !== "—" ? p.pickupTime : ""}
                                    </span>
                                    <span className="text-white/60 font-medium">
                                      {p.name}
                                    </span>
                                    {p.pickupPoint !== "—" && (
                                      <span className="text-white/25 truncate">
                                        · {p.pickupPoint}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Drivers with no pickups from that area */}
                  <div>
                    <p className="text-[11px] text-white/30 uppercase tracking-wider font-semibold mb-2">
                      Drivers with no pickups from this area (potentially free)
                    </p>
                    <div className="space-y-2">
                      {availableDrivers.slice(0, 10).map((d) => (
                        <div
                          key={d.name}
                          className="bg-green-500/8 border border-green-500/20 rounded-xl px-4 py-3 flex justify-between items-center"
                        >
                          <div>
                            <p className="font-semibold text-sm">{d.name}</p>
                            <p className="text-[11px] text-white/30">
                              {d.count} rides today
                            </p>
                          </div>
                          <span className="text-xs text-green-400 font-semibold bg-green-500/15 px-2 py-0.5 rounded-full">
                            Available
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
