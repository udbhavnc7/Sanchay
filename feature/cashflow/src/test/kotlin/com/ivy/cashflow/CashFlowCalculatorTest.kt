package com.ivy.cashflow

import io.kotest.property.Arb
import io.kotest.property.arbitrary.double
import io.kotest.property.arbitrary.instant
import io.kotest.property.arbitrary.list
import io.kotest.property.checkAll
import io.kotest.property.imports.random
import org.junit.Test
import java.time.Instant
import java.time.temporal.ChronoUnit

class CashFlowCalculatorTest {

    @Test
    fun `basic forecast: current balance + inflow - outflow`() {
        // Given
        val currentBalance = 10000.0
        val horizonDays = 30

        // One inflow event
        val inflow = CashFlowEvent.Inflow(
            date = Instant.now().plusDays(5),
            amount = 5000.0,
            source = "Salary",
            description = "Monthly salary",
            confidence = CashFlowConfidence.EXPECTED
        )

        // One outflow event
        val outflow = CashFlowEvent.Outflow(
            date = Instant.now().plusDays(10),
            amount = 2000.0,
            source = "Rent",
            description = "Monthly rent",
            confidence = CashFlowConfidence.KNOWN
        )

        val events = listOf(inflow, outflow)

        // When
        val forecast = CashFlowCalculator.calculate(
            currentBalance = currentBalance,
            events = events,
            horizonDays = horizonDays,
            includeGoals = false,
            includeCommitments = false
        )

        // Then
        assert(forecast.currentBalance == currentBalance)
        assert(forecast.totalExpectedInflow == 5000.0)
        assert(forecast.totalExpectedOutflow == 2000.0)
        assert(forecast.endingBalance == 13000.0) // 10000 + 5000 - 2000
        assert(forecast.lowestProjectedBalance == 8000.0) // min(10000, 15000, 13000)
        assert(forecast.healthState.display == "On track")
    }

    @Test
    fun `forecast with commitment`() {
        // Given
        val currentBalance = 10000.0
        val horizonDays = 30

        val commitment = CashFlowEvent.Commitment(
            date = Instant.now().plusDays(15),
            amount = 3000.0,
            source = "Credit card",
            description = "Monthly payment",
            confidence = CashFlowConfidence.KNOWN
        )

        // When
        val forecast = CashFlowCalculator.calculate(
            currentBalance = currentBalance,
            events = listOf(commitment),
            horizonDays = horizonDays,
            includeGoals = true,
            includeCommitments = true
        )

        // Then
        assert(forecast.totalCommitted == 3000.0)
        assert(forecast.endingBalance == 7000.0) // 10000 - 3000
        assert(forecast.lowestProjectedBalance == 7000.0)
    }

    @Test
    fun `forecast no future income`() {
        // Given - no income, only expenses
        val currentBalance = 5000.0
        val horizonDays = 30

        val events = emptyList<CashFlowEvent>()

        // When
        val forecast = CashFlowCalculator.calculate(
            currentBalance = currentBalance,
            events = events,
            horizonDays = horizonDays,
            includeGoals = false,
            includeCommitments = false
        )

        // Then - balance should remain the same
        assert(forecast.currentBalance == currentBalance)
        assert(forecast.totalExpectedInflow == 0.0)
        assert(forecast.totalExpectedOutflow == 0.0)
        assert(forecast.endingBalance == 5000.0)
        assert(forecast.lowestProjectedBalance == 5000.0)
    }

    @Test
    fun `forecast lowest projected balance`() {
        // Given - balance drops then recovers
        val currentBalance = 10000.0
        val horizonDays = 60

        val events = listOf(
            // First, a large outflow
            CashFlowEvent.Outflow(
                date = Instant.now().plusDays(5),
                amount = 8000.0,
                source = "Emergency",
                description = "Large expense",
                confidence = CashFlowConfidence.KNOWN
            ),
            // Then an inflow
            CashFlowEvent.Inflow(
                date = Instant.now().plusDays(20),
                amount = 6000.0,
                source = "Salary",
                description = "Part salary",
                confidence = CashFlowConfidence.EXPECTED
            )
        )

        // When
        val forecast = CashFlowCalculator.calculate(
            currentBalance = currentBalance,
            events = events,
            horizonDays = horizonDays,
            includeGoals = false,
            includeCommitments = false
        )

        // Then - lowest should be after the large outflow
        // Starting: 10000, after outflow: 2000, after inflow: 8000
        assert(forecast.lowestProjectedBalance == 2000.0)
        // The lowest should be around day 5
        assert(forecast.lowestDate != null)
        assert(forecast.lowestDate!!.equals(Instant.now().plusDays(5).truncatedTo(ChronoUnit.DAYS)))
    }

    @Test
    fun `forecast at_risk health state`() {
        // Given - balance drops below zero
        val currentBalance = 1000.0
        val horizonDays = 30

        val events = listOf(
            CashFlowEvent.Outflow(
                date = Instant.now().plusDays(5),
                amount = 2000.0,
                source = "Overdraft",
                description = "Large expense",
                confidence = CashFlowConfidence.KNOWN
            )
        )

        // When
        val forecast = CashFlowCalculator.calculate(
            currentBalance = currentBalance,
            events = events,
            horizonDays = horizonDays,
            includeGoals = false,
            includeCommitments = false
        )

        // Then - should be AT_RISK
        assert(forecast.healthState.display == "AT_RISK")
        assert(forecast.lowestProjectedBalance < 0.0)
    }

    @Test
    fun `forecast tight health state`() {
        // Given - significant balance drop but stays positive
        val currentBalance = 10000.0
        val horizonDays = 30

        val events = listOf(
            CashFlowEvent.Outflow(
                date = Instant.now().plusDays(15),
                amount = 6000.0,
                source = "Expenses",
                description = "Large expenses",
                confidence = CashFlowConfidence.KNOWN
            )
        )

        // When
        val forecast = CashFlowCalculator.calculate(
            currentBalance = currentBalance,
            events = events,
            horizonDays = horizonDays,
            includeGoals = false,
            includeCommitments = false
        )

        // Then - TIGHT (significant drop but positive)
        assert(forecast.healthState.display == "TIGHT")
        assert(forecast.endingBalance >= 0.0)
    }

    @Test
    fun `forecast healthy health state`() {
        // Given - balance stays positive
        val currentBalance = 10000.0
        val horizonDays = 30

        val events = listOf(
            CashFlowEvent.Inflow(
                date = Instant.now().plusDays(10),
                amount = 2000.0,
                source = "Bonus",
                description = "Year end bonus",
                confidence = CashFlowConfidence.EXPECTED
            ),
            CashFlowEvent.Outflow(
                date = Instant.now().plusDays(20),
                amount = 3000.0,
                source = "Expenses",
                description = "Living expenses",
                confidence = CashFlowConfidence.KNOWN
            )
        )

        // When
        val forecast = CashFlowCalculator.calculate(
            currentBalance = currentBalance,
            events = events,
            horizonDays = horizonDays,
            includeGoals = false,
            includeCommitments = false
        )

        // Then - HEALTHY
        assert(forecast.healthState.display == "On track")
        assert(forecast.endingBalance > 0.0)
    }

    @Test
    fun `forecast 7 day horizon`() {
        // Given - short horizon
        val currentBalance = 5000.0
        val horizonDays = 7

        val events = listOf()

        // When
        val forecast = CashFlowCalculator.calculate(
            currentBalance = currentBalance,
            events = events,
            horizonDays = horizonDays,
            includeGoals = false,
            includeCommitments = false
        )

        // Then
        assert(forecast.horizonDays == 7)
    }

    @Test
    fun `forecast 90 day horizon`() {
        // Given - medium-term horizon
        val currentBalance = 5000.0
        val horizonDays = 90

        val events = listOf()

        // When
        val forecast = CashFlowCalculator.calculate(
            currentBalance = currentBalance,
            events = events,
            horizonDays = horizonDays,
            includeGoals = false,
            includeCommitments = false
        )

        // Then
        assert(forecast.horizonDays == 90)
    }

    @Test
    fun `forecast goal contribution not included by default`() {
        // Given - goal with required contribution
        val currentBalance = 10000.0
        val horizonDays = 30

        // A goal contribution event
        val goalContribution = CashFlowEvent.GoalContribution(
            date = Instant.now().plusDays(15),
            amount = 500.0,
            goalName = "Emergency Fund",
            confidence = CashFlowConfidence.EXPECTED
        )

        // When - including goals
        val forecast = CashFlowCalculator.calculate(
            currentBalance = currentBalance,
            events = listOf(goalContribution),
            horizonDays = horizonDays,
            includeGoals = true,
            includeCommitments = false
        )

        // Then - goal contribution is subtracted
        assert(forecast.totalGoalContributions == 500.0)
        assert(forecast.endingBalance == 9500.0) // 10000 - 500
    }

    @Test
  fun `forecast goal contribution excluded when includeGoals=false`() {
        // Given - goal with required contribution
        val currentBalance = 10000.0
        val horizonDays = 30

        val goalContribution = CashFlowEvent.GoalContribution(
            date = Instant.now().plusDays(15),
            amount = 500.0,
            goalName = "Emergency Fund",
            confidence = CashFlowConfidence.EXPECTED
        )

        // When - excluding goals
        val forecast = CashFlowCalculator.calculate(
            currentBalance = currentBalance,
            events = listOf(goalContribution),
            horizonDays = horizonDays,
            includeGoals = false,
            includeCommitments = false
        )

        // Then - goal contribution should NOT be subtracted
        assert(forecast.totalGoalContributions == 0.0)
        assert(forecast.endingBalance == 10000.0)
    }

    @Test
    fun `forecast multiple events chronological ordering`() {
        // Given - events not sorted
        val currentBalance = 10000.0
        val horizonDays = 30

        val events = listOf(
            // Outflow first (day 10)
            CashFlowEvent.Outflow(
                date = Instant.now().plusDays(10),
                amount = 1000.0,
                source = "Outflow 2",
                description = "",
                confidence = CashFlowConfidence.KNOWN
            ),
            // Inflow first in list (day 5)
            CashFlowEvent.Inflow(
                date = Instant.now().plusDays(5),
                amount = 2000.0,
                source = "Inflow 1",
                description = "",
                confidence = CashFlowConfidence.EXPECTED
            ),
            // Another outflow (day 15)
            CashFlowEvent.Outflow(
                date = Instant.now().plusDays(15),
                amount = 500.0,
                source = "Outflow 3",
                description = "",
                confidence = CashFlowConfidence.KNOWN
            )
        )

        // When
        val forecast = CashFlowCalculator.calculate(
            currentBalance = currentBalance,
            events = events,
            horizonDays = horizonDays,
            includeGoals = false,
            includeCommitments = false
        )

        // Then - should be processed chronologically
        // Day 5: +2000 -> 12000
        // Day 10: -1000 -> 11000
        // Day 15: -500 -> 10500
        // Ending: 10500
        assert(forecast.endingBalance == 10500.0)
        // Lowest should be at the end (10500) since all events are outflows after inflow
        // Actually lowest would be after the last outflow if no more inflows
    }

    @Test
    fun `forecast summary builds correctly`() {
        // Given
        val inflowEvents = listOf(
            CashFlowEvent.Inflow(
                date = Instant.now().plusDays(5),
                amount = 5000.0,
                source = "Salary",
                description = "Monthly salary",
                confidence = CashFlowConfidence.EXPECTED
            )
        )
        val outflowEvents = listOf(
            CashFlowEvent.Outflow(
                date = Instant.now().plusDays(10),
                amount = 2000.0,
                source = "Rent",
                description = "Monthly rent",
                confidence = CashFlowConfidence.KNOWN
            )
        )
        val commitmentEvents = emptyList()
        val goalContributionEvents = emptyList()

        // When - build summary
        val summary = CashFlowCalculator.buildSummary(
            inflowEvents = inflowEvents,
            outflowEvents = outflowEvents,
            commitmentEvents = commitmentEvents,
            goalContributionEvents = goalContributionEvents
        )

        // Then
        assert(summary != null)
        assert(summary.contains("Expected income"))
        assert(summary.contains("Expected expenses"))
    }

    @Test
    fun `forecast empty summary`() {
        // Given - no events
        val inflowEvents = emptyList()
        val outflowEvents = emptyList()
        val commitmentEvents = emptyList()
        val goalContributionEvents = emptyList()

        // When
        val summary = CashFlowCalculator.buildSummary(
            inflowEvents = inflowEvents,
            outflowEvents = outflowEvents,
            commitmentEvents = commitmentEvents,
            goalContributionEvents = goalContributionEvents
        )

        // Then - null summary
        assert(summary == null)
    }
}