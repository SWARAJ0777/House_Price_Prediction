import { formatCompactCurrency, type Factor } from "@/lib/model";
import { cn } from "@/utils/cn";

interface FeatureBarChartProps {
  factors: Factor[];
  maxItems?: number;
  currency?: "USD" | "INR";
}

export function FeatureBarChart({ factors, maxItems = 5, currency = "USD" }: FeatureBarChartProps) {
  const displayFactors = factors.slice(0, maxItems);
  const maxAbs = Math.max(...displayFactors.map((f) => Math.abs(f.contribution)), 1);

  return (
    <div className="space-y-4">
      {displayFactors.map((factor) => {
        const isPositive = factor.contribution >= 0;
        const width = Math.min(100, (Math.abs(factor.contribution) / maxAbs) * 100);

        return (
          <div key={factor.label} className="group">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">{factor.label}</span>
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  isPositive ? "text-emerald-700" : "text-rose-600",
                )}
              >
                {isPositive ? "+" : ""}
                {formatCompactCurrency(factor.contribution, currency)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700 ease-out",
                  isPositive ? "bg-emerald-500" : "bg-rose-500",
                )}
                style={{ width: `${width}%` }}
                aria-label={`${factor.label}: ${formatCompactCurrency(factor.contribution, currency)}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
