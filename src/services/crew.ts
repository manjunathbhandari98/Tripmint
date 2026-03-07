import { supabase } from "../lib/supabase";

export interface Crew {
  id?: string;
  name: string;
  phone: string;
  address: string;
  location: string;
  lat?: number;
  lng?: number;
  designation?: string;
  bookingLeadTime?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rowToCrew = (row: any): Crew => ({
  id: row.id,
  name: row.name ?? "",
  phone: row.phone ?? "",
  address: row.address ?? "",
  location: row.location ?? "",
  lat: row.lat,
  lng: row.lng,
  designation: row.designation,
  // Handle both snake_case (Postgres default) and camelCase column names
  bookingLeadTime: row.booking_lead_time ?? row.bookingLeadTime,
});

export const fetchCrew = async (): Promise<Crew[]> => {
  const { data, error } = await supabase
    .from("crew")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Fetch crew error:", error);
    return [];
  }

  return (data ?? []).map(rowToCrew);
};

export const addCrew = async (crew: Crew) => {
  const { data, error } = await supabase
    .from("crew")
    .insert([{
      name: crew.name,
      phone: crew.phone,
      address: crew.address,
      location: crew.location,
      lat: crew.lat ?? null,
      lng: crew.lng ?? null,
      designation: crew.designation ?? null,
      booking_lead_time: crew.bookingLeadTime ?? null,
    }])
    .select();

  if (error) {
    console.error("Add crew error:", error);
    throw error;
  }

  return (data ?? []).map(rowToCrew);
};

export const updateCrew = async (id: string, updates: Partial<Crew>) => {
  const dbUpdates: Record<string, unknown> = { ...updates };
  if ("bookingLeadTime" in updates) {
    dbUpdates.booking_lead_time = updates.bookingLeadTime;
    delete dbUpdates.bookingLeadTime;
  }

  const { data, error } = await supabase
    .from("crew")
    .update(dbUpdates)
    .eq("id", id)
    .select();

  if (error) {
    console.error("Update crew error:", error);
    throw error;
  }

  return (data ?? []).map(rowToCrew);
};

export const deleteCrew = async (id: string) => {
  const { error } = await supabase.from("crew").delete().eq("id", id);
  if (error) {
    console.error("Delete crew error:", error);
    throw error;
  }
};