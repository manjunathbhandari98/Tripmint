export type MessageType = {
  pickupDate: string;
  pickupTime: string;
  passengerName: string;
  passengerPhone: string;
  pickupLocations: string[];  
  dropLocations: string[];    
  locationLink?: string;
  driverName: string;
  driverNumber: string;
  vehicleNumber: string;
  otp: string;
  additionalNotes?: string;
};

export const generateMessage = (data: MessageType) => {
  const lines = [
    `Pickup Date & Time: ${data.pickupDate} : ${data.pickupTime}`,
    "",
    `Passenger Name: ${data.passengerName}`,
    `Passenger Phone: ${data.passengerPhone}`,
    "",
    "Pickup Location:",
    ...data.pickupLocations.map((loc) => loc.trim()),
    "",
    "Drop Location:",
    ...data.dropLocations.map((loc) => loc.trim()),
  ];

  if (data.locationLink) {
    lines.push("", data.locationLink);
  }

  lines.push(
    "",
    `Driver Name: ${data.driverName}`,
    `Driver Phone: ${data.driverNumber}`,
    `Vehicle Number: ${data.vehicleNumber}`,
    "",
    `OTP: ${data.otp}`
  );

  if (data.additionalNotes) {
    lines.push("", data.additionalNotes);
  }

  lines.push("", "Thank you!");

  return lines.join("\n");
};