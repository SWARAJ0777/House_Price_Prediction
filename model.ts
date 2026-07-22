export interface LocationOption {
  value: string;
  label: string;
  ratePerSqft: number;
}

export interface PropertyTypeOption {
  value: string;
  label: string;
  multiplier: number;
}

export interface ConditionOption {
  value: string;
  label: string;
  adjustment: number;
}

export interface PredictionInput {
  location: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  propertyType: string;
  yearBuilt: number;
  condition: string;
}

export interface Factor {
  label: string;
  contribution: number;
}

export interface PredictionResult {
  price: number;
  low: number;
  high: number;
  pricePerSqft: number;
  confidence: number;
  factors: Factor[];
  median: number;
  diffPercent: number;
  locationLabel: string;
  locationRate: number;
}

export const USD_TO_INR = 84;

export const LOCATIONS: LocationOption[] = [
  { value: "downtown-metro", label: "Downtown Metro", ratePerSqft: 620 },
  { value: "uptown", label: "Uptown", ratePerSqft: 480 },
  { value: "riverside", label: "Riverside", ratePerSqft: 350 },
  { value: "midtown", label: "Midtown", ratePerSqft: 280 },
  { value: "green-valley", label: "Green Valley", ratePerSqft: 190 },
  { value: "sunset-heights", label: "Sunset Heights", ratePerSqft: 160 },
];

export const PROPERTY_TYPES: PropertyTypeOption[] = [
  { value: "apartment", label: "Apartment", multiplier: 0.95 },
  { value: "house", label: "House", multiplier: 1.0 },
  { value: "condo", label: "Condo", multiplier: 1.05 },
  { value: "townhouse", label: "Townhouse", multiplier: 1.1 },
  { value: "villa", label: "Villa", multiplier: 1.22 },
];

export const CONDITIONS: ConditionOption[] = [
  { value: "new", label: "New", adjustment: 45000 },
  { value: "renovated", label: "Renovated", adjustment: 22000 },
  { value: "average", label: "Average", adjustment: 0 },
  { value: "fixer", label: "Fixer-upper", adjustment: -35000 },
];

const BEDROOM_VALUE = 25000;
const BATHROOM_VALUE = 18000;
const PARKING_VALUE = 12000;
const NEW_PREMIUM = 25000;
const YEARLY_DEPRECIATION = 800;
const OLD_AGE_THRESHOLD = 50;
const OLD_AGE_EXTRA_DEPRECIATION = 500;
const MIN_PRICE = 50000;

export function getLocalMedian(location: LocationOption): number {
  const currentYear = new Date().getFullYear();
  const area = 1500;
  const bedrooms = 3;
  const bathrooms = 2;
  const parking = 1;
  const conditionAdjustment = 0;
  const typeMultiplier = 1; // House baseline
  const age = Math.max(0, currentYear - 2015);
  const ageAdjustment = Math.min(
    0,
    -Math.min(age, OLD_AGE_THRESHOLD) * YEARLY_DEPRECIATION -
      Math.max(0, age - OLD_AGE_THRESHOLD) * OLD_AGE_EXTRA_DEPRECIATION,
  );
  const base = area * location.ratePerSqft;
  return (
    base * typeMultiplier +
    bedrooms * BEDROOM_VALUE +
    bathrooms * BATHROOM_VALUE +
    parking * PARKING_VALUE +
    conditionAdjustment +
    ageAdjustment
  );
}

export function predictPrice(input: PredictionInput): PredictionResult {
  const location = LOCATIONS.find((l) => l.value === input.location);
  const propertyType = PROPERTY_TYPES.find((t) => t.value === input.propertyType);
  const condition = CONDITIONS.find((c) => c.value === input.condition);

  if (!location || !propertyType || !condition) {
    throw new Error("Invalid input options");
  }

  const currentYear = new Date().getFullYear();
  const age = Math.max(0, currentYear - input.yearBuilt);

  let ageAdjustment = 0;
  if (age <= 2) {
    ageAdjustment = NEW_PREMIUM;
  } else {
    const cappedAge = Math.min(age, OLD_AGE_THRESHOLD);
    const extraAge = Math.max(0, age - OLD_AGE_THRESHOLD);
    ageAdjustment = -cappedAge * YEARLY_DEPRECIATION - extraAge * OLD_AGE_EXTRA_DEPRECIATION;
  }

  const base = input.area * location.ratePerSqft;
  const typeAdjustment = base * (propertyType.multiplier - 1);
  const bedroomAdjustment = input.bedrooms * BEDROOM_VALUE;
  const bathroomAdjustment = input.bathrooms * BATHROOM_VALUE;
  const parkingAdjustment = input.parking * PARKING_VALUE;

  const price = Math.max(
    MIN_PRICE,
    base +
      typeAdjustment +
      bedroomAdjustment +
      bathroomAdjustment +
      parkingAdjustment +
      condition.adjustment +
      ageAdjustment,
  );

  const factors: Factor[] = [
    { label: `Location & area (${location.label})`, contribution: base },
    { label: `Property type (${propertyType.label})`, contribution: typeAdjustment },
    { label: "Bedrooms", contribution: bedroomAdjustment },
    { label: "Bathrooms", contribution: bathroomAdjustment },
    { label: "Parking", contribution: parkingAdjustment },
    { label: `Condition (${condition.label})`, contribution: condition.adjustment },
    { label: "Year built", contribution: ageAdjustment },
  ].filter((f) => f.contribution !== 0);

  factors.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  let confidence = 96;
  if (age > OLD_AGE_THRESHOLD) confidence -= 4;
  if (condition.value === "fixer") confidence -= 3;
  if (input.area < 400) confidence -= 2;
  confidence = Math.max(88, Math.min(98, confidence));

  const margin = (100 - confidence) / 100 + 0.05;
  const low = Math.max(MIN_PRICE, price * (1 - margin));
  const high = price * (1 + margin);

  const median = getLocalMedian(location);
  const diffPercent = ((price - median) / median) * 100;

  return {
    price,
    low,
    high,
    pricePerSqft: price / input.area,
    confidence,
    factors,
    median,
    diffPercent,
    locationLabel: location.label,
    locationRate: location.ratePerSqft,
  };
}

export function formatCurrency(value: number, currency: "USD" | "INR" = "USD"): string {
  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value * USD_TO_INR);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactCurrency(value: number, currency: "USD" | "INR" = "USD"): string {
  if (currency === "INR") {
    return formatINRCompact(value);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value * USD_TO_INR);
}

export function formatINRCompact(value: number): string {
  const inr = value * USD_TO_INR;
  const crore = 1_00_00_000;
  const lakh = 1_00_000;

  if (inr >= crore) {
    return `₹${(inr / crore).toFixed(2)} Cr`;
  }
  if (inr >= lakh) {
    return `₹${(inr / lakh).toFixed(2)} L`;
  }
  return `₹${Math.round(inr).toLocaleString("en-IN")}`;
}
