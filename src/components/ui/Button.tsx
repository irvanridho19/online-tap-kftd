import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "ghost";
};

export function Button({ variant = "primary", className = "", ...props }: Props) {
    const base =
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] px-4 py-3 text-sm font-medium transition " +
        "disabled:opacity-50 disabled:cursor-not-allowed";

    const styles =
        variant === "primary"
            ? "bg-[var(--color-primary)] text-white hover:opacity-95"
            : "bg-transparent text-[var(--color-ink)] hover:bg-black/5";

    return <button className={[base, styles, className].join(" ")} {...props} />;
}
