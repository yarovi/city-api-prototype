import {
  createCity,
  deleteCity,
  findCityById,
  listCities,
  updateCity
} from "../repositories/cityRepository.js";
import { AppError } from "../middlewares/errorHandler.js";

function normalizeRequiredText(value, field) {
  if (value === null || value === undefined) {
    throw new AppError(`${field} is required`, 400, "VALIDATION_ERROR");
  }

  if (typeof value !== "string") {
    throw new AppError(`${field} must be a string`, 400, "VALIDATION_ERROR");
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new AppError(`${field} cannot be empty`, 400, "VALIDATION_ERROR");
  }

  return normalized;
}

export async function createCityService(input) {
  const name = normalizeRequiredText(input?.name, "name");
  const country = normalizeRequiredText(input?.country, "country");
  return createCity({ name, country });
}

export async function listCitiesService() {
  return listCities();
}

export async function getCityService(id) {
  const city = await findCityById(id);
  if (!city) {
    throw new AppError("City not found", 404, "CITY_NOT_FOUND");
  }
  return city;
}

export async function updateCityService(id, input) {
  const fields = {};

  if (Object.prototype.hasOwnProperty.call(input ?? {}, "name")) {
    fields.name = normalizeRequiredText(input.name, "name");
  }

  if (Object.prototype.hasOwnProperty.call(input ?? {}, "country")) {
    fields.country = normalizeRequiredText(input.country, "country");
  }

  if (Object.keys(fields).length === 0) {
    throw new AppError("No fields to update", 400, "VALIDATION_ERROR");
  }

  const city = await updateCity(id, fields);
  if (!city) {
    throw new AppError("City not found", 404, "CITY_NOT_FOUND");
  }
  return city;
}

export async function deleteCityService(id) {
  const city = await deleteCity(id);
  if (!city) {
    throw new AppError("City not found", 404, "CITY_NOT_FOUND");
  }
}
