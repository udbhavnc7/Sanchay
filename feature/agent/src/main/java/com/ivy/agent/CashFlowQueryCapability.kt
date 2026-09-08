package com.ivy.agent

import com.ivy.cashflow.CashFlowCalculator
import com.ivy.cashflow.CashFlowForecast
import com.ivy.cashflow.CashFlowHealth
import com.ivy.data.model.primitive.UUID
import java.time.Instant
import java.util.*

class CashFlowQueryCapability(
    private val cashFlowCalculator: CashFlowCalculator = CashFlowCalculator
) : AgentCapability() {

    override val supportedIntents: List<AgentIntentType> =
        listOf(AgentIntentType.CASH_FLOW_QUERY)

    override val requiredPermission: AgentPermissionLevel = AgentPermissionLevel.READ

    override fun execute(intent: AgentIntent): AgentCapabilityResult {
        // Get current balance from context
        val currentBalance = 50000.0 // In real implementation, query from accounts

        // Build baseline events from existing data
        val baselineEvents = buildBaselineEvents()

        // Calculate 30-day forecast
        val forecast = cashFlowCalculator.calculate(
            currentBalance = currentBalance,
            events = baselineEvents,
            horizonDays = 30,
            includeGoals = true,
            includeCommitments = true
        )

        val explanation = buildCashFlowExplanation(forecast)

        AgentCapabilityResult(
            success = true,
            explanation = explanation,
            data = mapOf(
                "currentBalance" to currentBalance,
                "endingBalance" to forecast.endingBalance,
                "lowestProjectedBalance" to forecast.lowestProjectedBalance,
                "healthState" to forecast.healthState,
                "healthExplanation" to forecast.healthExplanation,
                "totalInflow" to forecast.totalExpectedInflow,
                "totalOutflow" to forecast.totalExpectedOutflow,
                "totalCommitted" to forecast.totalCommitted,
                "totalGoalContributions" to forecast.totalGoalContributions,
                "horizonDays" to 30
            )
        )
    }

    private fun buildBaselineEvents(): List<com.ivy.cashflow.CashFlowEvent> {
        // Build baseline events from existing transactions, commitments, goals
        // This is a simplified version - real implementation would query actual data
        return listOf(
            com.ivy.cashflow.CashFlowEvent.Baseline
        )
    }

    private fun buildCashFlowExplanation(forecast: CashFlowForecast): String {
        val formatted = { d: Double -> d.format("%.0f") }

        val header = "Your projected cash flow for the next 30 days."
        val currentInfo = "Current balance: ₹${formatted(forecast.currentBalance)}"
        val endingInfo = "Ending balance: ₹${formatted(forecast.lowestProjectedBalance)}"
        val lowestInfo = "Lowest projected balance: ₹${formatted(forecast.lowestProjectedBalance)}"
        val healthInfo = "Health: ${forecast.healthState.display}"

        return "$header $currentInfo. $lowestInfo. $healthInfo."
    }
}