import { formatCompactCurrency } from "@/lib/model";

interface PriceRangeGaugeProps {
  low: number;
  price: number;
  high: number;
  currency: "USD" | "INR";
}

export function PriceRangeGauge({ low, price, high, currency }: PriceRangeGaugeProps) {
  const range = high - low;
  const pct = range > 0 ? Math.min(100, Math.max(0, ((price - low) / range) * 100)) : 50;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-end justify-between text-sm">
        <span>
          <span className="text-slate-500">Low</span>
          <span className="ml-1 font-semibold text-slate-700">{formatCompactCurrency(low, currency)}</span>
        </span>
        <span className="text-right">
          <span className="text-slate-500">High</span>
          <span className="ml-1 font-semibold text-slate-700">{formatCompactCurrency(high, currency)}</span>
        </span>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-300 via-emerald-500 to-emerald-600"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 h-5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded bg-slate-900 shadow"
          style={{ left: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-center text-xs text-slate-500">
        Predicted value sits at the marker within the estimated range
      </p>
    </div>
  );
}
