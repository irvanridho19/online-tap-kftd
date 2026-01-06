"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabaseClient } from "@/lib/supabaseClient";

const EVENT_ID = "47dd02f0-a934-4a45-87b6-affd6ff83c1a";

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
    | { ok: false; reason: string; badgeId?: string; detail?: string };

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

function Icon({
    name,
    className,
}: {
    name:
    | "qr"
    | "home"
    | "info"
    | "play"
    | "stop"
    | "refresh"
    | "chevRight";
    className?: string;
}) {
    const cls = cn("w-5 h-5", className);

    switch (name) {
        case "qr":
            return (
                <svg className={cls} viewBox="0 0 24 24" fill="none">
                    <path d="M3 3h7v7H3V3Z" stroke="currentColor" strokeWidth="2" />
                    <path d="M14 3h7v7h-7V3Z" stroke="currentColor" strokeWidth="2" />
                    <path d="M3 14h7v7H3v-7Z" stroke="currentColor" strokeWidth="2" />
                    <path d="M14 14h3v3h-3v-3Z" stroke="currentColor" strokeWidth="2" />
                    <path
                        d="M18 14h3v7h-7v-3"
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
        case "info":
            return (
                <svg className={cls} viewBox="0 0 24 24" fill="none">
                    <path
                        d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <path
                        d="M12 17v-6"
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
        case "play":
            return (
                <svg className={cls} viewBox="0 0 24 24" fill="none">
                    <path
                        d="M8 5v14l11-7-11-7Z"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinejoin="round"
                    />
                </svg>
            );
        case "stop":
            return (
                <svg className={cls} viewBox="0 0 24 24" fill="none">
                    <path
                        d="M7 7h10v10H7V7Z"
                        stroke="currentColor"
                        strokeWidth="2"
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
        case "chevRight":
            return (
                <svg className={cls} viewBox="0 0 24 24" fill="none">
                    <path
                        d="M9 18l6-6-6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            );
    }
}

export default function ScanPage() {
    const [email, setEmail] = useState("Operator");

    const [status, setStatus] = useState("Ready. Tap Start Camera.");
    const [started, setStarted] = useState(false);

    const [lastResult, setLastResult] = useState<string | null>(null);
    const [lastResponse, setLastResponse] = useState<ScanApiResponse | null>(null);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const qrRef = useRef<Html5Qrcode | null>(null);
    const isScanningRef = useRef(false);
    const isBusyRef = useRef(false);

    // init user email
    useEffect(() => {
        (async () => {
            const { data } = await supabaseClient.auth.getUser();
            setEmail(data?.user?.email ?? "Operator");
        })();
    }, []);

    // init scanner instance (once)
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        if (!el.id) el.id = "qr-reader";
        qrRef.current = new Html5Qrcode(el.id);

        return () => {
            const qr = qrRef.current;
            qrRef.current = null;

            (async () => {
                try {
                    if (!qr) return;
                    if (isScanningRef.current) {
                        isScanningRef.current = false;
                        await qr.stop().catch(() => { });
                    }
                    try {
                        qr.clear();
                    } catch { }
                } catch { }
            })();
        };
    }, []);

    const callScanApi = async (qrText: string) => {
        const res = await fetch("/api/scan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                eventId: EVENT_ID,
                qrText,
                operatorUserId: null,
            }),
        });

        return (await res.json()) as ScanApiResponse;
    };

    const startCamera = async () => {
        const qr = qrRef.current;
        if (!qr) return;

        try {
            setStatus("Starting camera...");
            setStarted(true);
            setLastResult(null);
            setLastResponse(null);

            await new Promise<void>((r) => requestAnimationFrame(() => r()));

            isScanningRef.current = true;

            await qr.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 260, height: 260 } },
                async (decodedText) => {
                    if (isBusyRef.current) return;
                    isBusyRef.current = true;

                    setLastResult(decodedText);
                    setStatus("Processing...");

                    // stop scanning to avoid multiple hits
                    if (isScanningRef.current) {
                        isScanningRef.current = false;
                        await qr.stop().catch(() => { });
                    }

                    const apiResp = await callScanApi(decodedText);
                    window.location.href = `/scan/result?payload=${encodeURIComponent(
                        JSON.stringify(apiResp)
                    )}`
                },
                () => { }
            );

            setStatus("Camera ready. Point to QR...");
        } catch (err) {
            console.error(err);
            setStatus(
                "Failed to start camera. Check permission / HTTPS / other apps using camera."
            );
            setStarted(false);
            isScanningRef.current = false;
            isBusyRef.current = false;
        }
    };

    const stopCamera = async () => {
        const qr = qrRef.current;
        if (!qr) return;

        setStatus("Stopping camera...");
        try {
            if (isScanningRef.current) {
                isScanningRef.current = false;
                await qr.stop().catch(() => { });
            }
        } catch { }
        setStatus("Stopped. Tap Start Camera.");
        setStarted(false);
        isBusyRef.current = false;
    };

    const resetState = async () => {
        await stopCamera().catch(() => { });
        setLastResult(null);
        setLastResponse(null);
        setStatus("Ready. Tap Start Camera.");
    };

    const statusTone =
        lastResponse?.ok === true
            ? lastResponse.action === "IN"
                ? "blue"
                : "orange"
            : lastResponse && !lastResponse.ok
                ? "red"
                : "neutral";

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Bar */}
            <header className="sticky top-0 z-10 bg-[#0048FF] text-white">
                <div className="mx-auto max-w-md px-5 py-4 flex items-center justify-between">
                    <div className="font-semibold tracking-tight">Scan QR Participant</div>
                    <div className="text-sm text-white/90 truncate max-w-[55%] text-right">
                        {email}
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-md px-5 pt-5 pb-10">
                {/* Status */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-orange-100 ring-1 ring-slate-200 grid place-items-center text-[#0048FF]">
                            <Icon name="qr" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-[#252525] font-semibold">Scanner status</div>
                            <div className="text-slate-600 text-sm mt-1">{status}</div>
                            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                                <Icon name="info" className="w-4 h-4" />
                                <span>Pastikan izin kamera “Allow”. iOS/Safari wajib HTTPS.</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                    {!started ? (
                        <button
                            onClick={startCamera}
                            className={cn(
                                "rounded-2xl px-4 py-4 shadow-md shadow-blue-200/60",
                                "bg-gradient-to-r from-[#0048FF] to-[#1f6bff]",
                                "text-white font-semibold flex items-center justify-center gap-2"
                            )}
                        >
                            <Icon name="play" />
                            Start Camera
                        </button>
                    ) : (
                        <button
                            onClick={stopCamera}
                            className={cn(
                                "rounded-2xl px-4 py-4 shadow-sm",
                                "bg-white border border-slate-200",
                                "text-[#252525] font-semibold flex items-center justify-center gap-2"
                            )}
                        >
                            <Icon name="stop" />
                            Stop Camera
                        </button>
                    )}

                    <button
                        onClick={resetState}
                        className={cn(
                            "rounded-2xl px-4 py-4 shadow-sm",
                            "bg-white border border-slate-200",
                            "text-slate-700 font-semibold flex items-center justify-center gap-2"
                        )}
                    >
                        <Icon name="refresh" />
                        Reset
                    </button>
                </div>

                {/* Camera */}
                <section className="mt-4">
                    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="px-5 py-4 flex items-center justify-between">
                            <div>
                                <div className="text-[#252525] font-semibold">Camera</div>
                                <div className="text-slate-600 text-sm">Arahkan QR badge ke kotak.</div>
                            </div>

                            <div
                                className={cn(
                                    "text-xs font-semibold px-3 py-1 rounded-full ring-1",
                                    statusTone === "blue" &&
                                    "bg-blue-50 text-[#0048FF] ring-blue-100",
                                    statusTone === "orange" &&
                                    "bg-orange-50 text-[#FF6000] ring-orange-100",
                                    statusTone === "red" &&
                                    "bg-rose-50 text-rose-700 ring-rose-100",
                                    statusTone === "neutral" &&
                                    "bg-slate-100 text-slate-700 ring-slate-200"
                                )}
                            >
                                {started ? "RUNNING" : "IDLE"}
                            </div>
                        </div>

                        <div className="relative bg-[#0b1220]">
                            <div ref={containerRef} id="qr-reader" className="w-full min-h-[360px]" />

                            {/* Finder overlay */}
                            <div className="pointer-events-none absolute inset-0 grid place-items-center">
                                <div className="w-[260px] h-[260px] rounded-3xl ring-2 ring-white/30" />
                            </div>

                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent" />
                        </div>
                    </div>
                </section>

                {/* Last Scan */}
                {(lastResult || lastResponse) && (
                    <section className="mt-5">
                        <div className="text-[#252525] font-semibold">Last Scan</div>

                        {lastResult && (
                            <div className="mt-2 rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
                                <div className="text-xs text-slate-500">QR Payload</div>
                                <div className="mt-1 text-sm text-[#252525] break-all">{lastResult}</div>
                            </div>
                        )}

                        {lastResponse?.ok && (
                            <div className="mt-3 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                <div className="p-5 flex items-start gap-4">
                                    {lastResponse.participant.photoUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={lastResponse.participant.photoUrl}
                                            alt="participant"
                                            className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 grid place-items-center text-slate-500 text-xs">
                                            No Photo
                                        </div>
                                    )}

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="text-[#252525] font-semibold truncate">
                                                    {lastResponse.participant.name}
                                                </div>
                                                <div className="text-slate-600 text-sm truncate">
                                                    Employee No: {lastResponse.participant.employeeNo ?? "-"}
                                                </div>
                                                <div className="text-slate-500 text-sm truncate">
                                                    Badge: {lastResponse.participant.badgeId}
                                                </div>
                                            </div>

                                            <div
                                                className={cn(
                                                    "shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1",
                                                    lastResponse.action === "IN" &&
                                                    "bg-blue-50 text-[#0048FF] ring-blue-100",
                                                    lastResponse.action === "OUT" &&
                                                    "bg-orange-50 text-[#FF6000] ring-orange-100"
                                                )}
                                            >
                                                {lastResponse.action}
                                            </div>
                                        </div>

                                        <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-4">
                                            {lastResponse.action === "IN" && (
                                                <div className="text-sm text-[#252525]">
                                                    Tap In time: <b>{fmtTime(lastResponse.tapInAt)}</b>
                                                </div>
                                            )}

                                            {lastResponse.action === "OUT" && (
                                                <div className="text-sm text-[#252525]">
                                                    <div>
                                                        From <b>{fmtTime(lastResponse.tapInAt)}</b> to{" "}
                                                        <b>{fmtTime(lastResponse.tapOutAt)}</b>
                                                    </div>
                                                    <div className="mt-1">
                                                        Duration: <b>{lastResponse.durationMinutes ?? 0}</b> minutes
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {lastResponse && !lastResponse.ok && (
                            <div className="mt-3 rounded-3xl border border-rose-200 bg-rose-50 shadow-sm p-5">
                                <div className="text-rose-800 font-semibold">Rejected</div>
                                <div className="mt-1 text-rose-800/90 text-sm">
                                    Reason: <b>{lastResponse.reason}</b>
                                </div>
                                {lastResponse.detail && (
                                    <div className="mt-1 text-rose-800/90 text-sm">Detail: {lastResponse.detail}</div>
                                )}
                            </div>
                        )}
                    </section>
                )}

                {/* Back */}
                <div className="mt-6">
                    <Link href="/home" className="inline-flex items-center gap-2 text-[#0048FF] font-semibold">
                        <Icon name="home" />
                        Back to Home
                    </Link>
                </div>
            </main>
        </div>
    );
}
