package com.ivy.data.db.entity

import androidx.annotation.Keep
import androidx.room.Entity
import androidx.room.PrimaryKey
import com.ivy.base.kotlinxserilzation.KSerializerInstant
import com.ivy.base.kotlinxserilzation.KSerializerUUID
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import java.time.Instant
import java.util.UUID

@Suppress("DataClassDefaultValues")
@Keep
@Serializable
@Entity(tableName = "financial_rules")
data class FinancialRuleEntity(
    @SerialName("name")
    val name: String,
    @SerialName("enabled")
    @Serializable(with = KSerializerInstant::class)
    val enabled: Boolean,
    @SerialName("triggerType")
    val triggerType: String,
    @SerialName("conditionOperator")
    val conditionOperator: String,
    @SerialName("thresholdValue")
    val thresholdValue: Double,
    @SerialName("categoryId")
    @Serializable(with = KSerializerUUID::class)
    val categoryId: UUID? = null,
    @SerialName("accountId")
    @Serializable(with = KSerializerUUID::class)
    val accountId: UUID? = null,
    @SerialName("budgetId")
    @Serializable(with = KSerializerUUID::class)
    val budgetId: UUID? = null,
    @SerialName("goalId")
    @Serializable(with = KSerializerUUID::class)
    val goalId: UUID? = null,
    @SerialName("pactId")
    @Serializable(with = KSerializerUUID::class)
    val pactId: UUID? = null,
    @SerialName("purchaseId")
    @Serializable(with = KSerializerUUID::class)
    val purchaseId: UUID? = null,
    @SerialName("actionType")
    val actionType: String,
    @SerialName("createdAt")
    @Serializable(with = KSerializerInstant::class)
    val createdAt: Instant,
    @SerialName("updatedAt")
    @Serializable(with = KSerializerInstant::class)
    val updatedAt: Instant,

    @Deprecated("Obsolete field used for cloud sync. Can't be deleted because of backwards compatibility")
    @SerialName("isSynced")
    val isSynced: Boolean = false,
    @Deprecated("Obsolete field used for cloud sync. Can't be deleted because of backwards compatibility")
    @SerialName("isDeleted")
    val isDeleted: Boolean = false,

    @PrimaryKey
    @SerialName("id")
    @Serializable(with = KSerializerUUID::class)
    val id: UUID = UUID.randomUUID()
)