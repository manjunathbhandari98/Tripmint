import { useState } from "react";
import { Toaster } from "react-hot-toast";
import BookingForm from "../components/BookingForm";
import MessagePreview from "../components/MessagePreview";
import { generateMessage, type MessageType } from "../messageTemplate";
import Footer from "./Footer";
import Header from "./Header";

const MainLayout = () => {
  const [message, setMessage] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");

  const handleGenerate = (formData: MessageType) => {
    const formattedMessage = generateMessage(formData);

    setMessage(formattedMessage);
    setDriverPhone(formData.driverNumber);
    setPassengerPhone(formData.passengerPhone);
  };

  return (
    <div className="main h-full w-screen bg-gray-100">
      <Header />
      <Toaster position="bottom-right" />

      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white rounded-lg p-5 shadow-sm">
            <BookingForm onGenerate={handleGenerate} />
          </div>

          <div className="lg:col-span-2">
            <MessagePreview
              message={message}
              driverPhone={driverPhone}
              passengerPhone={passengerPhone}
              onMessageUpdate={setMessage}
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MainLayout;
