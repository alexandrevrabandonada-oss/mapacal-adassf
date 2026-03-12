"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type TimelineBucket = "day" | "week";

type BucketToggleProps = {
  basePath: string;
};

function normalizeBucket(bucket: string | null): TimelineBucket {
  return bucket === "week" ? "week" : "day";
}

export function BucketToggle({ basePath }: BucketToggleProps) {
  const searchParams = useSearchParams();
  const currentBucket = normalizeBucket(searchParams.get("bucket"));

  const days = searchParams.get("days") || "90";
  const neighborhood = searchParams.get("neighborhood") || "";

  const buildUrl = (nextBucket: TimelineBucket) => {
    const url = new URL(basePath, "http://localhost");
    url.searchParams.set("days", days);
    url.searchParams.set("bucket", nextBucket);
    if (neighborhood) {
      url.searchParams.set("neighborhood", neighborhood);
    }
    return `${url.pathname}${url.search}`;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {(["day", "week"] as const).map((bucket) => {
        const isActive = currentBucket === bucket;
        return (
          <Link
            key={bucket}
            href={buildUrl(bucket)}
            className={`border-2 px-3 py-2 text-xs font-bold uppercase ${
              isActive
                ? "border-[var(--ink)] bg-[var(--signal)]"
                : "border-[var(--ink)] bg-white hover:bg-[var(--paper)]"
            }`}
          >
            {bucket === "day" ? "Bucket: dia" : "Bucket: semana"}
          </Link>
        );
      })}
    </div>
  );
}
