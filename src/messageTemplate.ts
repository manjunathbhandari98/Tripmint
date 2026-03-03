// ─── Types ────────────────────────────────────────────────────────────────────

export type Passenger = {
  name: string;
  phone: string;
  /** The location that varies per passenger (pickup OR drop depending on mode) */
  individualLocation: string;
  /** Optional Google Maps link for the individual location */
  locationLink?: string;
};

/**
 * "single"      → classic single-passenger booking
 * "same_pickup" → all share one pickup, each has their own drop
 * "same_drop"   → all share one drop, each has their own pickup
 */
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
  sharedLocation: string;        // common pickup OR drop address
  sharedLocationLink?: string;   // map link for the shared stop
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
    lines.push(`Pickup: ${data.sharedLocation}`);
    if (data.sharedLocationLink) lines.push(`${data.sharedLocationLink}`);
    lines.push("");
    lines.push(`Passengers (${data.passengers.length}):`);
    data.passengers.forEach((p, i) => {
      lines.push("");
      lines.push(`  ${i + 1}. ${p.name} — 📞 ${p.phone}`);
      lines.push(`Drop: ${p.individualLocation}`);
      if (p.locationLink) lines.push(`     ${p.locationLink}`);
    });
  }

  if (data.bookingMode === "same_drop") {
    lines.push(`Drop: ${data.sharedLocation}`);
    if (data.sharedLocationLink) lines.push(`${data.sharedLocationLink}`);
    lines.push("");
    lines.push(`Passengers (${data.passengers.length}):`);
    data.passengers.forEach((p, i) => {
      lines.push("");
      lines.push(`  ${i + 1}. ${p.name} — 📞 ${p.phone}`);
      lines.push(`Pickup: ${p.individualLocation}`);
      if (p.locationLink) lines.push(`${p.locationLink}`);
    });
  }

  lines.push("");
  // lines.push("─────────────────────");
  lines.push(`Driver Name: ${data.driverName}`);
  lines.push(`Driver Phone: ${data.driverNumber}`);
  lines.push(`Vehicle Number: ${data.vehicleNumber}`);
  if (data.otp && data.otp !== "N/A") lines.push(`OTP: ${data.otp}`);
  if (data.additionalNotes) {
    lines.push("");
    lines.push(`${data.additionalNotes}`);
  }
  lines.push("");
  lines.push("Thank you");

  return lines.join("\n");
};