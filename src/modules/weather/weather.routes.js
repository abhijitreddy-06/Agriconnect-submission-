import express from "express";
import { getRegionalWeather } from "./weather.controller.js";

const router = express.Router();

router.get("/region", getRegionalWeather);

export default router;
