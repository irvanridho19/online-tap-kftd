import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type LogRow = {
    id: string;
    type: "IN" | "OUT";
    scanned_at: string;
    duration_minutes: number | null;
    participant_id: string;
};

type ParticipantRow = {
    id: string;
    name: string;
    employee_no: string | null;
    photo_url: string | null;
    badge_id: string;
};

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get("eventId");
        const limitParam = searchParams.get("limit");

        if (!eventId) {
            return NextResponse.json({ ok: false, reason: "MISSING_EVENT_ID" }, { status: 400 });
        }

        const limit = Math.min(Math.max(Number(limitParam ?? "15"), 1), 50);

        // 1) Ambil logs terbaru
        const { data: logs, error: lErr } = await supabaseAdmin
            .from("attendance_logs")
            .select("id, type, scanned_at, duration_minutes, participant_id")
            .eq("event_id", eventId)
            .order("scanned_at", { ascending: false })
            .limit(limit);

        if (lErr) {
            return NextResponse.json({ ok: false, reason: "DB_ERROR", detail: lErr.message }, { status: 500 });
        }

        if (!logs || logs.length === 0) {
            return NextResponse.json({ ok: true, rows: [] });
        }

        // 2) Ambil participant yang terlibat (batched)
        const participantIds = Array.from(new Set(logs.map((l) => l.participant_id)));

        const { data: participants, error: pErr } = await supabaseAdmin
            .from("participants")
            .select("id, name, employee_no, photo_url, badge_id")
            .eq("event_id", eventId)
            .in("id", participantIds);

        if (pErr) {
            return NextResponse.json({ ok: false, reason: "DB_ERROR", detail: pErr.message }, { status: 500 });
        }

        const pMap = new Map<string, ParticipantRow>();
        (participants ?? []).forEach((p) => pMap.set(p.id, p as ParticipantRow));

        // 3) Shape response rows
        const rows = (logs as LogRow[]).map((log) => {
            const p = pMap.get(log.participant_id);

            // fallback kalau participant missing (harusnya jarang)
            return {
                logId: log.id,
                scannedAt: log.scanned_at,
                type: log.type, // IN / OUT
                durationMinutes: log.duration_minutes,
                participant: p
                    ? {
                        name: p.name,
                        employeeNo: p.employee_no,
                        photoUrl: p.photo_url,
                        badgeId: p.badge_id,
                    }
                    : {
                        name: "Unknown Participant",
                        employeeNo: null,
                        photoUrl: null,
                        badgeId: "—",
                    },
            };
        });

        return NextResponse.json({ ok: true, rows });
    } catch (err: unknown) {
        const detail =
            err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err);

        return NextResponse.json({ ok: false, reason: "UNKNOWN_ERROR", detail }, { status: 500 });
    }
}
