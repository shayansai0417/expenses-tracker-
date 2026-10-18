import { Router } from 'express';
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  uploadCsv
} from '../controllers/expenseController';
import { authMiddleware } from '../middleware/authMiddleware';
import { uploadCsvMiddleware } from '../middleware/uploadMiddleware';

const router = Router();

// Protect all routes with JWT authentication middleware
router.use(authMiddleware);

// Aggregation Stats Route (declared before /:id)
router.get('/stats', getExpenseStats);

// Bank CSV Statement Upload Route (declared before /:id)
router.post('/upload-csv', uploadCsvMiddleware, uploadCsv);

// Unified Transaction CRUD Routes
router.get('/', getExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
