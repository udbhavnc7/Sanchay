package com.ivy.domain.intelligence

import com.ivy.base.model.TransactionType
import com.ivy.data.db.dao.fake.FakeAccountDao
import com.ivy.data.db.dao.fake.FakeBudgetDao
import com.ivy.data.db.dao.fake.FakeLoanDao
import com.ivy.data.db.dao.fake.FakeLoanRecordDao
import com.ivy.data.db.dao.fake.FakePlannedPaymentDao
import com.ivy.data.db.dao.fake.FakeTransactionDao
import com.ivy.data.db.entity.BudgetEntity
import com.ivy.data.db.entity.PlannedPaymentRuleEntity
import com.ivy.data.db.entity.TransactionEntity
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

class FinancialIntelligenceEngineTest {

    private lateinit var transactionDao: FakeTransactionDao
    private lateinit var budgetDao: FakeBudgetDao
    private lateinit var plannedPaymentDao: FakePlannedPaymentDao
    private lateinit var accountDao: FakeAccountDao
    private lateinit var loanDao: FakeLoanDao
    private lateinit var loanRecordDao: FakeLoanRecordDao
    private lateinit var engine: FinancialIntelligenceEngine

    @Before
    fun setup() {
        transactionDao = FakeTransactionDao()
        budgetDao = FakeBudgetDao()
        plannedPaymentDao = FakePlannedPaymentDao()
        accountDao = FakeAccountDao()
        loanDao = FakeLoanDao()
        loanRecordDao = FakeLoanRecordDao()

        engine = FinancialIntelligenceEngine(
            transactionDao = transactionDao,
            budgetDao = budgetDao,
            plannedPaymentRuleDao = plannedPaymentDao,
            accountDao = accountDao,
            loanDao = loanDao,
            loanRecordDao = loanRecordDao
        )
    }

    @Test
    fun testEmptyStateYieldsNoSignals() = runBlocking {
        val signals = engine.evaluateSignals()
        assertTrue(signals.isEmpty())
    }

    @Test
    fun testBudgetExceededTriggersCriticalSignal() = runBlocking {
        val categoryId = UUID.randomUUID()
        val accountId = UUID.randomUUID()
        val budget = BudgetEntity(
            name = "Dining",
            amount = 1000.0,
            categoryIdsSerialized = categoryId.toString(),
            accountIdsSerialized = accountId.toString(),
            orderId = 1.0
        )
        budgetDao.save(budget)

        val expense = TransactionEntity(
            accountId = accountId,
            amount = 1200.0,
            type = TransactionType.EXPENSE,
            categoryId = categoryId,
            dateTime = Instant.now()
        )
        transactionDao.save(expense)

        val signals = engine.evaluateSignals()
        assertEquals(1, signals.size)
        val signal = signals.first()
        assertEquals(SignalCategory.BUDGET, signal.category)
        assertEquals(SignalSeverity.CRITICAL, signal.severity)
        assertEquals("Budget Exceeded", signal.title)
    }

    @Test
    fun testUpcomingPlannedPaymentTriggersSignal() = runBlocking {
        val plannedPayment = PlannedPaymentRuleEntity(
            startDate = Instant.now().plus(2, ChronoUnit.DAYS),
            intervalN = 1,
            intervalType = null,
            oneTime = true,
            type = TransactionType.EXPENSE,
            accountId = UUID.randomUUID(),
            amount = 500.0,
            title = "Internet Bill"
        )
        plannedPaymentDao.save(plannedPayment)

        val signals = engine.evaluateSignals()
        assertEquals(1, signals.size)
        val signal = signals.first()
        assertEquals(SignalCategory.RECURRING, signal.category)
        assertEquals(SignalSeverity.HIGH, signal.severity)
        assertTrue(signal.title.contains("Upcoming"))
    }

    @Test
    fun testDismissSignalRemovesFromResults() = runBlocking {
        val plannedPayment = PlannedPaymentRuleEntity(
            startDate = Instant.now().plus(1, ChronoUnit.DAYS),
            intervalN = 1,
            intervalType = null,
            oneTime = true,
            type = TransactionType.EXPENSE,
            accountId = UUID.randomUUID(),
            amount = 250.0,
            title = "Gym"
        )
        plannedPaymentDao.save(plannedPayment)

        val initialSignals = engine.evaluateSignals()
        assertEquals(1, initialSignals.size)

        engine.dismissSignal(initialSignals.first().dedupKey)

        val afterDismissSignals = engine.evaluateSignals()
        assertTrue(afterDismissSignals.isEmpty())
    }

    @Test
    fun testRealWorldDiverseFinancialDataset() = runBlocking {
        val salaryAccount = UUID.randomUUID()
        val walletAccount = UUID.randomUUID()
        val foodCat = UUID.randomUUID()
        val utilitiesCat = UUID.randomUUID()

        // 1. Income: Salary ₹80,000
        val salary = TransactionEntity(
            accountId = salaryAccount,
            amount = 80000.0,
            type = TransactionType.INCOME,
            categoryId = null,
            dateTime = Instant.now()
        )
        transactionDao.save(salary)

        // 2. Budget: Utilities ₹5,000
        val utilitiesBudget = BudgetEntity(
            name = "Utilities",
            amount = 5000.0,
            categoryIdsSerialized = utilitiesCat.toString(),
            accountIdsSerialized = salaryAccount.toString(),
            orderId = 1.0
        )
        budgetDao.save(utilitiesBudget)

        // 3. Expense: Utilities ₹4,500 (90% -> Approaching Limit)
        val elecBill = TransactionEntity(
            accountId = salaryAccount,
            amount = 4500.0,
            type = TransactionType.EXPENSE,
            categoryId = utilitiesCat,
            dateTime = Instant.now()
        )
        transactionDao.save(elecBill)

        // 4. Planned commitment: Rent ₹22,000 due in 2 days
        val rentPayment = PlannedPaymentRuleEntity(
            startDate = Instant.now().plus(2, ChronoUnit.DAYS),
            intervalN = 1,
            intervalType = null,
            oneTime = false,
            type = TransactionType.EXPENSE,
            accountId = salaryAccount,
            amount = 22000.0,
            title = "House Rent"
        )
        plannedPaymentDao.save(rentPayment)

        // Evaluate signals with this real-world dataset
        val signals = engine.evaluateSignals()
        assertTrue(signals.isNotEmpty())

        // Check budget signal
        val budgetSignal = signals.find { it.category == SignalCategory.BUDGET }
        assertTrue(budgetSignal != null)
        assertEquals(SignalSeverity.HIGH, budgetSignal?.severity)
        assertEquals("Approaching Budget Limit", budgetSignal?.title)

        // Check planned payment signal
        val rentSignal = signals.find { it.category == SignalCategory.RECURRING }
        assertTrue(rentSignal != null)
        assertEquals(SignalSeverity.HIGH, rentSignal?.severity)
        assertTrue(rentSignal?.title?.contains("Upcoming") == true)
    }

    @Test
    fun testCashFlowPressureWhenExpensesExceedIncome() = runBlocking {
        val accountId = UUID.randomUUID()
        
        // Income ₹10,000
        transactionDao.save(
            TransactionEntity(
                accountId = accountId,
                amount = 10000.0,
                type = TransactionType.INCOME,
                categoryId = null,
                dateTime = Instant.now()
            )
        )

        // Expenses ₹15,000
        transactionDao.save(
            TransactionEntity(
                accountId = accountId,
                amount = 15000.0,
                type = TransactionType.EXPENSE,
                categoryId = null,
                dateTime = Instant.now()
            )
        )

        val signals = engine.evaluateSignals()
        val cashFlowSignal = signals.find { it.category == SignalCategory.CASH_FLOW }
        assertTrue(cashFlowSignal != null)
        assertEquals(SignalSeverity.HIGH, cashFlowSignal?.severity)
        assertEquals("Cash Flow Pressure", cashFlowSignal?.title)
    }
}
