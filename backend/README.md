# Expense Tracker API Backend

Clean, production-ready Express.js & TypeScript REST API for personal expense and income tracking with MongoDB, Mongoose, and Bank CSV Statement parsing.

---

## 📁 Architecture Overview

```text
backend/
├── src/
│   ├── config/
│   │   └── db.ts                   # Mongoose connection & lifecycle management
│   ├── controllers/
│   │   ├── authController.ts       # Register & Login logic with bcrypt & JWT
│   │   └── expenseController.ts    # Unified Transaction CRUD, CSV upload, & Stats aggregation
│   ├── middleware/
│   │   ├── authMiddleware.ts       # Bearer token validation & req.user binding
│   │   ├── errorHandler.ts         # Global centralized error handler ({ message, error })
│   │   └── uploadMiddleware.ts     # Multer memory-storage middleware for CSV statement uploads
│   ├── models/
│   │   ├── User.ts                 # User schema (id, name, email unique, passwordHash, createdAt)
│   │   ├── Transaction.ts          # Unified Transaction schema (type, category, amount > 0)
│   │   └── Expense.ts              # Backwards-compatible export mapping to Transaction
│   ├── routes/
│   │   ├── authRoutes.ts           # POST /register, POST /login
│   │   ├── expenseRoutes.ts        # Protected CRUD, POST /upload-csv, GET /stats
│   │   └── index.ts                # Main router mounted on /api
│   ├── types/
│   │   └── express.d.ts            # TypeScript request typing extension
│   ├── utils/
│   │   └── csvStatementParser.ts   # Streaming Bank CSV parser with intelligent sign & category detection
│   ├── app.ts                      # Express app setup & CORS configuration
│   └── server.ts                   # Server entry point with dotenv
├── scripts/
│   └── verify.ts                   # In-memory end-to-end verification suite
├── .env                            # Local environment variables
├── .env.example                    # Environment template
├── package.json
└── tsconfig.json
```

---

## 💎 Features Implemented

1. **Unified Transaction System**:
   - Supports both `income` and `expense` entries.
   - Enforces strict positive amount validation (`amount > 0`) regardless of transaction type.
   - Combined categories:
     - Income: `Salary`, `Freelance`, `Investments`, `Misc`
     - Expense: `Food`, `Rent`, `Utilities`, `Entertainment`, `Misc`

2. **Metrics & Balanced Financial Aggregation (`GET /api/expenses/stats`)**:
   - Calculates and returns:
     - `totalIncome`: Total sum of all income transactions
     - `totalExpenses`: Total sum of all expense transactions
     - `netBalance`: `totalIncome - totalExpenses`
     - `byCategory`: Segmented category distributions isolating `income` from `expense`
     - `byMonth`: Monthly timeline with income, expense, and net balances

3. **Bank CSV Statement Upload & Parser (`POST /api/expenses/upload-csv`)**:
   - Handles multipart form file uploads (`file` field) via `multer`.
   - Streaming CSV parsing via `csv-parser`.
   - Normalizes variable bank column headers (`Date`, `Description`/`Title`, `Amount`/`Debit`/`Credit`).
   - Intelligent sign detection: negative values (e.g. `-85.40` or `(85.40)`) have negative signs stripped and are saved as positive amounts with type `'expense'`; positive values are saved with type `'income'`.
   - High-performance batch saving using Mongoose `insertMany`.

---

## 📡 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user (`name`, `email`, `password`) |
| `POST` | `/api/auth/login` | Authenticate user & return signed JWT token |

### Transactions / Expenses (`/api/expenses`) - *Bearer Token Required*
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/expenses` | List transactions (supports `?type=income\|expense`, `?category=...`, `?startDate=...`, `?endDate=...`) |
| `POST` | `/api/expenses` | Manually record an entry (`title`, `amount` > 0, `type`: `income\|expense`, `category`, `date`, `description`) |
| `POST` | `/api/expenses/upload-csv` | Upload Bank CSV statement (`multipart/form-data`, field: `file`) |
| `GET` | `/api/expenses/stats` | Aggregated financial metrics (`totalIncome`, `totalExpenses`, `netBalance`, segmented categories, monthly timeline) |
| `PUT` | `/api/expenses/:id` | Update transaction entry (enforces ownership) |
| `DELETE` | `/api/expenses/:id` | Remove transaction entry (enforces ownership) |

---

## 🚀 Running Verification & Server

```bash
# Run test suite
npm run test:verify

# Compile TypeScript
npm run build

# Start development server
npm run dev
```
