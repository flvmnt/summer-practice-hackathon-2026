import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/components/ui/Skeleton";

export default async function TodayLoading() {
  const t = await getTranslations("routeStates");
  const aria = t("loadingAria", { section: t("sections.today") });

  return (
    <main
      className="relative min-h-screen w-full"
      style={{
        background: "var(--bg)",
        color: "var(--ink)",
        paddingBottom: "calc(78px + env(safe-area-inset-bottom) + 16px)",
      }}
    >
      {/* Mobile header - eyebrow + first name shape */}
      <header
        className="flex items-center justify-between px-5 pt-5 md:hidden"
        style={{ gap: 12 }}
      >
        <div className="min-w-0 flex flex-col gap-2">
          <Skeleton width={56} height={11} radius={4} ariaLabel={aria} />
          <Skeleton width={140} height={24} radius={6} />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton width={92} height={28} radius={999} />
          <Skeleton width={36} height={36} radius={999} />
        </div>
      </header>

      <div
        className="mx-auto w-full px-5 pt-6 md:pt-10"
        style={{ maxWidth: 1080 }}
      >
        <div className="grid items-start gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          {/* Info column - desktop only */}
          <section className="hidden lg:block">
            <Skeleton width={88} height={40} radius={10} />
            <Skeleton
              className="mt-8"
              width={56}
              height={56}
              radius={999}
            />
            <div className="mt-5 flex flex-col gap-3">
              <Skeleton width="90%" height={36} radius={8} />
              <Skeleton width="70%" height={36} radius={8} />
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <Skeleton width="100%" height={14} radius={4} />
              <Skeleton width="86%" height={14} radius={4} />
              <Skeleton width="62%" height={14} radius={4} />
            </div>
          </section>

          {/* Hero column - prompt card */}
          <section className="flex flex-col gap-4">
            {/* Prompt card */}
            <div
              className="flex flex-col gap-4 p-5"
              style={{
                background: "var(--surface)",
                borderRadius: "var(--r-surface)",
                boxShadow: "var(--shadow-2)",
                border: "1px solid var(--line)",
              }}
            >
              <Skeleton width={120} height={12} radius={4} />
              <Skeleton width="80%" height={28} radius={8} />
              <div className="flex flex-col gap-2">
                <Skeleton width="100%" height={14} radius={4} />
                <Skeleton width="92%" height={14} radius={4} />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <Skeleton width="100%" height={52} radius={999} />
                <Skeleton width="100%" height={52} radius={999} />
              </div>
            </div>

            {/* Secondary card */}
            <div
              className="flex flex-col gap-3 p-4"
              style={{
                background: "var(--surface)",
                borderRadius: "var(--r-card)",
                border: "1px solid var(--line)",
              }}
            >
              <Skeleton width="60%" height={16} radius={6} />
              <Skeleton width="100%" height={14} radius={4} />
              <Skeleton width="78%" height={14} radius={4} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
