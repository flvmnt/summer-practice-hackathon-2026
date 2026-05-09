import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/components/ui/Skeleton";

export default async function NotificationsLoading() {
  const t = await getTranslations("routeStates");
  const aria = t("loadingAria", { section: t("sections.notifications") });

  return (
    <main
      className="relative min-h-screen w-full"
      style={{
        background: "var(--bg)",
        color: "var(--ink)",
        paddingBottom: "calc(96px + env(safe-area-inset-bottom) + 16px)",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 16px",
          background: "color-mix(in oklch, var(--surface) 92%, transparent)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="flex items-center gap-2">
          <Skeleton width={36} height={36} radius={999} ariaLabel={aria} />
          <div className="min-w-0 flex flex-col gap-2">
            <Skeleton width={48} height={10} radius={4} />
            <Skeleton width={120} height={20} radius={6} />
          </div>
        </div>
        <Skeleton width={84} height={26} radius={999} />
      </header>

      <section
        className="mx-auto w-full px-4 pt-5"
        style={{ maxWidth: 720 }}
      >
        {/* Filter chips */}
        <div className="mb-4 flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} width={64} height={28} radius={999} />
          ))}
        </div>

        {/* Notification rows */}
        <ul className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3 p-3"
              style={{
                background: "var(--surface)",
                borderRadius: "var(--r-card)",
                border: "1px solid var(--line)",
              }}
            >
              <Skeleton width={36} height={36} radius={999} />
              <div className="min-w-0 flex-1 flex flex-col gap-2">
                <Skeleton width="50%" height={14} radius={4} />
                <Skeleton width="100%" height={12} radius={4} />
                <Skeleton width="75%" height={12} radius={4} />
              </div>
              <Skeleton width={56} height={28} radius={999} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
