import { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={[
                "w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3",
                "text-[var(--color-ink)] placeholder:text-black/40",
                "outline-none focus:ring-4 focus:ring-[color:var(--color-primary)]/15 focus:border-[var(--color-primary)]",
                className,
            ].join(" ")}
            {...props}
        />
    );
}
