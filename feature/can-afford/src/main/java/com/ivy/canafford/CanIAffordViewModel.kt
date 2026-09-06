package com.ivy.canafford

import com.ivy.base.resource.IvyViewModel
import com.ivy.base.threading.DispatchersProvider
import com.ivy.base.resource.ResourceProvider
import com.ivy.base.kotlinxserilzation.KSerializerInstant
import com.ivy.base.kotlinxserilzation.KSerializerUUID
import androidx.lifecycle.viewbinding.ViewBinding
import dagger.hilt.android.AndroidEntryPoint
import dagger.hilt.android.Hilt
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.Toast
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.*

@Hilt
@AndroidEntryPoint
class CanIAffordViewModel(
    private val calculator: CanIAffordCalculator = CanIAffordCalculator(),
    @ApplicationContext
    private val context: Context,
    private val resourceProvider: ResourceProvider,
    private val dispatchers: DispatchersProvider,
) : IvyViewModel() {

    private val _scenario = MutableStateFlow<CanIAffordScenario?>(null)
    val scenario: StateFlow<CanIAffordScenario?> = _scenario.asStateFlow()

    private val _result = MutableStateFlow<CanIAffordResult?>(null)
    val result: StateFlow<CanIAffordResult?> = _result.asStateFlow()

    private val _isCalculating = MutableStateFlow(false)
    val isCalculating: StateFlow<bool> = _isCalculating.asStateFlow()

    private val _validationErrors = MutableStateFlow<List<String>>(listOf())
    val validationErrors: StateFlow<List<String>> = _validationErrors.asStateFlow()

    private val _previewText = MutableStateFlow<String>("")
    val previewText: StateFlow<String> = _previewText.asStateFlow()

    init {
        // Initialize with empty state
    }

    fun setScenario(scenario: CanIAffordScenario) {
        _scenario.value = scenario
        _result.value = null
        _validationErrors.value = listOf()
        _previewText.value = ""
    }

    fun clearScenario() {
        _scenario.value = null
        _result.value = null
        _validationErrors.value = listOf()
    }

    fun calculateAffordability() {
        val scenario = _scenario.value
        if (scenario == null) {
            _validationErrors.value = listOf("No scenario configured")
            return
        }

        // Validate required fields
        val errors = mutableListOf<String>()
        if (scenario.amount <= 0) {
            errors.add("Please enter a valid purchase amount")
        }
        if (scenario.amount == 0) {
            errors.add("Amount must be greater than zero")
        }
        if (scenario.accountId == null) {
            errors.add("Please select an account")
        }
        if (scenario.categoryId == null && needsCategory()) {
            errors.add("Please select a category for budget impact analysis")
        }

        _validationErrors.value = errors
        if (errors.isNotEmpty()) return

        launch(dispatchers.io) {
            _isCalculating.value = true
            try {
                val currentBalance = retrieveCurrentBalance()
                val existingEvents = retrieveExistingEvents()

                val result = calculator.simulate(
                    scenario = scenario,
                    currentBalance = currentBalance,
                    existingEvents = existingEvents
                )

                _result.value = result
                generatePreview(result)
            } catch (e: Exception) {
                _validationErrors.value = listOf("Simulation error: ${e.message ?: "Unknown error"}")
            } finally {
                _isCalculating.value = false
            }
        }
    }

    private fun needsCategory(): Boolean {
        // Category is needed for budget impact analysis
        return true
    }

    private fun retrieveCurrentBalance(): Double {
        // In a full implementation, this would query the account entity
        // For V1, return a default or the account's current balance
        return 50000.0
    }

    private fun retrieveExistingEvents(): List<CashFlowEvent> {
        // In a full implementation, this would query existing cash flow events
        // For V1, return empty list
        return listOf()
    }

    private fun generatePreview(result: CanIAffordResult?) {
        if (result == null) return

        when (result.state) {
            AffordabilityState.COMFORTABLE -> {
                _previewText.value = "You can make this purchase without violating any guardrails, budgets, or goals."
            }
            AffordabilityState.TIGHT -> {
                _previewText.value = result.why ?: "This purchase would impact your financial position."
            }
            AffordabilityState.NOT_AFFORDABLE -> {
                _previewText.value = result.why ?: "This purchase is not affordable given your current financial position."
            }
            AffordabilityState.INSUFFICIENT_DATA -> {
                _previewText.value = "Not enough information to confidently simulate this purchase."
            }
        }
    }

    fun testScenario() {
        // Evaluate the current scenario without saving
        val scenario = _scenario.value
        if (scenario == null) return

        launch(dispatchers.io) {
            val currentBalance = retrieveCurrentBalance()
            val existingEvents = retrieveExistingEvents()

            val result = calculator.simulate(
                scenario = scenario,
                currentBalance = currentBalance,
                existingEvents = existingEvents
            )

            // Show result as Toast
            _result.value = result
            showResultToast(result)
        }
    }

    private fun showResultToast(result: CanIAffordResult) {
        val message = when (result.state) {
            AffordabilityState.COMFORTABLE -> "✅ ${result.why ?: "You can make this purchase."}"
            AffordabilityState.TIGHT -> "⚠️ ${result.why ?: "This purchase would impact your finances."}"
            AffordabilityState.NOT_AFFORDABLE -> "❌ ${result.why ?: "This purchase is not affordable."}"
            AffordabilityState.INSUFFICIENT_DATA -> "ℹ️ ${result.why ?: "Not enough information."}"
        }
        Toast.makeText(context, message, Toast.LENGTH_LONG).show()
    }

    fun getImpactSummary(result: CanIAffordResult): String {
        val lines = mutableListOf<String>()

        lines.add("Current balance: ₹${result.currentBalance.format("%.0f")}")
        lines.add("Projected lowest balance: ₹${result.projectedLowestBalance.format("%.0f")}")
        lines.add("Ending balance: ₹${result.endingBalance.format("%.0f")}")
        lines.add("Balance change: ₹${result.balanceDelta.format("%.0f")}")

        if (result.commitmentsDelta != 0.0) {
            lines.add("Commitment change: ₹${result.commitmentsDelta.format("%.0f")}")
        }

        if (result.guardrailImpact != null) {
            lines.add("Guardrail: ${result.guardrailImpact}")
        }

        if (result.budgetImpact != null) {
            lines.add("Budget: ${result.budgetImpact}")
        }

        if (result.goalImpact != null) {
            lines.add("Goal: ${result.goalImpact}")
        }

        return lines.joinToString("\n")
    }
}