package com.ivy.agent

import com.ivy.base.model.TransactionType
import com.ivy.data.db.entity.PaymentRuleEntity
import com.ivy.data.db.dao.read.PaymentRuleDao
import java.util.*

class CommitmentQueryCapability(
    private val paymentRuleDao: PaymentRuleDao
) : AgentCapability() {

    override val supportedIntents: List<AgentIntentType> =
        listOf(AgentIntentType.COMMITMENT_QUERY)

    override val requiredPermission: AgentPermissionLevel = AgentPermissionLevel.READ

    override fun execute(intent: AgentIntent): AgentCapabilityResult {
        val commitments = paymentRuleDao.findAllActive()

        if (commitments.isEmpty()) {
            return AgentCapabilityResult(
                success = true,
                explanation = "You don't have any upcoming commitments.",
                data = mapOf("hasCommitments" to false)
            )
        }

        // Sort by due date, earliest first
        val sorted = commitments.sortedBy { it.dueDate }

        // Build explanation for upcoming commitments
        val upcoming = sorted.take(3) // Show top 3 upcoming
        val explanation = buildCommitmentExplanation(upcoming)

        val data = mapOf(
            "hasCommitments" to true,
            "commitmentCount" to commitments.size,
            "upcomingCommitments" to upstreamCommitments.map { mapOf(
                "description" to it.description,
                "amount" to it.amount,
                "dueDate" to it.dueDate?.toString(),
                "recurring" to it.isRecurring
            ) }
        )

        AgentCapabilityResult(
            success = true,
            explanation = explanation,
            data = data
        )
    }

    private fun buildCommitmentExplanation(upcoming: List</* PaymentRuleEntity */>): String {
        if (upcoming.isEmpty()) {
            return "No upcoming commitments."
        }

        val first = upcoming.first()
        val amount = first.amount.format("%.0f")

        return "You have ₹$amount committed. "
    }
}