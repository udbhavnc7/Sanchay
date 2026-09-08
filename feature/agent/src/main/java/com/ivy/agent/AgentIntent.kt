package com.ivy.agent

import com.ivy.base.model.TransactionType
import com.ivy.data.model.primitive.UUID
import java.time.Instant

/** Structured intent parsed from natural language. */
@Immutable
data class AgentIntent(
    val intent: AgentIntentType,
    val amount: Double? = null,
    val currency: String? = null,
    val accountId: UUID? = null,
    val categoryId: UUID? = null,
    val goalId: UUID? = null,
    val budgetId: UUID? = null,
    val pactId: UUID? = null,
    val purchaseId: UUID? = null,
    val date: Instant? = null,
   .recurrence: String? = null,
    val queryText: String?,
    val permissionLevel: AgentPermissionLevel = AgentPermissionLevel.READ
)