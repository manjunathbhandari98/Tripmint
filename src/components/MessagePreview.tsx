import { Car, Copy, Edit3, MessageCircle, Save, Send } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface MessagePreviewProps {
  message: string;
  driverPhone: string;
  passengerPhone: string;
  onMessageUpdate: (updatedMessage: string) => void;
}

const MessagePreview = ({
  message,
  driverPhone,
  passengerPhone,
  onMessageUpdate,
}: MessagePreviewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableMessage, setEditableMessage] = useState("");
  const [otherNumber, setOtherNumber] = useState("");

  const finalMessage = isEditing ? editableMessage : message;

  const handleEdit = () => {
    setEditableMessage(message);
    setIsEditing(true);
  };

  const handleSave = () => {
    onMessageUpdate(editableMessage); // 🔥 update parent
    setIsEditing(false);
    toast.success("Message updated.");
  };

  const handleCopy = async () => {
    if (!finalMessage) return;
    await navigator.clipboard.writeText(finalMessage);
    toast.success("Message Copied!");
  };

  const sendWhatsApp = (phone: string) => {
    if (!finalMessage) return;

    const cleaned = phone.replace(/\D/g, "");
    const num = cleaned.startsWith("91") ? cleaned : `91${cleaned}`;

    const url = `https://web.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(finalMessage)}`;
    window.open(url, "whatsappWindow");
  };

  const handleOtherSend = () => {
    if (!finalMessage) {
      toast.error("Generate message first.");
      return;
    }

    if (!otherNumber.trim()) {
      toast.error("Enter a number or group link.");
      return;
    }

    if (otherNumber.includes("chat.whatsapp.com")) {
      window.open(otherNumber, "whatsappWindow");
      return;
    }

    const cleaned = otherNumber.replace(/\D/g, "");

    if (cleaned.length < 10) {
      toast.error("Enter valid phone number.");
      return;
    }

    const num = cleaned.startsWith("91") ? cleaned : `91${cleaned}`;
    const url = `https://web.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(finalMessage)}`;

    window.open(url, "whatsappWindow");
  };

  return (
    <div>
      <div className="bg-white rounded-2xl h-full flex flex-col shadow-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div className="flex gap-2 items-center font-semibold text-[#075E54]">
            <Car size={18} />
            <h2>Cab Booking Details</h2>
          </div>

          {message && (
            <button
              onClick={isEditing ? handleSave : handleEdit}
              className="text-sm flex items-center gap-1 text-[#075E54] hover:text-[#168c41] transition"
            >
              {isEditing ? <Save size={16} /> : <Edit3 size={16} />}
              {isEditing ? "Save" : "Edit"}
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {!message ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center gap-3">
              <MessageCircle size={40} />
              <p className="text-sm font-medium">No message generated yet</p>
              <p className="text-xs">
                Fill the booking form and click Generate Message
              </p>
            </div>
          ) : isEditing ? (
            <textarea
              value={editableMessage}
              onChange={(e) => setEditableMessage(e.target.value)}
              className="w-full min-h-[300px] resize-none 
                         text-sm text-gray-800 leading-relaxed 
                         font-medium outline-none border border-gray-200 
                         rounded-lg p-4"
            />
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-medium">
              {message}
            </pre>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {message && (
        <div className="gap-3">
          <div className="flex gap-2 py-6">
            <button
              className="flex-1 bg-[#168c41] text-sm hover:bg-[#07c251] text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition"
              onClick={() => sendWhatsApp(driverPhone)}
            >
              <Send size={18} />
              Send to Driver
            </button>

            <button
              className="flex-1 bg-[#168c41] text-sm hover:bg-[#07c251] text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition"
              onClick={() => sendWhatsApp(passengerPhone)}
            >
              <Send size={18} />
              Send to Passenger
            </button>
          </div>

          <button
            className="w-full text-sm bg-gray-100 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 border border-gray-300 hover:text-green-600 hover:bg-green-300/20 transition"
            onClick={handleCopy}
          >
            <Copy size={18} />
            Copy Message
          </button>

          <div className="flex items-center gap-3 mt-5 w-full">
            <input
              type="text"
              value={otherNumber}
              onChange={(e) => setOtherNumber(e.target.value)}
              placeholder="Enter number or group invite link"
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm 
                         focus:outline-none focus:ring-1 focus:ring-[#25D366]"
            />

            <button
              onClick={handleOtherSend}
              className="px-5 py-2.5 rounded-xl bg-gray-200 text-sm font-semibold 
                         hover:bg-[#1ebe5d] hover:text-white flex items-center gap-2 transition"
            >
              <Send size={18} />
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagePreview;
