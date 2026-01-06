"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Participant = {
  id: string;
  name: string | null;
  employee_no: string | null;
  photo_url: string | null;
};

type AttendanceLogRow = {
  id: string;
  scanned_at: string | null; // timestamptz
  type: string | null; // "IN" | "OUT" | text
  participant_id: string | null; // participant id
  participant?: Participant | Participant[] | null;
};

type RecentItem = {
  id: string;
  name: string;
  employeeNo: string;
  photoUrl: string | null;
  status: "IN" | "OUT" | "ONGOING";
  at: string; // iso
};

type LatestLogRow = {
  participant_id: string | null;
  type: string | null;
  scanned_at: string | null;
};

function firstParticipant(
  p?: Participant | Participant[] | null
): Participant | null {
  if (!p) return null;
  return Array.isArray(p) ? (p[0] ?? null) : p;
}


const fmtTime = (iso?: string) => {
  if (!iso) return "-";
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

function isLatestLogRow(x: unknown): x is LatestLogRow {
  if (typeof x !== "object" || x === null) return false;
  const r = x as Record<string, unknown>;
  return (
    "participant_id" in r &&
    "type" in r &&
    "scanned_at" in r &&
    (r.participant_id === null || typeof r.participant_id === "string") &&
    (r.type === null || typeof r.type === "string") &&
    (r.scanned_at === null || typeof r.scanned_at === "string")
  );
}

function isAttendanceLogRow(x: unknown): x is AttendanceLogRow {
  if (typeof x !== "object" || x === null) return false;
  const r = x as Record<string, unknown>;

  const participant = r.participant as unknown;

  const participantOk =
    participant === undefined ||
    participant === null ||
    (typeof participant === "object" &&
      participant !== null &&
      ("id" in (participant as Record<string, unknown>) || true));

  return (
    "id" in r &&
    "scanned_at" in r &&
    "type" in r &&
    "participant_id" in r &&
    (typeof r.id === "string" || typeof r.id === "number") &&
    (r.scanned_at === null || typeof r.scanned_at === "string") &&
    (r.type === null || typeof r.type === "string") &&
    (r.participant_id === null || typeof r.participant_id === "string") &&
    participantOk
  );
}

function Icon({
  name,
  className,
}: {
  name: "users" | "in" | "out" | "qr" | "trophy" | "logout" | "home";
  className?: string;
}) {
  const base = "w-5 h-5";
  const cls = cn(base, className);

  switch (name) {
    case "users":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none">
          <path
            d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M22 21v-2a4 4 0 0 0-3-3.87"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M16 3.13a4 4 0 0 1 0 7.75"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "in":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3v12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M7 8l5-5 5 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 21h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "out":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 21V9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M17 16l-5 5-5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 3h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "qr":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none">
          <path
            d="M3 3h7v7H3V3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M14 3h7v7h-7V3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M3 14h7v7H3v-7Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M14 14h3v3h-3v-3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M18 14h3v7h-7v-3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
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
    case "logout":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none">
          <path
            d="M10 17l5-5-5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15 12H3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M21 21V3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "home":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none">
          <path
            d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10.5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

function StatCard({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
  tone: "blue" | "orange" | "gray";
}) {
  const toneStyles = {
    blue: { bg: "bg-blue-50", ring: "ring-blue-100", iconText: "text-[#0048FF]" },
    orange: {
      bg: "bg-orange-50",
      ring: "ring-orange-100",
      iconText: "text-[#FF6000]",
    },
    gray: { bg: "bg-slate-100", ring: "ring-slate-200", iconText: "text-[#252525]" },
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 block items-center gap-3">
      <div
        className={cn(
          "w-10 h-10 rounded-xl grid place-items-center ring-1 mb-4",
          toneStyles.bg,
          toneStyles.ring
        )}
      >
        <div className={toneStyles.iconText}>{icon}</div>
      </div>

      <div className="min-w-0">
        <div className="text-sm text-slate-500 mb-3">{title}</div>
        <div className="text-xl font-semibold text-[#252525] leading-tight">
          {value}
        </div>
      </div>
    </div>
  );
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (!url) {
    return (
      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 grid place-items-center text-slate-500 text-sm">
        {name.slice(0, 1).toUpperCase()}
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      className="w-10 h-10 rounded-full object-cover border border-slate-200"
    />
  );
}

function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    // biar errornya jelas pas dev
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
  }

  return createClient(url, anon);
}

export default function HomePage() {
  const supabase = useMemo(() => getSupabaseClient(), []);

  const [email, setEmail] = useState<string>("Operator");
  const [loading, setLoading] = useState<boolean>(true);

  const [totalParticipants, setTotalParticipants] = useState<number>(0);
  const [insideCount, setInsideCount] = useState<number>(0);
  const [outCount, setOutCount] = useState<number>(0);

  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const refresh = async () => {
    setLoading(true);

    try {
      // user info
      const { data: authRes, error: authErr } = await supabase.auth.getUser();
      if (!authErr) setEmail(authRes?.user?.email ?? "Operator");

      // 1) Total participants
      const totalRes = await supabase
        .from("participants")
        .select("id", { count: "exact", head: true });
      setTotalParticipants(totalRes.count ?? 0);

      // 2) OUT count (log OUT)
      const outRes = await supabase
        .from("attendance_logs")
        .select("id", { count: "exact", head: true })
        .eq("type", "OUT");
      setOutCount(outRes.count ?? 0);

      // 3) Inside count: latest per participant lalu hitung IN
      const { data: latestLogsRaw, error: latestErr } = await supabase
        .from("attendance_logs")
        .select("participant_id, type, scanned_at")
        .order("scanned_at", { ascending: false })
        .limit(500);

      if (!latestErr) {
        const latestLogs = (latestLogsRaw ?? []).filter(isLatestLogRow);
        const latestMap = new Map<string, { type: string }>();

        for (const r of latestLogs) {
          const pid = r.participant_id;
          if (!pid) continue;
          if (!latestMap.has(pid)) {
            latestMap.set(pid, { type: (r.type ?? "").toUpperCase() });
          }
        }

        let inside = 0;
        for (const v of latestMap.values()) {
          if (v.type === "IN") inside += 1;
        }
        setInsideCount(inside);
      } else {
        setInsideCount(0);
      }

      // 4) Recent scans + join participant
      const { data: recentRowsRaw, error: recentErr } = await supabase
        .from("attendance_logs")
        .select(
          `
          id,
          scanned_at,
          type,
          participant_id,
          participant:participants (
            id,
            name,
            employee_no,
            photo_url
          )
        `
        )
        .order("scanned_at", { ascending: false })
        .limit(5);

      if (!recentErr) {
        const rows = (recentRowsRaw ?? []).filter(isAttendanceLogRow);

        const mapped: RecentItem[] = rows.map((r) => {
          const type = String(r.type ?? "").toUpperCase();
          const status: RecentItem["status"] =
            type === "IN" ? "IN" : type === "OUT" ? "OUT" : "ONGOING";

          const p = firstParticipant(r.participant);

          return {
            id: String(r.id),
            name: p?.name ?? "-",
            employeeNo: p?.employee_no ?? "-",
            photoUrl: p?.photo_url ?? null,
            status,
            at: r.scanned_at ?? "",
          };


        });

        setRecent(mapped);
      } else {
        setRecent([]);
      }

      setLastUpdated(fmtTime(new Date().toISOString()));
    } catch (e) {
      // biar gak blank kalau env missing / error runtime
      console.error(e);
      setRecent([]);
      setInsideCount(0);
      setOutCount(0);
      setTotalParticipants(0);
      setLastUpdated(fmtTime(new Date().toISOString()));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 bg-[#0048FF] text-white">
        <div className="mx-auto max-w-md px-5 py-4 flex items-center justify-between">
          <div className="font-semibold tracking-tight">Tap In / Tap Out</div>
          <div className="text-sm text-white/90 truncate max-w-[55%] text-right">
            {email}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 pt-5 pb-28">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            title="Total Participants"
            value={loading ? "—" : totalParticipants}
            tone="blue"
            icon={<Icon name="users" />}
          />
          <StatCard
            title="Participants Tap In"
            value={loading ? "—" : insideCount}
            tone="orange"
            icon={<Icon name="in" />}
          />
          <StatCard
            title="Participants Tap Out"
            value={loading ? "—" : outCount}
            tone="gray"
            icon={<Icon name="out" />}
          />
        </div>

        {/* Main CTA */}
        <div className="mt-5">
          <Link href="/scan" className="block">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[#252525] font-semibold text-lg">
                      Scan Participant QR
                    </div>
                    <div className="mt-1 text-slate-600 text-sm">
                      Tap In / Tap Out in seconds.
                    </div>
                  </div>

                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-100 to-orange-100 ring-1 ring-slate-200 grid place-items-center">
                    <span className="text-[#0048FF]">
                      <Icon name="qr" />
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="w-full rounded-2xl bg-gradient-to-r from-[#0048FF] to-[#1f6bff] px-5 py-4 text-white shadow-md shadow-blue-200/60">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Start Scanning</span>
                      <span className="text-white/90">→</span>
                    </div>
                    <div className="mt-1 text-white/85 text-sm">
                      Use camera (mobile / laptop)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Secondary CTA */}
          <Link href="/leaderboard" className="block mt-3">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 ring-1 ring-slate-200 grid place-items-center text-[#252525]">
                  <Icon name="trophy" />
                </div>
                <div>
                  <div className="text-[#252525] font-medium">Leaderboard</div>
                  <div className="text-slate-600 text-sm">
                    View longest presence
                  </div>
                </div>
              </div>
              <div className="text-slate-400">→</div>
            </div>
          </Link>
        </div>

        {/* Recent Scans */}
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[#252525] font-semibold">Recent Scans</h2>
              <div className="text-sm text-slate-500">
                Last updated: {lastUpdated || "—"}
              </div>
            </div>

            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium",
                "border border-slate-200 bg-white shadow-sm",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              Refresh
            </button>
          </div>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {recent.length === 0 ? (
              <div className="p-5">
                <div className="text-[#252525] font-semibold">
                  No recent scans
                </div>
                <div className="mt-1 text-slate-600 text-sm">
                  Mulai scan dari halaman Scan untuk mengisi data.
                </div>
                <Link
                  href="/scan"
                  className="inline-flex mt-3 text-[#0048FF] font-medium"
                >
                  Go to Scan →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {recent.slice(0, 5).map((x) => (
                  <li key={x.id} className="p-4 flex items-center gap-3">
                    <Avatar url={x.photoUrl} name={x.name} />

                    <div className="min-w-0 flex-1">
                      <div className="text-[#252525] font-medium truncate">
                        {x.name}
                      </div>
                      <div className="text-slate-500 text-sm truncate">
                        {x.employeeNo}
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={cn(
                          "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold",
                          x.status === "IN" &&
                          "bg-blue-50 text-[#0048FF] ring-1 ring-blue-100",
                          x.status === "OUT" &&
                          "bg-orange-50 text-[#FF6000] ring-1 ring-orange-100",
                          x.status === "ONGOING" &&
                          "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
                        )}
                      >
                        {x.status}
                      </div>
                      <div className="mt-1 text-slate-500 text-xs">
                        {fmtTime(x.at)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200">
        <div className="mx-auto max-w-md px-5 py-3 grid grid-cols-3 gap-2">
          <Link
            href="/home"
            className={cn(
              "rounded-2xl px-3 py-2 flex flex-col items-center gap-1",
              "text-[#0048FF] bg-blue-50 ring-1 ring-blue-100"
            )}
          >
            <Icon name="home" />
            <span className="text-xs font-semibold">Home</span>
          </Link>

          <Link
            href="/leaderboard"
            className={cn(
              "rounded-2xl px-3 py-2 flex flex-col items-center gap-1",
              "text-slate-500 hover:bg-slate-50"
            )}
          >
            <Icon name="trophy" />
            <span className="text-xs font-medium">Dashboard</span>
          </Link>

          <button
            type="button"
            onClick={() => void onLogout()}
            className={cn(
              "rounded-2xl px-3 py-2 flex flex-col items-center gap-1",
              "text-slate-500 hover:bg-slate-50"
            )}
          >
            <Icon name="logout" />
            <span className="text-xs font-medium">Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
