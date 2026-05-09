import { Pill } from "@/components/ui/Pill";

type DbStatus = "up" | "down" | "not_configured";

type Props = {
  db: DbStatus;
  commit: string;
  buildVersion: string;
  seed: { users: number; groups: number; events: number };
  aiCacheEntries: number;
  copy: {
    health: string;
    healthUp: string;
    healthDown: string;
    healthUnknown: string;
    seedLoaded: string;
    seedEmpty: string;
    aiCache: string;
    aiCacheEmpty: string;
    build: string;
  };
};

export function DemoHealth({
  db,
  commit,
  buildVersion,
  seed,
  aiCacheEntries,
  copy,
}: Props) {
  const dbVariant: "field" | "alt" | "default" =
    db === "up" ? "field" : db === "down" ? "alt" : "default";
  const dbLabel =
    db === "up"
      ? copy.healthUp
      : db === "down"
        ? copy.healthDown
        : copy.healthUnknown;

  const totalSeeded = seed.users + seed.groups + seed.events;
  const seedLabel =
    totalSeeded > 0
      ? copy.seedLoaded
          .replace("{users}", String(seed.users))
          .replace("{groups}", String(seed.groups))
          .replace("{events}", String(seed.events))
      : copy.seedEmpty;

  const aiLabel =
    aiCacheEntries > 0
      ? copy.aiCache.replace("{count}", String(aiCacheEntries))
      : copy.aiCacheEmpty;

  return (
    <div
      className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4"
      role="group"
      aria-label="Demo environment status"
    >
      <StatusTile
        eyebrow={copy.health}
        body={dbLabel}
        pill={dbLabel}
        variant={dbVariant}
      />
      <StatusTile
        eyebrow="Demo seed"
        body={seedLabel}
        pill={totalSeeded > 0 ? `${totalSeeded}` : "0"}
        variant={totalSeeded > 0 ? "field" : "default"}
      />
      <StatusTile
        eyebrow="AI cache"
        body={aiLabel}
        pill={aiCacheEntries > 0 ? `${aiCacheEntries}` : "0"}
        variant={aiCacheEntries > 0 ? "accent" : "default"}
      />
      <StatusTile
        eyebrow={copy.build}
        body={`${buildVersion} · ${shortCommit(commit)}`}
        pill={shortCommit(commit)}
        variant="default"
        mono
      />
    </div>
  );
}

function StatusTile({
  eyebrow,
  body,
  pill,
  variant,
  mono,
}: {
  eyebrow: string;
  body: string;
  pill: string;
  variant: "field" | "alt" | "accent" | "default";
  mono?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-2 px-3 py-3"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-card)",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="mono text-[10px] font-bold uppercase tracking-[0.14em]"
          style={{ color: "var(--ink-muted)" }}
        >
          {eyebrow}
        </span>
        <Pill variant={variant}>{pill}</Pill>
      </div>
      <span
        className={mono ? "mono text-[12px]" : "text-[13px] font-semibold"}
        style={{ color: "var(--ink)" }}
      >
        {body}
      </span>
    </div>
  );
}

function shortCommit(commit: string): string {
  if (!commit || commit === "local") return "dev";
  return commit.slice(0, 7);
}
