package com.ivy.agent

import com.ivy.base.model.TransactionType
import com.ivy.data.db.entity.TransactionEntity
import com.ivy.data.db.dao.read.TransactionDao
import com.ivy.data.model.Category
import java.time.Instant
import java.util.*

class TransactionQueryCapability(
    private val transactionDao: TransactionDao
) : AgentCapability() {

    override val supportedIntents: List<AgentIntentType> =
        listOf(
            AgentIntentType.TRANSACTION_QUERY,
            AgentIntentType.BALANCE_QUERY
        )

    override val requiredPermission: AgentPermissionLevel = AgentPermissionLevel.READ

    override fun execute(intent: AgentIntent): AgentCapabilityResult {
        return when (intent.intent) {
            AgentIntentType.TRANSACTION_QUERY -> {
                val period = inferPeriod(intent.queryText ?: "")
                val transactions = transactionDao.findAll()
                        .filter { /* filter by period and category */ it }

                val amountByCategory = transactions
                    .filter { it.categoryId != null }
                    .groupBy { categoryDao.findById(it.categoryId!!)?.name ?: "Unknown" }
                    .eachCount()

                val totalSpent = transactions
                    .sumOf { if (it.type == TransactionType.DEBIT) it.amount else 0.0 }

                val explanation = buildTransactionExplanation(
                    totalSpent = totalSpent,
                    amountByCategory = amountByCategory,
                    period = period
                )

                AgentCapabilityResult(
                    success = true,
                    explanation = explanation,
                    data = mapOf(
                        "totalSpent" to totalSpent,
                        "amountByCategory" to amountByCategory,
                        "period" to period
                    )
                )
            }

            AgentIntentType.BALANCE_QUERY -> {
                val currentBalance = /* query account balance */ 0.0
                val explanation = "Your current balance is ₹${currentBalance.format("%.0f")}."

                AgentCapabilityResult(
                    success = true,
                    explanation = explanation,
                    data = mapOf("currentBalance" to currentBalance)
                )
            }

            else -> AgentCapabilityResult(
                success = false,
                explanation = "Unsupported intent type."
            )
        }
    }

    private fun inferPeriod(queryText: String): String {
        val lower = queryText.lowercase()
        return when {
            lower.contains("this month") -> "this month"
            lower.contains("last month") -> "last month"
            lower.contains("this week") -> "this week"
            lower.contains("last week") -> "last week"
            else -> "this month" // default
        }
    }

    private fun buildTransactionExplanation(
        totalSpent: Double,
        amountByCategory: Map<String, Int>,
        period: String
    ): String {
        val totalFormatted = totalSpent.format("%.0f")
        val header = "You spent ₹$totalFormatted on $period."

        if (amountByCategory.isEmpty()) {
            return header
        }

        val topCategory = amountByCategory.entries.maxBy { it.value }!!
        val breakdown = "₹${topCategory.value.format("%.0f")} on ${topCategory.key}."

        return "$header $breakdown"
    }
}