import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { app } from '../src/app';

process.env.JWT_SECRET = 'test_jwt_secret_unified_transactions_2026';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.NODE_ENV = 'test';

let mongod: MongoMemoryServer;

const runVerification = async () => {
  console.log('================================================================');
  console.log('🧪 Starting Unified Transaction & Bank CSV Verification Suite');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  const assert = (condition: boolean, testName: string, detail?: string) => {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ PASS: ${testName}`);
    } else {
      console.error(`  ❌ FAIL: ${testName}${detail ? ` -> ${detail}` : ''}`);
      throw new Error(`Test failed: ${testName}`);
    }
  };

  try {
    // 1. Initialize In-Memory MongoDB Server
    console.log('1️⃣  Starting In-Memory MongoDB Database...');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`  ✅ Connected to MongoDB Memory Server at: ${uri}\n`);

    // 2. Health & CORS Verification
    console.log('2️⃣  Verifying Health & CORS Configuration...');
    const corsRes = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');

    assert(corsRes.status === 200, 'Health endpoint responds with 200');
    assert(
      corsRes.headers['access-control-allow-origin'] === 'http://localhost:5173',
      'CORS explicitly allows http://localhost:5173'
    );
    console.log('');

    // 3. User Setup (Alice & Bob)
    console.log('3️⃣  Registering Test Users for Data Isolation...');
    const regAlice = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice Walker', email: 'alice.walker@example.com', password: 'Password123!' });
    assert(regAlice.status === 201, 'Alice registered successfully');
    const tokenAlice = regAlice.body.token;

    const regBob = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob Stone', email: 'bob.stone@example.com', password: 'Password123!' });
    assert(regBob.status === 201, 'Bob registered successfully');
    const tokenBob = regBob.body.token;
    console.log('');

    // 4. Manual Transaction Processing (Income & Expense)
    console.log('4️⃣  Verifying Manual Income & Expense Transactions...');

    // Strict positive numeric validation (> 0)
    const negativeRes = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({ title: 'Negative Amount Test', amount: -250, type: 'expense', category: 'Food' });
    assert(negativeRes.status === 400, 'Rejects negative amount with 400 (strict > 0 validation)');

    const zeroRes = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({ title: 'Zero Amount Test', amount: 0, type: 'income', category: 'Salary' });
    assert(zeroRes.status === 400, 'Rejects zero amount with 400');

    // Create Manual Income 1: Monthly Salary ($3,500)
    const incomeRes = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({
        title: 'Monthly Tech Salary',
        amount: 3500.00,
        type: 'income',
        category: 'Salary',
        date: '2026-10-01',
        description: 'Primary software engineering salary'
      });
    assert(incomeRes.status === 201, 'Manual income transaction created with 201');
    assert(incomeRes.body.transaction.type === 'income', 'Transaction type recorded as income');
    assert(incomeRes.body.transaction.amount === 3500.00, 'Income amount matches 3500.00');

    // Create Manual Expense 1: Apartment Rent ($1,200)
    const rentRes = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({
        title: 'Apartment Rent',
        amount: 1200.00,
        type: 'expense',
        category: 'Rent',
        date: '2026-10-02',
        description: 'Downtown apartment monthly rent'
      });
    assert(rentRes.status === 201, 'Manual rent expense created with 201');
    assert(rentRes.body.transaction.type === 'expense', 'Transaction type recorded as expense');
    const manualExpenseId = rentRes.body.transaction.id;

    // Create Manual Expense 2: Groceries ($150)
    const groceryRes = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({
        title: 'Supermarket Groceries',
        amount: 150.00,
        type: 'expense',
        category: 'Food',
        date: '2026-10-03'
      });
    assert(groceryRes.status === 201, 'Manual grocery expense created');
    console.log('');

    // 5. Bank CSV Statement Upload & Intelligent Parsing
    console.log('5️⃣  Verifying Bank CSV Statement Upload & Parser (POST /api/expenses/upload-csv)...');

    // Missing file upload error
    const noFileRes = await request(app)
      .post('/api/expenses/upload-csv')
      .set('Authorization', `Bearer ${tokenAlice}`);
    assert(noFileRes.status === 400, 'Missing file upload rejected with 400');

    // Construct realistic bank statement CSV buffer with positive (credits) and negative (debits)
    const sampleCsv = [
      'Date,Description,Amount',
      '2026-10-05,Upwork Client Consulting,1250.00',
      '2026-10-06,Whole Foods Market,-85.40',
      '2026-10-07,Electric Power Utility,-115.00',
      '2026-10-08,Quarterly Stock Dividend,75.50',
      '2026-10-09,Netflix Streaming Subscription,-19.99'
    ].join('\n');

    const uploadRes = await request(app)
      .post('/api/expenses/upload-csv')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .attach('file', Buffer.from(sampleCsv, 'utf-8'), 'bank_statement_october.csv');

    assert(uploadRes.status === 201, 'CSV statement uploaded and processed with 201 Created');
    assert(uploadRes.body.count === 5, 'Parser processed exactly 5 transactions');
    assert(Array.isArray(uploadRes.body.imported), 'Returns array of imported transaction records');

    const imported = uploadRes.body.imported;
    // Verify intelligent type detection and negative sign stripping
    const consulting = imported.find((r: any) => r.title.includes('Upwork'));
    assert(consulting && consulting.type === 'income', 'Positive value (1250.00) detected as income');
    assert(consulting && consulting.category === 'Freelance', 'Consulting auto-categorized as Freelance');

    const wholeFoods = imported.find((r: any) => r.title.includes('Whole Foods'));
    assert(wholeFoods && wholeFoods.type === 'expense', 'Negative value (-85.40) detected as expense');
    assert(wholeFoods && wholeFoods.amount === 85.40, 'Negative sign stripped: amount is strictly positive 85.40');
    assert(wholeFoods && wholeFoods.category === 'Food & Dining', 'Whole Foods auto-categorized as Food & Dining');

    const utility = imported.find((r: any) => r.title.includes('Electric Power'));
    assert(utility && utility.type === 'expense' && utility.amount === 115.00, 'Utility bill parsed as expense of 115.00');
    assert(utility && utility.category === 'Utilities', 'Electric Power categorized as Utilities');

    const dividend = imported.find((r: any) => r.title.includes('Dividend'));
    assert(dividend && dividend.type === 'income' && dividend.amount === 75.50, 'Dividend parsed as income of 75.50');
    assert(dividend && dividend.category === 'Investments', 'Dividend categorized as Investments');

    const netflix = imported.find((r: any) => r.title.includes('Netflix'));
    assert(netflix && netflix.type === 'expense' && netflix.amount === 19.99, 'Netflix parsed as expense of 19.99');
    assert(netflix && netflix.category === 'Entertainment', 'Netflix categorized as Entertainment');
    console.log('');

    // 6. Metrics Aggregation Pipeline Verification (GET /api/expenses/stats)
    console.log('6️⃣  Verifying Metrics Aggregation & Net Balance (GET /api/expenses/stats)...');
    const statsRes = await request(app)
      .get('/api/expenses/stats')
      .set('Authorization', `Bearer ${tokenAlice}`);

    assert(statsRes.status === 200, 'GET /api/expenses/stats responds with 200');

    // Expected calculations:
    // Total Income = 3500.00 (Salary) + 1250.00 (Freelance) + 75.50 (Investments) = 4825.50
    // Total Expenses = 1200.00 (Rent) + 150.00 (Food) + 85.40 (Food & Dining) + 115.00 (Utilities) + 19.99 (Entertainment) = 1570.39
    // Net Balance = 4825.50 - 1570.39 = 3255.11
    assert(statsRes.body.totalIncome === 4825.50, 'totalIncome matches exactly: 4825.50');
    assert(statsRes.body.totalExpenses === 1570.39, 'totalExpenses matches exactly: 1570.39');
    assert(statsRes.body.netBalance === 3255.11, 'netBalance (totalIncome - totalExpenses) matches: 3255.11');
    assert(statsRes.body.incomeCount === 3, 'incomeCount is 3');
    assert(statsRes.body.expenseCount === 5, 'expenseCount is 5');

    // Segmented category breakdowns
    assert(Boolean(statsRes.body.byCategory), 'Segmented byCategory breakdown exists');
    assert(Array.isArray(statsRes.body.byCategory.income), 'byCategory.income is an array');
    assert(Array.isArray(statsRes.body.byCategory.expense), 'byCategory.expense is an array');

    const salaryStat = statsRes.body.byCategory.income.find((c: any) => c.category === 'Salary');
    assert(salaryStat && salaryStat.total === 3500.00, 'Income byCategory includes Salary ($3,500)');

    const rentStat = statsRes.body.byCategory.expense.find((c: any) => c.category === 'Rent');
    assert(rentStat && rentStat.total === 1200.00, 'Expense byCategory includes Rent ($1,200)');

    const foodDiningStat = statsRes.body.byCategory.expense.find((c: any) => c.category === 'Food & Dining');
    assert(foodDiningStat && foodDiningStat.total === 85.40, 'Expense byCategory aggregates Food & Dining ($85.40)');

    assert(Array.isArray(statsRes.body.byMonth), 'Monthly timeline breakdown exists');
    const octTimeline = statsRes.body.byMonth.find((m: any) => m.month === '2026-10');
    assert(octTimeline && octTimeline.net === 3255.11, 'Monthly timeline net matches October net balance: 3255.11');
    console.log('');

    // 7. Filtering & Data Isolation
    console.log('7️⃣  Verifying Filters and User Data Isolation...');
    const incomeFilterRes = await request(app)
      .get('/api/expenses?type=income')
      .set('Authorization', `Bearer ${tokenAlice}`);
    assert(incomeFilterRes.body.count === 3, 'Filtering by ?type=income returns exactly 3 income records');

    const expenseFilterRes = await request(app)
      .get('/api/expenses?type=expense')
      .set('Authorization', `Bearer ${tokenAlice}`);
    assert(expenseFilterRes.body.count === 5, 'Filtering by ?type=expense returns exactly 5 expense records');

    // Bob tries to access Alice's records
    const bobStatsRes = await request(app)
      .get('/api/expenses/stats')
      .set('Authorization', `Bearer ${tokenBob}`);
    assert(bobStatsRes.body.totalIncome === 0, 'Bob has 0 income (complete data isolation)');
    assert(bobStatsRes.body.totalExpenses === 0, 'Bob has 0 expenses (complete data isolation)');
    assert(bobStatsRes.body.netBalance === 0, 'Bob has 0 net balance');

    // Bob tries to update or delete Alice's transaction
    const bobUpdateRes = await request(app)
      .put(`/api/expenses/${manualExpenseId}`)
      .set('Authorization', `Bearer ${tokenBob}`)
      .send({ amount: 1 });
    assert(bobUpdateRes.status === 404, 'Bob cannot update Alice transaction (returns 404)');

    const bobDeleteRes = await request(app)
      .delete(`/api/expenses/${manualExpenseId}`)
      .set('Authorization', `Bearer ${tokenBob}`);
    assert(bobDeleteRes.status === 404, 'Bob cannot delete Alice transaction (returns 404)');
    console.log('');

    // 8. Update & Deletion Lifecycle
    console.log('8️⃣  Verifying Update and Deletion Operations...');
    const aliceUpdateRes = await request(app)
      .put(`/api/expenses/${manualExpenseId}`)
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({ title: 'Apartment Rent (Renegotiated)', amount: 1100.00 });
    assert(aliceUpdateRes.status === 200, 'Alice successfully updates transaction amount to 1100.00');

    const aliceDeleteRes = await request(app)
      .delete(`/api/expenses/${manualExpenseId}`)
      .set('Authorization', `Bearer ${tokenAlice}`);
    assert(aliceDeleteRes.status === 200, 'Alice deletes transaction successfully');

    const verifyFinalGet = await request(app)
      .get('/api/expenses')
      .set('Authorization', `Bearer ${tokenAlice}`);
    assert(verifyFinalGet.body.count === 7, 'Count decreases from 8 to 7 after deletion');
    console.log('');

    // 9. Intelligent Keyword-Based Category Mapper Verification
    console.log('9️⃣  Verifying Intelligent Merchant Keyword Category Mapper...');
    const { mapDescriptionToCategory } = await import('../src/utils/csvStatementParser');
    assert(mapDescriptionToCategory("Joe's Pizza & Starbucks Coffee", 'expense') === 'Food & Dining', "Maps Joe's Pizza & Starbucks to Food & Dining");
    assert(mapDescriptionToCategory("Uber Ride from Airport", 'expense') === 'Transportation', "Maps Uber Ride to Transportation");
    assert(mapDescriptionToCategory("Shell Gas Station", 'expense') === 'Transportation', "Maps Shell Gas to Transportation");
    assert(mapDescriptionToCategory("Netflix and Spotify Subscription", 'expense') === 'Entertainment', "Maps Netflix/Spotify to Entertainment");
    assert(mapDescriptionToCategory("CVS Pharmacy Medical Prescription", 'expense') === 'Medical & Health', "Maps CVS Pharmacy to Medical & Health");
    assert(mapDescriptionToCategory("Comcast Electric Utility Power", 'expense') === 'Utilities', "Maps Comcast/Electric/Power to Utilities");
    assert(mapDescriptionToCategory("Unrecognized Merchant XYZ999", 'expense') === 'Uncategorized', "Unrecognized merchant safely falls back to Uncategorized");
    console.log('');

    console.log('================================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log('================================================================');
  } catch (err) {
    console.error('\n❌ Test run failed with error:', err);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongod) {
      await mongod.stop();
    }
  }
};

runVerification();
