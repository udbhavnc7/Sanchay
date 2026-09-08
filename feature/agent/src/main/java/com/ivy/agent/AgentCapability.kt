package com.ivy.agent

import com.ivy.agent.AgentIntentType
import com.ivy.agent.AgentPermissionLevel
import com.ivy.agent.AgentIntent
import com.ivy.canafford.CanIAffordResult
import com.ivy.canafford.AffordabilityState
import com.ivy.cashflow.CashFlowForecast
import com.ivy.cashflow.CashFlowHealth
import com.ivy.data.model.primitive.UUID
import java.time.Instant

/** Capability interface for Agent financial operations. */
interface AgentCapability {

    /** Returns the intent types this capability handles. */
    val supportedIntents: List<AgentIntentType>

    /** Returns the required permission level. */
    val requiredPermission: AgentPermissionLevel

    /** Execute the capability against the given intent.
     *  Returns a structured result and explanation.
     */
    fun execute(intent: AgentIntent): AgentCapabilityResult
}

/** Structured result from a capability execution. */
@Immutable
data class AgentCapabilityResult(
    val success: Boolean,
    val explanation: String?,
    val data: Any? = null,
    val permissionLevel: AgentPermissionLevel = AgentPermissionLevel.READ
)