package com.ivy.agent

import com.ivy.canafford.CanIAffordCalculator
import com.ivy.canafford.CanIAffordResult
import com.ivy.canafford.AffordabilityState
import com.ivy.data.model.primitive.UUID
import java.time.Instant

class AffordabilityQueryCapability(
    private val calculator: CanIAffordCalculator = CanIAffordCalculator()
) : AgentCapability() {

    override val supportedIntents: List<AgentIntentType> =
        listOf(AgentIntentType.AFFORDABILITY_QUERY)

    override val requiredPermission: AgentPermissionLevel = AgentPermissionLevel.READ

    override fun execute(intent: AgentIntent): AgentCapabilityResult {
        val amount = intent.amount ?: return AgentCapabilityResult(
            success = false,
            explanation = "Please specify an amount to check affordability for."
        )

        val scenario = com.ivy.canafford.CanIAffordScenario(
            amount = amount,
            transactionType = com.ivy.base.model.TransactionType.DEBIT,
            accountId = intent.accountId,
            categoryId = intent.categoryId,
            description = intent.queryText,
            purchaseDate = Instant.now()
        )

        val result = calculator.simulate(scenario, 50000.0, listOf())

        val explanation = buildAffordabilityExplanation(result)

        val data = mapOf(
            "state" to result.state.value,
            "scenarioAmount" to amount,
            "currentBalance" to result.currentBalance,
            "projectedLowestBalance" to result.projectedLowestBalance,
            "endingBalance" to result.endingBalance,
            "balanceDelta" to result.balanceDelta,
            "guardrailImpact" to result.guardrailImpact,
            "budgetImpact" to result.budgetImpact,
            "goalImpact" to result.goalImpact
        )

        AgentCapabilityResult(
            success = true,
            explanation = explanation,
            data = data
        )
    }

    private fun buildAffordabilityExplanation(result: CanIAffordResult): String {
        val formatted = { d: Double -> d.format("%.0f") }

        when (result.state) {
            AffordabilityState.COMFORTABLE -> {
                "You can make this purchase without violating any guardrails, budgets, or goals."
            }
            AffordabilityState.TIGHT -> {
                "You can make this purchase, but it would impact your financial position.\n" +
                result.why ?: "This purchase would affect your financial position."
            }
            AffordabilityState.NOT_AFFORDABLE -> {
                "This purchase is not affordable given your current financial position.\n" +
                result.why ?: "Insufficient funds available."
            }
            AffordabilityState.INSUFFICIENT_DATA -> {
                "Not enough information to confidently simulate this purchase.\n" +
                result.why ?: "Missing required information."
            }
        }
    }
}