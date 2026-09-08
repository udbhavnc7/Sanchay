package com.ivy.agent

class HelpQueryCapability() : AgentCapability() {

    override val supportedIntents: List<AgentIntentType> =
        listOf(AgentIntentType.HELP_QUERY)

    override val requiredPermission: AgentPermissionLevel = AgentPermissionLevel.READ

    override fun execute(intent: AgentIntent): AgentCapabilityResult {
        val explanation = """Sanchay Agent can help you with:

• Transaction queries: "How much did I spend on food this month?"
• Balance inquiries: "What is my current balance?"
• Budget status: "How am I doing on my food budget?"
• Goal progress: "How am I doing on my laptop goal?"
• Commitments: "What payments are coming up?"
• Cash flow: "What will my balance look like at month end?"
• Pact status: "Which Pacts are overdue?"
• Purchase protection: "Which warranties are expiring?"
• True cost: "How much has my phone actually cost me?"
• Guardrail status: "Which rules are currently active?"
• Affordability: "Can I afford ₹25,000?"
• Draft transactions: "Draft a ₹2,000 Food expense for today"

For best results, be specific about amounts, categories, and time periods.

Example questions:
• "Can I afford ₹15,000 on Electronics?"
• "How much did I spend on Food this month?"
• "What's my food budget status?"
• "What commitments do I have this week?"

All calculations use your existing Sanchay financial data."""

        AgentCapabilityResult(
            success = true,
            explanation = explanation,
            data = mapOf("availableIntents" to listOf(
                "transaction_query",
                "balance_query",
                "budget_query",
                "goal_query",
                "commitment_query",
                "cash_flow_query",
                "pact_query",
                "purchase_query",
                "true_cost_query",
                "guardrail_query",
                "affordability_query",
                "help_query",
                "draft_transaction"
            ))
        )
    }
}