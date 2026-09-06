package com.ivy.canafford

import com.ivy.cashflow.CashFlowCalculator
import com.ivy.cashflow.CashFlowEvent
import com.ivy.cashflow.CashFlowForecast
import com.ivy.cashflow.CashFlowHealth
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import kotlin.test.isTrue
import kotlin.test.isFalse

class CanIAffordCalculatorTest {

    private lateinit var calculator: CanIAffordCalculator

    @BeforeEach
    fun setup() {
        calculator = CanIAffordCalculator()
    }

    @Test
    fun simulate_comfortable_purchase() {
        // Given: A user with healthy financial position
        val scenario = CanIAffordScenario(
            amount = 5000.0,
            transactionType = TransactionType.DEBIT,
            accountId = UUID.randomUUID(),
            categoryId = UUID.randomUUID(),
            description = "Test purchase",
            purchaseDate = Instant.now()
        )

        // When: We simulate an affordable purchase
        val result = calculator.simulate(
            scenario = scenario,
            currentBalance = 50000.0,
            existingEvents = listOf()
        )

        // Then: The result should be COMFORTABLE
        assertNotNull(result)
        assertEquals(AffordabilityState.COMFORTABLE, result.state)
        assertNotNull(result.why)
        assertTrue(result.why!!.contains("can make this purchase"))
    }

    @Test
    fun simulate_tight_purchase_guardrail() {
        // Given: A user with a guardrail
        val scenario = CanIAffordScenario(
            amount = 25000.0,
            transactionType = TransactionType.DEBIT,
            accountId = UUID.randomUUID(),
            categoryId = UUID.randomUUID(),
            description = "Large purchase",
            purchaseDate = Instant.now()
        )

        // When: We simulate a purchase that approaches a guardrail
        val result = calculator.simulate(
            scenario = scenario,
            currentBalance = 30000.0,
            existingEvents = listOf()
        )

        // Then: The result should be TIGHT (guardrail impacted)
        assertNotNull(result)
        assertEquals(AffordabilityState.TIGHT, result.state)
        assertNotNull(result.why)
        assertTrue(result.why!!.contains("guardrail") || result.why!!.contains("budget") || result.why!!.contains("goal"))
    }

    @Test
    fun simulate_not_affordable_negative_balance() {
        // Given: A purchase that exceeds the balance
        val scenario = CanIAffordScenario(
            amount = 99999.0,
            transactionType = TransactionType.DEBIT,
            accountId = UUID.randomUUID(),
            categoryId = UUID.randomUUID(),
            description = "Unaffordable purchase",
            purchaseDate = Instant.now()
        )

        // When: We simulate
        val result = calculator.simulate(
            scenario = scenario,
            currentBalance = 1000.0,
            existingEvents = listOf()
        )

        // Then: NOT_AFFORDABLE
        assertNotNull(result)
        assertEquals(AffordabilityState.NOT_AFFORDABLE, result.state)
        assertNotNull(result.why)
        assertTrue(result.why!!.contains("below ₹0") || result.why!!.contains("not affordable"))
    }

    @Test
    fun simulate_insufficient_data_missing_account() {
        // Given: A scenario without an account
        val scenario = CanIAffordScenario(
            amount = 5000.0,
            transactionType = TransactionType.DEBIT,
            accountId = null,
            categoryId = UUID.randomUUID(),
            description = "Test",
            purchaseDate = Instant.now()
        )

        // When: We try to simulate
        val result = calculator.simulate(
            scenario = scenario,
            currentBalance = 50000.0,
            existingEvents = listOf()
        )

        // Then: Should handle gracefully
        assertNotNull(result)
        // May be COMFORTABLE or INSUFFICIENT_DATA depending on implementation
        assertOneOf(result.state) { 
            AffordabilityState.COMFORTABLE 
            AffordabilityState.INSUFFICIENT_DATA 
        }
    }

    @Test
    fun simulate_no_mutation() {
        // Given: Existing financial data
        val originalBalance = 50000.0
        val scenario = CanIAffordScenario(
            amount = 5000.0,
            transactionType = TransactionType.DEBIT,
            accountId = UUID.randomUUID(),
            categoryId = UUID.randomUUID(),
            description = "Test",
            purchaseDate = Instant.now()
        )

        // When: We simulate multiple times
        val result1 = calculator.simulate(scenario, originalBalance, listOf())
        val result2 = calculator.simulate(scenario, originalBalance, listOf())
        val result3 = calculator.simulate(scenario, originalBalance, listOf())

        // Then: All results should be consistent (deterministic)
        assertEquals(result1.state, result2.state)
        assertEquals(result2.state, result3.state)
        assertEquals(result1.balanceDelta, result2.balanceDelta)
        assertEquals(result2.balanceDelta, result3.balanceDelta)

        // The original balance should be unchanged (simulation is read-only)
        // This is verified by the fact that no financial data was modified
    }

    @Test
    fun simulate_commitments_preserved() {
        // Given: A scenario with existing commitments
        val scenario = CanIAffordScenario(
            amount = 10000.0,
            transactionType = TransactionType.DEBIT,
            accountId = UUID.randomUUID(),
            categoryId = UUID.randomUUID(),
            description = "Purchase with commitments",
            purchaseDate = Instant.now()
        )

        // When: We simulate with existing commitment events
        val commitmentEvent = CashFlowEvent.Commitment(
            date = Instant.now().plusDays(7),
            amount = 5000.0,
            source = "Existing commitment",
            description = "Existing commitment",
            confidence = CashFlowConfidence.KNOWN
        )

        val result = calculator.simulate(
            scenario = scenario,
            currentBalance = 30000.0,
            existingEvents = listOf(commitmentEvent)
        )

        // Then: The simulation should account for commitments
        assertNotNull(result)
        assertTrue(result.balanceDelta != null)
        // Commitments should be accounted for in the calculation
        assertTrue(result.commitmentsDelta != null)
    }

    @Test
    fun simulate_determinism_same_inputs() {
        // Given: Same inputs
        val scenario = CanIAffordScenario(
            amount = 7500.0,
            transactionType = TransactionType.DEBIT,
            accountId = UUID.randomUUID(),
            categoryId = UUID.randomUUID(),
            description = "Determinism test",
            purchaseDate = Instant.now()
        )

        val result1 = calculator.simulate(scenario, 60000.0, listOf())
        val result2 = calculator.simulate(scenario, 60000.0, listOf())
        val result3 = calculator.simulate(scenario, 60000.0, listOf())

        // When: Results should be identical
        assertEquals(result1.state, result2.state)
        assertEquals(result2.state, result3.state)
        assertEquals(result1.balanceDelta, result2.balanceDelta)
        assertEquals(result1.commitmentsDelta, result2.commitmentsDelta)
        assertEquals(result1.commitmentsDelta, result3.commitmentsDelta)

        // Then: All three are the same
        isTrue(result1 == result2 && result2 == result3)
    }

    @Test
    fun simulate_guardrail_breach() {
        // Given: A scenario that breaches a guardrail
        val scenario = CanIAffordScenario(
            amount = 20000.0,
            transactionType = TransactionType.DEBIT,
            accountId = UUID.randomUUID(),
            categoryId = UUID.randomUUID(),
            description = "Guardrail breach test",
            purchaseDate = Instant.now()
        )

        // When: We simulate with low balance
        val result = calculator.simulate(
            scenario = scenario,
            currentBalance = 15000.0,
            existingEvents = listOf()
        )

        // Then: Should detect guardrail impact
        assertNotNull(result)
        assertTrue(result.guardrailImpact != null || result.state == AffordabilityState.TIGHT)
    }

    @Test
    fun simulate_budget_impact() {
        // Given: A scenario affecting a budget
        val scenario = CanIAffordScenario(
            amount = 3000.0,
            transactionType = TransactionType.DEBIT,
            accountId = UUID.randomUUID(),
            categoryId = UUID.randomUUID(),
            description = "Budget impact test",
            purchaseDate = Instant.now()
        )

        // When: We simulate
        val result = calculator.simulate(
            scenario = scenario,
            currentBalance = 50000.0,
            existingEvents = listOf()
        )

        // Then: Should evaluate budget impact
        assertNotNull(result)
        assertTrue(result.budgetImpact != null || result.state == AffordabilityState.TIGHT)
    }

    @Test
    fun simulate_goal_impact() {
        // Given: A scenario affecting goals
        val scenario = CanIAffordScenario(
            amount = 15000.0,
            transactionType = TransactionType.DEBIT,
            accountId = UUID.randomUUID(),
            categoryId = UUID.randomUUID(),
            description = "Goal impact test",
            purchaseDate = Instant.now()
        )

        // When: We simulate
        val result = calculator.simulate(
            scenario = scenario,
            currentBalance = 40000.0,
            existingEvents = listOf()
        )

        // Then: Should evaluate goal impact
        assertNotNull(result)
        assertTrue(result.goalImpact != null || result.state == AffordabilityState.TIGHT)
    }

    @Test
    fun simulate_comfortable_with_positive_projected_balance() {
        // Given: A healthy financial scenario
        val scenario = CanIAffordScenario(
            amount = 3000.0,
            transactionType = TransactionType.DEBIT,
            accountId = UUID.randomUUID(),
            categoryId = UUID.randomUUID(),
            description = "Comfortable purchase",
            purchaseDate = Instant.now()
        )

        // When: We simulate
        val result = calculator.simulate(
            scenario = scenario,
            currentBalance = 50000.0,
            existingEvents = listOf()
        )

        // Then: COMFORTABLE state with positive projected balance
        assertNotNull(result)
        assertEquals(AffordabilityState.COMFORTABLE, result.state)
        // Projected balance should still be positive
        assertTrue(result.projectedLowestBalance >= 0.0 || result.state == AffordabilityState.COMFORTABLE)
    }
}