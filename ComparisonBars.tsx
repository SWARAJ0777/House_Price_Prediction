import { formatCompactCurrency } from "@/lib/model";

interface ComparisonBarsProps {
  predicted: number;
  median: number;
  currency: "USD" | "INR";
}

export function ComparisonBars({ predicted, median, currency }: ComparisonBarsProps) {
  const max = Math.max(predicted, median, 1);
  const predictedWidth = (predicted / max) * 100;
  const medianWidth = (median / max) * 100;

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">Predicted price</span>
          <span className="font-semibold text-emerald-700">{formatCompactCurrency(predicted, currency)}</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
            style={{ width: `${predictedWidth}%` }}
          />
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">Local median</span>
          <span className="font-semibold text-slate-600">{formatCompactCurrency(median, currency)}</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-slate-400 transition-all duration-700 ease-out"
            style={{ width: `${medianWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}
