import { supabase } from "../lib/supabase";

export interface Driver {
  id?: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  vehicleType?: string;
  isPrimary?: boolean; // matches DB column "isPrimary"
}

export const fetchDrivers = async (): Promise<Driver[]> => {
  const { data, error } = await supabase
    .from("drivers")
    .select("id, name, phone, vehicleNumber, vehicleType, isPrimary")
    .order("isPrimary", { ascending: false }) // prime drivers first
    .order("name",      { ascending: true });

  if (error) {
    console.error("Fetch drivers error:", error);
    return [];
  }

  return (data ?? []) as Driver[];
};

export const addDriver = async (driver: Omit<Driver, "id">) => {
  const { data, error } = await supabase
    .from("drivers")
    .insert([{
      name:          driver.name,
      phone:         driver.phone,
      vehicleNumber: driver.vehicleNumber,
      vehicleType:   driver.vehicleType  ?? null,
      isPrimary:     driver.isPrimary    ?? false,
    }])
    .select();

  if (error) {
    console.error("Add driver error:", error);
    throw error;
  }

  return (data ?? []) as Driver[];
};

export const updateDriver = async (id: string, updates: Partial<Omit<Driver, "id">>) => {
  const { data, error } = await supabase
    .from("drivers")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) {
    console.error("Update driver error:", error);
    throw error;
  }

  return (data ?? []) as Driver[];
};

export const deleteDriver = async (id: string) => {
  const { error } = await supabase.from("drivers").delete().eq("id", id);
  if (error) {
    console.error("Delete driver error:", error);
    throw error;
  }
};