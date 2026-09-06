package com.ivy.rules

import com.ivy.data.db.entity.FinancialRuleEntity
import com.ivy.data.db.dao.read.FinancialRuleDao
import com.ivy.data.db.dao.write.WriteFinancialRuleDao
import com.ivy.base.kotlinxserilzation.KSerializerInstant
import com.ivy.base.kotlinxserilzation.KSerializerUUID
import kotlinx.serialization.SerializationSerializable
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.decodeFromString
import kotlinx.serialization.json.encodeToString
import java.util.*
import java.time.Instant
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import org.mockito.Mockito.*
import org.mockito.ArgumentMatchers.*

class RuleEntityTest {

    @BeforeEach
    fun setup() {
        // Entity tests
    }

    @Test
    fun rule_entity_can_be_created_and_serialized() {
        val rule = FinancialRuleEntity(
            name = "Food Spending Guardrail",
            enabled = true,
            triggerType = "spending_threshold",
            conditionOperator = ">",
            thresholdValue = 2000.0,
            categoryId = null,
            accountId = null,
            budgetId = null,
            goalId = null,
            pactId = null,
            purchaseId = null,
            actionType = "show_warning",
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )

        val serial = encodeToString(rule)
        val decoded = decodeFromString<FinancialRuleEntity>(serial)

        assertNotNull(decoded)
        assertEquals(rule.name, decoded.name)
        assertEquals(rule.enabled, decoded.enabled)
        assertEquals(rule.triggerType, decoded.triggerType)
        assertEquals(rule.thresholdValue, decoded.thresholdValue)
    }

    @Test
    fun rule_default_values() {
        val rule = FinancialRuleEntity(
            name = "Test Rule",
            enabled = true,
            triggerType = "spending_threshold",
            conditionOperator = ">",
            thresholdValue = 1000.0,
            actionType = "show_warning",
            createdAt = Instant.EPOCH,
            updatedAt = Instant.EPOCH
        )

        assertNotNull(rule.id)
        assertTrue(rule.id !is NullPointerException)
        assertNull(rule.categoryId)
        assertNull(rule.accountId)
        assertNull(rule.budgetId)
        assertNull(rule.goalId)
        assertNull(rule.pactId)
        assertNull(rule.purchaseId)
    }
}