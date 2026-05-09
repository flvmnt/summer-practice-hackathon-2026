import { Skeleton } from "@/components/ui/Skeleton";

export default function LocaleLoading() {
  return (
    <main
      className="min-h-screen px-5 py-6"
      style={{ background: "var(--bg)", color: "var(--ink)" }}
    >
      <div className="mx-auto grid w-full max-w-xl gap-4">
        <Skeleton width="42%" height={20} radius={10} />
        <Skeleton width="100%" height={180} radius={18} />
        <Skeleton width="78%" height={44} radius={999} />
      </div>
    </main>
  );
}
