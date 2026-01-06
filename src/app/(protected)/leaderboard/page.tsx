"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const EVENT_ID = "47dd02f0-a934-4a45-87b6-affd6ff83c1a";

type LeaderRow = {
  participantId: string;
  name: string;
  employeeNo: string | null;
  photoUrl: string | null;
  badgeId: string;
  totalMinutes: number;
  isInside: boolean;

  // OPTIONAL (biar bisa tampil "Tap In → Tap Out/Now")
  lastTapInAt?: string | null;
  lastTapOutAt?: string | null;
};

type ApiResponse =
  | { ok: true; rows: LeaderRow[] }
  | { ok: false; reason?: string };

const fmtTime = (iso?: string | null) => {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Icon({
  name,
  className,
}: {
  name: "trophy" | "refresh" | "back" | "crown" | "info";
  className?: string;
}) {
  const cls = cn("w-5 h-5", className);

  switch (name) {
    case "back":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none">
          <path
            d="M15 18l-6-6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "refresh":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none">
          <path
            d="M21 12a9 9 0 1 1-2.64-6.36"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M21 3v6h-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "trophy":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none">
          <path
            d="M8 4h8v3a4 4 0 0 1-8 0V4Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M6 4H4v3a4 4 0 0 0 4 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M18 4h2v3a4 4 0 0 1-4 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M12 11v4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M8 21h8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M9 15h6v6H9v-6Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "crown":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none">
          <path
            d="M5 17h14l1-9-4 3-4-6-4 6-4-3 1 9Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M7 20h10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "info":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M12 10v6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M12 7h.01"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (!url) {
    return (
      <div className="w-24 h-24 rounded-2xl bg-slate-100 border border-slate-200 grid place-items-center text-slate-500 text-base font-semibold">
        {name?.slice(0, 1)?.toUpperCase() || "—"}
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={url}
      alt={name}
      className="w-24 h-24 rounded-2xl object-cover border border-slate-200 bg-slate-100"
    />
  );
}

function StatusPill({ isInside }: { isInside: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ring-1",
        isInside
          ? "bg-blue-50 text-[#0048FF] ring-blue-100"
          : "bg-orange-50 text-[#FF6000] ring-orange-100"
      )}
    >
      {isInside ? "IN (ongoing)" : "OUT"}
    </span>
  );
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("—");

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/leaderboard?eventId=${EVENT_ID}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as ApiResponse;

      if (!json.ok) {
        setError(json.reason ?? "Failed to load leaderboard");
        setRows([]);
      } else {
        const sorted = [...(json.rows ?? [])].sort(
          (a, b) => (b.totalMinutes ?? 0) - (a.totalMinutes ?? 0)
        );
        setRows(sorted);
        setLastUpdated(
          new Intl.DateTimeFormat("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
            timeZone: "Asia/Jakarta",
          }).format(new Date())
        );
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Network error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasRows = rows.length > 0;

  const noteText = useMemo(
    () =>
      "Jika peserta masih IN (belum Tap Out), menit tetap dihitung sampai waktu sekarang (update setelah refresh).",
    []
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 bg-[#0048FF] text-white">
        <div className="mx-auto max-w-md px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/home"
              className="shrink-0 w-10 h-10 rounded-2xl grid place-items-center bg-white/10 ring-1 ring-white/20 hover:bg-white/15"
              aria-label="Back to Home"
            >
              <Icon name="back" className="w-5 h-5" />
            </Link>

            <div className="min-w-0">
              <div className="font-semibold tracking-tight leading-tight">
                Leaderboard
              </div>
              <div className="text-xs text-white/80 truncate">
                Updated: {lastUpdated}
              </div>
            </div>
          </div>

          <button
            onClick={load}
            disabled={loading}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold",
              "bg-white/10 hover:bg-white/15 ring-1 ring-white/20",
              loading && "opacity-60 cursor-not-allowed"
            )}
          >
            <Icon name="refresh" className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 pt-5 pb-10">
        {/* Header card */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[#252525] font-semibold text-lg">
                Attendance Ranking
              </div>
              <div className="mt-1 text-slate-600 text-sm">
                Sorted by total minutes (highest → lowest)
              </div>
            </div>

            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-100 to-orange-100 ring-1 ring-slate-200 grid place-items-center text-[#0048FF]">
              <Icon name="trophy" />
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 text-xs text-slate-500">
            <Icon name="info" className="w-4 h-4 text-slate-400 mt-[1px]" />
            <span>{noteText}</span>
          </div>
        </div>

        {/* Loading / error / empty */}
        {loading && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm p-4 text-slate-600">
            Loading leaderboard...
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 shadow-sm p-4">
            <div className="text-rose-800 font-semibold">Error</div>
            <div className="text-rose-800/90 text-sm mt-1">{error}</div>
          </div>
        )}

        {!loading && !error && !hasRows && (
          <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-white shadow-sm p-5">
            <div className="text-[#252525] font-semibold text-lg">
              No attendance yet
            </div>
            <div className="mt-2 text-slate-600 text-sm">
              Belum ada peserta yang Tap In/Tap Out. Mulai scan dari halaman Scan
              untuk mengisi data leaderboard.
            </div>
            <Link
              href="/scan"
              className="inline-flex mt-4 text-[#0048FF] font-semibold"
            >
              Go to Scan →
            </Link>
          </div>
        )}

        {/* List (mobile friendly) */}
        {!loading && !error && hasRows && (
          <div className="mt-4 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <div className="grid grid-cols-[72px_1fr_86px] gap-3 text-xs font-semibold text-slate-500">
                <div>Rank</div>
                <div>Participant</div>
                <div className="text-right">Minutes</div>
              </div>
            </div>

            <ul className="divide-y divide-slate-200">
              {rows.map((r, idx) => {
                const isTop = idx === 0;

                const rangeText = r.isInside
                  ? `${fmtTime(r.lastTapInAt)} → Now`
                  : `${fmtTime(r.lastTapInAt)} → ${fmtTime(r.lastTapOutAt)}`;

                const rangeAvailable =
                  Boolean(r.lastTapInAt) || Boolean(r.lastTapOutAt);

                return (
                  <li
                    key={r.participantId}
                    className={cn(
                      "px-4 py-4",
                      isTop &&
                      "bg-gradient-to-r from-blue-50 via-white to-orange-50"
                    )}
                  >
                    <div className="grid grid-cols-[72px_1fr_86px] gap-3 items-start">
                      {/* Rank */}
                      <div className="flex items-center gap-2 pt-1">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-2xl grid place-items-center border text-base font-semibold",
                            isTop
                              ? "bg-white border-blue-100 text-[#0048FF]"
                              : "bg-slate-50 border-slate-200 text-slate-600"
                          )}
                        >
                          {idx + 1}
                        </div>
                        {isTop && (
                          <span className="text-[#FF6000] pt-1">
                            <Icon name="crown" className="w-5 h-5" />
                          </span>
                        )}
                      </div>

                      {/* Participant (STACK) */}
                      <div className="min-w-0">
                        <div className="flex-row items-start gap-3">
                          <Avatar url={r.photoUrl} name={r.name} />

                          <div className="min-w-0 flex-1 my-2">
                            <div className="text-[#252525] font-semibold text-base leading-tight break-words">
                              {r.name}
                            </div>

                            <div className="mt-1 text-xs text-slate-600">
                              <div className="break-words">
                                <span className="text-slate-500">Employee No:</span>{" "}
                                <b className="text-slate-700">{r.employeeNo ?? "-"}</b>
                              </div>
                              {/* <div className="break-words">
                                <span className="text-slate-500">Badge:</span>{" "}
                                <b className="text-slate-700">{r.badgeId}</b>
                              </div> */}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <StatusPill isInside={r.isInside} />

                              <span className="text-xs text-slate-500">
                                Session:{" "}
                                <b className="text-slate-700">
                                  {rangeAvailable ? rangeText : "—"}
                                </b>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Minutes */}
                      <div className="text-right pt-1">
                        <div className="text-[#252525] font-semibold text-xl leading-none">
                          {r.totalMinutes}
                        </div>
                        <div className="text-xs text-slate-500">minutes</div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
