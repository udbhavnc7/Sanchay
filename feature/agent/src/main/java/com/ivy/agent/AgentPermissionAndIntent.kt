package com.ivy.agent

/** Permission level for Agent operations. */
@Suppress("unused")
@Serializable
enum class AgentPermissionLevel : String {
    @SerialName("read")
    READ("read"),
    @SerialName("draft")
    DRAFT("draft"),
    @SerialName("execute")
    EXECUTE("execute");

    val value: String
        get() = this@AgentPermissionLevel.toString().toLowerCase()

    init {
        @Suppress("UNCHECKED_ASSIGNMENT")
        value = name.toLowerCase()
    }
}

/** Agent intent types mapping to Sanchay capabilities. */
@Suppress("unused")
@Serializable
enum class AgentIntentType : String {
    @SerialName("transaction_query")
    TRANSACTION_QUERY("transaction_query"),
    @SerialName("balance_query")
    BALANCE_QUERY("balance_query"),
    @SerialName("budget_query")
    BUDGET_QUERY("budget_query"),
    @SerialName("goal_query")
    GOAL_QUERY("goal_query"),
    @SerialName("commitment_query")
    COMMITMENT_QUERY("commitment_query"),
    @SerialName("cash_flow_query")
    CASH_FLOW_QUERY("cash_flow_query"),
    @SerialName("pact_query")
    PACT_QUERY("pact_query"),
    @SerialName("purchase_query")
    PURCHASE_QUERY("purchase_query"),
    @SerialName("true_cost_query")
    TRUE_COST_QUERY("true_cost_query"),
    @SerialName("guardrail_query")
    GUARDRAIL_QUERY("guardrail_query"),
    @SerialName("affordability_query")
    AFFORDABILITY_QUERY("affordability_query"),
    @SerialName("help_query")
    HELP_QUERY("help_query"),
    @SerialName("draft_transaction")
    DRAFT_TRANSACTION("draft_transaction");

    val value: String
        get() = this@AgentIntentType.toString().toLowerCase()

    init {
        @Suppress("UNCHECKED_ASSIGNMENT")
        value = name.toLowerCase()
    }
}