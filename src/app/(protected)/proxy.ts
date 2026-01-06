import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function proxy(req: Request) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Cookie supabase biasanya sb-...
    const hasSbCookie = (await cookies()).getAll().some((c) => c.name.startsWith("sb-"));

    if (!hasSbCookie) {
        const redirectUrl = new URL("/", url.origin);
        redirectUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
}
