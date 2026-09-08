package com.ivy.agent

import com.ivy.agent.AgentCapability
import com.ivy.agent.AgentCapabilityResult
import com.ivy.agent.AgentIntent
import com.ivy.agent.AgentIntentType
import com.ivy.agent.AgentPermissionLevel
import com.ivy.canafford.CanIAffordResult
import com.ivy.canafford.AffordabilityState
import com.ivy.cashflow.CashFlowForecast
import com.ivy.data.model.primitive.UUID
import java.util.*

class AgentRouter(
    private val capabilities: List<AgentCapability>
) {

    /** Find the capability that handles the given intent type. */
    private fun findCapabilityFor(intentType: AgentIntentType): AgentCapability? {
        return capabilities.firstOrNull { it.supportedIntents.contains(intentType) }
    }

    /** Route an intent to the appropriate capability and execute it. */
    fun route(intent: AgentIntent): AgentCapabilityResult {
        val capability = findCapabilityFor(intent.intent)

        if (capability == null) {
            return AgentCapabilityResult(
                success = false,
                explanation = "I'm sorry, I don't have a capability to handle that type of request.",
                permissionLevel = intent.permissionLevel
            )
        }

        // Check permission
        if (intent.permissionLevel.requiredPermission.value !in capability.requiredPermission.value) {
            return AgentCapabilityResult(
                success = false,
                explanation = "You don't have permission to perform this action.",
                permissionLevel = intent.permissionLevel
            )
        }

        return capability.execute(intent)
    }

    /** Route an intent without permission checking (for internal use). */
    fun routeInternal(intent: AgentIntent): AgentCapabilityResult {
        return route(intent)
    }