export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // YYYY-MM-DD
  description?: string;
}

export interface Category {
  id: string;
  label: string;
  color: string; // hex for chart
  icon: string; // lucide icon name
}
