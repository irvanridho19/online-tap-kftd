import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type ScanRequest = {
    eventId: string;
    qrText: string;
    operatorUserId?: string | null;
};

function parseBadgeId(qrText: string): string {
    const trimmed = qrText.trim();
    const badgeMatch = trimmed.match(/badge=([^|]+)/i);
    if (badgeMatch?.[1]) return badgeMatch[1].trim();
    return trimmed;
}

function minutesBetween(aIso: string, bIso: string): number {
    const a = new Date(aIso).getTime();
    const b = new Date(bIso).getTime();
    return Math.max(0, Math.round((b - a) / 60000));
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as ScanRequest;

        if (!body?.eventId || !body?.qrText) {
            return NextResponse.json(
                { ok: false, reason: "MISSING_EVENT_OR_QR" },
                { status: 400 }
            );
        }

        const badgeId = parseBadgeId(body.qrText);

        // 1) Find participant
        const { data: participant, error: pErr } = await supabaseAdmin
            .from("participants")
            .select("id, name, employee_no, photo_url, badge_id, event_id")
            .eq("event_id", body.eventId)
            .eq("badge_id", badgeId)
            .maybeSingle();

        if (pErr) {
            return NextResponse.json(
                { ok: false, reason: "DB_ERROR", detail: pErr.message },
                { status: 500 }
            );
        }
        if (!participant) {
            return NextResponse.json(
                { ok: false, reason: "PARTICIPANT_NOT_FOUND", badgeId },
                { status: 404 }
            );
        }

        // 2) Read last log
        const { data: lastLog, error: lErr } = await supabaseAdmin
            .from("attendance_logs")
            .select("id, type, scanned_at")
            .eq("event_id", body.eventId)
            .eq("participant_id", participant.id)
            .order("scanned_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (lErr) {
            return NextResponse.json(
                { ok: false, reason: "DB_ERROR", detail: lErr.message },
                { status: 500 }
            );
        }

        const nowIso = new Date().toISOString();

        // Decide action:
        // - If last log is OUT or doesn't exist => IN
        // - If last log is IN => OUT (compute duration)
        const nextType: "IN" | "OUT" =
            !lastLog || lastLog.type === "OUT" ? "IN" : "OUT";

        if (nextType === "IN") {
            // Insert IN
            const { data: inserted, error: iErr } = await supabaseAdmin
                .from("attendance_logs")
                .insert({
                    event_id: body.eventId,
                    participant_id: participant.id,
                    operator_user_id: body.operatorUserId ?? null,
                    type: "IN",
                    scanned_at: nowIso,
                })
                .select("id, scanned_at")
                .single();

            if (iErr) {
                return NextResponse.json(
                    { ok: false, reason: "DB_ERROR", detail: iErr.message },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                ok: true,
                action: "IN",
                tapInAt: inserted.scanned_at,
                participant: {
                    name: participant.name,
                    employeeNo: participant.employee_no,
                    photoUrl: participant.photo_url,
                    badgeId: participant.badge_id,
                },
            });
        }

        // nextType === "OUT"
        // If lastLog was IN, compute duration
        if (!lastLog || lastLog.type !== "IN") {
            // Edge case (shouldn't happen with our rules)
            return NextResponse.json(
                { ok: false, reason: "NO_TAPIN_FOUND" },
                { status: 409 }
            );
        }

        const durationMinutes = minutesBetween(lastLog.scanned_at, nowIso);

        // Insert OUT with pairing + duration
        const { data: insertedOut, error: oErr } = await supabaseAdmin
            .from("attendance_logs")
            .insert({
                event_id: body.eventId,
                participant_id: participant.id,
                operator_user_id: body.operatorUserId ?? null,
                type: "OUT",
                scanned_at: nowIso,
                in_log_id: lastLog.id,
                duration_minutes: durationMinutes,
            })
            .select("id, scanned_at, in_log_id, duration_minutes")
            .single();

        if (oErr) {
            return NextResponse.json(
                { ok: false, reason: "DB_ERROR", detail: oErr.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            ok: true,
            action: "OUT",
            tapInAt: lastLog.scanned_at,
            tapOutAt: insertedOut.scanned_at,
            durationMinutes: insertedOut.duration_minutes,
            participant: {
                name: participant.name,
                employeeNo: participant.employee_no,
                photoUrl: participant.photo_url,
                badgeId: participant.badge_id,
            },
        });
    } catch (err: unknown) {
        const detail =
            err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err);

        return NextResponse.json(
            { ok: false, reason: "UNKNOWN_ERROR", detail },
            { status: 500 }
        );
    }
}
