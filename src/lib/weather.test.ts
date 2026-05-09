import { describe, expect, it } from "vitest";
import { evaluateWeatherFit, selectClosestHourlyIndex } from "@/lib/weather";

describe("evaluateWeatherFit", () => {
  it("recommends indoor venues when rain probability is high", () => {
    expect(
      evaluateWeatherFit({
        temperatureC: 18,
        rainProbability: 72,
        windKmh: 12,
        sport: "running",
      }),
    ).toBe("indoor_recommended");
  });

  it("warns for windy racket sports", () => {
    expect(
      evaluateWeatherFit({
        temperatureC: 16,
        rainProbability: 10,
        windKmh: 38,
        sport: "tennis",
      }),
    ).toBe("wind_warning");
  });

  it("suggests a safer plan in cold weather", () => {
    expect(
      evaluateWeatherFit({
        temperatureC: 2,
        rainProbability: 10,
        windKmh: 8,
        sport: "football",
      }),
    ).toBe("cold_warning");
  });

  it("highlights outdoor options when weather is clear", () => {
    expect(
      evaluateWeatherFit({
        temperatureC: 22,
        rainProbability: 5,
        windKmh: 6,
        sport: "hiking",
      }),
    ).toBe("outdoor_good");
  });
});

describe("selectClosestHourlyIndex", () => {
  it("selects the closest Open-Meteo hourly bucket", () => {
    expect(
      selectClosestHourlyIndex(
        ["2026-05-10T14:00", "2026-05-10T15:00", "2026-05-10T16:00"],
        new Date("2026-05-10T15:20:00.000Z"),
      ),
    ).toBe(1);
  });

  it("returns null for empty hourly forecasts", () => {
    expect(selectClosestHourlyIndex([], new Date("2026-05-10T15:20:00.000Z"))).toBe(
      null,
    );
  });
});
