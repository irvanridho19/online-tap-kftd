"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

type ScanApiResponse =
    | {
        ok: true;
        action: "IN" | "OUT";
        tapInAt?: string;
        tapOutAt?: string;
        durationMinutes?: number;
        participant: {
            name: string;
            employeeNo: string | null;
            photoUrl: string | null;
            badgeId: string;
        };
    }
    | { ok: false; reason: string; detail?: string };

const fmtTime = (iso?: string) =>
    iso
        ? new Intl.DateTimeFormat("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Asia/Jakarta",
        }).format(new Date(iso))
        : "-";

export default function ScanResultPage() {
    const params = useSearchParams();
    const router = useRouter();

    const raw = params.get("payload");

    const data = useMemo<ScanApiResponse | null>(() => {
        if (!raw) return null;
        try {
            return JSON.parse(raw) as ScanApiResponse;
        } catch {
            return { ok: false, reason: "Invalid payload" };
        }
    }, [raw]);

    // auto back after 3s (hanya kalau data ada)
    useEffect(() => {
        if (!data) return;

        const t = setTimeout(() => {
            router.replace("/scan");
        }, 8000);

        return () => clearTimeout(t);
    }, [data, router]);

    // render fallback kalau payload kosong
    if (!data) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-5">
                <div className="max-w-md w-full rounded-3xl bg-white border border-slate-200 shadow-lg p-6 text-center">
                    <div className="text-[#252525] font-semibold text-lg">
                        No scan result
                    </div>
                    <div className="mt-2 text-slate-600 text-sm">
                        Payload tidak ditemukan. Kembali ke halaman scan.
                    </div>

                    <Link
                        href="/scan"
                        className="mt-6 block rounded-2xl bg-[#0048FF] text-white py-3 font-semibold"
                    >
                        Back to Scan
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-5">
            <div className="max-w-md w-full rounded-3xl bg-white border border-slate-200 shadow-lg p-6 text-center">
                {/* ICON */}
                <div
                    className={`mx-auto w-20 h-20 rounded-full grid place-items-center ${data.ok ? "bg-green-50 text-green-600" : "bg-rose-50 text-rose-600"
                        }`}
                >
                    {data.ok ? "✓" : "✕"}
                </div>

                {/* TITLE */}
                <h1 className="mt-4 text-2xl font-semibold text-[#252525]">
                    {data.ok
                        ? data.action === "IN"
                            ? "Tap In Success"
                            : "Tap Out Success"
                        : "Scan Rejected"}
                </h1>

                {/* CONTENT */}
                {data.ok ? (
                    <div className="mt-4 text-left">
                        <div className="flex items-center gap-4">
                            {data.participant.photoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={data.participant.photoUrl}
                                    className="w-32 h-32 rounded-xl object-cover border"
                                    alt=""
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-xl bg-slate-100 grid place-items-center">
                                    —
                                </div>
                            )}

                            <div>
                                <div className="font-semibold">{data.participant.name}</div>
                                <div className="text-sm text-slate-600">
                                    Employee No: {data.participant.employeeNo ?? "-"}
                                </div>
                                <div className="text-sm text-slate-500">
                                    Badge: {data.participant.badgeId}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 rounded-xl bg-slate-50 border p-4 text-sm">
                            {data.action === "IN" && (
                                <>
                                    Tap In at <b>{fmtTime(data.tapInAt)}</b>
                                </>
                            )}
                            {data.action === "OUT" && (
                                <>
                                    <div>
                                        {fmtTime(data.tapInAt)} → {fmtTime(data.tapOutAt)}
                                    </div>
                                    <div className="mt-1">
                                        Duration: <b>{data.durationMinutes ?? 0} minutes</b>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="mt-4 text-rose-700">
                        <b>{data.reason}</b>
                        {"detail" in data && data.detail && <div>{data.detail}</div>}
                    </div>
                )}

                {/* ACTION */}
                <Link
                    href="/scan"
                    className="mt-6 block rounded-2xl bg-[#0048FF] text-white py-3 font-semibold"
                >
                    Scan Next
                </Link>

                <div className="mt-2 text-xs text-slate-400">
                    Auto return in 8 seconds
                </div>
            </div>
        </div>
    );
}
