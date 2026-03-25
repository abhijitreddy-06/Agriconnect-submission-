import AppError from "../../utils/AppError.js";

const regionCoordinates = {
  hyderabad: { lat: 17.385, lng: 78.4867 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  delhi: { lat: 28.6139, lng: 77.209 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  pune: { lat: 18.5204, lng: 73.8567 },
};

const buildPestAlerts = ({ temperature, humidity, precipitation }) => {
  const alerts = [];

  if (humidity >= 80 && temperature >= 24) {
    alerts.push("High fungal disease risk. Increase field ventilation and monitor leaf spots.");
  }
  if (temperature >= 32 && humidity <= 40) {
    alerts.push("Heat stress conditions likely. Schedule irrigation in early morning/evening.");
  }
  if (precipitation >= 5) {
    alerts.push("Rainfall expected. Watch for root rot and spray wash-off after rain.");
  }

  if (alerts.length === 0) {
    alerts.push("Conditions are relatively stable. Continue weekly pest scouting.");
  }

  return alerts;
};

export const getRegionalWeather = async (query) => {
  const region = String(query.region || "hyderabad").trim().toLowerCase();
  const mapped = regionCoordinates[region];

  const lat = Number(query.lat || mapped?.lat);
  const lng = Number(query.lng || mapped?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new AppError("Valid lat and lng are required, or provide a supported region.", 400);
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url);
  if (!response.ok) {
    throw new AppError("Unable to fetch weather at the moment.", 502);
  }

  const payload = await response.json();
  const current = payload.current || {};

  const weather = {
    region,
    coordinates: { lat, lng },
    temperature: Number(current.temperature_2m || 0),
    humidity: Number(current.relative_humidity_2m || 0),
    precipitation: Number(current.precipitation || 0),
    windSpeed: Number(current.wind_speed_10m || 0),
    weatherCode: Number(current.weather_code || 0),
    observedAt: current.time || null,
  };

  return {
    weather,
    pestDiseaseAlerts: buildPestAlerts({
      temperature: weather.temperature,
      humidity: weather.humidity,
      precipitation: weather.precipitation,
    }),
  };
};
