import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/components/ui/Skeleton";

export default async function MapLoading() {
  const t = await getTranslations("routeStates");
  const aria = t("loadingAria", { section: t("sections.map") });

  return (
    <main
      className="relative min-h-screen w-full"
      style={{
        background: "var(--bg)",
        color: "var(--ink)",
        paddingBottom: "calc(78px + env(safe-area-inset-bottom) + 16px)",
      }}
    >
      {/* Sticky search/filter bar shape */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 16px",
          background: "color-mix(in oklch, var(--surface) 92%, transparent)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <Skeleton width={36} height={36} radius={999} ariaLabel={aria} />
        <Skeleton width="100%" height={40} radius={999} />
        <Skeleton width={40} height={40} radius={999} />
      </header>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-hidden px-4 pt-3">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Skeleton key={idx} width={84} height={32} radius={999} />
        ))}
      </div>

      {/* Map canvas placeholder */}
      <div className="px-4 pt-4">
        <div
          className="relative overflow-hidden"
          style={{
            height: 320,
            borderRadius: "var(--r-surface)",
            border: "1px solid var(--line)",
            background:
              "repeating-linear-gradient(135deg, var(--surface-2) 0 12px, var(--bg-alt) 12px 24px)",
          }}
        >
          <Skeleton
            className="absolute inset-0"
            width="100%"
            height="100%"
            radius={26}
          />
        </div>
      </div>

      {/* Venue list rows */}
      <ul className="flex flex-col gap-2 px-4 pt-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <li
            key={idx}
            className="flex items-center gap-3 p-3"
            style={{
              background: "var(--surface)",
              borderRadius: "var(--r-card)",
              border: "1px solid var(--line)",
            }}
          >
            <Skeleton width={40} height={40} radius={12} />
            <div className="min-w-0 flex-1 flex flex-col gap-2">
              <Skeleton width="60%" height={14} radius={4} />
              <Skeleton width="40%" height={12} radius={4} />
            </div>
            <Skeleton width={60} height={28} radius={999} />
          </li>
        ))}
      </ul>
    </main>
  );
}
