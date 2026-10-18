import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Transaction } from '@/types';
import { loadTransactions, saveTransactions, uuid } from '@/lib/storage';
import { seedTransactions } from '@/lib/seed';

export interface NewTransactionInput {
  title: string;
  amount: number;
  type: Transaction['type'];
  category: string;
  date: string;
  description?: string;
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const stored = loadTransactions();
    setTransactions(stored ?? seedTransactions());
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      saveTransactions(transactions);
    }
  }, [transactions]);

  const addTransaction = useCallback((input: NewTransactionInput) => {
    const tx: Transaction = {
      id: uuid(),
      title: input.title.trim(),
      amount: input.amount,
      type: input.type,
      category: input.category,
      date: input.date,
      description: input.description?.trim() || undefined,
    };
    setTransactions((prev) => [tx, ...prev]);
    return tx;
  }, []);

  const addTransactions = useCallback((inputs: (NewTransactionInput | Transaction)[]) => {
    const newItems: Transaction[] = inputs.map((input) => {
      if ('id' in input && input.id) {
        return input as Transaction;
      }
      return {
        id: uuid(),
        title: input.title.trim(),
        amount: input.amount,
        type: input.type,
        category: input.category,
        date: input.date,
        description: input.description?.trim() || undefined,
      };
    });
    setTransactions((prev) => [...newItems, ...prev]);
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const metrics = useMemo(() => {
    let income = 0;
    let expenses = 0;
    for (const t of transactions) {
      if (t.type === 'income') income += t.amount;
      else expenses += t.amount;
    }
    return { income, expenses, balance: income - expenses };
  }, [transactions]);

  return { transactions, metrics, addTransaction, addTransactions, deleteTransaction };
}
