package com.ivy.agent

import com.ivy.domain.intelligence.FinancialIntelligenceEngine
import com.ivy.domain.intelligence.FinancialSignal
import kotlinx.coroutines.runBlocking

class IntelligenceQueryCapability(
    private val intelligenceEngine: FinancialIntelligenceEngine
) : AgentCapability {

    override val supportedIntents: List<AgentIntentType> =
        listOf(AgentIntentType.INTELLIGENCE_QUERY, AgentIntentType.HELP_QUERY)

    override val requiredPermission: AgentPermissionLevel = AgentPermissionLevel.READ

    override fun execute(intent: AgentIntent): AgentCapabilityResult {
        val signals = runBlocking {
            intelligenceEngine.evaluateSignals()
        }

        val explanation = if (signals.isEmpty()) {
            "Your financial position is stable with no critical items requiring immediate attention."
        } else {
            val summary = signals.take(3).joinToString("\n• ") { "${it.title}: ${it.explanation}" }
            "Here is what needs your attention:\n• $summary"
        }

        return AgentCapabilityResult(
            success = true,
            explanation = explanation,
            data = signals,
            permissionLevel = requiredPermission
        )
    }
}
