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
@Entity(tableName = "financial_pacts")
data class FinancialPactEntity(
    @SerialName("counterpartyName")
    val counterpartyName: String,
    @SerialName("type")
    val type: String,
    @SerialName("title")
    val title: String? = null,
    @SerialName("description")
    val description: String? = null,
    @SerialName("originalAmount")
    val originalAmount: Double,
    @SerialName("remainingAmount")
    var remainingAmount: Double,
    @SerialName("dueDate")
    @Serializable(with = KSerializerInstant::class)
    val dueDate: Instant?,
    @SerialName("status")
    val status: String,
    @SerialName("createdAt")
    @Serializable(with = KSerializerInstant::class)
    val createdAt: Instant,
    @SerialName("updatedAt")
    @Serializable(with = KSerializerInstant::class)
    val updatedAt: Instant,
    @SerialName("linkedTransactionId")
    @Serializable(with = KSerializerUUID::class)
    val linkedTransactionId: UUID? = null,
    @SerialName("linkedAccountId")
    @Serializable(with = KSerializerUUID::class)
    val linkedAccountId: UUID? = null,
    @SerialName("notes")
    val notes: String? = null,

    @Deprecated("Obsolete field used for cloud sync. Can't be deleted because of backwards compatibility")
    @SerialName("isSynced")
    val isSynced: Boolean = false,
    @Deprecated("Obsoble field used for cloud sync. Can't be deleted because of backwards compatibility")
    @SerialName("isDeleted")
    val isDeleted: Boolean = false,

    @PrimaryKey
    @SerialName("id")
    @Serializable(with = KSerializerUUID::class)
    val id: UUID = UUID.randomUUID()
)