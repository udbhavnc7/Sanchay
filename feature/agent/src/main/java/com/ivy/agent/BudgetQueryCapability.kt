package com.ivy.agent

import com.ivy.base.model.TransactionType
import com.ivy.data.db.entity.BudgetEntity
import com.ivy.data.db.dao.read.BudgetDao
import com.ivy.data.model.Category
import java.util.*

class BudgetQueryCapability(
    private val budgetDao: BudgetDao,
    private val categoryDao: /* CategoryDao */
) : AgentCapability() {

    override val supportedIntents: List<AgentIntentType> =
        listOf(AgentIntentType.BUDGET_QUERY)

    override val requiredPermission: AgentPermissionLevel = AgentPermissionLevel.READ

    override fun execute(intent: AgentIntent): AgentCapabilityResult {
        val categoryName = intent.categoryId?.let { categoryDao.findById(it)?.name ?: "unknown" } ?: "Food"

        // Find the budget for this category
        val budget = budgetDao.findByCategoryId(/* categoryId */ UUID.randomUUID())

        if (budget == null) {
            return AgentCapabilityResult(
                success = true,
                explanation = "You don't have a budget set up for $categoryName.",
                data = mapOf("category" to categoryName, "hasBudget" to false)
            )
        }

        // Calculate spending against budget
        val currentSpending = /* calculate from transactions */ 0.0
        val budgetAmount = budget.amount
        val remaining = budgetAmount - currentSpending
        val percentageUsed = if (budgetAmount > 0) (currentSpending / budgetAmount * 100.0) else 0.0

        val healthState = when {
            percentageUsed >= 100.0 -> "exceeded"
            percentageUsed >= 80.0 -> "watch"
            else -> "healthy"
        }

        val explanation = buildBudgetExplanation(
            category = categoryName,
            budgetAmount = budgetAmount,
            currentSpending = currentSpending,
            remaining = remaining,
            healthState = healthState,
            percentageUsed = percentageUsed
        )

        AgentCapabilityResult(
            success = true,
            explanation = explanation,
            data = mapOf(
                "category" to categoryName,
                "budgetAmount" to budgetAmount,
                "currentSpending" to currentSpending,
                "remaining" to remaining,
                "percentageUsed" to percentageUsed.toInt(),
                "healthState" to healthState,
                "hasBudget" to true
            )
        )
    }

    private fun buildBudgetExplanation(
        category: String,
        budgetAmount: Double,
        currentSpending: Double,
        remaining: Double,
        healthState: String,
        percentageUsed: Double
    ): String {
        val formattedAmt = { d: Double -> d.format("%.0f") }

        val header = "Your $category budget is ${healthState}."
        val budgetInfo = "₹${formattedAmt(budgetAmount)} budget • ₹${formattedAmt(currentSpending)} spent"
        val remainingInfo = "₹${formattedAmt(remaining)} remaining"
        val percentageInfo = "${percentageUsed.toInt()}% of budget used"

        return "$header $budgetInfo. $remainingInfo. $percentageInfo."
    }
}