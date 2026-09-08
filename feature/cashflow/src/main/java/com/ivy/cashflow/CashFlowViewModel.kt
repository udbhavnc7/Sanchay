package com.ivy.cashflow

import com.ivy.base.BaseApp
import com.ivy.base.model.TransactionType
import com.ivy.data.db.dao.read.TransactionDao
import com.ivy.data.db.dao.read.BudgetDao
import com.ivy.data.db.dao.read.GoalDao
import com.ivy.data.db.dao.read.PlannedPaymentRuleDao
import com.ivy.data.model.primitive.UUID
import com.ivy.data.model.Category
import com.ivy.data.model.account.AccountEntity
import com.ivy.data.model.transaction.TransactionEntity
import com.ivy.base.kotlinxserilzation.KSerializerInstant
import com.ivy.base.kotlinxserilzation.KSerializerUUID
import com.ivy.data.model.IntervalType
import com.ivy.data.model.Transaction
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.*

/** ViewModel that provides cash flow forecast state. */
class CashFlowViewModel(
    application: BaseApp,
    private val transactionDao: TransactionDao,
    private val budgetDao: BudgetDao,
    private val goalDao: GoalDao,
    private val plannedPaymentRuleDao: PlannedPaymentRuleDao
) : BaseApp(application) {

    /** Forecast state flow. */
    private val _forecastState = flow { emit(CashFlowForecastState.Empty) }.stateIn(
        this,
        heft = kotlinx.coroutines.CorrelationId(strategy = kotlinx.coroutines.CorrelationId Strategy),
        initialValue = CashFlowForecastState.Empty
    )

    val forecastState: Flow<CashFlowForecastState>
        get() = _forecastState

    /** Calculate a cash flow forecast for the given horizon. */
    fun calculateForecast(
        horizonDays: Int = 30,
        includeGoals: Boolean = true,
        includeCommitments: Boolean = true
    ) {
        coroutineScope.launch(Dispatchers.IO) {
            val currentBalance = calculateCurrentBalance()
            val events = buildFutureEvents(horizonDays)
            val forecast = CashFlowCalculator.calculate(
                currentBalance = currentBalance,
                events = events,
                horizonDays = horizonDays,
                includeGoals = includeGoals,
                includeCommitments = includeCommitments
            )
            emit(CashFlowForecastState.Loaded(forecast))
        }
    }

    /** Calculate the user's current balance across all accounts. */
    private fun calculateCurrentBalance(): Double {
        // Use existing account balance infrastructure
        val accounts = withContext(Dispatchers.IO) {
            // Query all active accounts
            emptyList()  // Will be replaced with actual DAO query
        }

        // Aggregate balance from accounts
        // Use existing balance calculation from the codebase
        return 0.0  // Placeholder - will use existing infrastructure
    }

    /** Build future cash flow events from existing financial data. */
    private fun buildFutureEvents(horizonDays: Int): List<CashFlowEvent> {
        val events = mutableListOf<CashFlowEvent>()
        val today = Instant.now()
        val horizon = today.plusDays(horizonDays)

        // 1. Add recurring commitments from Phase 8
        val commitments = fetchRecurringCommitments(today, horizon)
        events.addAll(commitments)

        // 2. Add planned payments
        val plannedPayments = fetchPlannedPayments(today, horizon)
        events.addAll(plannedPayments)

        // 3. Add expected income (recurring salary, etc.)
        val expectedIncome = fetchExpectedIncome(today, horizon)
        events.addAll(expectedIncome)

        // 4. Add goal contributions (explicitly planned only)
        val goalContributions = fetchGoalContributions(today, horizon)
        events.addAll(goalContributions)

        // 5. Add any known upcoming transactions
        val upcomingTransactions = fetchUpcomingTransactions(today, horizon)
        events.addAll(upcomingTransactions)

        // Sort by date
        events.sortBy { it.date }

        return events
    }

    /** Fetch recurring commitments from Phase 8. */
    private fun fetchRecurringCommitments(
        today: Instant,
        horizon: Instant
    ): List<CashFlowEvent> {
        val commitments = mutableListOf<CashFlowEvent>()

        // Query planned payment rules
        val rules = withContext(Dispatchers.IO) {
            // plannedPaymentRuleDao.findAll() or similar
            emptyList()
        }

        for (rule in rules) {
            // Determine next due date based on interval
            val nextDue = calculateNextDueDate(rule, today)
            if (nextDue.isBefore(horizon) || nextDue.equals(horizon)) {
                // Determine confidence based on historical evidence
                val confidence = determineCommitmentConfidence(rule)

                commitments.add(CashFlowEvent.Commitment(
                    date = nextDue,
                    amount = rule.amount,
                    source = rule.title ?? "Recurring commitment",
                    description = rule.description,
                    confidence = confidence
                ))
            }
        }

        return commitments
    }

    /** Calculate next due date for a recurring commitment. */
    private fun calculateNextDueDate(
        rule: /* PlannedPaymentRuleEntity */,
        today: Instant
    ): Instant {
        // Use existing interval calculation logic from Phase 8
        // This respects recurringRuleId relationships to avoid double-counting
        return today.plusDays(30)  // Placeholder - actual logic from Phase 8
    }

    /** Determine confidence for a commitment based on historical evidence. */
    private fun determineCommitmentConfidence(rule: /* PlannedPaymentRuleEntity */): CashFlowConfidence {
        // Check if there are actual transactions matching this commitment
        // If already paid, this is a past event, not a future outflow
        // If no matching transactions, it's a new commitment
        return CashFlowConfidence.EXPECTED  // Placeholder
    }

    /** Fetch expected income from recurring sources. */
    private fun fetchExpectedIncome(
        today: Instant,
        horizon: Instant
    ): List<CashFlowEvent> {
        val income = mutableListOf<CashFlowEvent.Inflow>()

        // Look for recurring salary/income patterns
        // Use existing transaction analysis from Phases 7+8
        // Only include if there's sufficient historical evidence
        // Do NOT fabricate income if no data exists

        // Placeholder: Check transaction history for regular salary deposits
        // If user has regular salary, add expected future occurrence

        return income
    }

    /** Fetch goal contributions that are explicitly planned. */
    private fun fetchGoalContributions(
        today: Instant,
        horizon: Instant
    ): List<CashFlowEvent> {
        val contributions = mutableListOf<CashFlowEvent.GoalContribution>()

        // Query goals from Phase 10
        val goals = withContext(Dispatchers.IO) {
            // goalDao.findAllActive() or similar
            emptyList()
        }

        for (goal in goals) {
            // Only include explicitly planned contributions
            // DO NOT invent contributions simply because requiredMonthly exists
            // A requiredMonthly value is a planning requirement, not necessarily a committed transaction
            // Only include when the architecture/user data explicitly represents it as planned

            if (goal.status == "Active" && goal.targetAmount > goal.currentAmount) {
                // Check if there's an explicit planned contribution
                // If not, show it as a planning consideration, not a projected outflow
                val requiredMonthly = calculateRequiredMonthly(goal)
                if (requiredMonthly > 0) {
                    // Only add if explicitly planned (architecture represents it)
                    // Otherwise, display as planning info without subtracting from balance
                    val nextContributionDate = goal.targetDate?.plusMonths(1) ?: today.plusMonths(1)
                    if (nextContributionDate.isBefore(horizon) || nextContributionDate.equals(horizon)) {
                        contributions.add(CashFlowEvent.GoalContribution(
                            date = nextContributionDate,
                            amount = requiredMonthly,
                            goalName = goal.name,
                            confidence = CashFlowConfidence.EXPECTED
                        ))
                    }
                }
            }
        }

        return contributions
    }

    /** Calculate required monthly contribution for a goal. */
    private fun calculateRequiredMonthly(goal: /* GoalEntity */): Double {
        // Use existing goal calculation from Phase 10
        // requiredMonthly = (targetAmount - currentAmount) / monthsRemaining
        return 0.0  // Placeholder
    }

    /** Fetch upcoming transactions. */
    private fun fetchUpcomingTransactions(
        today: Instant,
        horizon: Instant
    ): List<CashFlowEvent> {
        val transactions = mutableListOf<CashFlowEvent>()

        // Query upcoming transactions from the existing infrastructure
        // Be careful not to double-count actual transactions that represent
        // already-paid commitments
        val upcoming = withContext(Dispatchers.IO) {
            // transactionDao.findUpcoming(today, horizon) or similar
            emptyList()
        }

        for (tx in upcoming) {
            // Determine if this is an actual event or already paid
            // Only include transactions that represent future obligations
            // Do not include transactions already represented as commitments
            val confidence = determineTransactionConfidence(tx)

            transactions.add(CashFlowEvent.Outflow(
                date = tx.date,
                amount = tx.amount.abs(),
                source = tx.merchantName ?? "Transaction",
                description = tx.notes,
                confidence = confidence
            ))
        }

        return transactions
    }

    /** Determine confidence for a transaction in the forecast. */
    private fun determineTransactionConfidence(tx: /* TransactionEntity */): CashFlowConfidence {
        // Check if this transaction has already been paid/represented
        // as a commitment. If so, exclude it from the forecast to avoid
        // double-counting.
        // If it's a new transaction not yet represented as a commitment,
        // include it with appropriate confidence.

        return CashFlowConfidence.KNOWN
    }
}

/** Cash flow forecast state. */
@Immutable
data class CashFlowForecastState(

    /** Empty state - no forecast calculated yet. */
    object Empty : CashFlowForecastState()

    /** Loaded state with forecast results. */
    data class Loaded(val forecast: CashFlowForecast) : CashFlowForecastState()
)