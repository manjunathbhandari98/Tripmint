import { MapPin, RotateCcw, Sparkles, User } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import type { MessageType } from "../messageTemplate";
import LocationInput from "./ui/LocationInput";

export type DraftType = MessageType & {
  id: string;
  savedAt: string;
};

interface Props {
  onGenerate: (data: MessageType) => void;
  onSaveDraft: (draft: DraftType) => void;
  initialDraft?: DraftType | null;
}

const emptyForm: MessageType = {
  passengerName: "",
  passengerPhone: "",
  driverName: "",
  driverNumber: "",
  vehicleNumber: "",
  pickupDate: "",
  pickupTime: "",
  otp: "",
  pickupLocations: [""],
  dropLocations: [""],
  locationLink: "",
  additionalNotes: "",
};

const BookingForm = ({ onGenerate, onSaveDraft, initialDraft }: Props) => {
  const [formData, setFormData] = useState<MessageType>(
    initialDraft || emptyForm,
  );
  const [includeOTP, setIncludeOTP] = useState(true);
  const [includeDateTime, setIncludeDateTime] = useState(true);

  const updateField = (key: keyof MessageType, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateLocation = (
    type: "pickupLocations" | "dropLocations",
    index: number,
    value: string,
  ) => {
    const updated = [...formData[type]];
    updated[index] = value;
    setFormData((prev) => ({ ...prev, [type]: updated }));
  };

  const addLocation = (type: "pickupLocations" | "dropLocations") => {
    setFormData((prev) => ({
      ...prev,
      [type]: [...prev[type], ""],
    }));
  };

  const removeLocation = (
    type: "pickupLocations" | "dropLocations",
    index: number,
  ) => {
    const updated = formData[type].filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, [type]: updated }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPickup = formData.pickupLocations.filter(Boolean);
    const cleanDrop = formData.dropLocations.filter(Boolean);

    if (
      !formData.passengerName ||
      !formData.passengerPhone ||
      !formData.pickupDate ||
      !formData.pickupTime ||
      cleanPickup.length === 0 ||
      cleanDrop.length === 0
    ) {
      toast.error("Please fill required fields.");
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (
      !phoneRegex.test(formData.passengerPhone) ||
      (formData.driverNumber && !phoneRegex.test(formData.driverNumber))
    ) {
      toast.error("Phone numbers must be 10 digits.");
      return;
    }

    const otpRegex = /^[0-9]{4,6}$/;
    if (formData.otp && !otpRegex.test(formData.otp)) {
      toast.error("OTP must be 4 to 6 digits.");
      return;
    }

    onGenerate({
      ...formData,
      pickupDate: includeDateTime ? formData.pickupDate : "N/A",
      pickupTime: includeDateTime ? formData.pickupTime : "N/A",
      otp: includeOTP ? formData.otp : "N/A",
      pickupLocations: cleanPickup,
      dropLocations: cleanDrop,
    });

    toast.success("Message generated.");
  };

  const handleSaveDraft = () => {
    const draft: DraftType = {
      ...formData,
      id: initialDraft?.id || crypto.randomUUID(),
      savedAt: new Date().toISOString(),
    };

    onSaveDraft(draft);
    toast.success("Draft saved.");
  };

  const handleClear = () => {
    setFormData(emptyForm);
    toast("Form cleared.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Passenger Section */}
      <section className="space-y-3">
        <h3 className="font-semibold text-[#075E54] flex items-center gap-2">
          <User size={18} /> Passenger Details
        </h3>

        <input
          value={formData.passengerName}
          onChange={(e) => updateField("passengerName", e.target.value)}
          placeholder="Passenger Name"
          className="input-style"
        />

        <input
          value={formData.passengerPhone}
          onChange={(e) =>
            updateField("passengerPhone", e.target.value.replace(/\D/g, ""))
          }
          placeholder="Passenger Phone"
          className="input-style"
        />
      </section>

      {/* Pickup Locations */}
      <section className="space-y-3">
        <h3 className="font-semibold text-[#075E54] flex items-center gap-2">
          <MapPin size={18} /> Pickup Locations
        </h3>

        {formData.pickupLocations.map((loc, i) => (
          <div key={i} className="flex gap-2">
            <LocationInput
              value={loc}
              onChange={(val) => updateLocation("pickupLocations", i, val)}
              placeholder={`Pickup ${i + 1}`}
            />
            {formData.pickupLocations.length > 1 && (
              <button
                type="button"
                onClick={() => removeLocation("pickupLocations", i)}
                className="text-red-500"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => addLocation("pickupLocations")}
          className="text-sm text-[#075E54]"
        >
          + Add Pickup
        </button>
      </section>

      {/* Drop Locations */}
      <section className="space-y-3">
        <h3 className="font-semibold text-[#075E54] flex items-center gap-2">
          <MapPin size={18} /> Drop Locations
        </h3>

        {formData.dropLocations.map((loc, i) => (
          <div key={i} className="flex gap-2">
            <LocationInput
              value={loc}
              onChange={(val) => updateLocation("dropLocations", i, val)}
              placeholder={`Drop ${i + 1}`}
            />
            {formData.dropLocations.length > 1 && (
              <button
                type="button"
                onClick={() => removeLocation("dropLocations", i)}
                className="text-red-500"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => addLocation("dropLocations")}
          className="text-sm text-[#075E54]"
        >
          + Add Drop
        </button>
      </section>

      {/* Other Fields */}
      <section className="space-y-3">
        <input
          value={formData.driverName}
          onChange={(e) => updateField("driverName", e.target.value)}
          placeholder="Driver Name"
          className="input-style"
        />

        <input
          value={formData.driverNumber}
          onChange={(e) =>
            updateField("driverNumber", e.target.value.replace(/\D/g, ""))
          }
          placeholder="Driver Phone"
          className="input-style"
        />

        <input
          value={formData.vehicleNumber}
          onChange={(e) => updateField("vehicleNumber", e.target.value)}
          placeholder="Vehicle Number"
          className="input-style"
        />

        <div className="flex gap-3">
          <input
            type="date"
            value={formData.pickupDate}
            onChange={(e) => updateField("pickupDate", e.target.value)}
            className="input-style flex-1"
          />
          <input
            type="time"
            value={formData.pickupTime}
            onChange={(e) => updateField("pickupTime", e.target.value)}
            className="input-style flex-1"
          />
        </div>

        <input
          value={formData.otp}
          onChange={(e) =>
            updateField("otp", e.target.value.replace(/\D/g, ""))
          }
          placeholder="OTP"
          className="input-style"
        />

        <textarea
          value={formData.additionalNotes}
          onChange={(e) => updateField("additionalNotes", e.target.value)}
          placeholder="Additional Notes (optional)"
          rows={3}
          className="input-style resize-none"
        />
      </section>
      {/* Message Options */}
      <div className="flex flex-wrap gap-6 pt-4">
        {/* OTP Toggle */}
        <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl w-full sm:w-auto min-w-[220px] border border-gray-200">
          <span className="text-sm font-medium text-gray-700">Include OTP</span>

          <button
            type="button"
            onClick={() => setIncludeOTP(!includeOTP)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
              includeOTP ? "bg-[#25D366]" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                includeOTP ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>

        {/* Date & Time Toggle */}
        <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl w-full sm:w-auto min-w-[220px] border border-gray-200">
          <span className="text-sm font-medium text-gray-700">
            Include Date & Time
          </span>

          <button
            type="button"
            onClick={() => setIncludeDateTime(!includeDateTime)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
              includeDateTime ? "bg-[#25D366]" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                includeDateTime ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-[#168c41] hover:bg-[#07c251] text-white py-2.5 rounded-lg flex items-center justify-center gap-2"
        >
          <Sparkles size={16} /> Generate
        </button>

        <button
          type="button"
          onClick={handleSaveDraft}
          className="px-4 bg-yellow-100 rounded-lg"
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
