import { Activity } from "lucide-react";

type BrandMarkProps = {
  name: string;
  tagline?: string;
};

export function BrandMark({ name, tagline }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
        <Activity className="h-5 w-5" />
      </div>
      <div>
        <p className="text-base font-semibold leading-5 text-[#111827]">{name}</p>
        {tagline ? (
          <p className="mt-0.5 text-xs font-medium text-slate-500">{tagline}</p>
        ) : null}
      </div>
    </div>
  );
}
