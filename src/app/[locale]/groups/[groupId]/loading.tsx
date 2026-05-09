import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/components/ui/Skeleton";

export default async function GroupDetailLoading() {
  const t = await getTranslations("routeStates");
  const aria = t("loadingAria", { section: t("sections.group") });

  return (
    <main
      className="min-h-screen has-mobile-tabbar"
      style={{ background: "var(--surface-2)" }}
    >
      {/* Sticky mobile header */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 md:hidden"
        style={{
          background: "color-mix(in oklch, var(--surface) 92%, transparent)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <Skeleton width={36} height={36} radius={999} ariaLabel={aria} />
        <div className="min-w-0 flex-1 flex flex-col gap-2">
          <Skeleton width={120} height={18} radius={6} />
          <Skeleton width={88} height={12} radius={4} />
        </div>
        <Skeleton width={44} height={20} radius={999} />
      </div>

      {/* Mobile tab bar shape */}
      <div className="flex gap-2 px-4 pt-3 md:hidden">
        <Skeleton width="33%" height={36} radius={999} />
        <Skeleton width="33%" height={36} radius={999} />
        <Skeleton width="33%" height={36} radius={999} />
      </div>

      {/* Mobile content */}
      <div className="flex flex-col gap-3 px-4 py-4 md:hidden">
        <div
          className="flex flex-col gap-3 p-4"
          style={{
            background: "var(--surface)",
            borderRadius: "var(--r-card)",
            border: "1px solid var(--line)",
          }}
        >
          <Skeleton width="50%" height={16} radius={6} />
          <Skeleton width="100%" height={14} radius={4} />
          <Skeleton width="80%" height={14} radius={4} />
          <div className="mt-2 flex flex-wrap gap-2">
            <Skeleton width={84} height={28} radius={999} />
            <Skeleton width={92} height={28} radius={999} />
            <Skeleton width={76} height={28} radius={999} />
          </div>
        </div>
        <div
          className="flex flex-col gap-3 p-4"
          style={{
            background: "var(--surface)",
            borderRadius: "var(--r-card)",
            border: "1px solid var(--line)",
          }}
        >
          <Skeleton width="60%" height={16} radius={6} />
          <Skeleton width="100%" height={44} radius={12} />
        </div>
      </div>

      {/* Desktop 3-column shell */}
      <div className="hidden md:block">
        <div
          className="mx-auto grid w-full max-w-6xl gap-5 px-5 py-6"
          style={{ gridTemplateColumns: "0.75fr 1.25fr 0.85fr" }}
        >
          {[
            { rows: [60, 28, 14, 14, 14, 14, 14] },
            { rows: [16, 64, 14, 14, 14, 14, 64] },
            { rows: [16, 14, 14, 14, 14, 14, 14] },
          ].map((col, ci) => (
            <section
              key={ci}
              className="flex flex-col gap-3 p-5"
              style={{
                background: "var(--surface)",
                borderRadius: "var(--r-card)",
                border: "1px solid var(--line)",
                minHeight: 320,
              }}
            >
              {col.rows.map((h, idx) => (
                <Skeleton
                  key={idx}
                  width={idx === 0 ? "60%" : idx === col.rows.length - 1 ? "70%" : "100%"}
                  height={h}
                  radius={h >= 28 ? 12 : 6}
                />
              ))}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
