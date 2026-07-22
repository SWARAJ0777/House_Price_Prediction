import { cn } from "@/utils/cn";
import { forwardRef, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400",
          "transition-colors duration-200",
          "focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15",
          "hover:border-slate-300",
          "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
