package com.ivy.domain.intelligence

import java.util.UUID

enum class SignalCategory {
    CASH_FLOW,
    BUDGET,
    GOAL,
    RECURRING,
    PACT,
    PURCHASE,
    SPENDING,
    MILESTONE
}

enum class SignalSeverity {
    CRITICAL,
    HIGH,
    MEDIUM,
    LOW,
    POSITIVE
}

enum class SignalLifecycle {
    ACTIVE,
    DISMISSED,
    SNOOZED,
    RESOLVED
}

enum class SignalActionType {
    NAVIGATE,
    DISMISS,
    SNOOZE,
    VIEW_DETAILS
}

data class SignalAction(
    val label: String,
    val type: SignalActionType = SignalActionType.NAVIGATE,
    val targetRoute: String? = null
)

data class FinancialSignal(
    val id: String = UUID.randomUUID().toString(),
    val category: SignalCategory,
    val severity: SignalSeverity,
    val title: String,
    val explanation: String,
    val evidence: String? = null,
    val relatedEntityId: String? = null,
    val relatedEntityType: String? = null,
    val timestamp: Long = System.currentTimeMillis(),
    val recommendedAction: SignalAction? = null,
    val dedupKey: String,
    val lifecycleState: SignalLifecycle = SignalLifecycle.ACTIVE
) : Comparable<FinancialSignal> {
    override fun compareTo(other: FinancialSignal): Int {
        val severityComparison = this.severity.ordinal.compareTo(other.severity.ordinal)
        return if (severityComparison != 0) {
            severityComparison
        } else {
            other.timestamp.compareTo(this.timestamp)
        }
    }
}
