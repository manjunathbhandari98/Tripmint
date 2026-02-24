import { Car, MapPin, RotateCcw, Sparkles, User } from "lucide-react";
import toast from "react-hot-toast";
import type { MessageType } from "../messageTemplate";
import Input from "./ui/Input";

interface Props {
  onGenerate: (data: MessageType) => void;
}

const BookingForm = ({ onGenerate }: Props) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;

    const formData: MessageType = {
      passengerName: (
        form.elements.namedItem("passengerName") as HTMLInputElement
      ).value.trim(),
      passengerPhone: (
        form.elements.namedItem("passengerPhone") as HTMLInputElement
      ).value.trim(),
      driverName: (
        form.elements.namedItem("driverName") as HTMLInputElement
      ).value.trim(),
      driverNumber: (
        form.elements.namedItem("driverPhone") as HTMLInputElement
      ).value.trim(),
      vehicleNumber: (
        form.elements.namedItem("vehicleNumber") as HTMLInputElement
      ).value.trim(),
      pickupLocation: (
        form.elements.namedItem("pickupLocation") as HTMLInputElement
      ).value.trim(),
      dropLocation: (
        form.elements.namedItem("dropLocation") as HTMLInputElement
      ).value.trim(),
      locationLink: (
        form.elements.namedItem("locationLink") as HTMLInputElement
      )?.value.trim(),
      pickupDate: (form.elements.namedItem("pickupDate") as HTMLInputElement)
        .value,
      pickupTime: (form.elements.namedItem("pickupTime") as HTMLInputElement)
        .value,
      otp: (form.elements.namedItem("otp") as HTMLInputElement).value.trim(),
    };

    // Required field validation
    const requiredFields = [
      formData.passengerName,
      formData.passengerPhone,
      formData.driverName,
      formData.driverNumber,
      formData.vehicleNumber,
      formData.pickupLocation,
      formData.dropLocation,
      formData.pickupDate,
      formData.pickupTime,
      formData.otp,
    ];

    if (requiredFields.some((field) => !field)) {
      toast.error("Please fill all required fields.");
      return;
    }

    //  Phone validation
    const phoneRegex = /^[0-9]{10}$/;

    if (!phoneRegex.test(formData.passengerPhone)) {
      toast.error("Passenger phone must be 10 digits.");
      return;
    }

    if (!phoneRegex.test(formData.driverNumber)) {
      toast.error("Driver phone must be 10 digits.");
      return;
    }

    // OTP validation (4–6 digits)
    const otpRegex = /^[0-9]{4,6}$/;

    if (!otpRegex.test(formData.otp)) {
      toast.error("OTP must be 4 to 6 digits.");
      return;
    }

    // If all valid
    onGenerate(formData);
    toast.success("Message generated successfully!");
  };

  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const form = e.currentTarget.closest("form") as HTMLFormElement;
    form.reset();
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* Passenger Details */}
        <div className="mb-6">
          <div className="font-semibold flex gap-2 items-center text-[#075E54] pb-2">
            <User size={22} />
            Passenger Details
          </div>

          <div className="mt-4 space-y-4">
            <Input label="Passenger Name" id="passengerName" />
            <Input label="Passenger Phone" id="passengerPhone" />
          </div>
        </div>

        {/* Driver Details */}
        <div className="mb-6">
          <div className="font-semibold flex gap-2 items-center text-[#075E54] pb-2">
            <Car size={22} />
            Driver Details
          </div>

          <div className="mt-4 space-y-4">
            <Input label="Driver Name" id="driverName" />
            <Input label="Driver Phone" id="driverPhone" />
            <Input label="Vehicle Number" id="vehicleNumber" />
          </div>
        </div>

        {/* Trip Details */}
        <div className="mb-6">
          <div className="font-semibold flex gap-2 items-center text-[#075E54] pb-2">
            <MapPin size={22} />
            Trip Details
          </div>

          <div className="mt-4 space-y-4">
            <Input label="Pickup Location" id="pickupLocation" />
            <Input label="Drop Location" id="dropLocation" />
            <Input label="Location Link(optional)" id="locationLink" />

            <div className="flex gap-4">
              <Input label="Pickup Date" id="pickupDate" type="date" />
              <Input label="Pickup Time" id="pickupTime" type="time" />
            </div>

            <Input label="OTP" id="otp" type="number" />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            className="flex-1 bg-[#168c41] cursor-pointer hover:bg-[#07c251] text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-md"
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
