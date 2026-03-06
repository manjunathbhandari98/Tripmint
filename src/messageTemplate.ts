// ─── Types ────────────────────────────────────────────────────────────────────

export type Passenger = {
  name: string;
  phone: string;
  individualLocation: string;
  locationLink?: string;
};

export type BookingMode = "single" | "same_pickup" | "same_drop";

export type MessageType = {
  bookingMode: BookingMode;

  // ── Single-passenger fields ──────────────────────────────────────
  passengerName: string;
  passengerPhone: string;
  pickupLocations: string[];
  dropLocations: string[];
  locationLink?: string;

  // ── Multi-passenger fields ───────────────────────────────────────
  sharedLocation: string;
  sharedLocationLink?: string;
  passengers: Passenger[];

  // ── Common fields ────────────────────────────────────────────────
  pickupDate: string;
  pickupTime: string;
  driverName: string;
  driverNumber: string;
  vehicleNumber: string;
  otp: string;
  additionalNotes?: string;
};

// ─── Generator ────────────────────────────────────────────────────────────────

export const generateMessage = (data: MessageType): string => {
  const lines: string[] = [];

  if (data.pickupDate !== "N/A") {
    lines.push(`Pickup Date & Time: ${data.pickupDate} at ${data.pickupTime}`);
    lines.push("");
  }

  if (data.bookingMode === "single") {
    lines.push(`Passenger Name: ${data.passengerName}`);
    lines.push(`Passenger Phone: ${data.passengerPhone}`);
    lines.push("");
    lines.push("Pickup:");
    data.pickupLocations.forEach((loc) => lines.push(`   ${loc.trim()}`));
    lines.push("");
    lines.push("Drop:");
    data.dropLocations.forEach((loc) => lines.push(`   ${loc.trim()}`));
    if (data.locationLink) {
      lines.push("");
      lines.push(`${data.locationLink}`);
    }
  }

  if (data.bookingMode === "same_pickup") {
    // Names — always present
    const names = data.passengers.map((p) => p.name).filter(Boolean);
    // Phones — only what was actually entered (stored as individual entries)
    const phones = data.passengers.map((p) => p.phone).filter(Boolean);
    // Locations — only what was actually entered
    const locs = data.passengers.map((p) => p.individualLocation).filter(Boolean);

    lines.push(`Passenger Name: ${names.join("\n")}`);
    lines.push("");

    if (phones.length > 0) {
      lines.push(`Passenger Phone: ${phones.join("\n")}`);
      lines.push("");
    }

    lines.push(`Pickup: ${data.sharedLocation}`);
    if (data.sharedLocationLink) lines.push(data.sharedLocationLink);
    lines.push("");

    if (locs.length === 1) {
      lines.push(`Drop: ${locs[0]}`);
    } else if (locs.length > 1) {
      lines.push("Drop:");
      locs.forEach((loc) => lines.push(`   ${loc}`));
    }
  }

  if (data.bookingMode === "same_drop") {
    const names = data.passengers.map((p) => p.name).filter(Boolean);
    const phones = data.passengers.map((p) => p.phone).filter(Boolean);
    const locs = data.passengers.map((p) => p.individualLocation).filter(Boolean);

    lines.push(`Passenger Name: ${names.join("\n")}`);
    lines.push("");

    if (phones.length > 0) {
      lines.push(`Passenger Phone: ${phones.join("\n")}`);
      lines.push("");
    }

    if (locs.length === 1) {
      lines.push(`Pickup: ${locs[0]}`);
    } else if (locs.length > 1) {
      lines.push("Pickup:");
      locs.forEach((loc) => lines.push(`   ${loc}`));
    }

    lines.push("");
    lines.push(`Drop: ${data.sharedLocation}`);
    if (data.sharedLocationLink) lines.push(data.sharedLocationLink);
  }

  lines.push("");
  lines.push(`Driver Name: ${data.driverName}`);
  lines.push(`Driver Phone: ${data.driverNumber}`);
  lines.push(`Vehicle Number: ${data.vehicleNumber}`);
  lines.push("");
  if (data.otp && data.otp !== "N/A") lines.push(`OTP: ${data.otp}`);
  if (data.additionalNotes) {
    lines.push("");
    lines.push(`${data.additionalNotes}`);
  }
  lines.push("");
  lines.push("Thank you");

  return lines.join("\n");
};