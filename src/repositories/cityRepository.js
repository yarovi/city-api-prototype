import { supabase } from "../config/supabase.js";
import { getEnv } from "../config/env.js";
import { AppError } from "../middlewares/errorHandler.js";

const TABLE = "city";

function ensureSupabaseSuccess(error) {
  if (error) {
    throw new AppError(error.message, 500, "DATABASE_ERROR");
  }
}

export async function createCity({ name, country }) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ name, country })
    .select()
    .single();

  ensureSupabaseSuccess(error);
  return data;
}

export async function listCities() {
  const { row } = getEnv();

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("date", { ascending: false })
    .limit(row);

  ensureSupabaseSuccess(error);
  return data;
}

export async function findCityById(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  ensureSupabaseSuccess(error);
  return data;
}

export async function updateCity(id, fields) {
  const payload = {
    ...fields,
    moddate: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", id)
    .select()
    .maybeSingle();

  ensureSupabaseSuccess(error);
  return data;
}

export async function deleteCity(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  ensureSupabaseSuccess(error);
  return data;
}
