import { useMemo } from 'react';
import type { Transaction } from '@/types';
import { getCategory } from '@/lib/categories';
import { formatCurrency } from '@/lib/format';

interface Props {
  transactions: Transaction[];
}

interface Slice {
  id: string;
  label: string;
  color: string;
  amount: number;
  pct: number;
}

export default function ExpenseBreakdown({ transactions }: Props) {
  const slices = useMemo<Slice[]>(() => {
    const totals = new Map<string, number>();
    let totalExpenses = 0;

    for (const t of transactions) {
      if (t.type !== 'expense') continue;
      // Resolve any category string safely via getCategory with fallback
      const cat = getCategory(t.category);
      totals.set(cat.id, (totals.get(cat.id) ?? 0) + t.amount);
      totalExpenses += t.amount;
    }

    const result: Slice[] = [];
    totals.forEach((amount, catId) => {
      if (amount <= 0) return;
      const cat = getCategory(catId);
      result.push({
        id: cat.id,
        label: cat.label,
        color: cat.color,
        amount,
        pct: totalExpenses > 0 ? amount / totalExpenses : 0,
      });
    });

    return result.sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const total = slices.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="rounded-2xl border border-[rgba(212,175,55,0.35)] bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] p-4 text-[#F5E6B3] shadow-xl shadow-black/30 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#F5E6B3]">Expense Breakdown</h2>
          <p className="text-sm text-[#BFA765]">Spending by category</p>
        </div>
      </div>

      {slices.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-[#BFA765]">
          No expenses recorded yet.
        </div>
      ) : (
        <div className="mt-6 flex min-w-0 flex-col items-stretch gap-6 lg:flex-row lg:items-center lg:gap-8">
          <DonutChart slices={slices} total={total} />
          <div className="w-full flex-1 space-y-3">
            {slices.map((s) => (
              <div key={s.id}>
                <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-2 text-xs sm:text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="break-words font-medium text-[#F5E6B3]">{s.label}</span>
                  </div>
                  <span className="whitespace-nowrap text-right text-[#BFA765]">{formatCurrency(s.amount)}</span>
                  <span className="w-10 whitespace-nowrap text-right font-medium text-[#F5E6B3] sm:w-12">
                    {(s.pct * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#3B3018]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${s.pct * 100}%`, backgroundColor: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DonutChart({ slices, total }: { slices: Slice[]; total: number }) {
  const size = 200;
  const stroke = 28;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative mx-auto w-full max-w-[200px] shrink-0" style={{ aspectRatio: '1 / 1' }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius - stroke / 2}
          fill="#0D0D0D"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#4A3B17"
          strokeWidth={stroke}
        />
        {slices.map((s) => {
          const dash = s.pct * circumference;
          const seg = (
            <circle
              key={s.id}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              className="transition-all duration-500"
            />
          );
          offset += dash;
          return seg;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-medium uppercase tracking-wide text-[#BFA765]">
          Total
        </span>
        <span className="mt-0.5 text-xl font-semibold text-[#F5E6B3]">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}
