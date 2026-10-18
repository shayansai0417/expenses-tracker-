import { Wallet, ArrowDownCircle, ArrowUpCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface Props {
  balance: number;
  income: number;
  expenses: number;
}

export default function MetricCards({ balance, income, expenses }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-[rgba(212,175,55,0.35)] bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] p-5 text-[#F5E6B3] shadow-xl shadow-black/30 sm:p-6">
        <div className="relative">
          <div className="flex items-center gap-2 text-[#BFA765]">
            <Wallet size={18} />
            <span className="text-sm font-medium">Total Balance</span>
          </div>
          <p className="mt-3 text-[clamp(1.4rem,5vw,2.5rem)] font-semibold leading-tight tracking-tight tabular-nums">
            {formatCurrency(balance)}
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-[#BFA765]">
            {balance >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{balance >= 0 ? 'Healthy cash flow' : 'Spending exceeds income'}</span>
          </div>
        </div>
      </div>

      <MetricCard
        label="Total Income"
        value={income}
        icon={<ArrowDownCircle size={18} className="text-emerald-600" />}
        accent="emerald"
      />
      <MetricCard
        label="Total Expenses"
        value={expenses}
        icon={<ArrowUpCircle size={18} className="text-rose-600" />}
        accent="rose"
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: 'emerald' | 'rose';
}) {
  const accentText = accent === 'emerald' ? 'text-emerald-400' : 'text-rose-400';
  const iconBg =
    accent === 'emerald'
      ? 'bg-emerald-950/70 text-emerald-300'
      : 'bg-rose-950/70 text-rose-300';
  return (
    <div className="rounded-2xl border border-[rgba(212,175,55,0.35)] bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] p-5 text-[#F5E6B3] shadow-xl shadow-black/30 sm:p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#BFA765]">{label}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
          {icon}
        </div>
      </div>
      <p className={`mt-3 text-[clamp(1.4rem,5vw,2.5rem)] font-semibold leading-tight tracking-tight tabular-nums ${accentText}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}
