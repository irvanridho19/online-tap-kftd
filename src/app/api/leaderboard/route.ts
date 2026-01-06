import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type LogRow = {
    participant_id: string;
    type: "IN" | "OUT";
    scanned_at: string;
    duration_minutes: number | null;
};

function minutesBetween(aIso: string, bIso: string): number {
    const a = new Date(aIso).getTime();
    const b = new Date(bIso).getTime();
    return Math.max(0, Math.round((b - a) / 60000));
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get("eventId");

        if (!eventId) {
            return NextResponse.json({ ok: false, reason: "MISSING_EVENT_ID" }, { status: 400 });
        }

        // 1) Ambil semua participant untuk event
        const { data: participants, error: pErr } = await supabaseAdmin
            .from("participants")
            .select("id, name, employee_no, photo_url, badge_id")
            .eq("event_id", eventId);

        if (pErr) {
            return NextResponse.json({ ok: false, reason: "DB_ERROR", detail: pErr.message }, { status: 500 });
        }

        // Jika belum ada participant sama sekali
        if (!participants || participants.length === 0) {
            return NextResponse.json({ ok: true, rows: [] });
        }

        // 2) Ambil semua logs untuk event (IN/OUT)
        const { data: logs, error: lErr } = await supabaseAdmin
            .from("attendance_logs")
            .select("participant_id, type, scanned_at, duration_minutes")
            .eq("event_id", eventId)
            .order("scanned_at", { ascending: true });

        if (lErr) {
            return NextResponse.json({ ok: false, reason: "DB_ERROR", detail: lErr.message }, { status: 500 });
        }

        const nowIso = new Date().toISOString();

        // Group logs by participant_id
        const logsByParticipant = new Map<string, LogRow[]>();
        (logs ?? []).forEach((log) => {
            const arr = logsByParticipant.get(log.participant_id) ?? [];
            arr.push(log as LogRow);
            logsByParticipant.set(log.participant_id, arr);
        });

        // 3) Hitung totalMinutes untuk tiap participant
        const rows = participants.map((p) => {
            const pLogs = logsByParticipant.get(p.id) ?? [];
            let total = 0;
            let lastIn: string | null = null;

            for (const log of pLogs) {
                if (log.type === "IN") {
                    lastIn = log.scanned_at;
                } else if (log.type === "OUT") {
                    if (lastIn) {
                        // prefer duration_minutes kalau tersedia
                        const dur = typeof log.duration_minutes === "number"
                            ? log.duration_minutes
                            : minutesBetween(lastIn, log.scanned_at);

                        total += Math.max(0, dur);
                        lastIn = null;
                    }
                }
            }

            // Kalau masih IN (belum OUT), tetap dihitung sampai sekarang
            const isInside = Boolean(lastIn);
            if (lastIn) {
                total += minutesBetween(lastIn, nowIso);
            }

            return {
                participantId: p.id,
                name: p.name,
                employeeNo: p.employee_no,
                photoUrl: p.photo_url,
                badgeId: p.badge_id,
                totalMinutes: total,
                isInside,
            };
        });

        // 4) Filter: hanya yang punya menit > 0 (biar empty state meaningful)
        const filtered = rows.filter((r) => r.totalMinutes > 0);

        // 5) Sort desc
        filtered.sort((a, b) => b.totalMinutes - a.totalMinutes);

        return NextResponse.json({ ok: true, rows: filtered });
    } catch (err: unknown) {
        const detail =
            err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err);

        return NextResponse.json({ ok: false, reason: "UNKNOWN_ERROR", detail }, { status: 500 });
    }
}
