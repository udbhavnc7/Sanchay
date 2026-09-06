package com.ivy.cashflow

import com.ivy.base.model.TransactionType
import com.ivy.data.model.primitive.UUID
import java.time.Instant
import java.time.temporal.ChronoUnit

/** The result of a cash flow forecast calculation. */
@Immutable
data class CashFlowForecast(
    val horizonDays: Int,
    val currentBalance: Double,
    val totalExpectedInflow: Double,
    val totalExpectedOutflow: Double,
    val totalCommitted: Double,
    val totalGoalContributions: Double,
    val lowestProjectedBalance: Double,
    val endingBalance: Double,
    val lowestDate: Instant?,
    val timeline: List<CashFlowPoint>,
    val healthState: CashFlowHealth,
    val healthExplanation: String?,
    val eventsSummary: String?
)

/** Cash flow health state. */
sealed class CashFlowHealth(val value: String, val display: String) {

    companion object {
        /** Projected balance stays positive throughout the horizon. */
        object Healthy : CashFlowHealth("healthy", "On track") {
            override fun toString(): String = "HEALTHY"
        }

        /** Projected balance becomes low but remains positive. */
        object Tight : CashFlowHealth("tight", "Tight") {
            override fun toString(): String = "TIGHT"
        }

        /** Projected balance may fall below zero or cannot cover obligations. */
        object AtRisk : CashFlowHealth("at_risk", "At risk") {
            override fun toString(): String = "AT_RISK"
        }
    }
}

/** Cash flow calculator - deterministic forecasting engine. */
object CashFlowCalculator {

    /** Calculate a cash flow forecast.
     *
     * @param currentBalance The user's actual current balance
     * @param events Future events sorted by date
     * @param horizonDays The forecast horizon in days from today
     * @param includeGoals Whether to include explicitly planned goal contributions
     * @param includeCommitments Whether to include recurring commitments
     * @return CashFlowForecast with complete timeline and health assessment
     */
    fun calculate(
        currentBalance: Double,
        events: List<CashFlowEvent>,
        horizonDays: Int,
        includeGoals: Boolean = true,
        includeCommitments: Boolean = true
    ): CashFlowForecast {

        val today = Instant.now()
        val horizon = today.plusDays(horizonDays)
        val sortedEvents = events.sortedBy { it.date }

        // Filter events within horizon
        val futureEvents = sortedEvents.filter { it.date.isBefore(horizon) || it.date.equals(horizon) }

        // Separate events by type for clarity
        val inflowEvents = futureEvents.filterIsInflow()
        val outflowEvents = futureEvents.filterIsOutflow()
        val commitmentEvents = if (includeCommitments) futureEvents.filterIsCommitment() else emptyList()
        val goalContributionEvents = if (includeGoals) futureEvents.filterIsGoalContribution() else emptyList()

        // Build timeline
        val timeline = buildTimeline(
            today = today,
            currentBalance = currentBalance,
            inflowEvents = inflowEvents,
            outflowEvents = outflowEvents,
            commitmentEvents = commitmentEvents,
            goalContributionEvents = goalContributionEvents,
            horizon = horizon
        )

        // Calculate totals
        val totalInflow = inflowEvents.sumOf { it.inflow }
        val totalOutflow = outflowEvents.sumOf { it.outflow }
        val totalCommitted = commitmentEvents.sumOf { it.amount }
        val totalGoalContributions = goalContributionEvents.sumOf { it.amount }

        // Calculate ending balance
        val endingBalance = currentBalance + totalInflow - totalOutflow - totalCommitted - totalGoalContributions

        // Calculate lowest projected balance
        val (lowestProjectedBalance, lowestDate) = calculateLowestProjectedBalance(timeline)

        // Determine health state
        val (healthState, healthExplanation) = determineHealth(
            currentBalance = currentBalance,
            endingBalance = endingBalance,
            lowestProjectedBalance = lowestProjectedBalance,
            timeline = timeline
        )

        // Build summary
        val eventsSummary = buildSummary(
            inflowEvents = inflowEvents,
            outflowEvents = outflowEvents,
            commitmentEvents = commitmentEvents,
            goalContributionEvents = goalContributionEvents
        )

        return CashFlowForecast(
            horizonDays = horizonDays,
            currentBalance = currentBalance,
            totalExpectedInflow = totalInflow,
            totalExpectedOutflow = totalOutflow,
            totalCommitted = totalCommitted,
            totalGoalContributions = totalGoalContributions,
            lowestProjectedBalance = lowestProjectedBalance,
            endingBalance = endingBalance,
            lowestDate = lowestDate,
            timeline = timeline,
            healthState = healthState,
            healthExplanation = healthExplanation,
            eventsSummary = eventsSummary
        )
    }

    /** Build the chronological timeline of cash flow points. */
    private fun buildTimeline(
        today: Instant,
        currentBalance: Double,
        inflowEvents: List<CashFlowEvent.Inflow>,
        outflowEvents: List<CashFlowEvent.Outflow>,
        commitmentEvents: List<CashFlowEvent.Commitment>,
        goalContributionEvents: List<CashFlowEvent.GoalContribution>,
        horizon: Instant
    ): List<CashFlowPoint> {

        val points = mutableListOf<CashFlowPoint>()
        var balance = currentBalance
        var currentDate = today

        // Add starting point
        points.add(CashFlowPoint(
            date = today,
            startingBalance = balance,
            inflow = 0.0,
            outflow = 0.0,
            committedAmount = 0.0,
            goalContribution = 0.0,
            endingBalance = balance,
            events = listOf(CashFlowEvent.Baseline),
            explanation = "Forecast start"
        ))

        // Process events in chronological order
        val allEvents = inflowEvents + outflowEvents + commitmentEvents + goalContributionEvents
        val sortedEvents = allEvents.sortedBy { it.date }

        for (event in sortedEvents) {
            // Advance date to event date
            if (event.date.isAfter(currentDate)) {
                // Add any intermediate points if needed
                // For simplicity, we just record the event
            }

            // Apply the event
            when (event) {
                is CashFlowEvent.Inflow -> {
                    balance += event.amount
                }
                is CashFlowEvent.Outflow -> {
                    balance -= event.amount
                }
                is CashFlowEvent.Commitment -> {
                    balance -= event.amount
                }
                is CashFlowEvent.GoalContribution -> {
                    balance -= event.amount
                }
                CashFlowEvent.Baseline -> {}
            }

            // Record the point after this event
            points.add(CashFlowPoint(
                date = event.date,
                startingBalance = if (points.isEmpty()) currentBalance else points.last().endingBalance,
                inflow = when (event) is CashFlowEvent.Inflow then event.amount else 0.0,
                outflow = when (event) is CashFlowEvent.Outflow then event.amount
                    else when (event) is CashFlowEvent.Commitment then event.amount
                    else when (event) is CashFlowEvent.GoalContribution then event.amount
                    else 0.0,
                committedAmount = when (event) is CashFlowEvent.Commitment then event.amount else 0.0,
                goalContribution = when (event) is CashFlowEvent.GoalContribution then event.amount else 0.0,
                endingBalance = balance,
                events = listOf(event),
                explanation = when (event) is CashFlowEvent.Inflow {
                    "Inflow: ${event.source}"
                } else when (event) is CashFlowEvent.Outflow {
                    "Outflow: ${event.source}"
                } else when (event) is CashFlowEvent.Commitment {
                    "Commitment: ${event.source}"
                } else when (event) is CashFlowEvent.GoalContribution {
                    "Goal contribution: ${event.source}"
                } else -> null
            ))
        }

        // Add final point at horizon
        points.add(CashFlowPoint(
            date = horizon,
            startingBalance = points.last().endingBalance,
            inflow = 0.0,
            outflow = 0.0,
            committedAmount = 0.0,
            goalContribution = 0.0,
            endingBalance = balance,
            events = listOf(CashFlowEvent.Baseline),
            explanation = "Forecast end"
        ))

        return points
    }

    /** Calculate the lowest projected balance and its date. */
    private fun calculateLowestProjectedBalance(timeline: List<CashFlowPoint>): Pair<Double, Instant?> {
        var lowest = timeline.first().endingBalance
        var lowestDate: Instant? = timeline.first().date

        for (point in timeline) {
            if (point.endingBalance < lowest) {
                lowest = point.endingBalance
                lowestDate = point.date
            }
        }

        return Pair(lowest, lowestDate)
    }

    /** Determine the cash flow health state and explanation. */
    private fun determineHealth(
        currentBalance: Double,
        endingBalance: Double,
        lowestProjectedBalance: Double,
        timeline: List<CashFlowPoint>
    ): Pair<CashFlowHealth, String?> {

        // If the lowest projected balance is negative, AT_RISK
        if (lowestProjectedBalance < 0.0) {
            val explanation = "Projected balance may fall below ₹0 ${lowestProjectedBalance.format("%.0f")} before the horizon ends"
            return Pair(CashFlowHealth.AtRisk, explanation)
        }

        // If the ending balance is low relative to current balance, TIGHT
        val balanceDrop = currentBalance - endingBalance
        if (balanceDrop >= currentBalance * 0.5 && balanceDrop < currentBalance) {
            val explanation = "Projected balance decreases significantly (₹${balanceDrop.format("%.0f")} drop from current)"
            return Pair(CashFlowHealth.Tight, explanation)
        }

        // Otherwise HEALTHY
        val explanation = "Projected balance stays positive over the forecast horizon"
        return Pair(CashFlowHealth.Healthy, explanation)
    }

    /** Build a human-readable summary of all events. */
    private fun buildSummary(
        inflowEvents: List<CashFlowEvent.Inflow>,
        outflowEvents: List<CashFlowEvent.Outflow>,
        commitmentEvents: List<CashFlowEvent.Commitment>,
        goalContributionEvents: List<CashFlowEvent.GoalContribution>
    ): String? {
        val parts = mutableListOf<String>()

        if (inflowEvents.isNotEmpty()) {
            val total = inflowEvents.sumOf { it.amount }
            parts.add("Expected income: ₹${total.format("%.0f")}")
        }

        if (outflowEvents.isNotEmpty()) {
            val total = outflowEvents.sumOf { it.amount }
            parts.add("Expected expenses: ₹${total.format("%.0f")}")
        }

        if (commitmentEvents.isNotEmpty()) {
            val total = commitmentEvents.sumOf { it.amount }
            parts.add("Committed: ₹${total.format("%.0f")}")
        }

        if (goalContributionEvents.isNotEmpty()) {
            val total = goalContributionEvents.sumOf { it.amount }
            parts.add("Goal contributions: ₹${total.format("%.0f")}")
        }

        if (parts.isEmpty()) return null
        return parts.joinToString("\n")
    }
}

/** Extension functions for CashFlowEvent filtering. */
private fun List<CashFlowEvent>.filterIsInflow(): List<CashFlowEvent.Inflow> {
    return this.filterIsInstance<CashFlowEvent.Inflow>()
}

private fun List<CashFlowEvent>.filterIsOutflow(): List<CashFlowEvent.Outflow> {
    return this.filterIsInstance<CashFlowEvent.Outflow>()
}

private fun List<CashFlowEvent>.filterIsCommitment(): List<CashFlowEvent.Commitment> {
    return this.filterIsInstance<CashFlowEvent.Commitment>()
}

private fun List<CashFlowEvent>.filterIsGoalContribution(): List<CashFlowEvent.GoalContribution> {
    return this.filterIsInstance<CashFlowEvent.GoalContribution>()
}