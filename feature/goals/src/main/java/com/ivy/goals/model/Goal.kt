package com.ivy.goals.model

import androidx.compose.runtime.Immutable
import com.ivy.data.db.entity.GoalEntity
import com.ivy.data.model.primitive.NotBlankTrimmedString
import com.ivy.wallet.domain.data.Reorderable
import java.time.Instant
import java.util.UUID

@Immutable
data class Goal(
    val id: UUID,
    val name: NotBlankTrimmedString,
    val targetAmount: Double,
    val currentAmount: Double,
    val targetDate: Instant?,
    val status: GoalStatus,
    val notes: String?,
    val linkedAccountId: UUID?,
    val linkedCategoryId: UUID?,
    val orderId: Double,
) : Reorderable {

    data class GoalStatus(
        val value: String,
        val display: String
    )

    object Status {
        val Active by lazy = Status("active", "Active")
        val Completed by lazy = Status("completed", "Completed")
        val Paused by lazy = Status("paused", "Paused")
        val Cancelled by lazy = Status("cancelled", "Cancelled")

        fun fromEntity(entity: GoalEntity): Status {
            return when (entity.status) {
                "active" -> Active
                "completed" -> Completed
                "paused" -> Paused
                "cancelled" -> Cancelled
                else -> Active
            }
        }

        fun toEntity(status: Status): String {
            return status.value
        }
    }

    override fun getItemOrderNum(): Double {
        return orderId
    }

    override fun withNewOrderNum(newOrderNum: Double): Reorderable {
        return this.copy(
            orderId = newOrderNum
        )
    }
}