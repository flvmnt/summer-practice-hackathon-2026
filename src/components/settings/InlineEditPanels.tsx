"use client";

import { useState, useTransition } from "react";
import { Glyph } from "@/components/ui/Glyph";
import { Pill } from "@/components/ui/Pill";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SettingsSection } from "@/components/settings/SettingsSection";
import {
  togglePublicVisibilityAction,
  updateLocationAction,
  updateProfileBasicsAction,
  updateSportsPrefsAction,
} from "@/lib/settings-actions";
import {
  DISTANCE_OPTIONS_KM,
  SPORT_KEYS,
  type SportKey,
} from "@/lib/sports";

type SectionKey = "profile" | "sports" | "location" | "privacy";

type SportEntry = { sport: SportKey; level: number };

type Copy = {
  edit: string;
  cancel: string;
  save: string;
  saving: string;
  saved: string;
  errorGeneric: string;
  fullNameLabel: string;
  bioLabel: string;
  noBio: string;
  fullNameRequired: string;
  bioRequired: string;
  bioCharsLeft: (n: number) => string;
  sportsEmpty: string;
  sportsHint: string;
  sportsRequired: string;
  sportsLevel: (n: number) => string;
  sportLabels: Record<SportKey, string>;
  cityLabel: string;
  latLabel: string;
  lngLabel: string;
  distanceLabel: string;
  cityRequired: string;
  invalidLatitude: string;
  invalidLongitude: string;
  kmSuffix: string;
  visibilityLabel: string;
  publicLabel: string;
  privateLabel: string;
  publicHint: string;
  privateHint: string;
  approxLocationBody: string;
};

const BIO_MAX = 240;
const NAME_MAX = 80;

function fieldErrorText(code: string | undefined, copy: Copy): string | undefined {
  if (!code) return undefined;
  if (code === "full_name_required" || code === "full_name_too_long" || code === "invalid_full_name") {
    return copy.fullNameRequired;
  }
  if (code === "bio_required") return copy.bioRequired;
  if (code === "city_required") return copy.cityRequired;
  if (code === "invalid_latitude") return copy.invalidLatitude;
  if (code === "invalid_longitude") return copy.invalidLongitude;
  if (code === "sports_required") return copy.sportsRequired;
  return copy.errorGeneric;
}

type StickySaveBarProps = {
  pending: boolean;
  onCancel: () => void;
  saveLabel: string;
  cancelLabel: string;
  savingLabel: string;
  disabled?: boolean;
};

function StickySaveBar({
  pending,
  onCancel,
  saveLabel,
  cancelLabel,
  savingLabel,
  disabled,
}: StickySaveBarProps) {
  return (
    <div
      className="sticky bottom-0 -mx-5 -mb-5 mt-2 flex items-center justify-end gap-2 px-5 py-3"
      style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--line)",
        borderBottomLeftRadius: "var(--r-card)",
        borderBottomRightRadius: "var(--r-card)",
      }}
    >
      <button
        type="button"
        onClick={onCancel}
        disabled={pending}
        className="btn-s2m btn-secondary"
        style={{ minHeight: 44, padding: "10px 14px", fontSize: 13 }}
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        disabled={pending || disabled}
        className="btn-s2m"
        style={{
          minHeight: 44,
          padding: "10px 16px",
          fontSize: 13,
          opacity: pending || disabled ? 0.6 : 1,
        }}
      >
        {pending ? savingLabel : saveLabel}
      </button>
    </div>
  );
}

function StatusLine({ kind, message }: { kind: "ok" | "err"; message: string }) {
  return (
    <p
      role={kind === "err" ? "alert" : "status"}
      className="text-[12px]"
      style={{
        color: kind === "err" ? "var(--alert)" : "var(--field)",
        lineHeight: 1.5,
      }}
    >
      {message}
    </p>
  );
}

function ReadField({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-1 rounded-md p-3"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--line)",
      }}
    >
      <span
        className="mono text-[10px] font-bold uppercase tracking-[0.12em]"
        style={{ color: "var(--ink-muted)" }}
      >
        {label}
      </span>
      <span
        className="text-[14px]"
        style={{
          color: muted ? "var(--ink-muted)" : "var(--ink)",
          lineHeight: 1.4,
          fontWeight: 600,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    padding: "12px 14px",
    background: "var(--surface)",
    color: "var(--ink)",
    borderColor: hasError ? "var(--alert)" : "var(--line)",
    borderRadius: "var(--r-card)",
    minHeight: 48,
    width: "100%",
    fontSize: 16,
    lineHeight: 1.4,
    border: "1.5px solid",
    transition: "border-color var(--t-1) var(--ease)",
  };
}

function fieldLabelClass() {
  return "mono text-[10px] font-bold uppercase tracking-[0.12em]";
}

type EditHeaderProps = {
  isEditing: boolean;
  onEdit: () => void;
  editLabel: string;
};

function EditHeader({ isEditing, onEdit, editLabel }: EditHeaderProps) {
  if (isEditing) return null;
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onEdit}
        className="btn-s2m btn-secondary"
        style={{ minHeight: 40, padding: "8px 14px", fontSize: 13 }}
      >
        {editLabel}
      </button>
    </div>
  );
}

export type InlineEditPanelsProps = {
  section: SectionKey;
  initial: {
    fullName: string;
    bio: string | null;
    city: string | null;
    homeLat: string | null;
    homeLng: string | null;
    maxDistanceKm: number;
    sports: SportEntry[];
    isPublic: boolean;
  };
  copy: Copy;
  sectionTitles: Record<SectionKey, { title: string; body: string }>;
};

export function InlineEditPanels(props: InlineEditPanelsProps) {
  if (props.section === "profile") {
    return (
      <SettingsSection
        title={props.sectionTitles.profile.title}
        description={props.sectionTitles.profile.body}
      >
        <ProfileEditor
          fullName={props.initial.fullName}
          bio={props.initial.bio}
          copy={props.copy}
        />
      </SettingsSection>
    );
  }

  if (props.section === "sports") {
    return (
      <SettingsSection
        title={props.sectionTitles.sports.title}
        description={props.sectionTitles.sports.body}
      >
        <SportsEditor sports={props.initial.sports} copy={props.copy} />
      </SettingsSection>
    );
  }

  if (props.section === "location") {
    return (
      <SettingsSection
        title={props.sectionTitles.location.title}
        description={props.sectionTitles.location.body}
      >
        <LocationEditor
          city={props.initial.city}
          homeLat={props.initial.homeLat}
          homeLng={props.initial.homeLng}
          maxDistanceKm={props.initial.maxDistanceKm}
          copy={props.copy}
        />
      </SettingsSection>
    );
  }

  return (
    <SettingsSection
      title={props.sectionTitles.privacy.title}
      description={props.sectionTitles.privacy.body}
    >
      <PrivacyEditor isPublic={props.initial.isPublic} copy={props.copy} />
    </SettingsSection>
  );
}

function ProfileEditor({
  fullName: initialFullName,
  bio: initialBio,
  copy,
}: {
  fullName: string;
  bio: string | null;
  copy: Copy;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [fullName, setFullName] = useState(initialFullName);
  const [bio, setBio] = useState(initialBio ?? "");
  const [savedFullName, setSavedFullName] = useState(initialFullName);
  const [savedBio, setSavedBio] = useState(initialBio);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [savedFlash, setSavedFlash] = useState(false);

  const remaining = Math.max(0, BIO_MAX - bio.length);
  const overLimit = bio.length > BIO_MAX;

  function reset() {
    setFullName(savedFullName);
    setBio(savedBio ?? "");
    setFieldErrors({});
    setFormError(undefined);
    setIsEditing(false);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(undefined);
    setSavedFlash(false);
    const trimmedName = fullName.trim();
    const trimmedBio = bio.trim();
    startTransition(async () => {
      const result = await updateProfileBasicsAction({
        fullName: trimmedName,
        bio: trimmedBio,
      });
      if (!result.ok) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        if (!result.fieldErrors || Object.keys(result.fieldErrors).length === 0) {
          setFormError(copy.errorGeneric);
        }
        return;
      }
      setSavedFullName(trimmedName);
      setSavedBio(trimmedBio);
      setSavedFlash(true);
      setIsEditing(false);
    });
  }

  if (!isEditing) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <ReadField label={copy.fullNameLabel} value={savedFullName} />
          <ReadField
            label={copy.bioLabel}
            value={savedBio && savedBio.length > 0 ? savedBio : copy.noBio}
            muted={!savedBio}
          />
        </div>
        {savedFlash ? <StatusLine kind="ok" message={copy.saved} /> : null}
        <EditHeader isEditing={false} onEdit={() => setIsEditing(true)} editLabel={copy.edit} />
      </div>
    );
  }

  const nameError = fieldErrorText(fieldErrors.fullName, copy);
  const bioError = fieldErrorText(fieldErrors.bio, copy);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="grid gap-1.5">
        <label
          htmlFor="settings-full-name"
          className={fieldLabelClass()}
          style={{ color: "var(--ink-muted)" }}
        >
          {copy.fullNameLabel}
        </label>
        <input
          id="settings-full-name"
          name="fullName"
          type="text"
          autoComplete="name"
          maxLength={NAME_MAX}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          aria-invalid={nameError ? true : undefined}
          style={inputStyle(Boolean(nameError))}
        />
        {nameError ? <StatusLine kind="err" message={nameError} /> : null}
      </div>

      <div className="grid gap-1.5">
        <div className="flex items-baseline justify-between">
          <label
            htmlFor="settings-bio"
            className={fieldLabelClass()}
            style={{ color: "var(--ink-muted)" }}
          >
            {copy.bioLabel}
          </label>
          <span
            className="mono text-[10px] font-bold"
            style={{
              color: overLimit ? "var(--alert)" : "var(--ink-muted)",
              letterSpacing: "0.04em",
            }}
          >
            {bio.length}/{BIO_MAX}
          </span>
        </div>
        <textarea
          id="settings-bio"
          name="bio"
          rows={4}
          maxLength={BIO_MAX + 40}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          aria-invalid={bioError ? true : undefined}
          style={{ ...inputStyle(Boolean(bioError)), minHeight: 96, resize: "vertical" }}
        />
        {bioError ? (
          <StatusLine kind="err" message={bioError} />
        ) : remaining < 40 ? (
          <p
            className="mono text-[10px]"
            style={{ color: "var(--ink-muted)" }}
          >
            {copy.bioCharsLeft(remaining)}
          </p>
        ) : null}
      </div>

      {formError ? <StatusLine kind="err" message={formError} /> : null}

      <StickySaveBar
        pending={pending}
        onCancel={reset}
        saveLabel={copy.save}
        cancelLabel={copy.cancel}
        savingLabel={copy.saving}
        disabled={overLimit}
      />
    </form>
  );
}

type LevelTier = "beginner" | "casual" | "pro";

const LEVEL_TIERS: ReadonlyArray<{ value: LevelTier; label: string; numeric: 1 | 3 | 5 }> = [
  { value: "beginner", label: "Beginner", numeric: 1 },
  { value: "casual", label: "Casual", numeric: 3 },
  { value: "pro", label: "Pro", numeric: 5 },
];

function tierFromNumeric(n: number): LevelTier {
  if (n <= 2) return "beginner";
  if (n >= 4) return "pro";
  return "casual";
}

function numericFromTier(tier: LevelTier): 1 | 3 | 5 {
  const found = LEVEL_TIERS.find((t) => t.value === tier);
  return found ? found.numeric : 3;
}

function SportsEditor({
  sports: initialSports,
  copy,
}: {
  sports: SportEntry[];
  copy: Copy;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [savedSports, setSavedSports] = useState<SportEntry[]>(initialSports);
  const [draft, setDraft] = useState<Record<string, LevelTier>>(() => {
    const m: Record<string, LevelTier> = {};
    for (const s of initialSports) {
      m[s.sport] = tierFromNumeric(s.level);
    }
    return m;
  });
  const [formError, setFormError] = useState<string | undefined>();
  const [savedFlash, setSavedFlash] = useState(false);

  const draftKeys = Object.keys(draft) as SportKey[];

  function reset() {
    const m: Record<string, LevelTier> = {};
    for (const s of savedSports) {
      m[s.sport] = tierFromNumeric(s.level);
    }
    setDraft(m);
    setFormError(undefined);
    setIsEditing(false);
  }

  function toggle(key: SportKey) {
    setDraft((prev) => {
      const next = { ...prev };
      if (key in next) {
        delete next[key];
      } else {
        next[key] = "casual";
      }
      return next;
    });
  }

  function setTier(key: SportKey, tier: LevelTier) {
    setDraft((prev) => (key in prev ? { ...prev, [key]: tier } : prev));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(undefined);
    setSavedFlash(false);
    const entries = (Object.keys(draft) as SportKey[]).map((k) => ({
      sport: k,
      level: numericFromTier(draft[k]),
    }));
    if (entries.length === 0) {
      setFormError(copy.sportsRequired);
      return;
    }
    startTransition(async () => {
      const result = await updateSportsPrefsAction({ sports: entries });
      if (!result.ok) {
        const code = result.fieldErrors?.sports ?? result.error;
        setFormError(fieldErrorText(code, copy) ?? copy.errorGeneric);
        return;
      }
      setSavedSports(entries);
      setSavedFlash(true);
      setIsEditing(false);
    });
  }

  if (!isEditing) {
    return (
      <div className="flex flex-col gap-3">
        {savedSports.length === 0 ? (
          <p className="text-[13px]" style={{ color: "var(--ink-muted)" }}>
            {copy.sportsEmpty}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {savedSports.map((s) => (
              <Pill key={s.sport} variant="field">
                {copy.sportLabels[s.sport] ?? s.sport}
                <span
                  className="mono"
                  style={{
                    marginLeft: 4,
                    fontSize: 10,
                    opacity: 0.7,
                    fontWeight: 700,
                  }}
                >
                  {copy.sportsLevel(s.level)}
                </span>
              </Pill>
            ))}
          </div>
        )}
        <p
          className="text-[12px]"
          style={{ color: "var(--ink-muted)", lineHeight: 1.5 }}
        >
          {copy.sportsHint}
        </p>
        {savedFlash ? <StatusLine kind="ok" message={copy.saved} /> : null}
        <EditHeader isEditing={false} onEdit={() => setIsEditing(true)} editLabel={copy.edit} />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
      >
        {SPORT_KEYS.map((key) => {
          const isActive = key in draft;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={isActive}
              onClick={() => toggle(key)}
              style={{
                minHeight: 44,
                padding: "10px 12px",
                borderRadius: 12,
                background: isActive ? "var(--accent-soft)" : "var(--surface)",
                border: isActive
                  ? "2px solid var(--accent)"
                  : "1.5px solid var(--line)",
                color: isActive ? "var(--accent-deep)" : "var(--ink)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                transition: "background var(--t-2) var(--ease), border-color var(--t-2) var(--ease)",
              }}
            >
              {copy.sportLabels[key] ?? key}
            </button>
          );
        })}
      </div>

      {draftKeys.length > 0 ? (
        <div className="flex flex-col gap-2">
          {draftKeys.map((key) => (
            <div
              key={`row-${key}`}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: 10,
                alignItems: "center",
                padding: "8px 10px",
                background: "var(--surface-2)",
                border: "1px solid var(--line)",
                borderRadius: 10,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "var(--accent-tint)",
                  color: "var(--accent-deep)",
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {copy.sportLabels[key] ?? key}
              </span>
              <SegmentedControl<LevelTier>
                options={LEVEL_TIERS.map((t) => ({ value: t.value, label: t.label }))}
                value={draft[key]}
                onChange={(next) => setTier(key, next)}
                size="sm"
                ariaLabel={`Level for ${copy.sportLabels[key] ?? key}`}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[13px]" style={{ color: "var(--ink-muted)" }}>
          {copy.sportsEmpty}
        </p>
      )}

      {formError ? <StatusLine kind="err" message={formError} /> : null}

      <StickySaveBar
        pending={pending}
        onCancel={reset}
        saveLabel={copy.save}
        cancelLabel={copy.cancel}
        savingLabel={copy.saving}
        disabled={draftKeys.length === 0}
      />
    </form>
  );
}

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

function LocationEditor({
  city: initialCity,
  homeLat: initialLat,
  homeLng: initialLng,
  maxDistanceKm: initialDistance,
  copy,
}: {
  city: string | null;
  homeLat: string | null;
  homeLng: string | null;
  maxDistanceKm: number;
  copy: Copy;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [city, setCity] = useState(initialCity ?? "");
  const [homeLat, setHomeLat] = useState(initialLat ?? "");
  const [homeLng, setHomeLng] = useState(initialLng ?? "");
  const [distance, setDistance] = useState<number>(
    snapDistance(initialDistance || 5),
  );
  const [savedCity, setSavedCity] = useState(initialCity);
  const [savedLat, setSavedLat] = useState(initialLat);
  const [savedLng, setSavedLng] = useState(initialLng);
  const [savedDistance, setSavedDistance] = useState<number>(
    snapDistance(initialDistance || 5),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [savedFlash, setSavedFlash] = useState(false);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "denied" | "error" | "ok">("idle");

  function reset() {
    setCity(savedCity ?? "");
    setHomeLat(savedLat ?? "");
    setHomeLng(savedLng ?? "");
    setDistance(savedDistance);
    setFieldErrors({});
    setFormError(undefined);
    setGeoStatus("idle");
    setIsEditing(false);
  }

  function useGeolocation() {
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

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(undefined);
    setSavedFlash(false);
    const latNum = Number(homeLat);
    const lngNum = Number(homeLng);
    startTransition(async () => {
      const result = await updateLocationAction({
        city: city.trim(),
        homeLat: latNum,
        homeLng: lngNum,
        maxDistanceKm: snapDistance(distance),
      });
      if (!result.ok) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        if (!result.fieldErrors || Object.keys(result.fieldErrors).length === 0) {
          setFormError(copy.errorGeneric);
        }
        return;
      }
      setSavedCity(city.trim());
      setSavedLat(latNum.toFixed(6));
      setSavedLng(lngNum.toFixed(6));
      setSavedDistance(snapDistance(distance));
      setSavedFlash(true);
      setIsEditing(false);
    });
  }

  if (!isEditing) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <ReadField
            label={copy.cityLabel}
            value={savedCity ?? "—"}
            muted={!savedCity}
          />
          <ReadField
            label={copy.distanceLabel}
            value={`${savedDistance} ${copy.kmSuffix}`}
          />
        </div>
        {savedFlash ? <StatusLine kind="ok" message={copy.saved} /> : null}
        <EditHeader isEditing={false} onEdit={() => setIsEditing(true)} editLabel={copy.edit} />
      </div>
    );
  }

  const cityError = fieldErrorText(fieldErrors.city, copy);
  const latError = fieldErrorText(fieldErrors.homeLat, copy);
  const lngError = fieldErrorText(fieldErrors.homeLng, copy);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="grid gap-1.5">
        <label
          htmlFor="settings-city"
          className={fieldLabelClass()}
          style={{ color: "var(--ink-muted)" }}
        >
          {copy.cityLabel}
        </label>
        <input
          id="settings-city"
          type="text"
          autoComplete="address-level2"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          maxLength={100}
          aria-invalid={cityError ? true : undefined}
          style={inputStyle(Boolean(cityError))}
        />
        {cityError ? <StatusLine kind="err" message={cityError} /> : null}
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label
            htmlFor="settings-lat"
            className={fieldLabelClass()}
            style={{ color: "var(--ink-muted)" }}
          >
            {copy.latLabel}
          </label>
          <input
            id="settings-lat"
            type="number"
            inputMode="decimal"
            step="0.000001"
            value={homeLat}
            onChange={(e) => setHomeLat(e.target.value)}
            aria-invalid={latError ? true : undefined}
            style={inputStyle(Boolean(latError))}
          />
          {latError ? <StatusLine kind="err" message={latError} /> : null}
        </div>

        <div className="grid gap-1.5">
          <label
            htmlFor="settings-lng"
            className={fieldLabelClass()}
            style={{ color: "var(--ink-muted)" }}
          >
            {copy.lngLabel}
          </label>
          <input
            id="settings-lng"
            type="number"
            inputMode="decimal"
            step="0.000001"
            value={homeLng}
            onChange={(e) => setHomeLng(e.target.value)}
            aria-invalid={lngError ? true : undefined}
            style={inputStyle(Boolean(lngError))}
          />
          {lngError ? <StatusLine kind="err" message={lngError} /> : null}
        </div>
      </div>

      <button
        type="button"
        onClick={useGeolocation}
        disabled={geoStatus === "loading"}
        className="btn-s2m btn-secondary self-start"
        style={{ minHeight: 44, padding: "8px 14px", fontSize: 13 }}
      >
        <Glyph.pin size={14} />
        {geoStatus === "loading" ? "…" : "Use my location"}
      </button>

      <div className="grid gap-1.5">
        <span
          className={fieldLabelClass()}
          style={{ color: "var(--ink-muted)" }}
        >
          {copy.distanceLabel}
        </span>
        <SegmentedControl<string>
          options={DISTANCE_OPTIONS_KM.map((opt) => ({
            value: String(opt),
            label: `${opt} ${copy.kmSuffix}`,
          }))}
          value={String(snapDistance(distance))}
          onChange={(next) => setDistance(Number(next))}
          ariaLabel={copy.distanceLabel}
        />
      </div>

      {formError ? <StatusLine kind="err" message={formError} /> : null}

      <StickySaveBar
        pending={pending}
        onCancel={reset}
        saveLabel={copy.save}
        cancelLabel={copy.cancel}
        savingLabel={copy.saving}
        disabled={city.trim().length < 2}
      />
    </form>
  );
}

function PrivacyEditor({
  isPublic: initialIsPublic,
  copy,
}: {
  isPublic: boolean;
  copy: Copy;
}) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | undefined>();
  const [savedFlash, setSavedFlash] = useState(false);

  function flip(nextValue: boolean) {
    setFormError(undefined);
    setSavedFlash(false);
    const previous = isPublic;
    setIsPublic(nextValue);
    startTransition(async () => {
      const result = await togglePublicVisibilityAction({ isPublic: nextValue });
      if (!result.ok) {
        setIsPublic(previous);
        setFormError(copy.errorGeneric);
        return;
      }
      setIsPublic(result.data.isPublic);
      setSavedFlash(true);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-1.5">
        <span
          className={fieldLabelClass()}
          style={{ color: "var(--ink-muted)" }}
        >
          {copy.visibilityLabel}
        </span>
        <SegmentedControl<string>
          options={[
            { value: "public", label: copy.publicLabel },
            { value: "private", label: copy.privateLabel },
          ]}
          value={isPublic ? "public" : "private"}
          onChange={(next) => flip(next === "public")}
          ariaLabel={copy.visibilityLabel}
        />
        <p
          className="text-[12px]"
          style={{ color: "var(--ink-muted)", lineHeight: 1.5 }}
        >
          {isPublic ? copy.publicHint : copy.privateHint}
        </p>
      </div>

      <div
        className="flex items-start gap-3 rounded-md p-3"
        style={{
          background: "var(--field-soft)",
          color: "var(--field)",
          border: "1px solid color-mix(in oklch, var(--field) 25%, transparent)",
        }}
      >
        <Glyph.shield size={16} />
        <div className="min-w-0 flex-1 text-[12px]" style={{ lineHeight: 1.5 }}>
          {copy.approxLocationBody}
        </div>
      </div>

      {pending ? (
        <p className="text-[12px]" style={{ color: "var(--ink-muted)" }}>
          {copy.saving}
        </p>
      ) : null}
      {formError ? <StatusLine kind="err" message={formError} /> : null}
      {savedFlash && !pending && !formError ? (
        <StatusLine kind="ok" message={copy.saved} />
      ) : null}
    </div>
  );
}
