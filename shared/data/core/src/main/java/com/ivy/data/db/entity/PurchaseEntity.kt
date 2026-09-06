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
@Entity(tableName = "purchases")
data class PurchaseEntity(
    @SerialName("title")
    val title: String,
    @SerialName("merchant")
    val merchant: String? = null,
    @SerialName("purchaseDate")
    @Serializable(with = KSerializerInstant::class)
    val purchaseDate: Instant?,
    @SerialName("amount")
    val amount: Double,
    @SerialName("currency")
    val currency: String? = null,
    @SerialName("linkedTransactionId")
    @Serializable(with = KSerializerUUID::class)
    val linkedTransactionId: UUID? = null,
    @SerialName("categoryId")
    @Serializable(with = KSerializerUUID::class)
    val categoryId: UUID? = null,
    @SerialName("notes")
    val notes: String? = null,
    @SerialName("returnDeadline")
    @Serializable(with = KSerializerInstant::class)
    val returnDeadline: Instant? = null,
    @SerialName("warrantyStartDate")
    @Serializable(with = KSerializerInstant::class)
    val warrantyStartDate: Instant? = null,
    @SerialName("warrantyEndDate")
    @Serializable(with = KSerializerInstant::class)
    val warrantyEndDate: Instant? = null,
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
