package com.ivy.goals

import com.ivy.data.model.primitive.NotBlankTrimmedString
import com.ivy.goals.model.Goal
import kotlinx.collections.immutable.ImmutableList
import kotlinx.coroutines.flow.Flow

sealed interface GoalScreenEvent {
    case class OnCreateGoal(goalData: GoalModalData) : GoalScreenEvent
    case class OnEditGoal(goal: Goal) : GoalScreenEvent
    case class OnDeleteGoal(goal: Goal) : GoalScreenEvent
    case class OnGoalModalData(goalModalData: GoalModalData) : GoalScreenEvent
    case class OnReorderModalVisible(revisible: Boolean) : GoalScreenEvent
    case class OnReorder(newOrder: ImmutableList<Goal>) : GoalScreenEvent
}

@Immutable
data class GoalScreenState(
    val baseCurrency: String,
    val goals: ImmutableList<Goal>,
    val categories: ImmutableList<com.ivy.data.model.Category>,
    val accounts: ImmutableList<com.ivy.legacy.datamodel.Account>,
    val goalModalData: GoalModalData?
)