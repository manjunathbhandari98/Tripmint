/* eslint-disable react-refresh/only-export-components */
/**
 * PasteImport — paste one or more tab-separated rows from Excel/Sheets
 * and auto-detect which sheet format they came from, then fill the booking form.
 *
 * Supported sheet formats:
 *
 * A) Airport Operations / Transfers
 *    Cols: Date&Shift | Name | Contact | PickUp Point | PickUp Time | VehicleNo | DriverName | DriverContact | _ | DropTime | VehicleNo | DriverName | DriverContact
 *
 * B) New Staff
 *    Cols: Agent | VerifiedBy | Names | Contact | PickupLocation | DropLocation | PickupTime | Vehicle | DriverName | DriverContact | VehicleCategory | DropTime | ...
 *
 * C) FLY91 Crew
 *    Cols: ReportingTime | Names | PickupTime | Location | Vehicle | DriverName | DriverNumber | Remarks | Remark | DropTime | Vehicle | DriverName | DriverNumber
 */

import { ClipboardPaste, X } from "lucide-react";
import { useRef, useState } from "react";
import type { MessageType, Passenger } from "../../messageTemplate";

interface ParsedBooking {
  // passengers
  passengerName: string;
  passengerPhone: string;
  passengers: Passenger[]; // for multi-passenger
  bookingMode: "single" | "same_pickup" | "same_drop";

  // locations
  pickupLocations: string[];
  dropLocations: string[];

  // schedule
  pickupDate: string;
  pickupTime: string;

  // driver (pickup leg)
  driverName: string;
  driverNumber: string;
  vehicleNumber: string;

  additionalNotes: string;
}

// ── helpers ──────────────────────────────────────────────────────────

const clean = (s: string) =>
  s
    .replace(/\uFFFD/g, "")
    .replace(/\t|\n/g, " ")
    .trim();

/** Convert DD/MMM/YY or DD/MMM/YYYY → YYYY-MM-DD */
const parseDate = (raw: string): string => {
  const months: Record<string, string> = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12",
  };
  // "25/FEB/26 04:00-12:30" or "25/FEB/2026"
  const m = raw.match(/(\d{1,2})[/-]([A-Za-z]{3})[/-](\d{2,4})/);
  if (!m) return "";
  const day = m[1].padStart(2, "0");
  const mon = months[m[2].toLowerCase()] ?? "01";
  const yr = m[3].length === 2 ? `20${m[3]}` : m[3];
  return `${yr}-${mon}-${day}`;
};

/** Normalise time "3:00" → "03:00", handles "15;35" typo */
const parseTime = (raw: string): string => {
  const t = raw.replace(";", ":").trim();
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return "";
  return `${m[1].padStart(2, "0")}:${m[2]}`;
};

/** Split tab-delimited pasted text into rows×cols */
const tabParse = (text: string): string[][] =>
  text
    .split(/\r?\n/)
    .map((line) => line.split("\t").map(clean))
    .filter((row) => row.some((c) => c.length > 0));

// ── Detect which sheet format ────────────────────────────────────────

type SheetType = "airport" | "newstaff" | "fly91" | "unknown";

const detectSheet = (rows: string[][]): SheetType => {
  // Look at all non-empty cells across first 2 rows
  const sample = rows
    .slice(0, 2)
    .flat()
    .map((c) => c.toLowerCase());
  if (
    sample.some(
      (c) =>
        c.includes("reporting time") ||
        c.includes("capt,") ||
        c.includes("tfo,"),
    )
  )
    return "fly91";
  if (sample.some((c) => c.includes("agent") || c.includes("verified")))
    return "newstaff";
  if (
    sample.some((c) => c.includes("date and shift") || c.includes("shift time"))
  )
    return "airport";

  // Fallback: sniff column count / content
  const first = rows[0] ?? [];
  if (first.length >= 13) {
    // airport: col[0] has date pattern or blank, col[1] is name
    if (/^\d{1,2}[/-][A-Za-z]{3}/.test(first[0]) || first[0] === "")
      return "airport";
  }
  return "unknown";
};

// ── Sheet A: Airport Operations ──────────────────────────────────────
// Row structure (repeating multi-passenger groups):
//  col0: date+shift (first row of group, blank for subsequent)
//  col1: name
//  col2: contact
//  col3: pickup point
//  col4: pickup time
//  col5: vehicle no
//  col6: driver name
//  col7: driver contact
//  col9: drop time
//  col10: vehicle no (drop)
//  col11: driver name (drop)
//  col12: driver contact (drop)

const parseAirport = (rows: string[][]): ParsedBooking | null => {
  // Filter out separator / garbage rows (all same char)
  const data = rows.filter((r) => {
    const joined = r
      .join("")
      .replace(/\uFFFD/g, "")
      .trim();
    return joined.length > 0 && !/^[\uFFFD\s]+$/.test(joined);
  });

  if (data.length === 0) return null;

  const first = data[0];
  const dateRaw = first[0] ?? "";
  const date = parseDate(dateRaw);

  // Pickup time — walk rows until we find one
  let pickupTime = "";
  let driverName = "";
  let driverNumber = "";
  let vehicleNumber = "";

  const passengers: Passenger[] = [];
  const pickupLocs: string[] = [];

  for (const row of data) {
    const name = clean(row[1] ?? "");
    const phone = clean(row[2] ?? "").replace(/\D/g, "");
    const pickup = clean(row[3] ?? "");
    const pTime = parseTime(row[4] ?? "");
    const veh = clean(row[5] ?? "");
    const drv = clean(row[6] ?? "");
    const drvPh = clean(row[7] ?? "").replace(/\D/g, "");

    if (!name || /^\uFFFD/.test(name)) continue;

    passengers.push({
      name,
      phone,
      individualLocation: pickup,
      locationLink: "",
    });
    if (pickup) pickupLocs.push(pickup);
    if (pTime && !pickupTime) pickupTime = pTime;
    if (veh && !vehicleNumber) vehicleNumber = veh;
    if (drv && !driverName) driverName = drv;
    if (drvPh && !driverNumber) driverNumber = drvPh;
  }

  // Drop info from first row
  const dropTime = parseTime(first[9] ?? "");
  const dropVeh = clean(first[10] ?? "");
  const dropDriver = clean(first[11] ?? "");
  const dropDriverPh = clean(first[12] ?? "").replace(/\D/g, "");

  // If no pickup driver found, use drop driver
  if (!driverName) driverName = dropDriver;
  if (!driverNumber) driverNumber = dropDriverPh;
  if (!vehicleNumber) vehicleNumber = dropVeh;

  const notes = dropTime ? `Drop time: ${dropTime}` : "";

  if (passengers.length === 1) {
    return {
      bookingMode: "single",
      passengerName: passengers[0].name,
      passengerPhone: passengers[0].phone,
      passengers: [],
      pickupLocations: passengers[0].individualLocation
        ? [passengers[0].individualLocation]
        : [""],
      dropLocations: ["Manohar International Airport (GOX) - Goa"],
      pickupDate: date,
      pickupTime,
      driverName,
      driverNumber,
      vehicleNumber,
      additionalNotes: notes,
      locationLink: "",
      sharedLocation: "",
      sharedLocationLink: "",
    } as unknown as ParsedBooking;
  }

  return {
    bookingMode: "same_drop",
    passengerName: passengers[0]?.name ?? "",
    passengerPhone: passengers[0]?.phone ?? "",
    passengers,
    pickupLocations: pickupLocs.length ? pickupLocs : [""],
    dropLocations: ["Manohar International Airport (GOX) - Goa"],
    pickupDate: date,
    pickupTime,
    driverName,
    driverNumber,
    vehicleNumber,
    additionalNotes: notes,
    locationLink: "",
    sharedLocation: "",
    sharedLocationLink: "",
  } as unknown as ParsedBooking;
};

// ── Sheet B: New Staff ───────────────────────────────────────────────
// col0: Agent  col1: VerifiedBy  col2: Names  col3: Contact
// col4: PickupLocation  col5: DropLocation  col6: PickupTime
// col7: Vehicle  col8: DriverName  col9: DriverContact
// col11: DropTime  col12: DropVehicle  col13: DropDriver  col14: DropDriverContact

const parseNewStaff = (rows: string[][]): ParsedBooking | null => {
  const data = rows.filter((r) => r.some((c) => c.trim()));
  if (data.length === 0) return null;

  const first = data[0];
  const passengers: Passenger[] = [];

  for (const row of data) {
    const name = clean(row[2] ?? "");
    const phone = clean(row[3] ?? "").replace(/\D/g, "");
    const pickup = clean(row[4] ?? "");
    if (!name) continue;
    passengers.push({
      name,
      phone,
      individualLocation: pickup,
      locationLink: "",
    });
  }

  const pickupTime = parseTime(first[6] ?? "");
  const vehicleNumber = clean(first[7] ?? "");
  const driverName = clean(first[8] ?? "");
  const driverNumber = clean(first[9] ?? "").replace(/\D/g, "");
  const dropLoc =
    clean(first[5] ?? "") || "Manohar International Airport (GOX) - Goa";
  const dropTime = parseTime(first[11] ?? "");
  const notes = dropTime ? `Drop time: ${dropTime}` : "";

  if (passengers.length === 1) {
    return {
      bookingMode: "single",
      passengerName: passengers[0].name,
      passengerPhone: passengers[0].phone,
      passengers: [],
      pickupLocations: [passengers[0].individualLocation || ""],
      dropLocations: [dropLoc],
      pickupDate: "",
      pickupTime,
      driverName,
      driverNumber,
      vehicleNumber,
      additionalNotes: notes,
    } as unknown as ParsedBooking;
  }

  return {
    bookingMode: "same_drop",
    passengerName: passengers[0]?.name ?? "",
    passengerPhone: passengers[0]?.phone ?? "",
    passengers,
    pickupLocations: passengers
      .map((p) => p.individualLocation)
      .filter(Boolean),
    dropLocations: [dropLoc],
    pickupDate: "",
    pickupTime,
    driverName,
    driverNumber,
    vehicleNumber,
    additionalNotes: notes,
  } as unknown as ParsedBooking;
};

// ── Sheet C: FLY91 Crew ──────────────────────────────────────────────
// col0: ReportingTime  col1: Names  col2: PickupTime  col3: Location
// col4: Vehicle  col5: DriverName  col6: DriverNumber  col7: Remarks
// col9: DropTime  col10: DropVehicle  col11: DropDriver  col12: DropDriverNumber

const parseFly91 = (rows: string[][]): ParsedBooking | null => {
  const data = rows.filter((r) => r.some((c) => c.trim()));
  if (data.length === 0) return null;

  const first = data[0];

  // Names: "Capt,Yogesh,Dahiya" → "Yogesh Dahiya" or keep as-is
  const normName = (raw: string) => {
    const cleaned = clean(raw).replace(/\uFFFD/g, "");
    // "Capt,First,Last" or "TFO,First,Last"
    const m = cleaned.match(/^(?:Capt|TFO|FO|SO)[,\s]+(.+)/i);
    if (m) return m[1].replace(/,/g, " ").trim();
    return cleaned;
  };

  const passengers: Passenger[] = [];
  for (const row of data) {
    const rawName = row[1] ?? "";
    const name = normName(rawName);
    if (!name) continue;
    passengers.push({
      name,
      phone: "",
      individualLocation: "",
      locationLink: "",
    });
  }

  const pickupTime = parseTime(first[2] ?? "");
  const pickupLoc = clean(first[3] ?? "");
  const vehicleNumber = clean(first[4] ?? "");
  const driverName = clean(first[5] ?? "");
  const driverNumber = clean(first[6] ?? "").replace(/\D/g, "");
  const remarks = [clean(first[7] ?? ""), clean(first[8] ?? "")]
    .filter(Boolean)
    .join(" | ");
  const dropTime = parseTime(first[9] ?? "");
  const dropVeh = clean(first[10] ?? "");
  const dropDriver = clean(first[11] ?? "");
  const reportingTime = clean(first[0] ?? "");

  const notes = [
    reportingTime ? `Reporting: ${reportingTime}` : "",
    dropTime ? `Drop: ${dropTime}` : "",
    dropVeh ? `Drop vehicle: ${dropVeh}` : "",
    dropDriver ? `Drop driver: ${dropDriver}` : "",
    remarks,
  ]
    .filter(Boolean)
    .join(" | ");

  if (passengers.length === 1) {
    return {
      bookingMode: "single",
      passengerName: passengers[0].name,
      passengerPhone: "",
      passengers: [],
      pickupLocations: [pickupLoc || ""],
      dropLocations: ["Manohar International Airport (GOX) - Goa"],
      pickupDate: "",
      pickupTime,
      driverName,
      driverNumber,
      vehicleNumber,
      additionalNotes: notes,
    } as unknown as ParsedBooking;
  }

  return {
    bookingMode: "same_drop",
    passengerName: passengers[0]?.name ?? "",
    passengerPhone: "",
    passengers,
    pickupLocations: [pickupLoc || ""],
    dropLocations: ["Manohar International Airport (GOX) - Goa"],
    pickupDate: "",
    pickupTime,
    driverName,
    driverNumber,
    vehicleNumber,
    additionalNotes: notes,
  } as unknown as ParsedBooking;
};

// ── Main parser ──────────────────────────────────────────────────────

export const parseExcelPaste = (
  text: string,
): (ParsedBooking & { sheetType: SheetType }) | null => {
  const rows = tabParse(text);
  if (rows.length === 0) return null;

  const sheetType = detectSheet(rows);

  // Strip header row if detected
  const isHeader = (row: string[]) =>
    row.some((c) =>
      /^(name|names|agent|reporting|date and shift)/i.test(c.trim()),
    );
  const dataRows = isHeader(rows[0]) ? rows.slice(1) : rows;

  let parsed: ParsedBooking | null = null;
  if (sheetType === "airport") parsed = parseAirport(dataRows);
  else if (sheetType === "newstaff") parsed = parseNewStaff(dataRows);
  else if (sheetType === "fly91") parsed = parseFly91(dataRows);
  else {
    // Unknown — try airport heuristic (most common)
    parsed = parseAirport(dataRows);
    if (!parsed) parsed = parseNewStaff(dataRows);
  }

  if (!parsed) return null;
  return { ...parsed, sheetType };
};

// ── UI Component ─────────────────────────────────────────────────────

interface Props {
  onImport: (
    data: Partial<MessageType> & {
      passengers?: Passenger[];
      bulk?: { names: string; phones: string; locations: string };
    },
  ) => void;
}

const SHEET_LABELS: Record<SheetType, string> = {
  airport: "✈ Airport Operations",
  newstaff: "👤 New Staff",
  fly91: "🛫 FLY91 Crew",
  unknown: "📋 Unknown format",
};

export const PasteImport = ({ onImport }: Props) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ReturnType<
    typeof parseExcelPaste
  > | null>(null);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData("text");
    setText(pasted);
    tryParse(pasted);
  };

  const tryParse = (raw: string) => {
    setError("");
    setPreview(null);
    if (!raw.trim()) return;
    const result = parseExcelPaste(raw);
    if (!result) {
      setError(
        "Could not detect a known sheet format. Make sure you copy full rows with Tab-separated columns.",
      );
      return;
    }
    setPreview(result);
  };

  const handleConfirm = () => {
    if (!preview) return;

    // Build bulk strings for multi-passenger modes
    const isMulti = preview.passengers && preview.passengers.length > 1;
    const bulk = isMulti
      ? {
          names: preview.passengers.map((p) => p.name).join("\n"),
          phones: preview.passengers.map((p) => p.phone).join("\n"),
          locations: preview.passengers
            .map((p) => p.individualLocation)
            .join("\n"),
        }
      : undefined;

    onImport({
      bookingMode: preview.bookingMode,
      passengerName: preview.passengerName,
      passengerPhone: preview.passengerPhone,
      passengers: preview.passengers,
      pickupLocations: preview.pickupLocations,
      dropLocations: preview.dropLocations,
      sharedLocation: isMulti ? (preview.dropLocations[0] ?? "") : "",
      sharedLocationLink: "",
      pickupDate: preview.pickupDate,
      pickupTime: preview.pickupTime,
      driverName: preview.driverName,
      driverNumber: preview.driverNumber,
      vehicleNumber: preview.vehicleNumber,
      additionalNotes: preview.additionalNotes,
      locationLink: "",
      otp: "",
      bulk,
    });

    setText("");
    setPreview(null);
    setOpen(false);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setTimeout(() => textareaRef.current?.focus(), 100);
        }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#e8faf4] border border-[#b2dfdb] text-[#075E54] text-sm font-medium hover:bg-[#d0f5ea] transition-all"
        title="Paste rows from Excel/Sheets"
      >
        <ClipboardPaste size={15} />
        Paste from Excel
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            style={{ backdropFilter: "blur(3px)" }}
            onClick={() => setOpen(false)}
          />

          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]"
            style={{
              animation: "sheetUp .25s cubic-bezier(.34,1.4,.64,1) both",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="font-bold text-gray-900">
                  Paste from Excel / Sheets
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Copy rows from Airport Ops, New Staff, or FLY91 sheet
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  tryParse(e.target.value);
                }}
                onPaste={handlePaste}
                placeholder={
                  "Select rows in Excel → Ctrl+C → click here → Ctrl+V\n\nWorks with all three sheet types automatically."
                }
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-mono focus:outline-none focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/15 resize-none transition-all placeholder:text-gray-400"
              />

              {error && (
                <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  <span className="text-base leading-none mt-0.5">⚠</span>
                  {error}
                </div>
              )}

              {preview && (
                <div className="space-y-3">
                  {/* Sheet type badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#e8faf4] text-[#075E54] border border-[#b2dfdb]">
                      {SHEET_LABELS[preview.sheetType]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {preview.passengers?.length > 1
                        ? `${preview.passengers.length} passengers detected`
                        : "1 passenger detected"}
                    </span>
                  </div>

                  {/* Preview card */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl divide-y divide-gray-100 text-sm overflow-hidden">
                    {preview.passengers?.length > 1 ? (
                      <div className="px-4 py-3 space-y-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Passengers
                        </p>
                        {preview.passengers.map((p, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#075E54] text-white text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <div>
                              <span className="font-medium text-gray-800">
                                {p.name}
                              </span>
                              {p.phone && (
                                <span className="text-gray-500 ml-2">
                                  {p.phone}
                                </span>
                              )}
                              {p.individualLocation && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {p.individualLocation}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <PreviewRow
                        label="Passenger"
                        value={`${preview.passengerName} ${preview.passengerPhone ? `· ${preview.passengerPhone}` : ""}`}
                      />
                    )}
                    <PreviewRow
                      label="Pickup"
                      value={
                        preview.pickupLocations.filter(Boolean).join(", ") ||
                        "—"
                      }
                    />
                    <PreviewRow
                      label="Drop"
                      value={
                        preview.dropLocations.filter(Boolean).join(", ") || "—"
                      }
                    />
                    {preview.pickupDate && (
                      <PreviewRow label="Date" value={preview.pickupDate} />
                    )}
                    {preview.pickupTime && (
                      <PreviewRow label="Time" value={preview.pickupTime} />
                    )}
                    {preview.driverName && (
                      <PreviewRow
                        label="Driver"
                        value={`${preview.driverName} ${preview.vehicleNumber ? `· ${preview.vehicleNumber}` : ""} ${preview.driverNumber ? `· ${preview.driverNumber}` : ""}`}
                      />
                    )}
                    {preview.additionalNotes && (
                      <PreviewRow
                        label="Notes"
                        value={preview.additionalNotes}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!preview}
                className="flex-1 py-2.5 rounded-xl bg-[#075E54] text-white text-sm font-bold hover:bg-[#064a43] transition-colors disabled:opacity-40"
              >
                Fill Form ↵
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes sheetUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

const PreviewRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-3 px-4 py-2.5">
    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-16 shrink-0 mt-0.5">
      {label}
    </span>
    <span className="text-gray-800 text-sm">{value}</span>
  </div>
);

export default PasteImport;
