"use client";

import Image from "next/image";
import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

function QrMark() {
  return (
    <div
      className={[
        "grid h-24 w-24 place-items-center rounded-2xl",
        "border border-[var(--color-line)] bg-white",
        "shadow-[var(--shadow-soft)]",
        "relative overflow-hidden",
      ].join(" ")}
    >
      {/* subtle gradient glaze */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/12 via-transparent to-[var(--color-accent)]/12" />
      <svg
        width="56"
        height="56"
        viewBox="0 0 24 24"
        className="relative"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        {/* corners */}
        <path d="M4 9V6a2 2 0 0 1 2-2h3" stroke="url(#g)" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 9V6a2 2 0 0 0-2-2h-3" stroke="url(#g)" strokeWidth="2" strokeLinecap="round" />
        <path d="M4 15v3a2 2 0 0 0 2 2h3" stroke="url(#g)" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 15v3a2 2 0 0 1-2 2h-3" stroke="url(#g)" strokeWidth="2" strokeLinecap="round" />
        {/* dots */}
        <path
          d="M9 9h2v2H9V9Zm4 0h2v2h-2V9ZM9 13h2v2H9v-2Zm4 4h2v2h-2v-2Zm4-4h2v2h-2v-2Z"
          fill="url(#g)"
        />
        <defs>
          <linearGradient id="g" x1="5" y1="5" x2="19" y2="19" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--color-primary)" />
            <stop offset="1" stopColor="var(--color-accent)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function FeatureCard({
  title,
  desc,
  kind,
}: {
  title: string;
  desc: string;
  kind: "scan" | "time" | "leaderboard";
}) {
  const tone =
    kind === "scan"
      ? "from-[var(--color-primary)]/10 to-white"
      : kind === "time"
        ? "from-[var(--color-accent)]/10 to-white"
        : "from-black/5 to-white";

  const chip =
    kind === "scan"
      ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
      : kind === "time"
        ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
        : "bg-black/5 text-[var(--color-ink)]";

  const emoji = kind === "scan" ? "⌁" : kind === "time" ? "⏱" : "🏆";

  return (
    <Card className={`p-5 bg-gradient-to-br ${tone}`}>
      <div className="flex items-start gap-4">
        <div className={`grid h-11 w-11 place-items-center rounded-2xl ${chip} border border-[var(--color-line)]`}>
          <span className="text-base">{emoji}</span>
        </div>

        <div>
          <div className="text-sm font-semibold text-[var(--color-ink)]">{title}</div>
          <p className="mt-1 text-sm leading-6 text-black/60">{desc}</p>
        </div>
      </div>
    </Card>
  );
}

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");

    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/home");
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* soft background accent */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-120px] h-[340px] w-[340px] -translate-x-1/2 rounded-full bg-[var(--color-primary)]/10 blur-3xl" />
        <div className="absolute right-[-120px] top-[140px] h-[280px] w-[280px] rounded-full bg-[var(--color-accent)]/10 blur-3xl" />
      </div>

      <Container>
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          {/* Logo (slightly bigger) */}
          <div className="mb-6 grid h-16 w-16 place-items-center">
            <Image
              src="/logo.png"
              alt="KFTD"
              width={44}
              height={44}
              className="h-11 w-11 object-contain"
              priority
            />
          </div>

          {/* QR mark on top, text below (stack) */}
          <QrMark />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
            Tap In / Tap Out
          </h1>
          <p className="mt-1 text-sm text-black/60">
            Attendance PWA for National Work Meetings
          </p>

          <p className="mt-4 text-sm leading-6 text-black/60 max-w-[36ch]">
            Scan participant badge QR to record entry/exit and automatically calculate total presence minutes.
          </p>
        </div>

        {/* Sign in card */}
        <Card className="mt-8 p-6">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-ink)]">Sign in</h2>
            <p className="mt-1 text-sm text-black/60">
              Use your operator account to scan and record attendance.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="operator@kftd.co.id" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required />
            </div>

            <Button
              type="submit"
              className={[
                "w-full",
                "shadow-[0_10px_30px_rgba(0,72,255,0.18)]",
                "hover:shadow-[0_12px_34px_rgba(0,72,255,0.22)]",
              ].join(" ")}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
              <span className="ml-1 text-white/85">→</span>
            </Button>

            <div className="text-center text-xs text-black/50">
              Having trouble? Contact your admin.
            </div>
          </form>
        </Card>

        {/* Feature cards: 1 column stack */}
        <div className="mt-8 space-y-4">
          <FeatureCard
            kind="scan"
            title="Fast QR scanning"
            desc="Operator scans participant badge QR for tap in / tap out."
          />
          <FeatureCard
            kind="time"
            title="Auto duration"
            desc="Minutes calculated across the event—even when ongoing."
          />
          <FeatureCard
            kind="leaderboard"
            title="Leaderboard"
            desc="Board can view top participants by total presence."
          />
        </div>
      </Container>
    </div>
  );
}
