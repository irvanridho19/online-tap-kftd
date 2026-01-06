"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

function IconHome({ active }: { active: boolean }) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
                d="M4 10.5 12 4l8 6.5V20a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 20v-9.5Z"
                stroke={active ? "var(--color-primary)" : "rgba(0,0,0,.45)"}
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path
                d="M9.5 21.5v-7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v7"
                stroke={active ? "var(--color-primary)" : "rgba(0,0,0,.45)"}
                strokeWidth="2"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function IconDashboard({ active }: { active: boolean }) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
                d="M4 4h7v9H4V4Zm9 0h7v6h-7V4ZM4 15h7v5H4v-5Zm9-3h7v8h-7v-8Z"
                stroke={active ? "var(--color-primary)" : "rgba(0,0,0,.45)"}
                strokeWidth="2"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function IconLogout() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
                d="M10 7V6a2 2 0 0 1 2-2h7v16h-7a2 2 0 0 1-2-2v-1"
                stroke="rgba(0,0,0,.55)"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path
                d="M3 12h10"
                stroke="rgba(0,0,0,.55)"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="m6 9-3 3 3 3"
                stroke="rgba(0,0,0,.55)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();

    const isHome = pathname === "/home";
    // “Dashboard” kita arahkan ke leaderboard (kalau nanti kamu punya /dashboard sendiri, tinggal ganti)
    const isDashboard = pathname.startsWith("/leaderboard");

    async function onLogout() {
        const supabase = supabaseBrowser();
        await supabase.auth.signOut();
        router.push("/");
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-30">
            <div className="mx-auto max-w-[480px] px-4 pb-4">
                <div className="rounded-2xl border border-[var(--color-line)] bg-white shadow-[var(--shadow-soft)]">
                    <div className="grid grid-cols-3">
                        <Link
                            href="/home"
                            className="flex flex-col items-center justify-center gap-1 py-3"
                        >
                            <IconHome active={isHome} />
                            <span className={`text-xs ${isHome ? "text-[var(--color-primary)]" : "text-black/55"}`}>
                                Home
                            </span>
                        </Link>

                        <Link
                            href="/leaderboard"
                            className="flex flex-col items-center justify-center gap-1 py-3"
                        >
                            <IconDashboard active={isDashboard} />
                            <span className={`text-xs ${isDashboard ? "text-[var(--color-primary)]" : "text-black/55"}`}>
                                Dashboard
                            </span>
                        </Link>

                        <button
                            type="button"
                            onClick={onLogout}
                            className="flex flex-col items-center justify-center gap-1 py-3"
                        >
                            <IconLogout />
                            <span className="text-xs text-black/55">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
