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
@Entity(tableName = "goals")
data class GoalEntity(
    @SerialName("name")
    val name: String,
    @SerialName("targetAmount")
    val targetAmount: Double,
    @SerialName("currentAmount")
    val currentAmount: Double,
    @SerialName("targetDate")
    @Serializable(with = KSerializerInstant::class)
    val targetDate: Instant?,
    @SerialName("startDate")
    @Serializable(with = KSerializerInstant::class)
    val startDate: Instant?,
    @SerialName("status")
    val status: String,
    @SerialName("notes")
    val notes: String?,
    @SerialName("linkedAccountId")
    @Serializable(with = KSerializerUUID::class)
    val linkedAccountId: UUID?,
    @SerialName("linkedCategoryId")
    @Serializable(with = KSerializerUUID::class)
    val linkedCategoryId: UUID?,
    @SerialName("orderId")
    val orderId: Double,
    @SerialName("id")
    @SerialName("id")
    @Serializable(with = KSerializerUUID::class)
    val id: UUID = UUID.randomUUID()
)