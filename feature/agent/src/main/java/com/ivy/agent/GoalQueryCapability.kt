package com.ivy.agent

import com.ivy.data.db.entity.GoalEntity
import com.ivy.data.db.dao.read.GoalDao
import java.util.*

class GoalQueryCapability(
    private val goalDao: GoalDao
) : AgentCapability() {

    override val supportedIntents: List<AgentIntentType> =
        listOf(AgentIntentType.GOAL_QUERY)

    override val requiredPermission: AgentPermissionLevel = AgentPermissionLevel.READ

    override fun execute(intent: AgentIntent): AgentCapabilityResult {
        val goals = goalDao.findAll()

        if (goals.isEmpty()) {
            return AgentCapabilityResult(
                success = true,
                explanation = "You don't have any financial goals set up.",
                data = mapOf("hasGoals" to false)
            )
        }

        // Process the first active goal (or all goals)
        val goal = goals.firstOrNull {}
            // Filter for active goals
        ?: goals.first()

        val target = goal.targetAmount
        val current = goal.currentAmount
        val remaining = target - current
        val progress = if (target > 0) (current / target * 100.0) else 0.0
        val targetDate = goal.targetDate
        val requiredMonthly = /* calculate required monthly contribution */ 0.0

        val healthState = when {
            remaining <= 0.0 -> "completed"
            progress >= 80.0 -> "on_track"
            progress >= 50.0 -> "watch"
            else -> "at_risk"
        }

        val explanation = buildGoalExplanation(
            goalName = goal.name,
            target = target,
            current = current,
            remaining = remaining,
            progress = progress,
            healthState = healthState,
            targetDate = targetDate,
            requiredMonthly = requiredMonthly
        )

        AgentCapabilityResult(
            success = true,
            explanation = explanation,
            data = mapOf(
                "goalName" to goal.name,
                "target" to target,
                "current" to current,
                "remaining" to remaining,
                "progress" to progress,
                "healthState" to healthState,
                "targetDate" to targetDate?.toString(),
                "requiredMonthly" to requiredMonthly,
                "hasGoals" to true
            )
        )
    }

    private fun buildGoalExplanation(
        goalName: String,
        target: Double,
        current: Double,
        remaining: Double,
        progress: Double,
        healthState: String,
        targetDate: Instant?,
        requiredMonthly: Double
    ): String {
        val formatted = { d: Double -> d.format("%.0f") }

        val header = "Your $goalName goal is $healthState."
        val progressInfo = "₹${formatted(current)} of ₹${formatted(target)} (${progress.toInt()}%)"
        val remainingInfo = "₹${formatted(remaining)} remaining"
        val statusInfo = when (healthState) {
            "completed" -> "Goal completed!"
            "on_track" -> "On track for target date."
            "watch" -> "Making steady progress."
            "at_risk" -> "May need increased contributions."
            else -> ""
        }

        return "$header $progressInfo. $remainingInfo. $statusInfo"
    }
}