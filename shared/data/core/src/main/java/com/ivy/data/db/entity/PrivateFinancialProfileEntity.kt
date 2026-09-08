package com.ivy.data.db.entity

import androidx.annotation.Keep
import androidx.room.Entity
import androidx.room.Ignore
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
@Entity(tableName = "private_financial_profile")
data class PrivateFinancialProfileEntity(
    @PrimaryKey
    @SerialName("id")
    @Serializable(with = KSerializerUUID::class)
    val id: UUID = UUID.randomUUID(),

    @SerialName("displayName")
    var displayName: String? = null,

    @SerialName("bio")
    var bio: String? = null,

    @SerialName("avatarReference")
    var avatarReference: String? = null,

    @SerialName("createdAt")
    @Serializable(with = KSerializerInstant::class)
    val createdAt: Instant = Instant.now(),

    @SerialName("updatedAt")
    @Serializable(with = KSerializerInstant::class)
    var updatedAt: Instant = Instant.now(),

    @SerialName("visibility")
    var visibility: String = "PRIVATE",

    @Deprecated("Obsolete field used for cloud sync. Can't be deleted because of backwards compatibility")
    @SerialName("isSynced")
    var isSynced: Boolean = false,

    @Deprecated("Obsolete field used for cloud sync. Can't be deleted because of backwards compatibility")
    @SerialName("isDeleted")
    var isDeleted: Boolean = false
) {
    @Ignore
    var sections: List<ProfileSectionConfig> = emptyList()
}

@Keep
@Serializable
data class ProfileSectionConfig(
    @SerialName("key")
    val key: String,

    @SerialName("label")
    val label: String,

    @SerialName("visibility")
    var visibility: String = "PRIVATE",

    @SerialName("order")
    val order: Int = 0
)