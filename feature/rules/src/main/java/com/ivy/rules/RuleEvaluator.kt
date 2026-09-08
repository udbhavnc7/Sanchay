package com.ivy.rules

import com.ivy.data.db.entity.FinancialRuleEntity
import com.ivy.data.db.dao.read.FinancialRuleDao
import com.ivy.data.db.dao.write.WriteFinancialRuleDao
import com.ivy.data.db.entity.TransactionEntity
import com.ivy.data.db.entity.BudgetEntity
import com.ivy.data.db.entity.GoalEntity
import com.ivy.data.db.entity.PurchaseEntity
import com.ivy.data.db.entity.FinancialPactEntity
import com.ivy.base.model.TransactionType
import com.ivy.data.model.Category
import com.ivy.base.kotlinxserilzation.KSerializerInstant
import com.ivy.base.kotlinxserilzation.KSerializerUUID
import kotlinx.serialization.Serializable
import java.time.Instant
import java.util.*

@Suppress("unused")
@Serializable
data class RuleEvaluationResult(
    @SerialName("ruleId")
    val ruleId: UUID,
    @SerialName("triggered")
    val triggered: Boolean,
    @SerialName("severity")
    val severity: String,
    @SerialName("title")
    val title: String,
    @SerialName("explanation")
    val explanation: String?,
    @SerialName("relevantAmount")
    val relevantAmount: Double? = null,
    @SerialName("relevantDate")
    val relevantDate: Instant? = null,
    @SerialName("evaluatedAt")
    val evaluatedAt: Instant = Instant.now(),
    @SerialName("sourceType")
    val sourceType: String = "unknown"
)

@Suppress("unused")
@Serializable
enum class RuleSeverity : String {
    @SerialName("info")
    INFO("info"),
    @SerialName("notice")
    NOTICE("notice"),
    @SerialName("warning")
    WARNING("warning"),
    @SerialName("critical")
    CRITICAL("critical");

    val value: String
        get() = this@RuleSeverity.toString().toLowerCase()

    init {
        @Suppress("UNCHECKED_ASSIGNMENT")
        value = name.toLowerCase()
    }
}

@Suppress("unused")
@Serializable
data class RuleState(
    @SerialName("ruleId")
    val ruleId: UUID,
    @SerialName("enabled")
    val enabled: Boolean,
    @SerialName("lastTriggeredAt")
    var lastTriggeredAt: Instant? = null,
    @SerialName("lastTriggerState")
    var lastTriggerState: String? = null,
    @SerialName("triggerCount")
    var triggerCount: Int = 0,
    @SerialName("cooldownMs")
    val cooldownMs: Long = 300000,
    @SerialName("suppressedUntil")
    var suppressedUntil: Long = 0
)