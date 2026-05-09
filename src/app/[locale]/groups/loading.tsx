import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/components/ui/Skeleton";

export default async function GroupsLoading() {
  const t = await getTranslations("routeStates");
  const aria = t("loadingAria", { section: t("sections.groups") });

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
          <Skeleton width={60} height={11} radius={4} ariaLabel={aria} />
          <Skeleton width={150} height={26} radius={6} />
        </div>
        <Skeleton width={36} height={36} radius={999} />
      </header>

      <div className="mx-auto w-full max-w-3xl px-5 pt-4 md:pt-10">
        {/* Desktop header */}
        <header className="mb-6 hidden md:block">
          <Skeleton width="40%" height={36} radius={8} />
          <div className="mt-3">
            <Skeleton width="60%" height={14} radius={4} />
          </div>
        </header>

        {/* Stat pills */}
        <div className="mb-3 flex flex-wrap gap-2">
          <Skeleton width={92} height={28} radius={999} />
          <Skeleton width={108} height={28} radius={999} />
        </div>

        {/* Group rows */}
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
                <Skeleton width="55%" height={16} radius={6} />
                <Skeleton width="35%" height={12} radius={4} />
              </div>
              <Skeleton width={64} height={32} radius={999} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
