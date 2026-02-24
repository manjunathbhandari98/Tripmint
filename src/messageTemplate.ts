export type MessageType ={
    pickupDate: string,
    pickupTime: string,
    passengerName: string,
    passengerPhone: string,
    pickupLocation: string,
    dropLocation: string,
    locationLink?: string,
    driverName: string,
    driverNumber: string,
    vehicleNumber: string,
    otp: string
}

export const generateMessage = (data: MessageType) => {
  const lines = [
    // "GoaMiles BOOKING CONFIRMATION",
    // "",
    `Pickup Date & Time: ${data.pickupDate} : ${data.pickupTime}`,
    "",
    `Passenger Name: ${data.passengerName}`,
    `Passenger Phone: ${data.passengerPhone}`,
    "",
    `Pickup Location: ${data.pickupLocation}`,
    `Drop Location: ${data.dropLocation}`,
  ];

  if (data.locationLink) {
    lines.push(`
${data.locationLink}`);
  }

  lines.push(
    "",
    `Driver Name: ${data.driverName}`,
    `Driver Phone: ${data.driverNumber}`,
    `Vehicle Number: ${data.vehicleNumber}`,
    "",
    `OTP: ${data.otp}`,
    "",
    "Thank you!"
  );

  return lines.join("\n");
};