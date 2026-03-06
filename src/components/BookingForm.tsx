import {
  ArrowUpDown,
  MapPin,
  RotateCcw,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import crewDatabase from "../data/crewDatabase";
import type { BookingMode, MessageType, Passenger } from "../messageTemplate";
import DriverSearchInput from "./ui/DriverSearchInput";
import LocationInput from "./ui/LocationInput";

// ── DraftType now includes bulk so multi-passenger drafts round-trip correctly ──
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

interface BulkInput {
  names: string;
  phones: string;
  locations: string;
}

const emptyBulk: BulkInput = { names: "", phones: "", locations: "" };

const phoneRegex = /^[0-9]{10}$/;
const otpRegex = /^[0-9]{4,6}$/;

const parseLines = (raw: string): string[] =>
  raw
    .split("\n")
    .map((line) => line.split("\t")[0].trim())
    .filter(Boolean);

// Reconstruct bulk text from a saved passengers array (for loading old drafts
// that were saved before bulk was introduced)
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

// ── Crew Autocomplete ───────────────────────────────────────────────
interface CrewAutocompleteProps {
  value: string;
  onSelect: (
    name: string,
    phone: string,
    address: string,
    locationLink: string,
  ) => void;
  placeholder?: string;
}

const CrewAutocomplete = ({
  value,
  onSelect,
  placeholder = "Passenger Name",
}: CrewAutocompleteProps) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<typeof crewDatabase>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    if (q.length >= 2) {
      const lower = q.toLowerCase();
      const matches = crewDatabase.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          c.phone.includes(q) ||
          c.designation.toLowerCase().includes(lower),
      );
      setSuggestions(matches.slice(0, 8));
      setOpen(matches.length > 0);
    } else {
      setSuggestions([]);
      setOpen(false);
    }
    onSelect(q, "", "", "");
  };

  const handlePick = (crew: (typeof crewDatabase)[0]) => {
    setQuery(crew.name);
    setOpen(false);
    onSelect(crew.name, crew.phone, crew.address, crew.locationLink);
  };

  return (
    <div ref={ref} className="relative">
      <input
        value={query}
        onChange={handleChange}
        onFocus={() =>
          query.length >= 2 && suggestions.length > 0 && setOpen(true)
        }
        placeholder={placeholder}
        className="input-style"
      />
      {open && (
        <ul className="absolute z-50 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-60 overflow-y-auto">
          {suggestions.map((crew) => (
            <li
              key={crew.id}
              onMouseDown={() => handlePick(crew)}
              className="px-4 py-2.5 hover:bg-[#e8faf0] cursor-pointer border-b last:border-0"
            >
              <p className="font-medium text-sm text-gray-800">{crew.name}</p>
              <p className="text-xs text-gray-500">
                {crew.designation} · {crew.location} · {crew.phone}
              </p>
              {crew.bookingLeadTime && (
                <p className="text-xs text-[#075E54] font-medium mt-0.5">
                  ⏱ Book {crew.bookingLeadTime} prior
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ── Main BookingForm ────────────────────────────────────────────────
const BookingForm = ({ onGenerate, onSaveDraft, initialDraft }: Props) => {
  const [formData, setFormData] = useState<MessageType>(
    initialDraft || emptyForm,
  );

  // Restore bulk from draft — prefer saved bulk, fall back to reconstructing from passengers array
  const [bulk, setBulk] = useState<BulkInput>(() => {
    if (!initialDraft) return emptyBulk;
    if (initialDraft.bulk) return initialDraft.bulk;
    if (
      initialDraft.bookingMode !== "single" &&
      initialDraft.passengers?.length
    ) {
      return passengersToBulk(initialDraft.passengers);
    }
    return emptyBulk;
  });

  const [includeOTP, setIncludeOTP] = useState(true);
  const [includeDateTime, setIncludeDateTime] = useState(true);

  const { today, currentTime, tomorrow } = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().slice(0, 5);
    const tmr = new Date(now);
    tmr.setDate(now.getDate() + 1);
    const tomorrow = tmr.toISOString().split("T")[0];
    return { today, currentTime, tomorrow };
  }, []);

  const set = (key: keyof MessageType, value: unknown) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const setMode = (mode: BookingMode) => {
    set("bookingMode", mode);
    setBulk(emptyBulk);
  };

  // ── Single mode helpers ──────────────────────────────────────────
  const updateLoc = (
    type: "pickupLocations" | "dropLocations",
    i: number,
    v: string,
  ) => {
    const arr = [...formData[type]];
    arr[i] = v;
    set(type, arr);
  };
  const addLoc = (type: "pickupLocations" | "dropLocations") =>
    set(type, [...formData[type], ""]);
  const removeLoc = (type: "pickupLocations" | "dropLocations", i: number) =>
    set(
      type,
      formData[type].filter((_, idx) => idx !== i),
    );

  const handleSwap = () => {
    setFormData((prev) => ({
      ...prev,
      pickupLocations: [...prev.dropLocations],
      dropLocations: [...prev.pickupLocations],
    }));
    toast("Pickup & Drop switched 🔄");
  };

  // ── Build passengers from bulk — no fill-down ────────────────────
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

  // ── Validation ───────────────────────────────────────────────────
  const validate = (): boolean => {
    if (formData.bookingMode === "single") {
      const cleanPickup = formData.pickupLocations.filter(Boolean);
      const cleanDrop = formData.dropLocations.filter(Boolean);
      if (
        !formData.passengerName ||
        !formData.passengerPhone ||
        cleanPickup.length === 0 ||
        cleanDrop.length === 0
      ) {
        toast.error("Fill in passenger name, phone, and both locations.");
        return false;
      }
      if (!phoneRegex.test(formData.passengerPhone)) {
        toast.error("Passenger phone must be 10 digits.");
        return false;
      }
    } else {
      if (!formData.sharedLocation.trim()) {
        toast.error("Enter the shared location.");
        return false;
      }
      const names = parseLines(bulk.names);
      if (names.length === 0) {
        toast.error("Add at least one passenger name.");
        return false;
      }
      const phones = parseLines(bulk.phones);
      for (let i = 0; i < phones.length; i++) {
        if (!phoneRegex.test(phones[i])) {
          toast.error(`Phone on line ${i + 1} must be 10 digits.`);
          return false;
        }
      }
    }
    if (!formData.pickupDate || !formData.pickupTime) {
      toast.error("Select pickup date and time.");
      return false;
    }
    if (formData.driverNumber && !phoneRegex.test(formData.driverNumber)) {
      toast.error("Driver phone must be 10 digits.");
      return false;
    }
    if (formData.otp && !otpRegex.test(formData.otp)) {
      toast.error("OTP must be 4–6 digits.");
      return false;
    }
    return true;
  };

  // ── Submit ───────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const passengers =
      formData.bookingMode !== "single"
        ? buildPassengersFromBulk()
        : formData.passengers;

    onGenerate({
      ...formData,
      passengers,
      pickupLocations: formData.pickupLocations.filter(Boolean),
      dropLocations: formData.dropLocations.filter(Boolean),
      pickupDate: includeDateTime ? formData.pickupDate : "N/A",
      pickupTime: includeDateTime ? formData.pickupTime : "N/A",
      otp: includeOTP ? formData.otp : "N/A",
    });
    toast.success("Message generated.");
  };

  // ── Save Draft — include bulk so it round-trips ──────────────────
  const handleSaveDraft = () => {
    const draft: DraftType = {
      ...formData,
      // For multi-passenger, persist the built passengers too (for display in draft list)
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

  const handleClear = () => {
    setFormData(emptyForm);
    setBulk(emptyBulk);
    toast("Form cleared.");
  };

  const sharedLabel =
    formData.bookingMode === "same_pickup"
      ? "Common Pickup Location"
      : "Common Drop Location";
  const individualLabel =
    formData.bookingMode === "same_pickup"
      ? "Drop location(s)"
      : "Pickup location(s)";
  const individualPlaceholder =
    formData.bookingMode === "same_pickup"
      ? "Manohar Airport T1\nPanaji Bus Stand\nMapusa Circle"
      : "Dhargal Janata Garage\nColvale Circle\nMapusa Bus Stand";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Booking Mode Tabs ── */}
      <section className="space-y-2">
        <h3 className="font-semibold text-[#075E54] flex items-center gap-2">
          <Users size={18} /> Booking Type
        </h3>
        <div className="flex gap-2 flex-wrap">
          {(["single", "same_pickup", "same_drop"] as BookingMode[]).map(
            (mode) => {
              const labels: Record<BookingMode, string> = {
                single: "Single Passenger",
                same_pickup: "Multi – Same Pickup",
                same_drop: "Multi – Same Drop",
              };
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setMode(mode)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
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

      {/* ── SINGLE PASSENGER MODE ── */}
      {formData.bookingMode === "single" && (
        <>
          <section className="space-y-3">
            <h3 className="font-semibold text-[#075E54] flex items-center gap-2">
              <User size={18} /> Passenger Details
            </h3>
            <CrewAutocomplete
              value={formData.passengerName}
              onSelect={(name, phone, address, locationLink) => {
                setFormData((prev) => ({
                  ...prev,
                  passengerName: name,
                  ...(phone ? { passengerPhone: phone } : {}),
                  ...(address ? { pickupLocations: [address] } : {}),
                  ...(locationLink ? { locationLink } : {}),
                }));
              }}
            />
            <input
              value={formData.passengerPhone}
              onChange={(e) =>
                set("passengerPhone", e.target.value.replace(/\D/g, ""))
              }
              placeholder="Passenger Phone"
              className="input-style"
            />
          </section>

          <section className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[#075E54] flex items-center gap-2">
                  <MapPin size={18} /> Pickup Locations
                </h3>
                <button
                  type="button"
                  onClick={handleSwap}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-[#25D366] text-gray-600 hover:text-white transition-all"
                >
                  <ArrowUpDown size={14} /> Swap
                </button>
              </div>
              {formData.pickupLocations.map((loc, i) => (
                <div key={i} className="flex gap-2">
                  <LocationInput
                    value={loc}
                    onChange={(v) => updateLoc("pickupLocations", i, v)}
                    placeholder={`Pickup ${i + 1}`}
                  />
                  {formData.pickupLocations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLoc("pickupLocations", i)}
                      className="text-red-500"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addLoc("pickupLocations")}
                className="text-sm text-[#075E54] font-medium hover:underline"
              >
                + Add Pickup
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-[#075E54] flex items-center gap-2">
                <MapPin size={18} /> Drop Locations
              </h3>
              {formData.dropLocations.map((loc, i) => (
                <div key={i} className="flex gap-2">
                  <LocationInput
                    value={loc}
                    onChange={(v) => updateLoc("dropLocations", i, v)}
                    placeholder={`Drop ${i + 1}`}
                  />
                  {formData.dropLocations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLoc("dropLocations", i)}
                      className="text-red-500"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addLoc("dropLocations")}
                className="text-sm text-[#075E54] font-medium hover:underline"
              >
                + Add Drop
              </button>
            </div>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-medium text-gray-600">
              Location Link (Optional)
            </h4>
            <input
              value={formData.locationLink}
              onChange={(e) => set("locationLink", e.target.value)}
              placeholder="Google Maps link"
              className="input-style"
            />
          </section>
        </>
      )}

      {/* ── MULTI-PASSENGER MODE ── */}
      {(formData.bookingMode === "same_pickup" ||
        formData.bookingMode === "same_drop") && (
        <>
          <section className="space-y-3">
            <h3 className="font-semibold text-[#075E54] flex items-center gap-2">
              <MapPin size={18} /> {sharedLabel}
            </h3>
            <LocationInput
              value={formData.sharedLocation}
              onChange={(v) => set("sharedLocation", v)}
              placeholder={sharedLabel}
            />
            <input
              value={formData.sharedLocationLink}
              onChange={(e) => set("sharedLocationLink", e.target.value)}
              placeholder="Map link for shared location (optional)"
              className="input-style"
            />
          </section>

          <section className="space-y-4">
            <h3 className="font-semibold text-[#075E54] flex items-center gap-2">
              <Users size={18} /> Passengers
            </h3>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <User size={13} /> Names <span className="text-red-400">*</span>
              </label>
              <textarea
                value={bulk.names}
                onChange={(e) =>
                  setBulk((b) => ({ ...b, names: e.target.value }))
                }
                placeholder={"Seemant\nYogita\nAnkita\nGarv"}
                rows={4}
                className="input-style resize-none font-mono text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">
                📞 Phones
                <span className="text-xs text-gray-400 font-normal ml-2">
                  optional
                </span>
              </label>
              <textarea
                value={bulk.phones}
                onChange={(e) =>
                  setBulk((b) => ({ ...b, phones: e.target.value }))
                }
                placeholder={"8813881345\n9874563215"}
                rows={3}
                className="input-style resize-none font-mono text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <MapPin size={13} /> {individualLabel}
                <span className="text-xs text-gray-400 font-normal ml-1">
                  optional
                </span>
              </label>
              <textarea
                value={bulk.locations}
                onChange={(e) =>
                  setBulk((b) => ({ ...b, locations: e.target.value }))
                }
                placeholder={individualPlaceholder}
                rows={4}
                className="input-style resize-none font-mono text-sm"
              />
            </div>
          </section>
        </>
      )}

      {/* ── Driver + Schedule ── */}
      <section className="space-y-3">
        <DriverSearchInput
          value={formData.driverName}
          onSelect={(driver) => {
            setFormData((prev) => ({
              ...prev,
              driverName: driver.name,
              driverNumber: driver.phone ?? prev.driverNumber,
              vehicleNumber: driver.vehicleNumber ?? prev.vehicleNumber,
            }));
          }}
        />
        <input
          value={formData.driverNumber}
          onChange={(e) =>
            set("driverNumber", e.target.value.replace(/\D/g, ""))
          }
          placeholder="Driver Phone"
          className="input-style"
        />
        <input
          value={formData.vehicleNumber}
          onChange={(e) => set("vehicleNumber", e.target.value)}
          placeholder="Vehicle Number"
          className="input-style"
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-600">
              Pickup Date & Time
            </label>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => set("pickupDate", today)}
                  className="px-3 py-1 rounded-full bg-gray-100 hover:bg-[#25D366] hover:text-white transition"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    set("pickupDate", today);
                    set("pickupTime", currentTime);
                  }}
                  className="px-3 py-1 rounded-full bg-gray-100 hover:bg-[#075E54] hover:text-white transition"
                >
                  Now
                </button>
              </div>
              <div className="h-4 w-px bg-gray-300" />
              <button
                type="button"
                onClick={() => set("pickupDate", tomorrow)}
                className="px-3 py-1 rounded-full border border-gray-300 text-gray-600 hover:border-[#25D366] hover:text-[#25D366] transition"
              >
                Tomorrow
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            <input
              type="date"
              value={formData.pickupDate}
              onChange={(e) => set("pickupDate", e.target.value)}
              className="input-style flex-1"
            />
            <input
              type="time"
              value={formData.pickupTime}
              min={formData.pickupDate === today ? currentTime : undefined}
              onChange={(e) => set("pickupTime", e.target.value)}
              className="input-style flex-1"
            />
          </div>
        </div>

        <input
          value={formData.otp}
          onChange={(e) => set("otp", e.target.value.replace(/\D/g, ""))}
          placeholder="OTP"
          className="input-style"
        />
        <textarea
          value={formData.additionalNotes}
          onChange={(e) => set("additionalNotes", e.target.value)}
          placeholder="Additional Notes (optional)"
          rows={3}
          className="input-style resize-none"
        />
      </section>

      {/* ── Toggles ── */}
      <div className="flex sm:flex-wrap justify-between gap-6 pt-4">
        {[
          {
            label: "Include OTP",
            state: includeOTP,
            toggle: () => setIncludeOTP(!includeOTP),
          },
          {
            label: "Include Date & Time",
            state: includeDateTime,
            toggle: () => setIncludeDateTime(!includeDateTime),
          },
        ].map(({ label, state, toggle }) => (
          <div
            key={label}
            className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl w-full sm:w-auto border border-gray-200"
          >
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <button
              type="button"
              onClick={toggle}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${state ? "bg-[#25D366]" : "bg-gray-300"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${state ? "translate-x-6" : ""}`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* ── Buttons ── */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-[#168c41] hover:bg-[#07c251] text-white py-2.5 rounded-lg flex items-center justify-center gap-2"
        >
          <Sparkles size={16} /> Generate
        </button>
        <button
          data-save="draft"
          type="button"
          onClick={handleSaveDraft}
          className="px-4 bg-yellow-100 rounded-lg text-sm font-medium"
        >
          Save Draft
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="px-4 bg-gray-100 rounded-lg"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </form>
  );
};

export default BookingForm;
