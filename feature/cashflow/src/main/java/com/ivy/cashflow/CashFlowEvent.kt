package com.ivy.cashflow

import com.ivy.base.model.TransactionType
import com.ivy.data.model.primitive.UUID
import java.time.Instant

/** A cash flow event that affects the projected balance. */
sealed interface CashFlowEvent {

    /** An inflow of money (income, salary, etc.) */
    data class Inflow(
        val date: Instant,
        val amount: Double,
        val source: String?,
        val description: String?,
        val confidence: CashFlowConfidence
    ) : CashFlowEvent

    /** An outflow of money (expense, commitment, etc.) */
    data class Outflow(
        val date: Instant,
        val amount: Double,
        val source: String?,
        val description: String?,
        val confidence: CashFlowConfidence
    ) : CashFlowEvent

    /** A commitment that affects the balance */
    data class Commitment(
        val date: Instant,
        val amount: Double,
        val source: String?,
        val description: String?,
        val confidence: CashFlowConfidence
    ) : CashFlowEvent

    /** A goal contribution */
    data class GoalContribution(
        val date: Instant,
        val amount: Double,
        val goalName: String?,
        val confidence: CashFlowConfidence
    ) : CashFlowEvent

    /** No event (baseline) */
    object Baseline : CashFlowEvent
}

/** Confidence level for a cash flow event. */
enum class CashFlowConfidence {
    KNOWN,      // Explicit planned payment
    EXPECTED,   // Recurring pattern with evidence
    SUGGESTED,  // Detected pattern (lower confidence)
    ESTIMATED,  // Rough estimate
    UNKNOWN     // Unknown reliability
}

/** A point in the cash flow timeline. */
@Immutable
data class CashFlowPoint(
    val date: Instant,
    val startingBalance: Double,
    val inflow: Double,
    val outflow: Double,
    val committedAmount: Double,
    val goalContribution: Double,
    val endingBalance: Double,
    val events: List<CashFlowEvent>,
    val explanation: String?
)