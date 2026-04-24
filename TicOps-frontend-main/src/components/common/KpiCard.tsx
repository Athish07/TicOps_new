interface KpiCardProps {
  label: string;
  value: string | number;
  helper?: string;
}

export default function KpiCard({ label, value, helper }: KpiCardProps) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="text-xs font-medium text-ey-gray-500 sm:text-sm">{label}</div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-ey-gray-900 sm:mt-3 sm:text-3xl">{value}</div>
      {helper ? <div className="mt-1.5 text-xs text-ey-gray-500 sm:mt-2 sm:text-sm">{helper}</div> : null}
    </div>
  );
}
