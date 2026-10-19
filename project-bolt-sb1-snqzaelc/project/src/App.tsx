import { useState } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import MetricCards from '@/components/MetricCards';
import ExpenseBreakdown from '@/components/ExpenseBreakdown';
import MonthlyTrends from '@/components/MonthlyTrends';
import TransactionList from '@/components/TransactionList';
import TransactionForm from '@/components/TransactionForm';
import Login from '@/components/Login';
import Logo from '@/components/Logo';

function App() {
  const { transactions, metrics, addTransaction, addTransactions, deleteTransaction } = useTransactions();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-[100dvh] bg-transparent text-[#F5E6B3]">
      <header className="sticky top-0 z-30 border-b border-[rgba(212,175,55,0.35)] bg-[#0A0A0A]/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Logo size={40} className="shrink-0" />
            <div>
              <h1 className="text-lg font-semibold tracking-tight">KARCH</h1>
              <p className="text-xs text-[#BFA765]">Personal expense tracker</p>
            </div>
          </div>
          <button
            onClick={() => setFormOpen(true)}
            aria-label="Add transaction"
            title="Add transaction"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#F2D675] via-[#D4AF37] to-[#A67C00] text-sm font-semibold text-[#0A0A0A] shadow-lg shadow-black/30 transition hover:brightness-110 active:scale-[0.98] sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2.5"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Transaction</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Receipt size={18} className="text-[#D4AF37]" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#BFA765]">
              Overview
            </h2>
          </div>
          <MetricCards
            balance={metrics.balance}
            income={metrics.income}
            expenses={metrics.expenses}
          />
        </section>

        <section>
          <MonthlyTrends transactions={transactions} />
        </section>

        <section>
          <ExpenseBreakdown transactions={transactions} />
        </section>

        <section>
          <TransactionList transactions={transactions} onDelete={deleteTransaction} />
        </section>

        <footer className="pt-4 text-center text-xs text-[#BFA765]">
          Data is saved locally in your browser.
        </footer>
      </main>

      <TransactionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={addTransaction}
        onImportSuccess={addTransactions}
      />
    </div>
  );
}

export default App;
