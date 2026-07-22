import { useState } from "react";
import {
  formatCurrency,
  type PredictionInput,
  type PredictionResult,
} from "@/lib/model";
import { Card } from "@/components/ui/Card";
import { FeatureBarChart } from "@/components/FeatureBarChart";
import { ConfidenceRing } from "@/components/ConfidenceRing";
import { PriceRangeGauge } from "@/components/PriceRangeGauge";
import { ComparisonBars } from "@/components/ComparisonBars";
import { BreakdownDonut } from "@/components/BreakdownDonut";
import { cn } from "@/utils/cn";
import {
  Bed,
  Calendar,
  Car,
  Home,
  MapPin,
  Ruler,
  ShowerHead,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { ReactNode } from "react";

interface ResultCardProps {
  result: PredictionResult;
  input: PredictionInput;
}

function formatPercent(value: number): string {
  const abs = Math.abs(value);
  return `${abs.toFixed(1)}%`;
}

export function ResultCard({ result, input }: ResultCardProps) {
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");
  const otherCurrency = currency === "USD" ? "INR" : "USD";
  const isAboveMedian = result.diffPercent >= 0;

  return (
    <Card className="relative overflow-hidden border-emerald-100/80 bg-gradient-to-b from-emerald-50/60 to-white">
      <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-emerald-100/40 blur-3xl" />

      <div className="relative space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-200">
              <Home className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-900">Estimated market value</p>
              <p className="text-xs text-emerald-700/80">{result.locationLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CurrencyToggle currency={currency} onChange={setCurrency} />
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                result.confidence >= 92
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800",
              )}
            >
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              {result.confidence}% confidence
            </span>
          </div>
        </div>

        {/* Primary price */}
        <div className="text-center">
          <p className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            {formatCurrency(result.price, currency)}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-500">
            ≈ {formatCurrency(result.price, otherCurrency)}
          </p>
        </div>

        {/* Price range gauge */}
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Estimated price range
          </h3>
          <PriceRangeGauge low={result.low} price={result.price} high={result.high} currency={currency} />
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox label="Price / sq ft" value={formatCurrency(result.pricePerSqft, currency)} />
          <StatBox label="Local median" value={formatCurrency(result.median, currency)} />
          <StatBox
            label="vs. median"
            value={
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  isAboveMedian ? "text-emerald-700" : "text-rose-600",
                )}
              >
                {isAboveMedian ? (
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {formatPercent(result.diffPercent)}
              </span>
            }
          />
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-white p-3 text-center shadow-sm">
            <ConfidenceRing value={result.confidence} size={64} strokeWidth={6} />
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Confidence</p>
          </div>
        </div>

        {/* Market comparison */}
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Predicted vs. local median</h3>
          <ComparisonBars predicted={result.price} median={result.median} currency={currency} />
        </div>

        {/* Visualizations */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Cost breakdown</h3>
            <BreakdownDonut factors={result.factors} currency={currency} />
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Key price drivers</h3>
            <FeatureBarChart factors={result.factors} currency={currency} />
          </div>
        </div>

        {/* Property summary */}
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Property summary
          </h3>
          <div className="flex flex-wrap gap-2">
            <SummaryBadge icon={<MapPin className="h-3.5 w-3.5" />} label={result.locationLabel} />
            <SummaryBadge icon={<Ruler className="h-3.5 w-3.5" />} label={`${input.area.toLocaleString()} sq ft`} />
            <SummaryBadge icon={<Bed className="h-3.5 w-3.5" />} label={`${input.bedrooms} bed`} />
            <SummaryBadge icon={<ShowerHead className="h-3.5 w-3.5" />} label={`${input.bathrooms} bath`} />
            <SummaryBadge icon={<Car className="h-3.5 w-3.5" />} label={`${input.parking} parking`} />
            <SummaryBadge icon={<Calendar className="h-3.5 w-3.5" />} label={`Built ${input.yearBuilt}`} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function CurrencyToggle({
  currency,
  onChange,
}: {
  currency: "USD" | "INR";
  onChange: (c: "USD" | "INR") => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
      {(["USD", "INR"] as const).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
            currency === c
              ? "bg-emerald-600 text-white"
              : "text-slate-600 hover:bg-slate-50",
          )}
          aria-pressed={currency === c}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col justify-center rounded-xl border border-slate-100 bg-white p-3 text-center shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-base font-bold text-slate-900">{value}</p>
    </div>
  );
}

function SummaryBadge({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700">
      <span className="text-emerald-600">{icon}</span>
      {label}
    </span>
  );
}
