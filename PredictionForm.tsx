import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import {
  CONDITIONS,
  LOCATIONS,
  PROPERTY_TYPES,
  type PredictionInput,
} from "@/lib/model";
import { Calculator } from "lucide-react";

interface PredictionFormProps {
  onPredict: (input: PredictionInput) => void;
  initialValues?: PredictionInput;
}

const emptyInput: PredictionInput = {
  location: "",
  area: "",
  bedrooms: "",
  bathrooms: "",
  parking: "",
  propertyType: "",
  yearBuilt: "",
  condition: "",
} as unknown as PredictionInput;

interface FormErrors {
  location?: string;
  area?: string;
  bedrooms?: string;
  bathrooms?: string;
  parking?: string;
  propertyType?: string;
  yearBuilt?: string;
  condition?: string;
}

export function PredictionForm({ onPredict, initialValues }: PredictionFormProps) {
  const [values, setValues] = useState<PredictionInput>(initialValues || emptyInput);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const currentYear = new Date().getFullYear();

  const handleChange = (field: keyof PredictionInput, value: string | number) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!values.location) next.location = "Please select a location";
    if (!values.propertyType) next.propertyType = "Please select a property type";
    if (!values.condition) next.condition = "Please select a condition";

    const area = Number(values.area);
    if (!values.area || Number.isNaN(area) || area < 100 || area > 50000) {
      next.area = "Enter a living area between 100 and 50,000 sq ft";
    }

    const bedrooms = Number(values.bedrooms);
    if (
      !values.bedrooms ||
      Number.isNaN(bedrooms) ||
      bedrooms < 0 ||
      bedrooms > 20 ||
      !Number.isInteger(bedrooms)
    ) {
      next.bedrooms = "Enter whole bedrooms between 0 and 20";
    }

    const bathrooms = Number(values.bathrooms);
    if (
      !values.bathrooms ||
      Number.isNaN(bathrooms) ||
      bathrooms < 0.5 ||
      bathrooms > 20
    ) {
      next.bathrooms = "Enter bathrooms between 0.5 and 20";
    }

    const parking = Number(values.parking);
    if (
      !values.parking ||
      Number.isNaN(parking) ||
      parking < 0 ||
      parking > 20 ||
      !Number.isInteger(parking)
    ) {
      next.parking = "Enter whole parking spots between 0 and 20";
    }

    const yearBuilt = Number(values.yearBuilt);
    if (
      !values.yearBuilt ||
      Number.isNaN(yearBuilt) ||
      yearBuilt < 1800 ||
      yearBuilt > currentYear + 1
    ) {
      next.yearBuilt = `Enter a year between 1800 and ${currentYear + 1}`;
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    window.setTimeout(() => {
      onPredict({
        location: values.location,
        area: Number(values.area),
        bedrooms: Number(values.bedrooms),
        bathrooms: Number(values.bathrooms),
        parking: Number(values.parking),
        propertyType: values.propertyType,
        yearBuilt: Number(values.yearBuilt),
        condition: values.condition,
      });
      setIsLoading(false);
    }, 900);
  };

  return (
    <Card className="h-full">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-200">
          <Calculator className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Property details</h2>
          <p className="text-sm text-slate-500">Enter the features used by the valuation model.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            label="Location"
            htmlFor="location"
            error={errors.location}
            required
            className="sm:col-span-2"
          >
            <Select
              id="location"
              value={values.location}
              onChange={(e) => handleChange("location", e.target.value)}
              options={LOCATIONS.map((l) => ({ value: l.value, label: l.label }))}
              placeholder="Select a neighborhood"
              aria-invalid={!!errors.location}
            />
          </Field>

          <Field label="Property type" htmlFor="propertyType" error={errors.propertyType} required>
            <Select
              id="propertyType"
              value={values.propertyType}
              onChange={(e) => handleChange("propertyType", e.target.value)}
              options={PROPERTY_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              placeholder="Select type"
              aria-invalid={!!errors.propertyType}
            />
          </Field>

          <Field label="Condition" htmlFor="condition" error={errors.condition} required>
            <Select
              id="condition"
              value={values.condition}
              onChange={(e) => handleChange("condition", e.target.value)}
              options={CONDITIONS.map((c) => ({ value: c.value, label: c.label }))}
              placeholder="Select condition"
              aria-invalid={!!errors.condition}
            />
          </Field>

          <Field label="Living area (sq ft)" htmlFor="area" error={errors.area} required>
            <Input
              id="area"
              type="number"
              min={100}
              max={50000}
              value={values.area}
              onChange={(e) => handleChange("area", e.target.value)}
              placeholder="e.g. 1,600"
              aria-invalid={!!errors.area}
            />
          </Field>

          <Field label="Year built" htmlFor="yearBuilt" error={errors.yearBuilt} required>
            <Input
              id="yearBuilt"
              type="number"
              min={1800}
              max={currentYear + 1}
              value={values.yearBuilt}
              onChange={(e) => handleChange("yearBuilt", e.target.value)}
              placeholder="e.g. 2015"
              aria-invalid={!!errors.yearBuilt}
            />
          </Field>

          <Field label="Bedrooms" htmlFor="bedrooms" error={errors.bedrooms} required>
            <Input
              id="bedrooms"
              type="number"
              min={0}
              max={20}
              step={1}
              value={values.bedrooms}
              onChange={(e) => handleChange("bedrooms", e.target.value)}
              placeholder="e.g. 3"
              aria-invalid={!!errors.bedrooms}
            />
          </Field>

          <Field label="Bathrooms" htmlFor="bathrooms" error={errors.bathrooms} required>
            <Input
              id="bathrooms"
              type="number"
              min={0.5}
              max={20}
              step={0.5}
              value={values.bathrooms}
              onChange={(e) => handleChange("bathrooms", e.target.value)}
              placeholder="e.g. 2"
              aria-invalid={!!errors.bathrooms}
            />
          </Field>

          <Field label="Parking spots" htmlFor="parking" error={errors.parking} required>
            <Input
              id="parking"
              type="number"
              min={0}
              max={20}
              step={1}
              value={values.parking}
              onChange={(e) => handleChange("parking", e.target.value)}
              placeholder="e.g. 1"
              aria-invalid={!!errors.parking}
            />
          </Field>
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full">
          Generate price prediction
        </Button>
      </form>
    </Card>
  );
}

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

function Field({ label, htmlFor, error, required, children, className }: FieldProps) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </Label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs font-medium text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
