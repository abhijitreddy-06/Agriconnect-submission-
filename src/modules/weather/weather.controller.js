import catchAsync from "../../utils/catchAsync.js";
import * as WeatherService from "./weather.service.js";
import sendResponse from "../../utils/sendResponse.js";

export const getRegionalWeather = catchAsync(async (req, res) => {
  const result = await WeatherService.getRegionalWeather(req.query);
  return sendResponse(res, 200, "Weather and pest alerts fetched successfully.", result);
});
