package com.ivy.canafford

import com.ivy.base.model.TransactionType
import com.ivy.cashflow.CashFlowCalculator
import com.ivy.cashflow.CashFlowEvent
import com.ivy.cashflow.CashFlowForecast
import com.ivy.cashflow.CashFlowHealth
import com.ivy.data.db.entity.FinancialRuleEntity
import com.ivy.data.model.primitive.UUID
import com.ivy.data.db.dao.read.BudgetDao
import com.ivy.data.db.dao.read.GoalDao
import com.ivy.data.db.dao.read.CategoryDao
import com.ivy.data.db.dao.read.TransactionDao
import com.ivy.data.db.dao.read.FinancialRuleDao
import com.ivy.data.db.entity.TransactionEntity
import com.ivy.data.model.Category
import java.time.Instant
import java.util.*
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class CanIAffordCalculator(
    private val cashFlowCalculator: CashFlowCalculator = CashFlowCalculator,
    private val budgetDao: BudgetDao? = null,
    private val goalDao: GoalDao? = null,
    private val categoryDao: CategoryDao? = null,
    private val transactionDao: TransactionDao? = null,
    private val financialRuleDao: FinancialRuleDao? = null,
) {

    /** Run a Can-I-Afford simulation.
     *  This is a READ-ONLY operation that does NOT mutate any financial data.
     */
    fun simulate(scenario: CanIAffordScenario,
                 currentBalance: Double,
                 existingEvents: List<CashFlowEvent> = listOf()): CanIAffordResult {

        // Step 1: Calculate baseline forecast
        val baseline = calculateBaseline(currentBalance, existingEvents)

        // Step 2: Calculate hypothetical scenario forecast
        val hypotheticalEvents = injectHypotheticalEvents(scenario, currentBalance, existingEvents)
        val scenarioForecast = calculateScenarioForecast(currentBalance, hypotheticalEvents, baseline)

        // Step 3: Evaluate guardrails/rules
        val guardrailEvaluation = evaluateGuardrails(scenario, baseline, scenarioForecast)

        // Step 4: Evaluate budget impact
        val budgetEvaluation = evaluateBudgetImpact(scenario, baseline, scenarioForecast)

        // Step 5: Evaluate goal impact
        val goalEvaluation = evaluateGoalImpact(scenario, baseline, scenarioForecast)

        // Step 6: Evaluate commitment impact
        val commitmentEvaluation = evaluateCommitmentImpact(scenario, baseline, scenarioForecast)

        // Step 7: Determine final affordability state
        return determineResult(
            baseline = baseline,
            scenarioForecast = scenarioForecast,
            guardrailEvaluation = guardrailEvaluation,
            budgetEvaluation = budgetEvaluation,
            goalEvaluation = goalEvaluation,
            commitmentEvaluation = commitmentEvaluation
        )
    }

    /** Calculate baseline cash flow forecast without any hypothetical changes. */
    private fun calculateBaseline(currentBalance: Double, events: List<CashFlowEvent>): CashFlowForecast {
        return cashFlowCalculator.calculate(
            currentBalance = currentBalance,
            events = events,
            horizonDays = 30,
            includeGoals = true,
            includeCommitments = true
        )
    }

    /** Inject hypothetical purchase events into the event list. */
    private fun injectHypotheticalEvents(
        scenario: CanIAffordScenario,
        currentBalance: Double,
        existingEvents: List<CashFlowEvent>
    ): List<CashFlowEvent> {
        val events = mutableListOf<CashFlowEvent>(existingEvents)

        // Add one-time purchase outflow
        events.add(CashFlowEvent.Outflow(
            date = scenario.purchaseDate,
            amount = scenario.amount,
            source = scenario.description,
            description = scenario.description,
            confidence = CashFlowConfidence.KNOWN
        ))

        // Add recurring if configured
        if (scenario.isRecurring && scenario.recurringAmount != null) {
            // For V1, we only simulate the first occurrence
            // Recurring rules are NOT created - this remains hypothetical
            events.add(CashFlowEvent.Outflow(
                date = scenario.purchaseDate,
                amount = scenario.recurringAmount!!,
                source = "Recurring: ${scenario.description}",
                description = "Recurring: ${scenario.description}",
                confidence = CashFlowConfidence.EXPECTED
            ))
        }

        return events
    }

    /** Calculate the scenario forecast with hypothetical events injected. */
    private fun calculateScenarioForecast(
        currentBalance: Double,
        hypotheticalEvents: List<CashFlowEvent>,
        baseline: CashFlowForecast
    ): CashFlowForecast {
        return cashFlowCalculator.calculate(
            currentBalance = currentBalance,
            events = hypotheticalEvents,
            horizonDays = 30,
            includeGoals = true,
            includeCommitments = true
        )
    }

    /** Evaluate guardrail impact from the scenario. */
    private fun evaluateGuardrails(
        scenario: CanIAffordScenario,
        baseline: CashFlowForecast,
        scenarioForecast: CashFlowForecast
    ): String? {
        // Check if any active rules would be breached
        if (financialRuleDao != null) {
            val rules = financialRuleDao.findAllActive()
            for (rule in rules) {
                when (rule.triggerType) {
                    "projected_balance" -> {
                        if (scenarioForecast.lowestProjectedBalance < rule.thresholdValue) {
                            return "Projected balance would fall to ${scenarioForecast.lowestProjectedBalance.format("%.0f")}, "
                                + "below your ${rule.name} guardrail of ${rule.thresholdValue.format("%.0f")}."
                        }
                    }
                }
            }
        }

        // Check cash flow health transition
        val baselineHealth = baseline.healthState
        val scenarioHealth = scenarioForecast.healthState

        if (baselineHealth != scenarioHealth) {
            return "This scenario would change your cash flow health from ${baselineHealth.display} to ${scenarioHealth.display}."
        }

        return null
    }

    /** Evaluate budget impact from the scenario. */
    private fun evaluateBudgetImpact(
        scenario: CanIAffordScenario,
        baseline: CashFlowForecast,
        scenarioForecast: CashFlowForecast
    ): String? {
        if (budgetDao == null || categoryDao == null || scenario.categoryId == null) {
            return null
        }

        // Find the budget for this category
        val category = categoryDao.findById(scenario.categoryId!!)!!
        val budget = budgetDao.findByCategoryId(category.id!!)

        if (budget == null) {
            return "No budget found for ${category.name} category."
        }

        // Calculate baseline spending vs budget
        val baselineSpending = calculateBaselineSpending(budget, existingEvents = [])
        val scenarioSpending = calculateBaselineSpending(budget, existingEvents = [])

        // The hypothetical purchase would add to this category's spending
        val hypotheticalCategorySpending = scenarioSpending + scenario.amount

        // Check budget health
        val baselineHealth = /* determine from budget */ "healthy"
        val scenarioHealth = if (hypotheticalCategorySpending >= budget.amount * 0.8) {
            "watch"
        } else if (hypotheticalCategorySpending >= budget.amount) {
            "exceeded"
        } else {
            "healthy"
        }

        if (baselineHealth != scenarioHealth) {
            return "Your ${category.name} budget would move from ${baselineHealth} to ${scenarioHealth} " + withScenarioSpending(hypotheticalCategorySpending, budget.amount)
        }

        return null
    }

    private fun withScenarioSpending(spending: Double, budgetAmount: Double): String {
        return "(spending would be ₹${spending.format("%.0f")} of ₹${budgetAmount.format("%.0f")} budget)"
    }

    /** Calculate baseline spending for a budget. */
    private fun calculateBaselineSpending(budget: /* BudgetEntity */, existingEvents: List<CashFlowEvent>): Double {
        // Use transaction filtering logic - simplified for V1
        // In a full implementation, this would filter transactions by category and date range
        return 0.0
    }

    /** Evaluate goal impact from the scenario. */
    private fun evaluateGoalImpact(
        scenario: CanIAffordScenario,
        baseline: CashFlowForecast,
        scenarioForecast: CashFlowForecast
    ): String? {
        if (goalDao == null) return null

        val goals = goalDao.findAll()
        if (goals.isEmpty()) return null

        // Check if the scenario would materially delay any goal
        val goalImpacts = mutableListOf<String>()

        for (goal in goals) {
            // Simplified: check if reduced available money would affect goal contribution
            val availableReduction = scenario.amount
            if (availableReduction > 0 && goal.targetAmount > 0) {
                goalImpacts.add("Your ${goal.name} goal contribution could be delayed by this purchase.")
            }
        }

        if (goalImpacts.isNotEmpty()) {
            return goalImpacts.joinToString(" ")
        }

        return null
    }

    /** Evaluate commitment impact from the scenario. */
    private fun evaluateCommitmentImpact(
        scenario: CanIAffordScenario,
        baseline: CashFlowForecast,
        scenarioForecast: CashFlowForecast
    ): String? {
        // The scenario should NOT modify existing commitments
        // Just report the impact on available balance after commitments
        val remainingAfterCommitments = scenarioForecast.endingBalance - scenarioForecast.totalCommitted

        if (remainingAfterCommitments < 0) {
            return "After known commitments, this scenario would leave a negative balance of ₹${abs(remainingAfterCommitments).format("%.0f")}."
        }

        return null
    }

    /** Determine the final affordability result. */
    private fun determineResult(
        baseline: CashFlowForecast,
        scenarioForecast: CashFlowForecast,
        guardrailEvaluation: String?,
        budgetEvaluation: String?,
        goalEvaluation: String?,
        commitmentEvaluation: String?
    ): CanIAffordResult {

        // Check for negative balance (critical)
        if (scenarioForecast.lowestProjectedBalance < 0.0) {
            return CanIAffordResult(
                state = AffordabilityState.NOT_AFFORDABLE,
                why = "This purchase would cause your projected balance to fall below ₹0 (₹${scenarioForecast.lowestProjectedBalance.format("%.0f")}).",
                currentBalance = baseline.currentBalance,
                projectedLowestBalance = scenarioForecast.lowestProjectedBalance,
                endingBalance = scenarioForecast.endingBalance,
                balanceDelta = scenarioForecast.endingBalance - baseline.currentBalance,
                commitmentsDelta = scenarioForecast.totalCommitted - baseline.totalCommitted,
                goalImpact = goalEvaluation,
                budgetImpact = budgetEvaluation,
                guardrailImpact = guardrailEvaluation,
                cashFlowHealth = scenarioForecast.healthState,
                cashFlowExplanation = scenarioForecast.healthExplanation
            )
        }

        // Check guardrail breach
        if (guardrailEvaluation != null) {
            return CanIAffordResult(
                state = AffordabilityState.TIGHT,
                why = guardrailEvaluation,
                currentBalance = baseline.currentBalance,
                projectedLowestBalance = scenarioForecast.lowestProjectedBalance,
                endingBalance = scenarioForecast.endingBalance,
                balanceDelta = scenarioForecast.endingBalance - baseline.currentBalance,
                commitmentsDelta = scenarioForecast.totalCommitted - baseline.totalCommitted,
                goalImpact = goalEvaluation,
                budgetImpact = budgetEvaluation,
                guardrailImpact = guardrailEvaluation,
                cashFlowHealth = scenarioForecast.healthState,
                cashFlowExplanation = scenarioForecast.healthExplanation
            )
        }

        // Check budget impact
        if (budgetEvaluation != null) {
            return CanIAffordResult(
                state = AffordabilityState.TIGHT,
                why = budgetEvaluation,
                currentBalance = baseline.currentBalance,
                projectedLowestBalance = scenarioForecast.lowestProjectedBalance,
                endingBalance = scenarioForecast.endingBalance,
                balanceDelta = scenarioForecast.endingBalance - baseline.currentBalance,
                commitmentsDelta = scenarioForecast.totalCommitted - baseline.totalCommitted,
                goalImpact = goalEvaluation,
                budgetImpact = budgetEvaluation,
                guardrailImpact = guardrailEvaluation,
                cashFlowHealth = scenarioForecast.healthState,
                cashFlowExplanation = scenarioForecast.healthExplanation
            )
        }

        // Check goal impact
        if (goalEvaluation != null) {
            return CanIAffordResult(
                state = AffordabilityState.TIGHT,
                why = goalEvaluation,
                currentBalance = baseline.currentBalance,
                projectedLowestBalance = scenarioForecast.lowestProjectedBalance,
                endingBalance = scenarioForecast.endingBalance,
                balanceDelta = scenarioForecast.endingBalance - baseline.currentBalance,
                commitmentsDelta = scenarioForecast.totalCommitted - baseline.totalCommitted,
                goalImpact = goalEvaluation,
                budgetImpact = budgetEvaluation,
                guardrailImpact = guardrailEvaluation,
                cashFlowHealth = scenarioForecast.healthState,
                cashFlowExplanation = scenarioForecast.healthExplanation
            )
        }

        // Commitment impact
        if (commitmentEvaluation != null) {
            return CanIAffordResult(
                state = AffordabilityState.TIGHT,
                why = commitmentEvaluation,
                currentBalance = baseline.currentBalance,
                projectedLowestBalance = scenarioForecast.lowestProjectedBalance,
                endingBalance = scenarioForecast.endingBalance,
                balanceDelta = scenarioForecast.endingBalance - baseline.currentBalance,
                commitmentsDelta = scenarioForecast.totalCommitted - baseline.totalCommitted,
                goalImpact = goalEvaluation,
                budgetImpact = budgetEvaluation,
                guardrailImpact = guardrailEvaluation,
                cashFlowHealth = scenarioForecast.healthState,
                cashFlowExplanation = scenarioForecast.healthExplanation
            )
        }

        // Default: comfortable
        return CanIAffordResult(
            state = AffordabilityState.COMFORTABLE,
            why = "You can make this purchase without violating any guardrails, budgets, or goals.",
            currentBalance = baseline.currentBalance,
            projectedLowestBalance = scenarioForecast.lowestProjectedBalance,
            endingBalance = scenarioForecast.endingBalance,
            balanceDelta = scenarioForecast.endingBalance - baseline.currentBalance,
            commitmentsDelta = scenarioForecast.totalCommitted - baseline.totalCommitted,
            goalImpact = goalEvaluation,
            budgetImpact = budgetEvaluation,
            guardrailImpact = guardrailEvaluation,
            cashFlowHealth = scenarioForecast.healthState,
            cashFlowExplanation = scenarioForecast.healthExplanation
        )
    }
}