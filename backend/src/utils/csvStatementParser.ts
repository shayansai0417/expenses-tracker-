import { Readable } from 'stream';
import csv from 'csv-parser';
import {
  TransactionCategory,
  TransactionType,
  TRANSACTION_CATEGORIES
} from '../models/Transaction';

export interface ParsedStatementRecord {
  title: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: Date;
  description?: string;
}

/**
 * Intelligent keyword-based category mapper.
 * Matches transaction descriptions against common merchant keywords to auto-assign categories.
 * If no keywords match, safely defaults to 'Uncategorized' (or 'Misc') rather than throwing errors.
 */
export const mapDescriptionToCategory = (
  description: string,
  type: TransactionType,
  explicitCategory?: string
): TransactionCategory => {
  // If an explicit category is provided that matches our known categories, use it
  if (explicitCategory && typeof explicitCategory === 'string') {
    const raw = explicitCategory.trim().toLowerCase();
    const matched = TRANSACTION_CATEGORIES.find(
      (c) => c.toLowerCase() === raw
    );
    if (matched) return matched;
  }

  const desc = (description || '').toLowerCase();

  // If transaction is income, check income keywords first
  if (type === 'income') {
    if (desc.includes('salary') || desc.includes('payroll') || desc.includes('direct dep') || desc.includes('wage') || desc.includes('employer')) {
      return 'Salary';
    }
    if (desc.includes('freelance') || desc.includes('upwork') || desc.includes('fiverr') || desc.includes('consulting') || desc.includes('client') || desc.includes('invoice') || desc.includes('stripe')) {
      return 'Freelance';
    }
    if (desc.includes('dividend') || desc.includes('interest') || desc.includes('stock') || desc.includes('yield') || desc.includes('invest') || desc.includes('trading') || desc.includes('crypto')) {
      return 'Investments';
    }
    return 'Misc';
  }

  // 1. Food & Dining: 'Foods', 'Market', "Joe's", 'Pizza', 'McDonald', 'Coffee', 'Starbucks'
  const foodKeywords = [
    'foods',
    'market',
    "joe's",
    'joes',
    'pizza',
    'mcdonald',
    'coffee',
    'starbucks',
    'grocery',
    'supermarket',
    'restaurant',
    'cafe',
    'burger',
    'bakery',
    'diner',
    'doordash',
    'uber eats',
    'grubhub',
    'instacart'
  ];
  if (foodKeywords.some((kw) => desc.includes(kw))) {
    return 'Food & Dining';
  }

  // 2. Transportation: 'Uber', 'Ride', 'Gas', 'Shell'
  const transportKeywords = [
    'uber',
    'ride',
    'gas',
    'shell',
    'lyft',
    'chevron',
    'exxon',
    'bp ',
    'transit',
    'subway',
    'metro',
    'parking',
    'toll',
    'airline',
    'flight'
  ];
  if (transportKeywords.some((kw) => desc.includes(kw))) {
    return 'Transportation';
  }

  // 3. Entertainment: 'Netflix', 'Spotify', 'Movie', 'Theatre'
  const entertainmentKeywords = [
    'netflix',
    'spotify',
    'movie',
    'theatre',
    'theater',
    'cinema',
    'hulu',
    'disney',
    'hbo',
    'steam',
    'playstation',
    'xbox',
    'nintendo',
    'concert',
    'ticketmaster'
  ];
  if (entertainmentKeywords.some((kw) => desc.includes(kw))) {
    return 'Entertainment';
  }

  // 4. Medical & Health: 'Pharmacy', 'CVS', 'Medical'
  const medicalKeywords = [
    'pharmacy',
    'cvs',
    'medical',
    'walgreens',
    'doctor',
    'clinic',
    'hospital',
    'dental',
    'dentist',
    'health',
    'urgent care',
    'prescription',
    'rx'
  ];
  if (medicalKeywords.some((kw) => desc.includes(kw))) {
    return 'Medical & Health';
  }

  // 5. Utilities: 'Power', 'Utility', 'Electric', 'Comcast', 'Internet'
  const utilityKeywords = [
    'power',
    'utility',
    'electric',
    'comcast',
    'internet',
    'water',
    'gas & electric',
    'pge',
    'coned',
    'at&t',
    'verizon',
    'spectrum',
    'wifi'
  ];
  if (utilityKeywords.some((kw) => desc.includes(kw))) {
    return 'Utilities';
  }

  // 6. Housing & Rent
  const rentKeywords = ['rent', 'mortgage', 'lease', 'landlord', 'housing'];
  if (rentKeywords.some((kw) => desc.includes(kw))) {
    return 'Rent';
  }

  // Fallback: If no keyword matches, assign safely to 'Uncategorized' rather than crashing or throwing errors
  return 'Uncategorized';
};

const parseAmountString = (val: string): { amount: number; isNegative: boolean } | null => {
  if (!val || typeof val !== 'string') return null;

  const trimmed = val.trim();
  const isNegative = trimmed.startsWith('-') || (trimmed.startsWith('(') && trimmed.endsWith(')'));

  const cleanNumberStr = trimmed.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleanNumberStr);

  if (isNaN(parsed) || parsed <= 0) {
    return null;
  }

  return {
    amount: Number(parsed.toFixed(2)),
    isNegative
  };
};

export const parseBankCsv = (csvBuffer: Buffer): Promise<ParsedStatementRecord[]> => {
  return new Promise((resolve, reject) => {
    const results: ParsedStatementRecord[] = [];
    const stream = Readable.from(csvBuffer);

    stream
      .pipe(
        csv({
          mapHeaders: ({ header }) => header.trim().toLowerCase()
        })
      )
      .on('data', (row: Record<string, string>) => {
        try {
          const keys = Object.keys(row);

          // Find date field
          const dateKey = keys.find((k) =>
            ['date', 'transaction date', 'posting date', 'trans date', 'txn date', 'booking date'].includes(k)
          );

          // Find description / title field
          const descKey = keys.find((k) =>
            ['description', 'title', 'narration', 'details', 'memo', 'payee', 'name', 'particulars'].includes(k)
          );

          // Find single amount or separate debit/credit fields
          const amountKey = keys.find((k) =>
            ['amount', 'amt', 'value', 'total', 'transaction amount'].includes(k)
          );
          const debitKey = keys.find((k) => ['debit', 'withdrawal', 'out'].includes(k));
          const creditKey = keys.find((k) => ['credit', 'deposit', 'in'].includes(k));
          const categoryKey = keys.find((k) => ['category', 'type'].includes(k));

          let finalAmount = 0;
          let finalType: TransactionType = 'expense';

          if (amountKey && row[amountKey]) {
            const parsed = parseAmountString(row[amountKey]);
            if (parsed) {
              finalAmount = parsed.amount;
              finalType = parsed.isNegative ? 'expense' : 'income';
            }
          } else if (debitKey && row[debitKey] && row[debitKey].trim() !== '') {
            const parsed = parseAmountString(row[debitKey]);
            if (parsed) {
              finalAmount = parsed.amount;
              finalType = 'expense';
            }
          } else if (creditKey && row[creditKey] && row[creditKey].trim() !== '') {
            const parsed = parseAmountString(row[creditKey]);
            if (parsed) {
              finalAmount = parsed.amount;
              finalType = 'income';
            }
          }

          if (finalAmount <= 0) {
            return;
          }

          const rawDesc = descKey && row[descKey] ? row[descKey].trim() : 'Bank Statement Record';
          const title = rawDesc.length > 150 ? rawDesc.substring(0, 147) + '...' : rawDesc;

          let date = new Date();
          if (dateKey && row[dateKey]) {
            const parsedDate = new Date(row[dateKey].trim());
            if (!isNaN(parsedDate.getTime())) {
              date = parsedDate;
            }
          }

          // Use the intelligent keyword-based category mapper
          const category = mapDescriptionToCategory(
            rawDesc,
            finalType,
            categoryKey ? row[categoryKey] : undefined
          );

          results.push({
            title,
            amount: finalAmount,
            type: finalType,
            category,
            date,
            description: `Imported via Bank CSV: ${rawDesc}`
          });
        } catch {
          // Skip malformed rows safely
        }
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};
