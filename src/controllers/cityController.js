import {
  createCityService,
  deleteCityService,
  getCityService,
  listCitiesService,
  updateCityService
} from "../services/cityService.js";

export async function createCity(req, res, next) {
  try {
    const city = await createCityService(req.body);
    res.status(201).json({ success: true, data: city });
  } catch (error) {
    next(error);
  }
}

export async function listCities(req, res, next) {
  try {
    const cities = await listCitiesService();
    res.json({ success: true, data: cities });
  } catch (error) {
    next(error);
  }
}

export async function getCity(req, res, next) {
  try {
    const city = await getCityService(req.params.id);
    res.json({ success: true, data: city });
  } catch (error) {
    next(error);
  }
}

export async function updateCity(req, res, next) {
  try {
    const city = await updateCityService(req.params.id, req.body);
    res.json({ success: true, data: city });
  } catch (error) {
    next(error);
  }
}

export async function deleteCity(req, res, next) {
  try {
    await deleteCityService(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
