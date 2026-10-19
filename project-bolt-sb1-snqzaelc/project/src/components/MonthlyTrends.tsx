import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Transaction } from '@/types';

interface Props {
  transactions: Transaction[];
}

interface MonthlyTotal {
  month: string;
  income: number;
  expenses: number;
}

const MOBILE_BREAKPOINT = '(max-width: 639px)';

function formatAxisAmount(value: number): string {
  if (value >= 1_000_000) {
    return `$${Number((value / 1_000_000).toFixed(1))}m`;
  }
  if (value >= 1_000) {
    return `$${Number((value / 1_000).toFixed(1))}k`;
  }
  return `$${Math.round(value)}`;
}

export default function MonthlyTrends({ transactions }: Props) {
  const [isMobile, setIsMobile] = useState(() =>
    window.matchMedia(MOBILE_BREAKPOINT).matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT);
    const updateIsMobile = () => setIsMobile(mediaQuery.matches);
    updateIsMobile();
    mediaQuery.addEventListener('change', updateIsMobile);
    return () => mediaQuery.removeEventListener('change', updateIsMobile);
  }, []);

  const monthlyTotals = useMemo<MonthlyTotal[]>(() => {
    const now = new Date();
    const visibleMonthCount = isMobile ? 4 : 6;
    const months = Array.from({ length: visibleMonthCount }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - visibleMonthCount + index + 1, 1);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return {
        month,
        label: date.toLocaleString('en-US', { month: 'short' }),
        income: 0,
        expenses: 0,
      };
    });
    const monthTotals = new Map(months.map((month) => [month.month, month]));

    for (const transaction of transactions) {
      const month = monthTotals.get(transaction.date.slice(0, 7));
      if (!month) continue;
      if (transaction.type === 'income') month.income += transaction.amount;
      else month.expenses += transaction.amount;
    }

    return months.map(({ label, income, expenses }) => ({
      month: label,
      income,
      expenses,
    }));
  }, [isMobile, transactions]);

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-[rgba(212,175,55,0.35)] bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] p-4 text-[#F5E6B3] shadow-xl shadow-black/30 sm:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[#F5E6B3]">Monthly Trends</h2>
        <p className="text-sm text-[#BFA765]">Income and expenses over time</p>
      </div>

      <div className="min-w-0">
        <ResponsiveContainer width="100%" height={isMobile ? 260 : 320}>
          <BarChart
            data={monthlyTotals}
            margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
            barCategoryGap={isMobile ? '18%' : '25%'}
            barGap={4}
          >
            <CartesianGrid stroke="#4A3B17" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: '#BFA765', fontSize: isMobile ? 11 : 12 }}
              tickLine={false}
              axisLine={{ stroke: '#4A3B17' }}
              interval={0}
            />
            <YAxis
              width={isMobile ? 38 : 54}
              tickFormatter={formatAxisAmount}
              tick={{ fill: '#BFA765', fontSize: isMobile ? 11 : 12 }}
              tickLine={false}
              axisLine={false}
              tickCount={5}
            />
            <Tooltip
              trigger={isMobile ? 'click' : 'hover'}
              cursor={{ fill: 'rgba(212, 175, 55, 0.08)' }}
              formatter={(value) => formatAxisAmount(Number(value))}
              contentStyle={{
                maxWidth: 'calc(100vw - 32px)',
                border: '1px solid rgba(212, 175, 55, 0.45)',
                borderRadius: '10px',
                backgroundColor: '#11100d',
                padding: '8px 10px',
                fontSize: '12px',
                whiteSpace: 'normal',
              }}
              labelStyle={{ color: '#F5E6B3', marginBottom: '4px' }}
              itemStyle={{ color: '#BFA765', padding: 0 }}
            />
            <Legend
              align="center"
              verticalAlign="bottom"
              wrapperStyle={{ fontSize: isMobile ? '11px' : '12px', paddingTop: '4px' }}
            />
            <Bar
              dataKey="income"
              name="Income"
              fill="#D4AF37"
              radius={[4, 4, 0, 0]}
              maxBarSize={isMobile ? 18 : 28}
            />
            <Bar
              dataKey="expenses"
              name="Expenses"
              fill="#A67C00"
              radius={[4, 4, 0, 0]}
              maxBarSize={isMobile ? 18 : 28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
