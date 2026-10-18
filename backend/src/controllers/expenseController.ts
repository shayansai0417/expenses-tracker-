import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import {
  Transaction,
  TRANSACTION_TYPES,
  TRANSACTION_CATEGORIES,
  TransactionType,
  TransactionCategory
} from '../models/Transaction';
import { parseBankCsv } from '../utils/csvStatementParser';

export const getExpenses = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated', error: 'Unauthorized' });
      return;
    }

    const { type, category, startDate, endDate, sort } = req.query;

    const query: any = { userId: new Types.ObjectId(userId) };

    if (type && typeof type === 'string' && TRANSACTION_TYPES.includes(type as TransactionType)) {
      query.type = type;
    }

    if (category && typeof category === 'string') {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate && typeof startDate === 'string') {
        query.date.$gte = new Date(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        query.date.$lte = new Date(endDate);
      }
    }

    const sortOption: any = sort === 'asc' ? { date: 1 } : { date: -1 };

    const transactions = await Transaction.find(query).sort(sortOption);

    res.status(200).json({
      count: transactions.length,
      transactions,
      expenses: transactions // Backwards compatibility for existing client consumers
    });
  } catch (error) {
    next(error);
  }
};

export const createExpense = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated', error: 'Unauthorized' });
      return;
    }

    const { title, amount, type = 'expense', category, date, description } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({
        message: 'Title is required and must not be empty.',
        error: 'ValidationError'
      });
      return;
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      res.status(400).json({
        message: 'Amount must be a positive number greater than 0 regardless of type.',
        error: 'ValidationError'
      });
      return;
    }

    if (!type || !TRANSACTION_TYPES.includes(type as TransactionType)) {
      res.status(400).json({
        message: `Transaction type must be one of: ${TRANSACTION_TYPES.join(', ')}`,
        error: 'ValidationError'
      });
      return;
    }

    const resolvedCategory =
      category && TRANSACTION_CATEGORIES.includes(category as TransactionCategory)
        ? category
        : 'Uncategorized';

    let parsedDate = new Date();
    if (date) {
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        res.status(400).json({
          message: 'Invalid date provided.',
          error: 'ValidationError'
        });
        return;
      }
      parsedDate = d;
    }

    const transaction = await Transaction.create({
      userId: new Types.ObjectId(userId),
      title: title.trim(),
      amount: parsedAmount,
      type,
      category,
      date: parsedDate,
      description: description ? String(description).trim() : undefined
    });

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction,
      expense: transaction
    });
  } catch (error) {
    next(error);
  }
};

export const updateExpense = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated', error: 'Unauthorized' });
      return;
    }

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        message: 'Invalid transaction ID format.',
        error: 'ValidationError'
      });
      return;
    }

    const { title, amount, type, category, date, description } = req.body;
    const updates: Record<string, any> = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        res.status(400).json({
          message: 'Title cannot be empty.',
          error: 'ValidationError'
        });
        return;
      }
      updates.title = title.trim();
    }

    if (amount !== undefined) {
      const parsedAmount = Number(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        res.status(400).json({
          message: 'Amount must be a positive number greater than 0.',
          error: 'ValidationError'
        });
        return;
      }
      updates.amount = parsedAmount;
    }

    if (type !== undefined) {
      if (!TRANSACTION_TYPES.includes(type as TransactionType)) {
        res.status(400).json({
          message: `Transaction type must be one of: ${TRANSACTION_TYPES.join(', ')}`,
          error: 'ValidationError'
        });
        return;
      }
      updates.type = type;
    }

    if (category !== undefined) {
      updates.category =
        TRANSACTION_CATEGORIES.includes(category as TransactionCategory)
          ? category
          : 'Uncategorized';
    }

    if (date !== undefined) {
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        res.status(400).json({
          message: 'Invalid date provided.',
          error: 'ValidationError'
        });
        return;
      }
      updates.date = d;
    }

    if (description !== undefined) {
      updates.description = String(description).trim();
    }

    // Ensure strict ownership
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedTransaction) {
      res.status(404).json({
        message: 'Transaction not found or you are not authorized to update it.',
        error: 'NotFound'
      });
      return;
    }

    res.status(200).json({
      message: 'Transaction updated successfully',
      transaction: updatedTransaction,
      expense: updatedTransaction
    });
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated', error: 'Unauthorized' });
      return;
    }

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        message: 'Invalid transaction ID format.',
        error: 'ValidationError'
      });
      return;
    }

    const deleted = await Transaction.findOneAndDelete({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId)
    });

    if (!deleted) {
      res.status(404).json({
        message: 'Transaction not found or you are not authorized to delete it.',
        error: 'NotFound'
      });
      return;
    }

    res.status(200).json({
      message: 'Transaction deleted successfully',
      id: deleted.id
    });
  } catch (error) {
    next(error);
  }
};

export const getExpenseStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated', error: 'Unauthorized' });
      return;
    }

    const userObjectId = new Types.ObjectId(userId);

    // 1. Total Income & Total Expenses Balance Aggregation
    const typeTotalsPromise = Transaction.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // 2. Category Aggregation Segmented by Type
    const categoryStatsPromise = Transaction.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: { type: '$type', category: '$category' },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // 3. Monthly Timeline Breakdown
    const monthlyStatsPromise = Transaction.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: {
            month: { $dateToString: { format: '%Y-%m', date: '$date' } },
            type: '$type'
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.month': 1 } }
    ]);

    const [typeTotals, categoryStats, monthlyStats] = await Promise.all([
      typeTotalsPromise,
      categoryStatsPromise,
      monthlyStatsPromise
    ]);

    let totalIncome = 0;
    let totalExpenses = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    typeTotals.forEach((t) => {
      if (t._id === 'income') {
        totalIncome = Number(t.totalAmount.toFixed(2));
        incomeCount = t.count;
      } else if (t._id === 'expense') {
        totalExpenses = Number(t.totalAmount.toFixed(2));
        expenseCount = t.count;
      }
    });

    const netBalance = Number((totalIncome - totalExpenses).toFixed(2));

    // Build segmented category breakdowns
    const incomeCategories: Array<{ category: string; total: number; count: number; percentage: number }> = [];
    const expenseCategories: Array<{ category: string; total: number; count: number; percentage: number }> = [];

    categoryStats.forEach((item) => {
      const type = item._id.type;
      const category = item._id.category;
      const total = Number(item.totalAmount.toFixed(2));
      const count = item.count;

      if (type === 'income') {
        const percentage = totalIncome > 0 ? Number(((total / totalIncome) * 100).toFixed(2)) : 0;
        incomeCategories.push({ category, total, count, percentage });
      } else {
        const percentage = totalExpenses > 0 ? Number(((total / totalExpenses) * 100).toFixed(2)) : 0;
        expenseCategories.push({ category, total, count, percentage });
      }
    });

    // Build timeline grouped by month
    const monthMap = new Map<string, { month: string; income: number; expenses: number; net: number; count: number }>();
    monthlyStats.forEach((item) => {
      const month = item._id.month;
      const type = item._id.type;
      const amount = Number(item.totalAmount.toFixed(2));

      if (!monthMap.has(month)) {
        monthMap.set(month, { month, income: 0, expenses: 0, net: 0, count: 0 });
      }

      const entry = monthMap.get(month)!;
      entry.count += item.count;
      if (type === 'income') {
        entry.income = Number((entry.income + amount).toFixed(2));
      } else {
        entry.expenses = Number((entry.expenses + amount).toFixed(2));
      }
      entry.net = Number((entry.income - entry.expenses).toFixed(2));
    });

    const byMonth = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));

    res.status(200).json({
      totalIncome,
      totalExpenses,
      netBalance,
      incomeCount,
      expenseCount,
      totalCount: incomeCount + expenseCount,
      byCategory: {
        income: incomeCategories,
        expense: expenseCategories
      },
      incomeByCategory: incomeCategories,
      expenseByCategory: expenseCategories,
      byMonth
    });
  } catch (error) {
    next(error);
  }
};

export const uploadCsv = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated', error: 'Unauthorized' });
      return;
    }

    if (!req.file || !req.file.buffer) {
      res.status(400).json({
        message: 'No file uploaded. Please upload a valid CSV bank statement using form-data field "file".',
        error: 'BadRequest'
      });
      return;
    }

    const records = await parseBankCsv(req.file.buffer);

    if (!records || records.length === 0) {
      res.status(400).json({
        message: 'No valid transaction records could be parsed from the uploaded CSV statement.',
        error: 'ValidationError'
      });
      return;
    }

    const userObjectId = new Types.ObjectId(userId);
    const docsToInsert = records.map((r) => ({
      ...r,
      userId: userObjectId
    }));

    // Batch-save records using optimized insertMany
    const createdTransactions = await Transaction.insertMany(docsToInsert, { ordered: false });

    res.status(201).json({
      message: `Successfully imported ${createdTransactions.length} transactions from CSV statement.`,
      count: createdTransactions.length,
      imported: createdTransactions
    });
  } catch (error) {
    next(error);
  }
};
