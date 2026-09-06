package com.ivy.goals

import com.ivy.data.model.primitive.NotBlankTrimmedString
import com.ivy.data.model.primitive.UUID
import com.ivy.goals.model.Goal
import java.time.Instant

data class GoalModalData(
    val goal: Goal?,
    val baseCurrency: String,
    val id: UUID = UUID.randomUUID(),
    val autoFocusKeyboard: Boolean = true,
) {
    fun toGoalEntity(): GoalEntity {
        return when (goal) {
            is Goal -> GoalEntity(
                name = goal.name,
                targetAmount = goal.targetAmount,
                currentAmount = goal.currentAmount,
                targetDate = goal.targetDate,
                startDate = null,
                status = goal.status.value,
                notes = goal.notes,
                linkedAccountId = goal.linkedAccountId?.value,
                linkedCategoryId = goal.linkedCategoryId?.value,
                orderId = goal.orderId,
                id = goal.id
            )
            is null -> GoalEntity(
                name = NotBlankTrimmedString.unsafe(""),
                targetAmount = 0.0,
                currentAmount = 0.0,
                targetDate = null,
                startDate = null,
                status = "active",
                notes = null,
                linkedAccountId = null,
                linkedCategoryId = null,
                orderId = 0.0,
                id = id
            )
        }
    }
}