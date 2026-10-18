import type { Category } from '@/types';

export const UNCATEGORIZED_CATEGORY: Category = {
  id: 'uncategorized',
  label: 'Uncategorized',
  color: '#E7D7A0',
  icon: 'HelpCircle', // Distinct styled neutral icon (question-mark circle)
};

export const MISC_CATEGORY: Category = {
  id: 'miscellaneous',
  label: 'Miscellaneous',
  color: '#BFA765',
  icon: 'Tag', // Styled neutral tag icon
};

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', label: 'Food & Dining', color: '#F2D675', icon: 'UtensilsCrossed' },
  { id: 'housing', label: 'Housing & Rent', color: '#D4AF37', icon: 'Home' },
  { id: 'utilities', label: 'Utilities', color: '#C98B2C', icon: 'PlugZap' },
  { id: 'entertainment', label: 'Entertainment', color: '#F5E6B3', icon: 'Clapperboard' },
  { id: 'transportation', label: 'Transportation', color: '#A67C00', icon: 'Car' },
  { id: 'medical', label: 'Medical & Health', color: '#D9822B', icon: 'HeartPulse' },
  { id: 'miscellaneous', label: 'Miscellaneous', color: '#BFA765', icon: 'Tag' },
  { id: 'uncategorized', label: 'Uncategorized', color: '#E7D7A0', icon: 'HelpCircle' },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'salary', label: 'Salary', color: '#059669', icon: 'Banknote' },
  { id: 'freelance', label: 'Freelance', color: '#22c55e', icon: 'Laptop' },
  { id: 'investment', label: 'Investment', color: '#65a30d', icon: 'TrendingUp' },
  { id: 'gift', label: 'Gift', color: '#D4AF37', icon: 'Gift' },
  { id: 'miscellaneous', label: 'Miscellaneous', color: '#BFA765', icon: 'Tag' },
  { id: 'uncategorized', label: 'Uncategorized', color: '#E7D7A0', icon: 'HelpCircle' },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export function getCategory(idOrName?: string): Category {
  if (!idOrName || typeof idOrName !== 'string') {
    return UNCATEGORIZED_CATEGORY;
  }

  const query = idOrName.trim().toLowerCase();

  // 1. Direct match on ID
  const directById = ALL_CATEGORIES.find((c) => c.id.toLowerCase() === query);
  if (directById) return directById;

  // 2. Direct match on Label
  const directByLabel = ALL_CATEGORIES.find((c) => c.label.toLowerCase() === query);
  if (directByLabel) return directByLabel;

  // 3. Synonym / Keyword based matching for backend categories
  if (query.includes('food') || query.includes('dining')) {
    return EXPENSE_CATEGORIES.find((c) => c.id === 'food')!;
  }
  if (query.includes('rent') || query.includes('housing') || query.includes('mortgage')) {
    return EXPENSE_CATEGORIES.find((c) => c.id === 'housing')!;
  }
  if (query.includes('utilit') || query.includes('power') || query.includes('electric') || query.includes('comcast')) {
    return EXPENSE_CATEGORIES.find((c) => c.id === 'utilities')!;
  }
  if (query.includes('entertain') || query.includes('movie') || query.includes('theatre') || query.includes('netflix')) {
    return EXPENSE_CATEGORIES.find((c) => c.id === 'entertainment')!;
  }
  if (query.includes('transport') || query.includes('uber') || query.includes('ride') || query.includes('gas')) {
    return EXPENSE_CATEGORIES.find((c) => c.id === 'transportation')!;
  }
  if (query.includes('medical') || query.includes('health') || query.includes('pharmacy') || query.includes('cvs')) {
    return EXPENSE_CATEGORIES.find((c) => c.id === 'medical')!;
  }
  if (query.includes('salary') || query.includes('payroll') || query.includes('wage')) {
    return INCOME_CATEGORIES.find((c) => c.id === 'salary')!;
  }
  if (query.includes('freelance') || query.includes('upwork') || query.includes('consulting')) {
    return INCOME_CATEGORIES.find((c) => c.id === 'freelance')!;
  }
  if (query.includes('invest') || query.includes('dividend') || query.includes('stock')) {
    return INCOME_CATEGORIES.find((c) => c.id === 'investment')!;
  }
  if (query.includes('misc') || query.includes('other')) {
    return MISC_CATEGORY;
  }

  // 4. Fallback: Any unrecognized category string safely resolves to Uncategorized with neutral styling
  return UNCATEGORIZED_CATEGORY;
}

export function categoriesForType(type: 'income' | 'expense'): Category[] {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}
