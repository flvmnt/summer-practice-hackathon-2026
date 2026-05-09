import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/components/ui/Skeleton";

export default async function SettingsLoading() {
  const t = await getTranslations("routeStates");
  const aria = t("loadingAria", { section: t("sections.settings") });

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
      <header className="flex items-center gap-3 px-5 pt-6 md:hidden">
        <Skeleton width={36} height={36} radius={999} ariaLabel={aria} />
        <div className="min-w-0 flex-1 flex flex-col gap-2">
          <Skeleton width={64} height={11} radius={4} />
          <Skeleton width={120} height={22} radius={6} />
        </div>
        <Skeleton width={36} height={36} radius={999} />
      </header>

      {/* Tabs strip */}
      <div className="mt-4 flex gap-2 overflow-hidden px-5 md:hidden">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Skeleton key={idx} width={88} height={32} radius={999} />
        ))}
      </div>

      <div className="mx-auto w-full max-w-5xl px-5 pt-4 md:grid md:grid-cols-[220px_1fr] md:gap-8 md:pt-10">
        <aside className="hidden md:block">
          <div className="px-2 pb-3 flex flex-col gap-3">
            <Skeleton width={140} height={26} radius={8} />
            <Skeleton width={200} height={12} radius={4} />
          </div>
        </aside>

        <div className="flex flex-col gap-4 md:gap-5">
          {/* Settings card */}
          {Array.from({ length: 2 }).map((_, idx) => (
            <section
              key={idx}
              className="flex flex-col gap-3 p-5"
              style={{
                background: "var(--surface)",
                borderRadius: "var(--r-card)",
                border: "1px solid var(--line)",
              }}
            >
              <Skeleton width="40%" height={18} radius={6} />
              <Skeleton width="80%" height={13} radius={4} />
              <div className="mt-2 flex flex-col gap-3">
                <Skeleton width="100%" height={44} radius={12} />
                <Skeleton width="100%" height={84} radius={12} />
              </div>
              <div className="mt-2 self-end">
                <Skeleton width={96} height={36} radius={999} />
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
