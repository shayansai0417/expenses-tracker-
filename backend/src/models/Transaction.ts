import { Schema, model, Document, Types } from 'mongoose';

export const TRANSACTION_TYPES = ['income', 'expense'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investments',
  'Misc',
  'Uncategorized'
] as const;

export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Food',
  'Housing & Rent',
  'Rent',
  'Utilities',
  'Entertainment',
  'Transportation',
  'Medical & Health',
  'Misc',
  'Uncategorized'
] as const;

export const TRANSACTION_CATEGORIES = [
  'Food & Dining',
  'Food',
  'Housing & Rent',
  'Rent',
  'Utilities',
  'Entertainment',
  'Transportation',
  'Medical & Health',
  'Salary',
  'Freelance',
  'Investments',
  'Misc',
  'Uncategorized'
] as const;

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export interface ITransaction extends Document {
  id: string;
  userId: Types.ObjectId;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Transaction title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      validate: {
        validator: (value: number) => typeof value === 'number' && !isNaN(value) && value > 0,
        message: 'Amount must be a positive number greater than 0'
      }
    },
    type: {
      type: String,
      required: [true, 'Transaction type is required (income or expense)'],
      enum: {
        values: TRANSACTION_TYPES,
        message: `Type must be one of: ${TRANSACTION_TYPES.join(', ')}`
      },
      index: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      default: 'Uncategorized',
      trim: true,
      index: true
    },
    date: {
      type: Date,
      default: Date.now,
      required: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        if (ret.userId) {
          ret.userId = ret.userId.toString();
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

TransactionSchema.index({ userId: 1, type: 1, date: -1 });
TransactionSchema.index({ userId: 1, category: 1 });

export const Transaction = model<ITransaction>('Transaction', TransactionSchema, 'transactions');
export const Expense = Transaction;
export type IExpense = ITransaction;
