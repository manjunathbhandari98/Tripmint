import { Car, Copy, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface MessagePreviewProps {
  message: string;
  driverPhone: string;
  passengerPhone: string;
}

const MessagePreview = ({
  message,
  driverPhone,
  passengerPhone,
}: MessagePreviewProps) => {
  const [otherNumber, setOtherNumber] = useState("");

  const handleMessageCopy = async () => {
    await navigator.clipboard.writeText(message);
    toast.success("Message Copied!", {
      duration: 2000,
    });
  };

  const sendWhatsApp = (phone: string) => {
    if (!message) return;

    const cleaned = phone.replace(/\D/g, "");
    const num = cleaned.startsWith("91") ? cleaned : `91${cleaned}`;

    const url = `https://web.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(message)}`;

    window.open(url, "whatsappWindow");
  };

  const handleOtherSend = () => {
    if (!message) {
      toast.error("Generate message first.");
      return;
    }

    if (!otherNumber.trim()) {
      toast.error("Enter a number or group link.");
      return;
    }

    // If it's a WhatsApp group invite link
    if (otherNumber.includes("chat.whatsapp.com")) {
      window.open(otherNumber, "whatsappWindow");
      toast.success("Opening group...");
      return;
    }

    // Otherwise treat as phone number
    const cleaned = otherNumber.replace(/\D/g, "");

    if (cleaned.length < 10) {
      toast.error("Enter a valid phone number.");
      return;
    }

    const num = cleaned.startsWith("91") ? cleaned : `91${cleaned}`;

    const url = `https://web.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(message)}`;

    window.open(url, "whatsappWindow");
    toast.success("Opening WhatsApp...");
  };

  return (
    <div className="">
      <div className="bg-white rounded-2xl h-full flex flex-col">
        {/* Header */}
        <div className="px-6 py-4">
          <div className="flex gap-2 items-center font-semibold text-[#075E54] tracking-wide">
            <Car size={18} />
            <h2>Cab Booking Details</h2>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {!message ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center gap-3">
              <MessageCircle size={40} />
              <p className="text-sm font-medium">No message generated yet</p>
              <p className="text-xs text-gray-400">
                Fill the booking form and click Generate Message
              </p>
            </div>
          ) : (
            <div className="w-full">
              <pre className="whitespace-pre-wrap p-6 text-sm text-gray-800 leading-relaxed font-medium">
                {message}
              </pre>

              <div className="flex justify-end mt-4">
                <span className="text-[11px] text-gray-400">
                  {new Date().toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Action Buttons */}
      <div className="gap-3">
        <div className="flex gap-2 py-6">
          <button
            type="submit"
            className="flex-1 bg-[#168c41] cursor-pointer text-sm hover:bg-[#07c251] text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md"
            onClick={() => sendWhatsApp(driverPhone)}
          >
            <Send size={18} />
            Send to Driver
          </button>
          <button
            type="submit"
            className="flex-1 bg-[#168c41] cursor-pointer text-sm hover:bg-[#07c251] text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md"
            onClick={() => sendWhatsApp(passengerPhone)}
          >
            <Send size={18} />
            Send to Passanger
          </button>
        </div>
        {/* Copy Button */}
        <button
          className="w-full text-sm text-center cursor-pointer bg-gray-100 text-zinc-900 f
          ont-semibold py-2.5 rounded-lg flex items-center justify-center 
          gap-2 transition-all duration-200 border border-gray-300
          hover:text-green-600 hover:bg-green-300/20
          "
          onClick={handleMessageCopy}
        >
          <Copy size={18} />
          Copy Message
        </button>
        {/* Other Number */}
        <div className="flex items-center gap-3 mt-5 w-full">
          <input
            type="text"
            value={otherNumber}
            onChange={(e) => setOtherNumber(e.target.value)}
            placeholder="Enter number or group invite link"
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm 
               focus:outline-none focus:ring-1 focus:ring-[#25D366] 
               focus:border-[#25D366] transition-all duration-200"
          />

          <button
            onClick={handleOtherSend}
            disabled={!message}
            className="px-5 py-2.5 rounded-xl bg-gray-200 text-black/70 text-sm font-semibold 
               hover:bg-[#1ebe5d] hover:text-white flex items-center gap-2 
               transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessagePreview;
