package com.ivy.domain.intelligence

import com.ivy.base.model.TransactionType
import com.ivy.data.db.dao.read.AccountDao
import com.ivy.data.db.dao.read.BudgetDao
import com.ivy.data.db.dao.read.LoanDao
import com.ivy.data.db.dao.read.LoanRecordDao
import com.ivy.data.db.dao.read.PlannedPaymentRuleDao
import com.ivy.data.db.dao.read.TransactionDao
import com.ivy.data.db.entity.BudgetEntity
import com.ivy.data.db.entity.PlannedPaymentRuleEntity
import com.ivy.data.db.entity.TransactionEntity
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.temporal.ChronoUnit
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FinancialIntelligenceEngine @Inject constructor(
    private val transactionDao: TransactionDao,
    private val budgetDao: BudgetDao,
    private val plannedPaymentRuleDao: PlannedPaymentRuleDao,
    private val accountDao: AccountDao,
    private val loanDao: LoanDao,
    private val loanRecordDao: LoanRecordDao
) {
    private val dismissedKeys = ConcurrentHashMap.newKeySet<String>()
    private val snoozedKeys = ConcurrentHashMap<String, Long>()

    fun dismissSignal(dedupKey: String) {
        dismissedKeys.add(dedupKey)
    }

    fun snoozeSignal(dedupKey: String, durationMillis: Long = 24 * 60 * 60 * 1000L) {
        snoozedKeys[dedupKey] = System.currentTimeMillis() + durationMillis
    }

    fun resetDismissed() {
        dismissedKeys.clear()
        snoozedKeys.clear()
    }

    suspend fun evaluateSignals(): List<FinancialSignal> {
        val signals = mutableListOf<FinancialSignal>()
        val now = Instant.now()
        val zone = ZoneId.systemDefault()
        val startOfMonth = LocalDate.now(zone).withDayOfMonth(1).atStartOfDay(zone).toInstant()
        val endOfMonth = LocalDate.now(zone).plusMonths(1).withDayOfMonth(1).atStartOfDay(zone).toInstant()

        val transactionsThisMonth = try {
            transactionDao.findAllBetween(startOfMonth, endOfMonth)
        } catch (e: Exception) {
            emptyList<TransactionEntity>()
        }

        // 1. Budget Signals
        try {
            val budgets = budgetDao.findAll()
            for (budget in budgets) {
                val budgetSpent = calculateBudgetSpent(budget, transactionsThisMonth)
                val targetAmount = budget.amount
                if (targetAmount > 0) {
                    val ratio = budgetSpent / targetAmount
                    val dedup = "budget_${budget.id}"
                    if (ratio >= 1.0) {
                        signals.add(
                            FinancialSignal(
                                category = SignalCategory.BUDGET,
                                severity = SignalSeverity.CRITICAL,
                                title = "Budget Exceeded",
                                explanation = "You have exceeded your ${budget.name} budget. Spent: ${String.format("%.0f", budgetSpent)} of ${String.format("%.0f", targetAmount)}.",
                                evidence = "spent=${budgetSpent}, target=${targetAmount}",
                                relatedEntityId = budget.id.toString(),
                                relatedEntityType = "budget",
                                dedupKey = "${dedup}_exceeded",
                                recommendedAction = SignalAction("Review Budget", SignalActionType.NAVIGATE, "budgets")
                            )
                        )
                    } else if (ratio >= 0.85) {
                        signals.add(
                            FinancialSignal(
                                category = SignalCategory.BUDGET,
                                severity = SignalSeverity.HIGH,
                                title = "Approaching Budget Limit",
                                explanation = "You have used ${(ratio * 100).toInt()}% of your ${budget.name} budget.",
                                evidence = "spent=${budgetSpent}, target=${targetAmount}",
                                relatedEntityId = budget.id.toString(),
                                relatedEntityType = "budget",
                                dedupKey = "${dedup}_approaching",
                                recommendedAction = SignalAction("Adjust Spending", SignalActionType.NAVIGATE, "budgets")
                            )
                        )
                    } else if (ratio < 0.5 && LocalDate.now(zone).dayOfMonth >= 15) {
                        signals.add(
                            FinancialSignal(
                                category = SignalCategory.BUDGET,
                                severity = SignalSeverity.POSITIVE,
                                title = "Budget on Track",
                                explanation = "${budget.name} spending is well controlled at ${(ratio * 100).toInt()}% midway through the month.",
                                evidence = "spent=${budgetSpent}, target=${targetAmount}",
                                relatedEntityId = budget.id.toString(),
                                relatedEntityType = "budget",
                                dedupKey = "${dedup}_ontrack"
                            )
                        )
                    }
                }
            }
        } catch (_: Exception) {}

        // 2. Cash Flow Signals
        try {
            var totalIncome = 0.0
            var totalExpense = 0.0
            for (t in transactionsThisMonth) {
                when (t.type) {
                    TransactionType.INCOME -> totalIncome += t.amount
                    TransactionType.EXPENSE -> totalExpense += t.amount
                    else -> {}
                }
            }

            if (totalIncome > 0 && totalExpense > totalIncome) {
                signals.add(
                    FinancialSignal(
                        category = SignalCategory.CASH_FLOW,
                        severity = SignalSeverity.HIGH,
                        title = "Cash Flow Pressure",
                        explanation = "Your expenses (${String.format("%.0f", totalExpense)}) currently exceed income (${String.format("%.0f", totalIncome)}) this month.",
                        evidence = "income=${totalIncome}, expense=${totalExpense}",
                        dedupKey = "cashflow_negative_${LocalDate.now(zone).monthValue}",
                        recommendedAction = SignalAction("Inspect Cash Flow", SignalActionType.NAVIGATE, "reports")
                    )
                )
            } else if (totalIncome > 0 && totalExpense <= totalIncome * 0.7 && LocalDate.now(zone).dayOfMonth >= 10) {
                val savingsRate = ((totalIncome - totalExpense) / totalIncome * 100).toInt()
                signals.add(
                    FinancialSignal(
                        category = SignalCategory.CASH_FLOW,
                        severity = SignalSeverity.POSITIVE,
                        title = "Strong Savings Rate",
                        explanation = "You have maintained a ${savingsRate}% savings rate so far this month.",
                        evidence = "income=${totalIncome}, expense=${totalExpense}",
                        dedupKey = "cashflow_savings_${LocalDate.now(zone).monthValue}"
                    )
                )
            }
        } catch (_: Exception) {}

        // 3. Planned / Recurring Payments
        try {
            val plannedRules = plannedPaymentRuleDao.findAll()
            val nextThreeDays = now.plus(3, ChronoUnit.DAYS)
            for (rule in plannedRules) {
                val startDate = rule.startDate
                if (startDate != null && startDate.isAfter(now.minus(1, ChronoUnit.DAYS)) && startDate.isBefore(nextThreeDays)) {
                    signals.add(
                        FinancialSignal(
                            category = SignalCategory.RECURRING,
                            severity = SignalSeverity.HIGH,
                            title = "Upcoming Planned Payment",
                            explanation = "${rule.title ?: "Planned payment"} of ${String.format("%.2f", rule.amount)} is due within 3 days.",
                            evidence = "amount=${rule.amount}, date=${startDate}",
                            relatedEntityId = rule.id.toString(),
                            relatedEntityType = "planned_payment",
                            dedupKey = "planned_due_${rule.id}",
                            recommendedAction = SignalAction("View Payment", SignalActionType.NAVIGATE, "planned")
                        )
                    )
                }
            }
        } catch (_: Exception) {}

        // 4. Loans & Commitments
        try {
            val loans = loanDao.findAll()
            for (loan in loans) {
                val records = loanRecordDao.findAllByLoanId(loan.id)
                val totalAmount = loan.amount
                val paidAmount = records.sumOf { it.amount }
                val remaining = totalAmount - paidAmount
                if (remaining > 0) {
                    signals.add(
                        FinancialSignal(
                            category = SignalCategory.PACT,
                            severity = SignalSeverity.MEDIUM,
                            title = "Active Loan Commitment",
                            explanation = "${loan.name} has an outstanding balance of ${String.format("%.2f", remaining)}.",
                            evidence = "remaining=${remaining}",
                            relatedEntityId = loan.id.toString(),
                            relatedEntityType = "loan",
                            dedupKey = "loan_active_${loan.id}",
                            recommendedAction = SignalAction("View Loan", SignalActionType.NAVIGATE, "loans")
                        )
                    )
                }
            }
        } catch (_: Exception) {}

        // Filter out dismissed & active snoozed signals
        val currentTimeMillis = System.currentTimeMillis()
        val filtered = signals.filter { signal ->
            if (dismissedKeys.contains(signal.dedupKey)) return@filter false
            val snoozedUntil = snoozedKeys[signal.dedupKey]
            if (snoozedUntil != null && currentTimeMillis < snoozedUntil) return@filter false
            true
        }

        // Deduplicate by dedupKey (keep highest severity)
        val deduplicated = filtered.groupBy { it.dedupKey }.map { (_, group) ->
            group.minByOrNull { it.severity.ordinal } ?: group.first()
        }

        // Sort deterministically: severity (CRITICAL -> HIGH -> MEDIUM -> LOW -> POSITIVE) then timestamp
        return deduplicated.sorted()
    }

    fun getSignalsFlow(): Flow<List<FinancialSignal>> = flow {
        emit(evaluateSignals())
    }

    private fun calculateBudgetSpent(budget: BudgetEntity, transactions: List<TransactionEntity>): Double {
        val categoryIds = parseIds(budget.categoryIdsSerialized)
        val accountIds = parseIds(budget.accountIdsSerialized)

        return transactions
            .filter { it.type == TransactionType.EXPENSE }
            .filter { t ->
                val matchesCategory = categoryIds.isEmpty() || (t.categoryId != null && categoryIds.contains(t.categoryId))
                val matchesAccount = accountIds.isEmpty() || accountIds.contains(t.accountId)
                matchesCategory && matchesAccount
            }
            .sumOf { it.amount }
    }

    private fun parseIds(serialized: String?): Set<UUID> {
        if (serialized.isNullOrBlank()) return emptySet()
        return serialized.split(",")
            .mapNotNull {
                try {
                    UUID.fromString(it.trim())
                } catch (_: Exception) {
                    null
                }
            }
            .toSet()
    }
}
