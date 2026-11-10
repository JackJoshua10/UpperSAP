type StatCardProps = {
  label: string;
  value: number;
  sub?: string;
};

export function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">
        {value} {sub && <span className="text-sm font-normal text-slate-500">{sub}</span>}
      </p>
    </div>
  );
}
