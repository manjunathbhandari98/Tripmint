import {
  ArrowUpDown,
  MapPin,
  RotateCcw,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { BookingMode, MessageType, Passenger } from "../messageTemplate";
import { addDriver } from "../services/drivers";
import { useTheme } from "../theme/ThemeContext";
import Crewautocomplete from "./Crewautocomplete";
import DriverSearchInput from "./ui/DriverSearchInput";
import LocationInput from "./ui/LocationInput";

export type DraftType = MessageType & {
  id: string;
  savedAt: string;
  bulk?: { names: string; phones: string; locations: string };
};

interface Props {
  onGenerate: (data: MessageType) => void;
  onSaveDraft: (draft: DraftType) => void;
  initialDraft?: DraftType | null;
}

interface BulkInput {
  names: string;
  phones: string;
  locations: string;
}

const emptyPassenger = (): Passenger => ({
  name: "",
  phone: "",
  individualLocation: "",
  locationLink: "",
});

const emptyForm: MessageType = {
  bookingMode: "single",
  passengerName: "",
  passengerPhone: "",
  pickupLocations: [""],
  dropLocations: [""],
  locationLink: "",
  sharedLocation: "",
  sharedLocationLink: "",
  passengers: [emptyPassenger(), emptyPassenger()],
  pickupDate: "",
  pickupTime: "",
  driverName: "",
  driverNumber: "",
  vehicleNumber: "",
  otp: "",
  additionalNotes: "",
};

const emptyBulk: BulkInput = { names: "", phones: "", locations: "" };
const phoneRegex = /^[0-9]{10}$/;
const otpRegex = /^[0-9]{4,6}$/;

const parseLines = (raw: string) =>
  raw
    .split("\n")
    .map((l) => l.split("\t")[0].trim())
    .filter(Boolean);

const passengersToBulk = (passengers: Passenger[]): BulkInput => ({
  names: passengers
    .map((p) => p.name)
    .filter(Boolean)
    .join("\n"),
  phones: passengers
    .map((p) => p.phone)
    .filter(Boolean)
    .join("\n"),
  locations: passengers
    .map((p) => p.individualLocation)
    .filter(Boolean)
    .join("\n"),
});

// ─── ordered field IDs used for Enter-to-advance ────────────────────
const FIELD_IDS = [
  "passengerName",
  "passengerPhone",
  "pickup-0",
  "pickup-1",
  "drop-0",
  "drop-1",
  "locationLink",
  "driverName",
  "driverNumber",
  "vehicleNumber",
  "pickupDate",
  "pickupTime",
  "otp",
  "additionalNotes",
];

const focusField = (id: string) => {
  document.getElementById(id)?.focus();
};

const focusAfter = (currentId: string) => {
  const idx = FIELD_IDS.indexOf(currentId);
  if (idx === -1) return;
  for (let i = idx + 1; i < FIELD_IDS.length; i++) {
    const el = document.getElementById(FIELD_IDS[i]);
    if (el) {
      el.focus();
      return;
    }
  }
};

// ─── Component ─────────────────────────────────────────────────────
const BookingForm = ({ onGenerate, onSaveDraft, initialDraft }: Props) => {
  const [formData, setFormData] = useState<MessageType>(
    initialDraft ?? emptyForm,
  );
  const [driverRefreshKey, setDriverRefreshKey] = useState(0);
  const [bulk, setBulk] = useState<BulkInput>(() => {
    if (!initialDraft) return emptyBulk;
    if (initialDraft.bulk) return initialDraft.bulk;
    if (
      initialDraft.bookingMode !== "single" &&
      initialDraft.passengers?.length
    )
      return passengersToBulk(initialDraft.passengers);
    return emptyBulk;
  });
  const [includeOTP, setIncludeOTP] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeDateTime, setIncludeDateTime] = useState(true);

  // refs for programmatic focus
  const timeRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);

  const { tokens } = useTheme();

  const accentText = { color: tokens.accent };

  // const accentSoft = {
  //   background: `${tokens.accent}15`,
  //   borderColor: tokens.accent,
  //   color: tokens.accent,
  // };

  // const accentButton = {
  //   background: tokens.accent,
  //   borderColor: tokens.accent,
  //   color: "white",
  // };

  // const accentToggle = (state: boolean) => ({
  //   backgroundColor: state ? tokens.accent : "#d1d5db",
  // });

  const { today, tomorrow, currentTime } = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const today = now.toISOString().split("T")[0];
    const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const tmr = new Date(now);
    tmr.setDate(now.getDate() + 1);
    return { today, tomorrow: tmr.toISOString().split("T")[0], currentTime };
  }, []);

  const set = useCallback(
    (key: keyof MessageType, value: unknown) =>
      setFormData((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const setMode = (mode: BookingMode) => {
    set("bookingMode", mode);
    setBulk(emptyBulk);
  };

  const setLocationLink = () => {
    const value = formData.locationLink?.trim();
    if (!value) return;
    if (value.includes("google.com/maps")) return;
    const coordsMatch = value.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
    if (coordsMatch) {
      const lat = coordsMatch[1];
      const lng = coordsMatch[2];
      set("locationLink", `https://maps.google.com/?q=${lat},${lng}`);
    }
  };

  // ── helpers ────────────────────────────────────────────────────────
  const updateLoc = (
    type: "pickupLocations" | "dropLocations",
    i: number,
    v: string,
  ) => {
    const arr = [...formData[type]];
    arr[i] = v;
    set(type, arr);
  };
  const removeLoc = (type: "pickupLocations" | "dropLocations", i: number) =>
    set(
      type,
      formData[type].filter((_, idx) => idx !== i),
    );

  const handleSwap = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      pickupLocations: [...prev.dropLocations],
      dropLocations: [...prev.pickupLocations],
    }));
    toast.success("Pickup & Drop switched");
  }, []);

  const handleClear = useCallback(() => {
    setFormData(emptyForm);
    setBulk(emptyBulk);
    toast.success("Form cleared");
    setTimeout(() => focusField("passengerName"), 50);
  }, []);

  const setToday = useCallback(() => {
    set("pickupDate", today);
    toast.success("Today");
    setTimeout(() => timeRef.current?.focus(), 50);
  }, [today, set]);

  const setTomorrow = useCallback(() => {
    set("pickupDate", tomorrow);
    toast.success("Tomorrow");
    setTimeout(() => timeRef.current?.focus(), 50);
  }, [tomorrow, set]);

  const setNow = useCallback(() => {
    set("pickupDate", today);
    set("pickupTime", currentTime);
    toast.success("Now");
    setTimeout(() => otpRef.current?.focus(), 50);
  }, [today, currentTime, set]);

  const buildPassengersFromBulk = (): Passenger[] => {
    const names = parseLines(bulk.names);
    const phones = parseLines(bulk.phones);
    const locs = parseLines(bulk.locations);
    return names.map((name, i) => ({
      name,
      phone: phones[i] ?? "",
      individualLocation: locs[i] ?? "",
      locationLink: "",
    }));
  };

  // ── Enter-to-advance for plain inputs ─────────────────────────────
  const enterNext = (id: string) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      focusAfter(id);
    }
  };

  // ── Global keyboard shortcuts ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const focused = document.activeElement?.tagName;
      const typing = focused === "INPUT" || focused === "TEXTAREA";

      if (ctrl && e.key === ".") {
        e.preventDefault();
        setToday();
        return;
      }
      if (ctrl && e.key === "/") {
        e.preventDefault();
        setTomorrow();
        return;
      }
      if (ctrl && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handleSwap();
        return;
      }
      if (e.altKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        setIncludeOTP((v) => !v);
        return;
      }
      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setIncludeNotes((v) => !v);
        return;
      }
      if (e.altKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        setIncludeDateTime((v) => !v);
        return;
      }
      if (ctrl && e.shiftKey && e.key.toLowerCase() === "c" && !typing) {
        e.preventDefault();
        handleClear();
        return;
      }
      if (e.altKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        if (formData.passengerPhone) {
          navigator.clipboard.writeText(formData.passengerPhone);
          toast.success("Passenger number copied");
        } else toast.error("No passenger number");
        return;
      }
      if (e.altKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (formData.driverNumber) {
          navigator.clipboard.writeText(formData.driverNumber);
          toast.success("Driver number copied");
        } else toast.error("No driver number");
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, tomorrow, formData.passengerPhone, formData.driverNumber]);

  // ── Validation ─────────────────────────────────────────────────────
  const validate = (): boolean => {
    if (formData.bookingMode === "single") {
      if (
        !formData.passengerName ||
        !formData.passengerPhone ||
        formData.pickupLocations.filter(Boolean).length === 0 ||
        formData.dropLocations.filter(Boolean).length === 0
      ) {
        toast.error("Fill passenger name, phone, and both locations.");
        focusField("passengerName");
        return false;
      }
      if (!phoneRegex.test(formData.passengerPhone)) {
        toast.error("Passenger phone must be 10 digits.");
        focusField("passengerPhone");
        return false;
      }
    } else {
      if (!formData.sharedLocation.trim()) {
        toast.error("Enter the shared location.");
        return false;
      }
      if (parseLines(bulk.names).length === 0) {
        toast.error("Add at least one passenger name.");
        return false;
      }
      for (const [i, ph] of parseLines(bulk.phones).entries()) {
        if (!phoneRegex.test(ph)) {
          toast.error(`Phone on line ${i + 1} must be 10 digits.`);
          return false;
        }
      }
    }
    if (!formData.pickupDate || !formData.pickupTime) {
      toast.error("Select pickup date and time.");
      dateRef.current?.focus();
      return false;
    }
    if (formData.driverNumber && !phoneRegex.test(formData.driverNumber)) {
      toast.error("Driver phone must be 10 digits.");
      focusField("driverNumber");
      return false;
    }
    if (formData.otp && !otpRegex.test(formData.otp)) {
      toast.error("OTP must be 4–6 digits.");
      otpRef.current?.focus();
      return false;
    }
    return true;
  };

  // ── Submit ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (formData.driverName.trim()) {
      try {
        await addDriver({
          name: formData.driverName.trim(),
          phone: formData.driverNumber ?? "",
          vehicleNumber: formData.vehicleNumber ?? "",
          isPrimary: false,
        });
      } catch (err) {
        console.warn("Driver auto-save failed:", err);
      }
    }
    setDriverRefreshKey((k) => k + 1);

    onGenerate({
      ...formData,
      passengers:
        formData.bookingMode !== "single"
          ? buildPassengersFromBulk()
          : formData.passengers,
      pickupLocations: formData.pickupLocations.filter(Boolean),
      dropLocations: formData.dropLocations.filter(Boolean),
      pickupDate: includeDateTime ? formData.pickupDate : "N/A",
      pickupTime: includeDateTime ? formData.pickupTime : "N/A",
      otp: includeOTP ? formData.otp : "N/A",
      additionalNotes: includeNotes
        ? (formData.additionalNotes ?? "")
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.length > 0)
            .join("\n")
        : "",
    });
    toast.success("Message generated");
  };

  const handleSaveDraft = () => {
    const draft: DraftType = {
      ...formData,
      passengers:
        formData.bookingMode !== "single"
          ? buildPassengersFromBulk()
          : formData.passengers,
      bulk: formData.bookingMode !== "single" ? bulk : undefined,
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
    };
    onSaveDraft(draft);
    toast.success("Draft saved.");
  };

  const sharedLabel =
    formData.bookingMode === "same_pickup"
      ? "Common Pickup Location"
      : "Common Drop Location";
  const individualLabel =
    formData.bookingMode === "same_pickup"
      ? "Drop location(s)"
      : "Pickup location(s)";
  const indivPlaceholder =
    formData.bookingMode === "same_pickup"
      ? "Manohar Airport T1\nPanaji Bus Stand\nMapusa Circle"
      : "Dhargal Janata Garage\nColvale Circle\nMapusa Bus Stand";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Booking Mode ─────────────────────────────────────────── */}
      <section className="space-y-2">
        <h3
          className="font-semibold flex items-center gap-2 text-sm"
          style={accentText}
        >
          <Users size={16} /> Booking Type
        </h3>
        <div className="flex gap-2 flex-wrap">
          {(["single", "same_pickup", "same_drop"] as BookingMode[]).map(
            (mode) => {
              const labels: Record<BookingMode, string> = {
                single: "Single",
                same_pickup: "Multi – Same Pickup",
                same_drop: "Multi – Same Drop",
              };
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    formData.bookingMode === mode
                      ? "bg-[#075E54] text-white border-[#075E54]"
                      : "bg-white text-gray-600 border-gray-300 hover:border-[#25D366]"
                  }`}
                >
                  {labels[mode]}
                </button>
              );
            },
          )}
        </div>
      </section>

      {/* ── Single Passenger ─────────────────────────────────────── */}
      {formData.bookingMode === "single" && (
        <>
          <section className="space-y-3">
            <h3 className="font-semibold text-[#075E54] flex items-center gap-2 text-sm">
              <User size={16} /> Passenger
            </h3>

            <Crewautocomplete
              value={formData.passengerName}
              onSelect={(name, phone, address, locationLink) =>
                setFormData((prev) => ({
                  ...prev,
                  passengerName: name,
                  ...(phone ? { passengerPhone: phone } : {}),
                  ...(address ? { pickupLocations: [address] } : {}),
                  ...(locationLink ? { locationLink } : {}),
                }))
              }
              onCommit={() => focusAfter("passengerName")}
            />

            <input
              id="passengerPhone"
              value={formData.passengerPhone}
              onChange={(e) =>
                set("passengerPhone", e.target.value.replace(/\D/g, ""))
              }
              onKeyDown={enterNext("passengerPhone")}
              placeholder="Passenger Phone"
              inputMode="numeric"
              maxLength={10}
              className="input-style"
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#075E54] flex items-center gap-2 text-sm">
                <MapPin size={16} /> Locations
              </h3>
              <button
                type="button"
                onClick={handleSwap}
                title="Ctrl+Shift+S"
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#25D366] text-gray-600 hover:text-white transition-all"
              >
                <ArrowUpDown size={13} /> Swap
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Pickup
              </p>
              {formData.pickupLocations.map((loc, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="flex-1">
                    <LocationInput
                      inputId={`pickup-${i}`}
                      value={loc}
                      onChange={(v) => updateLoc("pickupLocations", i, v)}
                      placeholder={`Pickup ${i + 1}`}
                      onEnter={() => focusAfter(`pickup-${i}`)}
                    />
                  </div>
                  {formData.pickupLocations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLoc("pickupLocations", i)}
                      className="text-red-400 hover:text-red-600 px-1 text-lg leading-none"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Drop
              </p>
              {formData.dropLocations.map((loc, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="flex-1">
                    <LocationInput
                      inputId={`drop-${i}`}
                      value={loc}
                      onChange={(v) => updateLoc("dropLocations", i, v)}
                      placeholder={`Drop ${i + 1}`}
                      onEnter={() => focusAfter(`drop-${i}`)}
                    />
                  </div>
                  {formData.dropLocations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLoc("dropLocations", i)}
                      className="text-red-400 hover:text-red-600 px-1 text-lg leading-none"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="w-full">
              <input
                id="locationLink"
                value={formData.locationLink}
                onChange={(e) => set("locationLink", e.target.value)}
                onKeyDown={enterNext("locationLink")}
                placeholder="Lat,Long or Google Maps link"
                className="input-style w-full"
              />
              <div className="flex justify-end mt-1">
                <span
                  onClick={setLocationLink}
                  className="text-xs text-[#6b7280] cursor-pointer hover:text-[#25D366] transition select-none"
                >
                  convert to maps link
                </span>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ── Multi-Passenger ──────────────────────────────────────── */}
      {(formData.bookingMode === "same_pickup" ||
        formData.bookingMode === "same_drop") && (
        <>
          <section className="space-y-3">
            <h3 className="font-semibold text-[#075E54] flex items-center gap-2 text-sm">
              <MapPin size={16} /> {sharedLabel}
            </h3>
            <LocationInput
              value={formData.sharedLocation}
              onChange={(v) => set("sharedLocation", v)}
              placeholder={sharedLabel}
            />
            <input
              value={formData.sharedLocationLink}
              onChange={(e) => set("sharedLocationLink", e.target.value)}
              placeholder="Map link (optional)"
              className="input-style"
            />
          </section>

          <section className="space-y-3">
            <h3 className="font-semibold text-[#075E54] flex items-center gap-2 text-sm">
              <Users size={16} /> Passengers
            </h3>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Names *
              </label>
              <textarea
                value={bulk.names}
                onChange={(e) =>
                  setBulk((b) => ({ ...b, names: e.target.value }))
                }
                placeholder={"Seemant\nYogita\nAnkita"}
                rows={4}
                className="input-style resize-none font-mono text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Phones{" "}
                <span className="normal-case font-normal text-gray-400">
                  optional
                </span>
              </label>
              <textarea
                value={bulk.phones}
                onChange={(e) =>
                  setBulk((b) => ({ ...b, phones: e.target.value }))
                }
                placeholder={"9876543210\n8813881345"}
                rows={3}
                className="input-style resize-none font-mono text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {individualLabel}{" "}
                <span className="normal-case font-normal text-gray-400">
                  optional
                </span>
              </label>
              <textarea
                value={bulk.locations}
                onChange={(e) =>
                  setBulk((b) => ({ ...b, locations: e.target.value }))
                }
                placeholder={indivPlaceholder}
                rows={4}
                className="input-style resize-none font-mono text-sm"
              />
            </div>
          </section>
        </>
      )}

      {/* ── Driver ───────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="font-semibold text-[#075E54] text-sm"> Driver</h3>

        <DriverSearchInput
          value={formData.driverName}
          refreshKey={driverRefreshKey}
          onSelect={(driver, nameOnly) =>
            setFormData((prev) => ({
              ...prev,
              driverName: driver.name,
              ...(nameOnly
                ? {}
                : {
                    driverNumber: driver.phone || prev.driverNumber,
                    vehicleNumber: driver.vehicleNumber || prev.vehicleNumber,
                  }),
            }))
          }
          onCommit={() => focusAfter("driverName")}
        />

        <input
          id="driverNumber"
          value={formData.driverNumber}
          onChange={(e) =>
            set("driverNumber", e.target.value.replace(/\D/g, ""))
          }
          onKeyDown={enterNext("driverNumber")}
          placeholder="Driver Phone"
          inputMode="numeric"
          maxLength={10}
          className="input-style"
        />
        <input
          id="vehicleNumber"
          value={formData.vehicleNumber}
          onChange={(e) => set("vehicleNumber", e.target.value.toUpperCase())}
          onKeyDown={enterNext("vehicleNumber")}
          placeholder="Vehicle Number"
          className="input-style"
        />
      </section>

      {/* ── Date & Time ──────────────────────────────────────────── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-sm font-semibold text-[#075E54]">
            Pickup Date & Time
          </label>
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={setToday}
              title="Ctrl+D"
              className="px-2.5 py-1 rounded-full bg-[#e8faf4] text-[#075E54] font-medium hover:bg-[#25D366] hover:text-white transition"
            >
              Today
            </button>
            <button
              type="button"
              onClick={setNow}
              title="Ctrl+Shift+N"
              className="px-2.5 py-1 rounded-full bg-[#e8faf4] text-[#075E54] font-medium hover:bg-[#075E54] hover:text-white transition"
            >
              Now
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={setTomorrow}
              title="Ctrl+/"
              className="px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-[#25D366] hover:text-[#25D366] transition"
            >
              Tomorrow
            </button>
          </div>
        </div>
        <div className="flex gap-3">
          <input
            id="pickupDate"
            ref={dateRef}
            type="date"
            value={formData.pickupDate}
            onChange={(e) => {
              set("pickupDate", e.target.value);
              setTimeout(() => timeRef.current?.focus(), 50);
            }}
            className="input-style flex-1"
          />
          <input
            id="pickupTime"
            ref={timeRef}
            type="time"
            value={formData.pickupTime}
            min={formData.pickupDate === today ? currentTime : undefined}
            onChange={(e) => set("pickupTime", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                otpRef.current?.focus();
              }
            }}
            className="input-style flex-1"
          />
        </div>
      </section>

      {/* ── OTP + Notes ──────────────────────────────────────────── */}
      <section className="space-y-3">
        <input
          id="otp"
          ref={otpRef}
          value={formData.otp}
          onChange={(e) => set("otp", e.target.value.replace(/\D/g, ""))}
          onKeyDown={enterNext("otp")}
          placeholder="OTP "
          inputMode="numeric"
          maxLength={6}
          className="input-style"
        />
        <textarea
          id="additionalNotes"
          value={formData.additionalNotes}
          onChange={(e) => set("additionalNotes", e.target.value)}
          placeholder="Additional Notes (optional)"
          rows={3}
          className="input-style resize-none"
        />
        <div className="flex flex-wrap gap-2 mt-1">
          {(
            [
              [
                "Approx. location",
                "*Note* : Pickup location shown in the app is approximate. Actual drop locations are shared with the driver on WhatsApp.",
              ],
              [
                "Delay possible",
                "*Note* : Pickup timing may vary slightly due to traffic or previous trips.",
              ],
              [
                "Contact support",
                "*Note* : For assistance, please contact support.",
              ],
            ] as [string, string][]
          ).map(([label, note]) => (
            <button
              key={label}
              type="button"
              onClick={() =>
                set(
                  "additionalNotes",
                  formData.additionalNotes
                    ? `${formData.additionalNotes}
${note}`
                    : note,
                )
              }
              className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#e8faf4] text-gray-500 hover:text-[#075E54] border border-transparent hover:border-[#b2dfdb] transition-all"
            >
              + {label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Toggles ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
        {(
          [
            {
              label: "OTP",
              state: includeOTP,
              toggle: () => setIncludeOTP((v) => !v),
            },
            {
              label: "Notes",
              state: includeNotes,
              toggle: () => setIncludeNotes((v) => !v),
            },
            {
              label: "Date & Time",
              state: includeDateTime,
              toggle: () => setIncludeDateTime((v) => !v),
            },
          ] as const
        ).map(({ label, state, toggle }) => (
          <button
            key={label}
            type="button"
            onClick={toggle}
            className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm font-medium transition-all
      ${
        state
          ? "bg-[#e8faf4] border-[#25D366] text-[#075E54]"
          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
      }`}
          >
            <span>{label}</span>

            <span
              className={`w-9 h-5 rounded-full relative transition-colors ${
                state ? "bg-[#25D366]" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-[2px] w-4 h-4 bg-white rounded-full shadow transition-all ${
                  state ? "left-[18px]" : "left-[2px]"
                }`}
              />
            </span>
          </button>
        ))}
      </div>
      {/* ── Action Buttons ───────────────────────────────────────── */}
      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          className="flex-1 bg-[#168c41] hover:bg-[#0ea03a] active:scale-[.98] text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-semibold shadow-sm"
        >
          <Sparkles size={16} /> Generate Message
        </button>
        <button
          type="button"
          onClick={handleSaveDraft}
          className="px-4 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-sm font-medium text-amber-700 transition-colors"
        >
          Save Draft
        </button>
        <button
          type="button"
          onClick={handleClear}
          title="Ctrl+Shift+C"
          className="px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors text-gray-500"
        >
          <RotateCcw size={15} />
        </button>
      </div>
    </form>
  );
};

export default BookingForm;
