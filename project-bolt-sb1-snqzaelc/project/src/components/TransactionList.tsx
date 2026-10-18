import { useMemo, useState } from 'react';
import { Search, Trash2, ArrowUpRight, ArrowDownLeft, Inbox } from 'lucide-react';
import type { Transaction, TransactionType } from '@/types';
import { getCategory, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/categories';
import { formatCurrency, formatShortDate } from '@/lib/format';
import { getDynamicIcon } from './Icon';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

type TypeFilter = 'all' | TransactionType;

export default function TransactionList({ transactions, onDelete }: Props) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions
      .filter((t) => (typeFilter === 'all' ? true : t.type === typeFilter))
      .filter((t) => {
        if (categoryFilter === 'all') return true;
        const cat = getCategory(t.category);
        return cat.id === categoryFilter || t.category.toLowerCase() === categoryFilter.toLowerCase();
      })
      .filter((t) =>
        q
          ? t.title.toLowerCase().includes(q) ||
            (t.description?.toLowerCase().includes(q) ?? false)
          : true,
      )
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [transactions, search, typeFilter, categoryFilter]);

  const categoryOptions =
    typeFilter === 'expense'
      ? EXPENSE_CATEGORIES
      : typeFilter === 'income'
        ? INCOME_CATEGORIES
        : [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

  return (
    <div className="rounded-2xl border border-[rgba(212,175,55,0.35)] bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] text-[#F5E6B3] shadow-xl shadow-black/30">
      <div className="border-b border-[rgba(212,175,55,0.2)] p-4 pb-5 sm:p-6 sm:pb-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#F5E6B3]">Recent Transactions</h2>
              <p className="text-sm text-[#BFA765]">
                {filtered.length} of {transactions.length} shown
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#BFA765]"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or note..."
                className="input pl-9"
              />
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:gap-3">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as TypeFilter);
                  setCategoryFilter('all');
                }}
                className="input min-w-0 sm:min-w-[120px]"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input min-w-0 sm:min-w-[150px]"
              >
                <option value="all">All Categories</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="divide-y divide-[rgba(212,175,55,0.12)]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-[#BFA765]">
            <Inbox size={36} className="opacity-50" />
            <p className="text-sm">No transactions match your filters.</p>
          </div>
        ) : (
          filtered.map((t) => {
            const cat = getCategory(t.category);
            const Icon = getDynamicIcon(cat.icon);
            const isIncome = t.type === 'income';
            return (
              <div
                key={t.id}
                className="group flex items-center gap-2 px-3 py-4 transition hover:bg-[#D4AF37]/10 sm:gap-4 sm:px-6"
              >
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: (cat.color ?? '#BFA765') + '1a',
                    color: cat.color ?? '#BFA765',
                  }}
                >
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-[#F5E6B3]">{t.title}</p>
                    <span
                      className={`hidden flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium sm:inline-flex ${
                        isIncome
                          ? 'bg-emerald-950 text-emerald-300'
                          : 'bg-rose-950 text-rose-300'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft size={11} />
                      ) : (
                        <ArrowUpRight size={11} />
                      )}
                      {isIncome ? 'Income' : 'Expense'}
                    </span>
                  </div>
                  <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 text-xs text-[#BFA765]">
                    <span>{cat.label}</span>
                    <span className="text-[#806C36]">•</span>
                    <span>{formatShortDate(t.date)}</span>
                    {t.description && (
                      <>
                        <span className="text-[#806C36]">•</span>
                        <span className="truncate">{t.description}</span>
                      </>
                    )}
                  </div>
                </div>
                <div
                  className={`flex-shrink-0 text-right text-sm font-semibold tabular-nums sm:text-base ${
                    isIncome ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isIncome ? '+' : '−'}
                  {formatCurrency(t.amount).replace('-', '')}
                </div>
                <button
                  onClick={() => onDelete(t.id)}
                  className="flex-shrink-0 rounded-lg p-2 text-[#BFA765] opacity-0 transition hover:bg-rose-950 hover:text-rose-300 group-hover:opacity-100 focus:opacity-100"
                  aria-label="Delete transaction"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
