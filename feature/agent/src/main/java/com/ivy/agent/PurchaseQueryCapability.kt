package com.ivy.agent

import com.ivy.data.db.entity.PurchaseEntity
import com.ivy.data.db.dao.read.PurchaseDao
import java.util.*

class PurchaseQueryCapability(
    private val purchaseDao: PurchaseDao
) : AgentCapability() {

    override val supportedIntents: List<AgentIntentType> =
        listOf(AgentIntentType.PURCHASE_QUERY)

    override val requiredPermission: AgentPermissionLevel = AgentPermissionLevel.READ

    override fun execute(intent: AgentIntent): AgentCapabilityResult {
        // In a full implementation, query the purchaseDao
        // For V1, return structured placeholder data

        val explanation = "I can help you check your purchases and return deadlines. Please check the Purchase Protection screen in Sanchay for detailed information."

        AgentCapabilityResult(
            success = true,
            explanation = explanation,
            data = mapOf("hasPurchaseData" to false)
        )
    }
}