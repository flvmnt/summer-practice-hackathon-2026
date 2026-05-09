import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/components/ui/Skeleton";

export default async function EventsLoading() {
  const t = await getTranslations("routeStates");
  const aria = t("loadingAria", { section: t("sections.events") });

  return (
    <main
      className="relative min-h-screen w-full"
      style={{
        background: "var(--surface-2)",
        color: "var(--ink)",
        paddingBottom: "calc(78px + env(safe-area-inset-bottom) + 16px)",
      }}
    >
      {/* Mobile header */}
      <header
        className="flex items-center justify-between px-5 pt-6 md:hidden"
        style={{ gap: 12 }}
      >
        <div className="min-w-0 flex flex-col gap-2">
          <Skeleton width={64} height={11} radius={4} ariaLabel={aria} />
          <Skeleton width={170} height={26} radius={6} />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton width={36} height={36} radius={999} />
          <Skeleton width={40} height={40} radius={999} />
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-5 pt-4 md:pt-10">
        {/* Desktop header */}
        <header className="mb-6 hidden items-center justify-between md:flex">
          <div className="flex flex-col gap-3">
            <Skeleton width={220} height={36} radius={8} />
            <Skeleton width={320} height={14} radius={4} />
          </div>
          <Skeleton width={140} height={44} radius={999} />
        </header>

        {/* Filter chips */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Skeleton width={92} height={32} radius={999} />
          <Skeleton width={72} height={32} radius={999} />
          <Skeleton width={68} height={32} radius={999} />
        </div>

        {/* Event rows */}
        <ul className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <li
              key={idx}
              className="flex items-center gap-3 p-4"
              style={{
                background: "var(--surface)",
                borderRadius: "var(--r-card)",
                border: "1px solid var(--line)",
              }}
            >
              <Skeleton width={44} height={44} radius={12} />
              <div className="min-w-0 flex-1 flex flex-col gap-2">
                <Skeleton width="65%" height={16} radius={6} />
                <Skeleton width="45%" height={12} radius={4} />
              </div>
              <Skeleton width={72} height={26} radius={999} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
