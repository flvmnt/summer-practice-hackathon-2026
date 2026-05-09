"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Glyph } from "@/components/ui/Glyph";
import { Input } from "@/components/ui/Input";
import { Slider } from "@/components/ui/Slider";
import { WizardMobileHeader } from "@/components/onboarding/WizardMobileHeader";
import { WizardStickyActionBar } from "@/components/onboarding/WizardStickyActionBar";
import type { AppLocale } from "@/i18n/routing";
import {
  onboardingLocationFormAction,
  type OnboardingLocationFormState,
} from "@/lib/onboarding-form-actions";
import { DISTANCE_OPTIONS_KM } from "@/lib/sports";

type LocationFormCopy = {
  city: string;
  cityPlaceholder: string;
  latitude: string;
  longitude: string;
  maxDistance: string;
  km: string;
  submit: string;
  pending: string;
  genericError: string;
  unauthorized: string;
  cityRequired: string;
  invalidLatitude: string;
  invalidLongitude: string;
  successTitle: string;
  successBody: string;
  continue: string;
};

const initialState: OnboardingLocationFormState = {};

const SLIDER_MIN = 1;
const SLIDER_MAX = 10;
const SLIDER_STEP = 0.5;

// Schema currently locks accepted distances to [1, 3, 5, 10]; the slider
// presents a continuous 1–10 km feel and snaps on submit so the action accepts.
function snapDistance(value: number): (typeof DISTANCE_OPTIONS_KM)[number] {
  let best: (typeof DISTANCE_OPTIONS_KM)[number] = DISTANCE_OPTIONS_KM[0];
  let bestDelta = Number.POSITIVE_INFINITY;
  for (const opt of DISTANCE_OPTIONS_KM) {
    const delta = Math.abs(opt - value);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = opt;
    }
  }
  return best;
}

function errorText(code: string | undefined, copy: LocationFormCopy) {
  if (code === "city_required") return copy.cityRequired;
  if (code === "invalid_latitude") return copy.invalidLatitude;
  if (code === "invalid_longitude") return copy.invalidLongitude;
  if (code === "unauthorized") return copy.unauthorized;
  if (code) return copy.genericError;
  return undefined;
}

export function LocationForm({
  copy,
  defaultCity,
  defaultHomeLat,
  defaultHomeLng,
  defaultMaxDistanceKm,
  locale,
}: {
  copy: LocationFormCopy;
  defaultCity: string;
  defaultHomeLat: string;
  defaultHomeLng: string;
  defaultMaxDistanceKm: number;
  locale: AppLocale;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<OnboardingLocationFormState>(initialState);

  const [city, setCity] = useState(defaultCity);
  const [homeLat, setHomeLat] = useState(defaultHomeLat);
  const [homeLng, setHomeLng] = useState(defaultHomeLng);
  const [distanceKm, setDistanceKm] = useState<number>(
    Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, defaultMaxDistanceKm || 5)),
  );
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "denied" | "error" | "ok">("idle");

  useEffect(() => {
    if (state.saved) {
      router.push(`/${locale}/onboarding/photo`);
    }
  }, [state.saved, locale, router]);

  function onUseLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setHomeLat(pos.coords.latitude.toFixed(6));
        setHomeLng(pos.coords.longitude.toFixed(6));
        setGeoStatus("ok");
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoStatus("denied");
        } else {
          setGeoStatus("error");
        }
      },
      { timeout: 10_000, enableHighAccuracy: false, maximumAge: 60_000 },
    );
  }

  function submit() {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    // Force the snapped distance value onto the form before submit.
    fd.set("maxDistanceKm", String(snapDistance(distanceKm)));
    startTransition(async () => {
      const result = await onboardingLocationFormAction(initialState, fd);
      setState(result);
    });
  }

  const cityError = errorText(state.fieldErrors?.city, copy);
  const latError = errorText(state.fieldErrors?.homeLat, copy);
  const lngError = errorText(state.fieldErrors?.homeLng, copy);
  const formError = errorText(state.error, copy);

  const canContinue = city.trim().length >= 2 && !pending;
  const distanceLabel = Number.isInteger(distanceKm)
    ? distanceKm.toFixed(1)
    : distanceKm.toFixed(1);
  const cityForChip = city.trim() || "your city";

  return (
    <div className="flex w-full flex-col">
      <WizardMobileHeader
        step={3}
        total={4}
        title="Where can you play?"
        subtitle="City and how far you'll travel"
      />

      <form ref={formRef} action={() => submit()} className="mt-5 flex flex-col gap-4">
        {/* City + Use my location */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="onboarding-city"
            className="mono text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: "var(--ink-muted)" }}
          >
            City
          </label>
          <div className="flex flex-wrap items-stretch gap-2">
            <Input
              id="onboarding-city"
              name="city"
              autoComplete="address-level2"
              placeholder={copy.cityPlaceholder || "Timișoara"}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              maxLength={100}
              required
              aria-describedby={cityError ? "city-error" : undefined}
              containerClassName="min-w-0 flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              onClick={onUseLocation}
              disabled={geoStatus === "loading"}
              className="gap-2 self-start"
              style={{ minHeight: 48, color: "var(--accent-deep)" }}
            >
              <Glyph.pin size={16} />
              {geoStatus === "loading" ? "Locating…" : "Use my location"}
            </Button>
          </div>
          {cityError ? (
            <span
              id="city-error"
              className="text-sm font-medium"
              style={{ color: "var(--accent-deep)" }}
            >
              {cityError}
            </span>
          ) : null}
          {geoStatus === "denied" ? (
            <span
              role="status"
              className="text-sm"
              style={{ color: "var(--ink-muted)" }}
            >
              Location denied — type your city manually.
            </span>
          ) : null}
          {geoStatus === "error" ? (
            <span
              role="status"
              className="text-sm"
              style={{ color: "var(--ink-muted)" }}
            >
              Couldn&apos;t read your location — type your city manually.
            </span>
          ) : null}
          {geoStatus === "ok" ? (
            <span
              role="status"
              className="text-sm"
              style={{ color: "var(--field)" }}
            >
              Got it. We&apos;ll use this for distance only.
            </span>
          ) : null}
        </div>

        {/* Hidden lat/lng — populated by geolocation or kept at defaults. */}
        <input
          name="homeLat"
          type="hidden"
          value={homeLat}
          onChange={() => {
            /* noop */
          }}
        />
        <input
          name="homeLng"
          type="hidden"
          value={homeLng}
          onChange={() => {
            /* noop */
          }}
        />
        {latError ? (
          <span className="text-sm font-medium" style={{ color: "var(--accent-deep)" }}>
            {latError}
          </span>
        ) : null}
        {lngError ? (
          <span className="text-sm font-medium" style={{ color: "var(--accent-deep)" }}>
            {lngError}
          </span>
        ) : null}

        {/* Distance section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-end justify-between gap-3">
            <span
              className="mono text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: "var(--ink-muted)" }}
            >
              How far will you travel?
            </span>
            <span
              className="mono"
              style={{
                fontFamily: "var(--f-mono)",
                fontSize: 24,
                fontWeight: 700,
                color: "var(--ink)",
                lineHeight: 1,
              }}
            >
              {distanceLabel}
              <span
                className="ml-1"
                style={{ fontSize: 12, color: "var(--ink-muted)" }}
              >
                km
              </span>
            </span>
          </div>

          <Slider
            value={distanceKm}
            onChange={setDistanceKm}
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            step={SLIDER_STEP}
            ariaLabel="Maximum travel distance in kilometres"
          />

          <div
            className="mono mt-1 flex justify-between"
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 11,
              color: "var(--ink-muted)",
            }}
          >
            <span>1 km</span>
            <span>5 km</span>
            <span>10 km</span>
          </div>
        </div>

        {/* Textual radius chip (mini map deferred to A10). */}
        <div
          style={{
            alignSelf: "flex-start",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 999,
            background: "var(--surface-2)",
            border: "1px solid var(--line)",
            color: "var(--ink-muted)",
            fontSize: 12,
          }}
        >
          <Glyph.pin size={14} />
          <span>
            Within <span style={{ fontFamily: "var(--f-mono)", color: "var(--ink)" }}>{distanceLabel} km</span> of {cityForChip}
          </span>
        </div>

        {formError ? (
          <p
            role="alert"
            className="rounded-md px-3 py-2 text-sm font-semibold"
            style={{
              background: "color-mix(in oklch, var(--accent) 10%, transparent)",
              color: "var(--accent-deep)",
              border: "1px solid color-mix(in oklch, var(--accent) 30%, transparent)",
            }}
          >
            {formError}
          </p>
        ) : null}

        <div className="h-24" aria-hidden="true" />
      </form>

      <WizardStickyActionBar
        primaryLabel={pending ? copy.pending : "Next"}
        primaryDisabled={!canContinue}
        primaryLoading={pending}
        onPrimary={submit}
        secondaryLabel="Back"
        secondaryHref={`/${locale}/onboarding/sports`}
      />
    </div>
  );
}
