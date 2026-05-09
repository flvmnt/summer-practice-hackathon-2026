import { z } from "zod";
import type { SportKey } from "@/lib/sports";

export type WeatherFit =
  | "outdoor_good"
  | "indoor_recommended"
  | "wind_warning"
  | "cold_warning";

export type WeatherForecast = {
  temperatureC: number;
  rainProbability: number;
  windKmh: number;
  fit: WeatherFit;
  forecastAt: string;
};

type WeatherInput = {
  temperatureC: number;
  rainProbability: number;
  windKmh: number;
  sport: SportKey;
};

const HOURLY_VALUE = z.union([z.number(), z.null()]);

const openMeteoForecastSchema = z.object({
  hourly: z.object({
    time: z.array(z.string()),
    temperature_2m: z.array(HOURLY_VALUE),
    precipitation_probability: z.array(HOURLY_VALUE),
    wind_speed_10m: z.array(HOURLY_VALUE),
  }),
});

export function evaluateWeatherFit({
  temperatureC,
  rainProbability,
  windKmh,
  sport,
}: WeatherInput): WeatherFit {
  if (rainProbability > 60) {
    return "indoor_recommended";
  }

  if ((sport === "tennis" || sport === "badminton") && windKmh > 35) {
    return "wind_warning";
  }

  if (temperatureC < 5) {
    return "cold_warning";
  }

  return "outdoor_good";
}

export function selectClosestHourlyIndex(times: string[], target: Date) {
  if (times.length === 0) {
    return null;
  }

  let closestIndex = 0;
  let closestDistanceMs = Number.POSITIVE_INFINITY;

  for (const [index, time] of times.entries()) {
    const forecastTime = new Date(`${time}Z`);
    const distanceMs = Math.abs(forecastTime.getTime() - target.getTime());
    if (Number.isFinite(distanceMs) && distanceMs < closestDistanceMs) {
      closestIndex = index;
      closestDistanceMs = distanceMs;
    }
  }

  return closestDistanceMs === Number.POSITIVE_INFINITY ? null : closestIndex;
}

function forecastDaysFor(target: Date, now = new Date()) {
  const diffMs = target.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000)) + 1;
  return Math.min(Math.max(days, 1), 16);
}

function valueAt(values: Array<number | null>, index: number) {
  const value = values[index];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseCoordinate(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function getOpenMeteoForecast({
  lat,
  lng,
  whenAt,
  sport,
}: {
  lat: string;
  lng: string;
  whenAt: string;
  sport: SportKey;
}): Promise<WeatherForecast | null> {
  const latitude = parseCoordinate(lat);
  const longitude = parseCoordinate(lng);
  const target = new Date(whenAt);

  if (
    latitude === null ||
    longitude === null ||
    !Number.isFinite(target.getTime()) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return null;
  }

  const params = new URLSearchParams({
    latitude: latitude.toFixed(6),
    longitude: longitude.toFixed(6),
    hourly: "temperature_2m,precipitation_probability,wind_speed_10m",
    timezone: "UTC",
    forecast_days: String(forecastDaysFor(target)),
  });

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(2500),
      },
    );

    if (!response.ok) {
      return null;
    }

    const parsed = openMeteoForecastSchema.safeParse(await response.json());
    if (!parsed.success) {
      return null;
    }

    const index = selectClosestHourlyIndex(parsed.data.hourly.time, target);
    if (index === null) {
      return null;
    }

    const temperatureC = valueAt(parsed.data.hourly.temperature_2m, index);
    const rainProbability = valueAt(
      parsed.data.hourly.precipitation_probability,
      index,
    );
    const windKmh = valueAt(parsed.data.hourly.wind_speed_10m, index);

    if (temperatureC === null || rainProbability === null || windKmh === null) {
      return null;
    }

    return {
      temperatureC,
      rainProbability,
      windKmh,
      fit: evaluateWeatherFit({
        temperatureC,
        rainProbability,
        windKmh,
        sport,
      }),
      forecastAt: new Date(`${parsed.data.hourly.time[index]}Z`).toISOString(),
    };
  } catch {
    return null;
  }
}
