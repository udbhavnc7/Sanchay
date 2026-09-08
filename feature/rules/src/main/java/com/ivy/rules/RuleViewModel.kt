package com.ivy.rules

import com.ivy.base.resource.ResourceProvider
import com.ivy.base.kotlinxserilzation.KSerializerInstant
import com.ivy.base.kotlinxserilzation.KSerializerUUID
import com.ivy.base.model.TransactionType
import com.ivy.base.threading.DispatchersProvider
import com.ivy.base.resource.IvyViewModel
import com.ivy.base.kotlinxserilzation.serializer
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import com.ivy.data.db.entity.FinancialRuleEntity
import com.ivy.data.db.dao.read.FinancialRuleDao
import com.ivy.data.db.dao.write.WriteFinancialRuleDao
import java.util.*
import java.time.Instant

class RuleViewModel(
    private val ruleRepository: RuleRepository,
    @ApplicationContext
    private val context: Context,
    private val resourceProvider: ResourceProvider,
    private val dispatchers: DispatchersProvider,
) : IvyViewModel() {

    private val _ruleState = MutableStateFlow<Map<UUID, RuleState>>(mapOf())
    val ruleState: StateFlow<Map<UUID, RuleState>> = _ruleState.asStateFlow()

    init {
        loadAndEvaluateRules()
    }

    private fun loadAndEvaluateRules() {
        launch(dispatchers.io) {
            val activeRules = ruleRepository.findAllActive()
            val evaluations = ruleRepository.evaluateAll()

            val state = mutableMapOf<UUID, RuleState>()

            for (rule in activeRules) {
                state[rule.id] = RuleState(
                    ruleId = rule.id,
                    enabled = rule.enabled,
                )
            }

            // Apply evaluations
            for (evaluation in evaluations) {
                if (evaluation.triggered && evaluation.severity != "info") {
                    // Rule triggered - update state
                    state[evaluation.ruleId] = (state[evaluation.ruleId]?.let {
                        it.copy(
                            lastTriggeredAt = evaluation.relevantDate,
                            lastTriggerState = evaluation.title,
                            triggerCount = it.triggerCount + 1
                        )
                    } ?: run {
                        state[evaluation.ruleId] = RuleState(
                            ruleId = evaluation.ruleId,
                            enabled = true,
                            lastTriggeredAt = evaluation.relevantDate,
                            lastTriggerState = evaluation.title,
                            triggerCount = 1
                        )
                    }
                }
            }

            _ruleState.value = state
        }
    }

    fun evaluateRule(ruleId: UUID): RuleEvaluationResult? {
        return ruleRepository.findAllActive()
            .firstOrNull { it.id == ruleId }
            ?.let { rule ->
                ruleRepository.evaluateAll()
                    .firstOrNull { it.ruleId == ruleId }
            }

        return null
    }

    fun toggleRule(ruleId: UUID) {
        launch(dispatchers.io) {
            val currentState = _ruleState.value[ruleId] ?: run {
                _ruleState.value = _ruleState.value + (ruleId to RuleState(ruleId = ruleId, enabled = true))
                _ruleState.value[ruleId]!!
            }

            val newEnabled = !currentState.enabled
            _ruleState.value = _ruleState.value + (ruleId to currentState.copy(enabled = newEnabled))

            writeDao.save(FinancialRuleEntity(
                id = ruleId,
                name = "",
                enabled = newEnabled,
                triggerType = "",
                conditionOperator = "",
                thresholdValue = 0.0,
                actionType = "",
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            ))
        }
    }

    fun deleteRule(ruleId: UUID) {
        launch(dispatchers.io) {
            writeDao.deleteById(ruleId)
            _ruleState.value = _ruleState.value - ruleId
        }
    }

    fun getRuleExplanation(rule: FinancialRuleEntity, evaluation: RuleEvaluationResult?): String {
        return when (rule.triggerType) {
            "spending_threshold" -> {
                if (evaluation?.triggered == true) {
                    val threshold = rule.thresholdValue
                    val spent = evaluation.relevantAmount ?: 0.0
                    "You have spent ${formatCurrency(spent)} on ${rule.name}, ${spent} above your ${formatCurrency(threshold)} guardrail."
                } else {
                    "${rule.name} guardrail is currently not triggered."
                }
            }
            "budget_threshold" -> {
                if (evaluation?.triggered == true) {
                    val budgetPct = evaluation.relevantAmount ?: 0.0
                    "Your ${rule.name} budget has reached ${budgetPct.toInt()}%."
                } else {
                    "${rule.name} budget is healthy."
                }
            }
            "projected_balance" -> {
                if (evaluation?.triggered == true) {
                    val projected = evaluation.relevantAmount ?: 0.0
                    val threshold = rule.thresholdValue
                    "Your projected balance falls to ${formatCurrency(projected)} in ${getDaysUntil(evaluation.relevantDate)} days, below your ${formatCurrency(threshold)} guardrail."
                } else {
                    "Your projected balance is healthy."
                }
            }
            "commitment_due_soon" -> {
                if (evaluation?.triggered == true) {
                    val days = getDaysUntil(evaluation.relevantDate)
                    "A payment of ${formatCurrency(evaluation.relevantAmount)} is due in ${days} days."
                } else {
                    "No upcoming commitments."
                }
            }
            "pact_overdue" -> {
                if (evaluation?.triggered == true) {
                    "₹${evaluation.relevantAmount} is overdue from ${rule.name}."
                } else {
                    "No overdue obligations."
                }
            }
            "goal_behind_pace" -> {
                if (evaluation?.triggered == true) {
                    "Your ${rule.name} goal is behind expected progress."
                } else {
                    "${rule.name} goal is on track."
                }
            }
            "purchase_return" -> {
                if (evaluation?.triggered == true) {
                    "Your return window for ${rule.name} is closing soon."
                } else {
                    "Return window is open."
                }
            }
            "purchase_warranty" -> {
                if (evaluation?.triggered == true) {
                    "The warranty for ${rule.name} is expiring soon."
                } else {
                    "Warranty is active."
                }
            }
            else -> "Rule triggered."
        }
    }

    private fun formatCurrency(amount: Double): String {
        return resourceProvider.getString(
            context.resources.getIdentifier(
                "format_currency",
                "string",
                context.packageName
            )
        ).format(amount)
            /* TODO: Use proper number formatting */
            .replace("₹", "")
    }

    private fun getDaysUntil(date: Instant?): Int {
        return if (date != null) {
            java.time.temporal.ChronoUnit.DAYS.between(java.time.Instant.now(), date)
        } else {
            0
        }
    }
}