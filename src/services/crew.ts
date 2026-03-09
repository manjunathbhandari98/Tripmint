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
  bookingLeadTime: row.bookingLeadTime ?? null,
});

// Converts a Crew object to the exact DB column names Supabase expects
// All columns are camelCase in the DB (same pattern as drivers table)
const toDbRow = (crew: Partial<Crew>): Record<string, unknown> => ({
  ...(crew.name            !== undefined && { name:            crew.name }),
  ...(crew.phone           !== undefined && { phone:           crew.phone }),
  ...(crew.address         !== undefined && { address:         crew.address ?? null }),
  ...(crew.location        !== undefined && { location:        crew.location ?? null }),
  ...(crew.lat             !== undefined && { lat:             crew.lat ?? null }),
  ...(crew.lng             !== undefined && { lng:             crew.lng ?? null }),
  ...(crew.designation     !== undefined && { designation:     crew.designation ?? null }),
  ...(crew.bookingLeadTime !== undefined && { bookingLeadTime: crew.bookingLeadTime ?? null }),
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

export const addCrew = async (crew: Omit<Crew, "id">): Promise<Crew[]> => {
  const { data, error } = await supabase
    .from("crew")
    .insert([toDbRow(crew)])
    .select();

  if (error) {
    console.error("Add crew error:", error);
    throw error;
  }

  return (data ?? []).map(rowToCrew);
};

export const updateCrew = async (id: string, updates: Partial<Omit<Crew, "id">>): Promise<Crew[]> => {
  const { data, error } = await supabase
    .from("crew")
    .update(toDbRow(updates))
    .eq("id", id)
    .select();

  if (error) {
    console.error("Update crew error:", error);
    throw error;
  }

  return (data ?? []).map(rowToCrew);
};

export const deleteCrew = async (id: string): Promise<void> => {
  const { error } = await supabase.from("crew").delete().eq("id", id);
  if (error) {
    console.error("Delete crew error:", error);
    throw error;
  }
};