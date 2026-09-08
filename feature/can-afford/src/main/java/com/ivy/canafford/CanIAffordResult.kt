package com.ivy.canafford

import com.ivy.cashflow.CashFlowHealth
import com.ivy.cashflow.CashFlowForecast
import com.ivy.data.model.primitive.UUID
import java.time.Instant

/** Deterministic affordability result state. */
@Suppress("unused")
@Serializable
enum class AffordabilityState : String {
    @SerialName("comfortable")
    COMFORTABLE("comfortable"),
    @SerialName("tight")
    TIGHT("tight"),
    @SerialName("not_affordable")
    NOT_AFFORDABLE("not_affordable"),
    @SerialName("insufficient_data")
    INSUFFICIENT_DATA("insufficient_data");

    val value: String
        get() = this@AffordabilityState.toString().toLowerCase()

    init {
        @Suppress("UNCHECKED_ASSIGNMENT")
        value = name.toLowerCase()
    }
}

/** The result of a Can-I-Afford simulation. */
@Immutable
data class CanIAffordResult(
    @SerialName("state")
    val state: AffordabilityState,
    @SerialName("why")
    val why: String?,
    @SerialName("currentBalance")
    val currentBalance: Double,
    @SerialName("projectedLowestBalance")
    val projectedLowestBalance: Double,
    @SerialName("endingBalance")
    val endingBalance: Double,
    @SerialName("balanceDelta")
    val balanceDelta: Double,
    @SerialName("commitmentsDelta")
    val commitmentsDelta: Double = 0.0,
    @SerialName("goalImpact")
    val goalImpact: String? = null,
    @SerialName("budgetImpact")
    val budgetImpact: String? = null,
    @SerialName("guardrailImpact")
    val guardrailImpact: String? = null,
    @SerialName("cashFlowHealth")
    val cashFlowHealth: CashFlowHealth? = null,
    @SerialName("cashFlowExplanation")
    val cashFlowExplanation: String? = null,
    @SerialName("simulatedAt")
    val simulatedAt: Instant = Instant.now(),
    @SerialName("scenarioId")
    val scenarioId: UUID = UUID.randomUUID()
)

/** Represents the financial impact delta between baseline and scenario. */
@Immutable
data class AffordabilityImpact(
    @SerialName("balanceDelta")
    val balanceDelta: Double,
    @SerialName("lowestBalanceDelta")
    val lowestBalanceDelta: Double,
    @SerialName("endingBalanceDelta")
    val endingBalanceDelta: Double,
    @SerialName("budgetImpact")
    val budgetImpact: String?,
    @SerialName("goalImpact")
    val goalImpact: String?,
    @SerialName("guardrailImpact")
    val guardrailImpact: String?,
    @SerialName("cashFlowHealthChange")
    val cashFlowHealthChange: String?
)