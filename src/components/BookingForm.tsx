import { Car, MapPin, RotateCcw, Sparkles, User } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import type { MessageType } from "../messageTemplate";
import Input from "./ui/Input";

interface Props {
  onGenerate: (data: MessageType) => void;
}

const BookingForm = ({ onGenerate }: Props) => {
  const [pickupLocations, setPickupLocations] = useState<string[]>([""]);
  const [dropLocations, setDropLocations] = useState<string[]>([""]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;

    const passengerName = (
      form.elements.namedItem("passengerName") as HTMLInputElement
    ).value.trim();

    const passengerPhone = (
      form.elements.namedItem("passengerPhone") as HTMLInputElement
    ).value.trim();

    const driverName = (
      form.elements.namedItem("driverName") as HTMLInputElement
    ).value.trim();

    const driverNumber = (
      form.elements.namedItem("driverPhone") as HTMLInputElement
    ).value.trim();

    const vehicleNumber = (
      form.elements.namedItem("vehicleNumber") as HTMLInputElement
    ).value.trim();

    const pickupDate = (
      form.elements.namedItem("pickupDate") as HTMLInputElement
    ).value;

    const pickupTime = (
      form.elements.namedItem("pickupTime") as HTMLInputElement
    ).value;

    const otp = (
      form.elements.namedItem("otp") as HTMLInputElement
    ).value.trim();

    const locationLink = (
      form.elements.namedItem("locationLink") as HTMLInputElement
    )?.value.trim();

    const additionalNotes = (
      form.elements.namedItem("additionalNotes") as HTMLTextAreaElement
    )?.value.trim();

    const cleanPickupLocations = pickupLocations
      .map((loc) => loc.trim())
      .filter(Boolean);

    const cleanDropLocations = dropLocations
      .map((loc) => loc.trim())
      .filter(Boolean);

    // Required validation
    if (
      !passengerName ||
      !passengerPhone ||
      !driverName ||
      !driverNumber ||
      !vehicleNumber ||
      !pickupDate ||
      !pickupTime ||
      !otp ||
      cleanPickupLocations.length === 0 ||
      cleanDropLocations.length === 0
    ) {
      toast.error("Please fill all required fields.");
      return;
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10}$/;

    if (!phoneRegex.test(passengerPhone)) {
      toast.error("Passenger phone must be 10 digits.");
      return;
    }

    if (!phoneRegex.test(driverNumber)) {
      toast.error("Driver phone must be 10 digits.");
      return;
    }

    // OTP validation
    const otpRegex = /^[0-9]{4,6}$/;

    if (!otpRegex.test(otp)) {
      toast.error("OTP must be 4 to 6 digits.");
      return;
    }

    const formData: MessageType = {
      passengerName,
      passengerPhone,
      driverName,
      driverNumber,
      vehicleNumber,
      pickupDate,
      pickupTime,
      otp,
      pickupLocations: cleanPickupLocations,
      dropLocations: cleanDropLocations,
      locationLink,
      additionalNotes,
    };

    onGenerate(formData);
    toast.success("Message generated successfully!");
  };

  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const form = e.currentTarget.closest("form") as HTMLFormElement;
    form.reset();
    setPickupLocations([""]);
    setDropLocations([""]);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} autoComplete="off">
        {/* Passenger Section */}
        <div className="mb-6">
          <div className="font-semibold flex gap-2 items-center text-[#075E54] pb-2">
            <User size={22} />
            Passenger Details
          </div>

          <div className="mt-4 space-y-4">
            <Input label="Passenger Name" id="passengerName" />
            <Input label="Passenger Phone" id="passengerPhone" type="tel" />
          </div>
        </div>

        {/* Driver Section */}
        <div className="mb-6">
          <div className="font-semibold flex gap-2 items-center text-[#075E54] pb-2">
            <Car size={22} />
            Driver Details
          </div>

          <div className="mt-4 space-y-4">
            <Input label="Driver Name" id="driverName" />
            <Input label="Driver Phone" id="driverPhone" type="tel" />
            <Input label="Vehicle Number" id="vehicleNumber" />
          </div>
        </div>

        {/* Trip Section */}
        <div className="mb-6">
          <div className="font-semibold flex gap-2 items-center text-[#075E54] pb-2">
            <MapPin size={22} />
            Trip Details
          </div>

          <div className="mt-4 space-y-4">
            {/* Pickup Locations */}
            <div className="space-y-3">
              {pickupLocations.map((loc, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={loc}
                    onChange={(e) => {
                      const updated = [...pickupLocations];
                      updated[index] = e.target.value;
                      setPickupLocations(updated);
                    }}
                    placeholder={`Pickup Location ${index + 1}`}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm"
                  />

                  {pickupLocations.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setPickupLocations(
                          pickupLocations.filter((_, i) => i !== index),
                        )
                      }
                      className="px-3 bg-red-100 text-red-600 rounded-lg"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => setPickupLocations([...pickupLocations, ""])}
                className="text-sm text-[#075E54] font-medium"
              >
                + Add Pickup
              </button>
            </div>

            {/* Drop Locations */}
            <div className="space-y-3 mt-4">
              {dropLocations.map((loc, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={loc}
                    onChange={(e) => {
                      const updated = [...dropLocations];
                      updated[index] = e.target.value;
                      setDropLocations(updated);
                    }}
                    placeholder={`Drop Location ${index + 1}`}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm"
                  />

                  {dropLocations.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setDropLocations(
                          dropLocations.filter((_, i) => i !== index),
                        )
                      }
                      className="px-3 bg-red-100 text-red-600 rounded-lg"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => setDropLocations([...dropLocations, ""])}
                className="text-sm text-[#075E54] font-medium"
              >
                + Add Drop
              </button>
            </div>

            <Input label="Location Link (optional)" id="locationLink" />

            <div className="flex gap-4">
              <Input label="Pickup Date" id="pickupDate" type="date" />
              <Input label="Pickup Time" id="pickupTime" type="time" />
            </div>

            <Input label="OTP" id="otp" type="number" />
          </div>

          {/* Additional Notes */}
          <div className="my-4">
            <div className="font-semibold text-[#075E54] pb-2">
              Additional Notes (Optional)
            </div>

            <textarea
              id="additionalNotes"
              rows={3}
              placeholder="Add price, helpline number, instructions..."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm resize-none"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            className="flex-1 bg-[#168c41] hover:bg-[#07c251] text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-md"
          >
            <Sparkles size={18} />
            Generate Message
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="px-4 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
