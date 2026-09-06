package com.ivy.agent

import com.ivy.data.db.entity.FinancialRuleEntity
import com.ivy.data.db.dao.read.FinancialRuleDao
import java.util.*

class GuardrailQueryCapability(
    private val ruleDao: FinancialRuleDao
) : AgentCapability() {

    override val supportedIntents: List<AgentIntentType> =
        listOf(AgentIntentType.GUARDRAIL_QUERY)

    override val requiredPermission: AgentPermissionLevel = AgentPermissionLevel.READ

    override fun execute(intent: AgentIntent): AgentCapabilityResult {
        val activeRules = ruleDao.findEnabled()

        if (activeRules.isEmpty()) {
            return AgentCapabilityResult(
                success = true,
                explanation = "You don't have any active financial rules/guardrails.",
                data = mapOf("hasActiveRules" to false)
            )
        }

        // Build explanation of active guardrails
        val ruleSummaries = activeRules.map { rule ->
            when (rule.triggerType) {
                "spending_threshold" -> "Spending guardrail for ${rule.name}"
                "budget_threshold" -> "Budget guardrail for ${rule.name}"
                "projected_balance" -> "Balance guardrail for ${rule.name}"
                "commitment_due_soon" -> "Payment due soon guardrail"
                "pact_overdue" -> "Overdue obligation guardrail"
                "goal_behind_pace" -> "Goal progress guardrail"
                "purchase_return" -> "Return deadline guardrail"
                "purchase_warranty" -> "Warranty expiry guardrail"
                else -> rule.name
            }
        }

        val explanation = "Your active guardrails: ${ruleSummaries.joinToString(", ")}."

        AgentCapabilityResult(
            success = true,
            explanation = explanation,
            data = mapOf(
                "activeRuleCount" to activeRules.size,
                "activeRules" to ruleSummaries,
                "hasActiveRules" to true
            )
        )
    }
}