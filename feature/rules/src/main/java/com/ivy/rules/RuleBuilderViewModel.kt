package com.ivy.rules

import com.ivy.base.resource.ResourceProvider
import com.ivy.base.kotlinxserilzation.KSerializerInstant
import com.ivy.base.kotlinxserilzation.KSerializerUUID
import com.ivy.base.threading.DispatchersProvider
import com.ivy.base.resource.IvyViewModel
import com.ivy.data.db.entity.FinancialRuleEntity
import com.ivy.data.db.dao.read.FinancialRuleDao
import com.ivy.data.db.dao.write.WriteFinancialRuleDao
import com.ivy.base.model.TransactionType
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.*
import java.time.Instant

data class RuleBuilderStep1(
    val selectedCategory: String? = null,
    val selectedTriggerType: String? = null
)

data class RuleBuilderStep2(
    val selectedCondition: String? = null,
    val thresholdValue: Double? = null,
    val period: String? = null,
    val days: Int? = null
)

data class RuleBuilderStep3(
    val actionType: String? = null
)

data class RuleBuilderRule(
    @SerialName("name")
    val name: String,
    @SerialName("triggerType")
    val triggerType: String,
    @SerialName("conditionOperator")
    val conditionOperator: String,
    @SerialName("thresholdValue")
    val thresholdValue: Double,
    @SerialName("categoryId")
    @SerialName("categoryName")
    val categoryName: String?,
    @SerialName("accountId")
    val accountId: String?,
    @SerialName("budgetId")
    val budgetId: String?,
    @SerialName("goalId")
    val goalId: String?,
    @SerialName("pactId")
    val pactId: String?,
    @SerialName("purchaseId")
    val purchaseId: String?,
    @SerialName("actionType")
    val actionType: String,
    @SerialName("createdAt")
    val createdAt: Instant,
    @SerialName("updatedAt")
    val updatedAt: Instant,
    @SerialName("id")
    @SerialName("id")
    @SerialName("id")
    val id: UUID = UUID.randomUUID()
)

@Suppress("unused")
@Serializable
enum class RuleBuilderStep : String {
    @SerialName("step1")
    STEP1("step1"),
    @SerialName("step2")
    STEP2("step2"),
    @SerialName("step3")
    STEP3("step3");

    val value: String
        get() = this@RuleBuilderStep.toString().toLowerCase()

    init {
        @Suppress("UNCHECKED_ASSIGNMENT")
        value = name.toLowerCase()
    }
}

class RuleBuilderViewModel(
    private val ruleRepository: RuleRepository,
    @ApplicationContext
    private val context: Context,
    private val resourceProvider: ResourceProvider,
    private val dispatchers: DispatchersProvider,
) : IvyViewModel() {

    private val _step = MutableStateFlow(RuleBuilderStep.STEP1)
    val step: StateFlow<RuleBuilderStep> = _step.asStateFlow()

    private val _ruleConfig = MutableStateFlow<RuleBuilderRule?>(null)
    val ruleConfig: StateFlow<RuleBuilderRule?> = _ruleConfig.asStateFlow()

    private val _validationErrors = MutableStateFlow<List<String>>(listOf())
    val validationErrors: StateFlow<List<String>> = _validationErrors.asStateFlow()

    private val _previewText = MutableStateFlow<String>("")
    val previewText: StateFlow<String> = _previewText.asStateFlow()

    init {
        observeStep()
    }

    fun nextStep() {
        when (_step.value) {
            RuleBuilderStep.STEP1 -> stepToStep2()
            RuleBuilderStep.STEP2 -> stepToStep3()
        }
    }

    fun prevStep() {
        when (_step.value) {
            RuleBuilderStep.STEP2 -> stepToStep1()
            RuleBuilderStep.STEP3 -> stepToStep2()
        }
    }

    private fun stepToStep1() {
        _step.value = RuleBuilderStep.STEP1
    }

    private fun stepToStep2() {
        validateStep1()
        if (validationErrors.value!!.isEmpty()) {
            _step.value = RuleBuilderStep.STEP2
            generatePreview()
        }
    }

    private fun stepToStep3() {
        validateStep2()
        if (validationErrors.value!!.isEmpty()) {
            _step.value = RuleBuilderStep.STEP3
            finalizeRule()
        }
    }

    private fun validateStep1() {
        val errors = mutableListOf<String>()
        // Validate step 1 selections
        _validationErrors.value = errors
    }

    private fun validateStep2() {
        val errors = mutableListOf<String>()
        val config = _ruleConfig.value
        if (config?.thresholdValue == null || config.thresholdValue <= 0) {
            errors.add("Please enter a valid threshold amount")
        }
        if (config?.period == null || config.period.isEmpty()) {
            errors.add("Please select a period")
        }
        _validationErrors.value = errors
    }

    private fun generatePreview() {
        val config = _ruleConfig.value
        if (config == null) return

        when (config.triggerType) {
            "spending_threshold" -> {
                val category = config.categoryName ?: "Food"
                val amount = config.thresholdValue
                val period = config.period ?: "week"
                val preview = "Warn me when ${category} spending exceeds ${formatCurrency(amount)} in a ${period}."
                _previewText.value = preview
            }
            "budget_threshold" -> {
                val budgetName = config.name ?: "Budget"
                val pct = config.thresholdValue
                val preview = "Warn me when ${budgetName} reaches ${pct.toInt}%"
                _previewText.value = preview
            }
            "projected_balance" -> {
                val amount = config.thresholdValue
                val preview = "Warn me when projected balance falls below ${formatCurrency(amount)}"
                _previewText.value = preview
            }
            "commitment_due_soon" -> {
                val days = config.days ?: 7
                val preview = "Remind me ${days} days before a planned payment is due"
                _previewText.value = preview
            }
            "pact_overdue" -> {
                val preview = "Alert me when money becomes overdue"
                _previewText.value = preview
            }
            "goal_behind_pace" -> {
                val preview = "Warn me when goal falls behind pace"
                _previewText.value = preview
            }
            "purchase_return" -> {
                val preview = "Remind me before return deadline"
                _previewText.value = preview
            }
            "purchase_warranty" -> {
                val preview = "Remind me before warranty expiry"
                _previewText.value = preview
            }
        }
    }

    private fun finalizeRule() {
        val config = _ruleConfig.value!!
        val now = Instant.now()

        val newRule = FinancialRuleEntity(
            id = config.id,
            name = config.name,
            enabled = true,
            triggerType = config.triggerType,
            conditionOperator = config.conditionOperator,
            thresholdValue = config.thresholdValue,
            categoryId = config.categoryId,
            accountId = config.accountId,
            budgetId = config.budgetId,
            goalId = config.goalId,
            pactId = config.pactId,
            purchaseId = config.purchaseId,
            actionType = config.actionType,
            createdAt = now,
            updatedAt = now
        )

        ruleRepository.save(newRule)
        _step.value = RuleBuilderStep.STEP1
        _ruleConfig.value = null
        _previewText.value = ""
        _validationErrors.value = listOf()
    }

    private fun formatCurrency(amount: Double): String {
        /* Use resource provider for currency formatting */
        return resourceProvider.getString(
            context.resources.getIdentifier(
                "format_currency",
                "string",
                context.packageName
            )
        ).format(amount)
    }

    fun setStep1Selection(triggerType: String, categoryName: String?) {
        when (_step.value) {
            RuleBuilderStep.STEP1 -> {
                _ruleConfig.value = _ruleConfig.value?.copy(triggerType = triggerType, categoryName = categoryName) ?: run {
                    RuleBuilderRule(
                        name = "",
                        triggerType = triggerType,
                        conditionOperator = ">",
                        thresholdValue = 0.0,
                        categoryName = categoryName,
                        accountId = null,
                        budgetId = null,
                        goalId = null,
                        pactId = null,
                        purchaseId = null,
                        actionType = "show_warning",
                        createdAt = Instant.EPOCH,
                        updatedAt = Instant.EPOCH
                    )
                }
                generatePreview()
                _step.value = RuleBuilderStep.STEP2
            }
        }
    }

    fun setStep2Selection(conditionOperator: String, thresholdValue: Double, period: String?, days: Int?) {
        when (_step.value) {
            RuleBuilderStep.STEP2 -> {
                _ruleConfig.value = _ruleConfig.value?.copy(
                    conditionOperator = conditionOperator,
                    thresholdValue = thresholdValue,
                    period = period,
                    days = days
                ) ?: run {
                    RuleBuilderRule(
                        name = "",
                        triggerType = "",
                        conditionOperator = conditionOperator,
                        thresholdValue = thresholdValue,
                        categoryName = null,
                        accountId = null,
                        budgetId = null,
                        goalId = null,
                        pactId = null,
                        purchaseId = null,
                        actionType = "show_warning",
                        createdAt = Instant.EPOCH,
                        updatedAt = Instant.EPOCH
                    )
                }
                generatePreview()
            }
        }
    }

    fun setStep3Selection(actionType: String) {
        when (_step.value) {
            RuleBuilderStep.STEP3 -> {
                _ruleConfig.value = _ruleConfig.value?.copy(actionType = actionType) ?: run {
                    RuleBuilderRule(
                        name = "",
                        triggerType = "",
                        conditionOperator = "",
                        thresholdValue = 0.0,
                        categoryName = null,
                        accountId = null,
                        budgetId = null,
                        goalId = null,
                        pactId = null,
                        purchaseId = null,
                        actionType = actionType,
                        createdAt = Instant.EPOCH,
                        updatedAt = Instant.EPOCH
                    )
                }
                generatePreview()
            }
        }
    }

    fun testRuleEvaluation() {
        val config = _ruleConfig.value
        if (config == null) return

        launch(dispatchers.io) {
            val results = ruleRepository.evaluateAll()
            val matching = results.firstOrNull { it.ruleId == _ruleConfig.value?.id }

            _validationErrors.value = if (matching != null) {
                if (matching.triggered) {
                    listOf("Triggered: ${matching.explanation ?: "Rule evaluated successfully"}")
                } else {
                    listOf("Not triggered - current values are within guardrail")
                }
            } else {
                listOf("No evaluation result available")
            }
        }
    }
}