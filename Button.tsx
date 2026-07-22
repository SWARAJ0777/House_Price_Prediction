import { cn } from "@/utils/cn";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary";
  isLoading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  isLoading = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60",
        variant === "primary" &&
          "bg-emerald-600 text-white shadow-sm shadow-emerald-200 hover:bg-emerald-700",
        variant === "secondary" &&
          "border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700",
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
