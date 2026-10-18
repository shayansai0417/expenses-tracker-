import type { Transaction } from '@/types';
import { uuid } from './storage';

export function seedTransactions(): Transaction[] {
  const today = new Date();
  const iso = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offsetDays);
    const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return tz.toISOString().slice(0, 10);
  };

  return [
    {
      id: uuid(),
      title: 'Monthly Salary',
      amount: 4200,
      type: 'income',
      category: 'salary',
      date: iso(2),
      description: 'October payroll deposit',
    },
    {
      id: uuid(),
      title: 'Apartment Rent',
      amount: 1450,
      type: 'expense',
      category: 'housing',
      date: iso(1),
      description: 'Monthly rent payment',
    },
    {
      id: uuid(),
      title: 'Grocery Shopping',
      amount: 186.4,
      type: 'expense',
      category: 'food',
      date: iso(1),
      description: 'Weekly groceries from Whole Foods',
    },
    {
      id: uuid(),
      title: 'Electric & Water Bill',
      amount: 142.75,
      type: 'expense',
      category: 'utilities',
      date: iso(3),
      description: 'Combined utilities for the month',
    },
    {
      id: uuid(),
      title: 'Movie Night',
      amount: 38.5,
      type: 'expense',
      category: 'entertainment',
      date: iso(4),
      description: 'Cinema tickets and snacks',
    },
    {
      id: uuid(),
      title: 'Freelance Project',
      amount: 650,
      type: 'income',
      category: 'freelance',
      date: iso(5),
      description: 'Logo design for client',
    },
  ];
}
