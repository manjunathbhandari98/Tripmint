import { useState } from "react";
import { Toaster } from "react-hot-toast";
import BookingForm from "../components/BookingForm";
import MessagePreview from "../components/MessagePreview";
import { generateMessage, type MessageType } from "../messageTemplate";
import Footer from "./Footer";
import Header from "./Header";

const MainLayout = () => {
  const [booking, setBooking] = useState<MessageType | null>(null);
  const [message, setMessage] = useState("");

  const handleGenerate = (formData: MessageType) => {
    setBooking(formData);
    const formattedMessage = generateMessage(formData);
    setMessage(formattedMessage);
  };

  return (
    <div className="main h-full w-screen bg-gray-100">
      <Header />
      <Toaster position="bottom-right" />
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-3 bg-white rounded-lg p-5 shadow-sm">
            <BookingForm onGenerate={handleGenerate} />
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            <MessagePreview
              message={message}
              driverPhone={booking?.driverNumber || ""}
              passengerPhone={booking?.passengerPhone || ""}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MainLayout;
