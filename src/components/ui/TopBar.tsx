"use client";

export function TopBar({ title, rightText }: { title: string; rightText?: string }) {
  return (
    <header className="sticky top-0 z-20">
      {/* primary bar */}
      <div className="bg-[var(--color-primary)] text-white">
        <div className="mx-auto flex max-w-[480px] items-center justify-between px-4 py-4">
          <div className="min-w-0">
            <div className="text-base font-semibold leading-5">{title}</div>
            <div className="mt-0.5 text-xs text-white/80">
              Attendance PWA
            </div>
          </div>

          <div className="ml-3 max-w-[52%] truncate text-right text-xs text-white/85">
            {rightText || "-"}
          </div>
        </div>
      </div>

      {/* thin divider */}
      <div className="h-px bg-black/5" />
    </header>
  );
}
