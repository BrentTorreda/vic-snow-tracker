const axios = require("axios");

// Precise coordinates for Victorian mountains
const MOUNTAINS = [
  { name: "Mt Hotham", lat: -36.98, lon: 147.13 },
  { name: "Falls Creek", lat: -36.86, lon: 147.28 },
  { name: "Mt Buller", lat: -37.15, lon: 146.45 },
  { name: "Mt Baw Baw", lat: -37.84, lon: 146.27 },
  { name: "Lake Mountain", lat: -37.5, lon: 145.88 },
  { name: "Mt Donna Buang", lat: -37.71, lon: 145.68 },
];

module.exports = async function (context, req) {
  context.log("Fetching snow data from Open-Meteo API...");

  try {
    const results = await Promise.all(
      MOUNTAINS.map(async (mountain) => {
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${mountain.lat}&longitude=${mountain.lon}&current=temperature_2m,apparent_temperature,precipitation,rain,snowfall,weather_code,wind_speed_10m&timezone=Australia%2FSydney`;

          const response = await axios.get(url, { timeout: 5000 });
          const current = response.data?.current;

          if (!current) {
            throw new Error("No weather payload returned");
          }

          const temp = current.temperature_2m;
          const snowfall = current.snowfall ?? 0;
          const rain = current.rain ?? 0;

          // Interpret Open-Meteo WMO weather codes
          const weatherDesc = getWeatherDescription(
            current.weather_code,
            snowfall,
            rain,
            temp,
          );

          return {
            name: mountain.name,
            temp: Math.round(temp * 10) / 10,
            apparentTemp: Math.round(current.apparent_temperature * 10) / 10,
            weather: weatherDesc,
            snowing: snowfall > 0 || (temp <= 1 && current.precipitation > 0),
            snowfallCm: snowfall,
            windSpd: Math.round(current.wind_speed_10m),
            updated: new Date().toLocaleTimeString("en-AU", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
        } catch (err) {
          context.log.error(`Error fetching ${mountain.name}: ${err.message}`);
          return {
            name: mountain.name,
            temp: "N/A",
            apparentTemp: "N/A",
            weather: "Data Unavailable",
            snowing: false,
            snowfallCm: 0,
            windSpd: 0,
            updated: "N/A",
          };
        }
      }),
    );

    context.res = {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300", // Cache 5 mins
      },
      body: results,
    };
  } catch (err) {
    context.log.error("Fatal API Error:", err);
    context.res = {
      status: 500,
      body: { error: "Failed to query weather provider", details: err.message },
    };
  }
};

// Map WMO Weather Codes to human-readable Victorian snow descriptions
function getWeatherDescription(code, snowfall, rain, temp) {
  if (snowfall > 0) return "Snowing 🌨️";
  if (code >= 71 && code <= 77) return "Snow Flurries ❄️";
  if (code >= 85 && code <= 86) return "Snow Showers 🌨️";
  if (code >= 51 && code <= 67)
    return rain > 0 ? (temp <= 2 ? "Freezing Rain 🌧️" : "Rain 🌧️") : "Drizzle";
  if (code >= 1 && code <= 3) return "Partly Cloudy ⛅";
  if (code === 0) return "Clear Skies ☀️";
  return temp <= 0 ? "Freezing / Frost 🧊" : "Cloudy ☁️";
}
