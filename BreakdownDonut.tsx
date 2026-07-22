import { formatCompactCurrency, type Factor } from "@/lib/model";
import { cn } from "@/utils/cn";

interface BreakdownDonutProps {
  factors: Factor[];
  currency: "USD" | "INR";
  maxItems?: number;
}

const POSITIVE_PALETTE = [
  "bg-emerald-500",
  "bg-emerald-400",
  "bg-teal-400",
  "bg-cyan-500",
];

const NEGATIVE_CLASS = "bg-rose-500";

export function BreakdownDonut({ factors, currency, maxItems = 4 }: BreakdownDonutProps) {
  const sorted = [...factors].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  const displayed = sorted.slice(0, maxItems);
  const others = sorted.slice(maxItems);
  const otherTotal = others.reduce((sum, f) => sum + Math.abs(f.contribution), 0);

  let positiveIndex = 0;

  const segments = displayed.map((f) => {
    const isPositive = f.contribution >= 0;
    const colorClass = isPositive
      ? POSITIVE_PALETTE[positiveIndex++ % POSITIVE_PALETTE.length]
      : NEGATIVE_CLASS;
    return {
      label: f.label,
      value: Math.abs(f.contribution),
      isPositive,
      colorClass,
    };
  });

  if (otherTotal > 0) {
    segments.push({
      label: "Other factors",
      value: otherTotal,
      isPositive: true,
      colorClass: POSITIVE_PALETTE[positiveIndex % POSITIVE_PALETTE.length],
    });
  }

  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  let cumulative = 0;

  const gradientStops = segments.map((segment) => {
    const start = cumulative;
    cumulative += (segment.value / total) * 100;
    const end = cumulative;
    const hex = getComputedColor(segment.colorClass);
    return `${hex} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
  });

  const conicGradient = `conic-gradient(${gradientStops.join(", ")})`;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center">
      <div className="relative h-36 w-36 flex-shrink-0">
        <div
          className="h-full w-full rounded-full"
          style={{ background: conicGradient }}
          aria-label="Cost breakdown chart"
        />
        <div className="absolute inset-0 m-auto flex h-24 w-24 items-center justify-center rounded-full bg-white text-center shadow-sm">
          <span className="text-xs font-medium text-slate-500">Top drivers</span>
        </div>
      </div>

      <ul className="w-full space-y-2 sm:w-auto">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2 text-sm">
            <span className={cn("h-3 w-3 rounded-full flex-shrink-0", segment.colorClass)} />
            <span className="truncate text-slate-600" title={segment.label}>
              {segment.label}
            </span>
            <span className="ml-auto whitespace-nowrap font-semibold text-slate-800">
              {formatCompactCurrency(segment.value, currency)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function getComputedColor(twClass: string): string {
  const map: Record<string, string> = {
    "bg-emerald-500": "#10b981",
    "bg-emerald-400": "#34d399",
    "bg-teal-400": "#2dd4bf",
    "bg-cyan-500": "#06b6d4",
    "bg-rose-500": "#f43f5e",
  };
  return map[twClass] || "#cbd5e1";
}
