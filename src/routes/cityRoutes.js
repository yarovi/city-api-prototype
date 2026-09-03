import { Router } from "express";
import {
  createCity,
  deleteCity,
  getCity,
  listCities,
  updateCity
} from "../controllers/cityController.js";

export const cityRouter = Router();

cityRouter.post("/", createCity);
cityRouter.get("/", listCities);
cityRouter.get("/:id", getCity);
cityRouter.put("/:id", updateCity);
cityRouter.delete("/:id", deleteCity);
