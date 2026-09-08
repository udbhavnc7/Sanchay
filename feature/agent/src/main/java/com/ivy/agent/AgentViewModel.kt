package com.ivy.agent

import com.ivy.base.resource.IvyViewModel
import com.ivy.base.threading.DispatchersProvider
import com.ivy.base.resource.ResourceProvider
import com.ivy.base.kotlinxserilzation.KSerializerInstant
import com.ivy.base.kotlinxserilzation.KSerializerUUID
import androidx.lifecycle.viewbinding.ViewBinding
import dagger.hilt.android.AndroidEntryPoint
import dagger.hilt.android.Hilt
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.*

@Hilt
@AndroidEntryPoint
class AgentViewModel(
    private val router: AgentRouter = AgentRouter(
        capabilities = listOf(
            TransactionQueryCapability(/* transactionDao */),
            BudgetQueryCapability(/* budgetDao */, /* categoryDao */),
            GoalQueryCapability(/* goalDao */),
            CommitmentQueryCapability(/* paymentRuleDao */),
            CashFlowQueryCapability(),
            TrueCostQueryCapability(/* costAssociationDao */),
            GuardrailQueryCapability(/* ruleDao */),
            AffordabilityQueryCapability(),
            HelpQueryCapability()
        )
    ),
    @ApplicationContext
    private val context: Context,
    private val resourceProvider: ResourceProvider,
    private val dispatchers: DispatchersProvider,
) : IvyViewModel() {

    private val _conversationHistory = MutableStateFlow<List<AgentMessage>>(listOf())
    val conversationHistory: StateFlow<List<AgentMessage>> = _conversationHistory.asStateFlow()

    private val _currentIntent = MutableStateFlow<AgentIntent?>(null)
    val currentIntent: StateFlow<AgentIntent?> = _currentIntent.asStateFlow()

    private val _isProcessing = MutableStateFlow(false)
    val isProcessing: StateFlow<bool> = _isProcessing.asStateFlow()

    private val _displayText = MutableStateFlow<String>("")
    val displayText: StateFlow<String> = _displayText.asStateFlow()

    init {
        startConversation()
    }

    fun startConversation() {
        val welcomeMessage = AgentMessage(
            role = "agent",
            text = "Hello! I'm Sanchay Agent. I can help you understand your financial position using your existing data. What would you like to know?",
            timestamp = Instant.now()
        )
        _conversationHistory.value = listOf(welcomeMessage)
    }

    fun processUserInput(text: String) {
        val userMessage = AgentMessage(
            role = "user",
            text = text,
            timestamp = Instant.now()
        )

        // Add user message to history
        _conversationHistory.value = _conversationHistory.value + userMessage

        // Process the intent
        launch(dispatchers.io) {
            _isProcessing.value = true
            try {
                val intent = parseIntent(text)
                val result = router.routeInternal(intent)

                val agentResponse = buildAgentResponse(intent, result)

                val assistantMessage = AgentMessage(
                    role = "agent",
                    text = agentResponse,
                    timestamp = Instant.now()
                )

                _conversationHistory.value = _conversationHistory.value + assistantMessage
                _currentIntent.value = intent
                _displayText.value = ""

                // Show toast for important results
                if (result.success && result.explanation != null) {
                    Toast.makeText(context, result.explanation, Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                val errorMessage = "I'm sorry, I encountered an error: ${e.message ?: "Unknown error"}"
                _conversationHistory.value = _conversationHistory.value + AgentMessage(
                    role = "agent",
                    text = errorMessage,
                    timestamp = Instant.now()
                )
                Toast.makeText(context, errorMessage, Toast.LENGTH_LONG).show()
            } finally {
                _isProcessing.value = false
            }
        }
    }

    private fun parseIntent(text: String): AgentIntent {
        val lower = text.lowercase()

        // Simple intent detection - real implementation would be more sophisticated
        return when {
            lower.contains("afford") && lower.contains("₹") -> AgentIntent(
                intent = AgentIntentType.AFFORDABILITY_QUERY,
                amount = extractAmount(text),
                queryText = text,
                permissionLevel = AgentPermissionLevel.READ
            )
            lower.contains("spend") && lower.contains("food") -> AgentIntent(
                intent = AgentIntentType.TRANSACTION_QUERY,
                amount = null,
                queryText = text,
                permissionLevel = AgentPermissionLevel.READ
            )
            lower.contains("budget") -> AgentIntent(
                intent = AgentIntentType.BUDGET_QUERY,
                categoryId = extractCategoryId(text),
                queryText = text,
                permissionLevel = AgentPermissionLevel.READ
            )
            lower.contains("goal") -> AgentIntent(
                intent = AgentIntentType.GOAL_QUERY,
                queryText = text,
                permissionLevel = AgentPermissionLevel.READ
            )
            lower.contains("commitment") || lower.contains("coming up") -> AgentIntent(
                intent = AgentIntentType.COMMITMENT_QUERY,
                queryText = text,
                permissionLevel = AgentPermissionLevel.READ
            )
            lower.contains("cash flow") || lower.contains("projected balance") -> AgentIntent(
                intent = AgentIntentType.CASH_FLOW_QUERY,
                queryText = text,
                permissionLevel = AgentPermissionLevel.READ
            )
            lower.contains("help") || lower.contains("what can") -> AgentIntent(
                intent = AgentIntentType.HELP_QUERY,
                queryText = text,
                permissionLevel = AgentPermissionLevel.READ
            )
            else -> AgentIntent(
                intent = AgentIntentType.HELP_QUERY,
                queryText = text,
                permissionLevel = AgentPermissionLevel.READ
            )
        }
    }

    private fun extractAmount(text: String): Double? {
        // Simple amount extraction - real implementation would be more robust
        val cleaned = text.replace("₹", "").replace(",", "").trim()
        return cleaned.toDoubleOrNull()
    }

    private fun extractCategoryId(text: String): UUID? {
        // Simple category extraction
        return null // In real implementation, map category name to UUID
    }

    private fun buildAgentResponse(intent: AgentIntent, result: AgentCapabilityResult): String {
        return when (result.success) {
            true -> {
                val base = result.explanation ?: "I've processed your request."
                val dataInfo = result.data?.let { data ->
                    when (data) {
                    // Format data for display
                    }
                }
                "$base ${result.explanation ?: ""}"
            }
            false -> {
                result.explanation ?: "I'm sorry, I couldn't process that request."
            }
        }
    }

    fun getConversationHistory(): List<AgentMessage> {
        return _conversationHistory.value
    }
}