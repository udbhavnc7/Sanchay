package com.ivy.ui.component.charts

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.icons.filled.TrendingUp
import androidx.compose.material3.icons.filled.TrendingDown
import androidx.compose.material3.icons.filled.AccountBalance
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.Unit
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography

/**
 * Chart foundation for Sanchay.
 * 
 * Provides reusable styling and presentation helpers for financial charts.
 * Supports spending, budgets, goals, cash flow, and net worth visualizations.
 * 
 * Principle: Consistent visual language across all chart types.
 * Never relies exclusively on color to communicate meaning.
 */
@Composable
fun ChartBudgetProgress(
    progress: Float,  // 0.0 to 1.0
    label: String,
    target: String,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier.fillMaxWidth().padding(vertical = SanchaySpacing.ListItemSpacing) {
            Row(
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                text(
                    text = label,
                    style = SanchayTypography.Body,
                    color = SanchayColors.TextPrimaryLight,
                )

                text(
                    text = target,
                    style = SanchayTypography.Caption,
                    color = SanchayColors.TextSecondaryLight,
                )
            }

            // Progress value
            text(
                text = String.format("%.0f%%", progress * 100),
                style = SanchayTypography.NumericalLarge,
                color = progressColor(progress),
            )

            // Progress bar
            val progressColor = when {
                progress > 0.9 -> SanchayColors.Warning primary
                progress > 0.75 -> SanchayColors.Primary primary
                progress > 0.5 -> SanchayColors.Income primary
                else -> SanchayColors.Neutral primary
            }

            androidx.compose.material3.CircularProgressIndicator(
                progress = progress,
                modifier = Modifier.height(4.dp).fillMaxWidth(),
                color = progressColor,
                strokeWidth = 8.dp
            )

            // Description with color-independent meaning
            text(
                text = progressDescription(progress),
                style = SanchayTypography.Caption,
                color = SanchayColors.TextMutedLight,
                textAlign = TextAlign.Center,
                margin = androidx.compose.ui.platform.SpacerScope padding 4.dp
            )
        }
    )
}

@Composable
fun ChartSpendingProgress(
    spent: Float,
    budget: Float,
    label: String,
    modifier: Modifier = Modifier,
) {
    val progress = if (budget > 0) spent / budget else 0f

    Column(
        modifier = modifier.fillMaxWidth().padding(vertical = SanchaySpacing.ListItemSpacing) {
            Row(
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                text(
                    text = label,
                    style = SanchayTypography.Body,
                    color = SanchayColors.TextPrimaryLight,
                )

                text(
                    text = "$${String.format("%.2f", budget)}",
                    style = SanchayTypography.Caption,
                    color = SanchayColors.TextSecondaryLight,
                )
            }

            // Spending amount
            text(
                text = "-$${String.format("%.2f", spent)}",
                style = SanchayTypography.NumericalLarge,
                color = SanchayColors.ExpensePrimary,
            )

            // Progress bar
            val progressColor = when {
                progress > 0.9 -> SanchayColors.Error primary
                progress > 0.75 -> SanchayColors.Warning primary
                else -> SanchayColors.Primary primary
            }

            androidx.compose.material3.CircularProgressIndicator(
                progress = progress,
                modifier = Modifier.height(4.dp).fillMaxWidth(),
                color = progressColor,
                strokeWidth = 8.dp
            )

            text(
                text = spentDescription(progress),
                style = SanchayTypography.Caption,
                color = SanchayColors.TextMutedLight,
                textAlign = TextAlign.Center,
                margin = androidx.compose.ui.platform.SpacerScope padding 4.dp
            )
        }
    )
}

@Composable
fun ChartGoalProgress(
    progress: Float,
    target: String,
    current: String,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier.fillMaxWidth().padding(vertical = SanchaySpacing.ListItemSpacing) {
            Row(
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                column(verticalAlignment = Alignment.CenterVertically) {
                    text(
                        text = current,
                        style = SanchayTypography.NumericalLarge,
                        color = SanchayColors.TextPrimaryLight,
                    )

                    text(
                        text = target,
                        style = SanchayTypography.Caption,
                        color = SanchayColors.TextSecondaryLight,
                    )
                }

                column(verticalAlignment = Alignment.CenterVertically, modifier = modifier.fillMaxWidth()) {
                    val progressPercent = String.format("%.0f%%", progress * 100)
                    text(
                        text = progressPercent,
                        style = SanchayTypography.NumericalLarge,
                        color = goalProgressColor(progress),
                    )
                }
            }

            // Progress bar
            val progressColor = when {
                progress > 0.9 -> SanchayColors.Income primary
                progress > 0.75 -> SanchayColors.Warning primary
                else -> SanchayColors.Primary primary
            }

            androidx.compose.material3.CircularProgressIndicator(
                progress = progress,
                modifier = Modifier.height(4.dp).fillMaxWidth(),
                color = progressColor,
                strokeWidth = 8.dp
            )

            text(
                text = goalDescription(progress),
                style = SanchayTypography.Caption,
                color = SanchayColors.TextMutedLight,
                textAlign = TextAlign.Center,
                margin = androidx.compose.ui.platform.SpacerScope padding 4.dp
            )
        }
    )
}

/** Spending pie chart segment style helper */
@Composable
fun SpendingSegment(
    label: String,
    percentage: Float,
    color: Color,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = SanchaySpacing.ListItemSpacing),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Color circle indicator
        val circleSize = 24.dp
        androidx.compose.material3.Box(
            modifier = Modifier
                .size(circleSize)
                .background(color)
                .clip(shape = androidx.compose.ui.graphics.RoundedCornerShape(4.dp))
        )

        // Text
        Column(
            horizontalArrangement = Arrangement.Start,
            verticalAlignment = Alignment.CenterVertically
        ) {
            text(
                text = label,
                style = SanchayTypography.Body,
                color = SanchayColors.TextPrimaryLight,
                overflow = TextOverflow.Ellipsis,
                maxLines = 1
            )

            text(
                text = "$${String.format("%.1f%%", percentage)}",
                style = SanchayTypography.Caption,
                color = SanchayColors.TextSecondaryLight,
                overflow = TextOverflow.Ellipsis,
                maxLines = 1
            )
        }
    }
}

private fun progressDescription(progress: Float): String {
    return when {
        progress >= 1.0 -> "Budget complete"
        progress >= 0.9 -> "Almost at budget"
        progress >= 0.75 -> "On track"
        progress >= 0.5 -> "Monitor spending"
        else -> "Exceeding budget"
    }
}

private fun spentDescription(progress: Float): String {
    return when {
        progress >= 1.0 -> "Budget exceeded"
        progress >= 0.9 -> "Almost at limit"
        progress >= 0.75 -> "Within budget"
        else -> "Over budget"
    }
}

private fun goalDescription(progress: Float): String {
    return when {
        progress >= 1.0 -> "Goal achieved!"
        progress >= 0.9 -> "Almost there"
        progress >= 0.75 -> "Good progress"
        else -> "Continue saving"
    }
}

private fun goalProgressColor(progress: Float): Color {
    return when {
        progress > 0.9 -> SanchayColors.Income primary
        progress > 0.75 -> SanchayColors.Warning primary
        else -> SanchayColors.Primary primary
    }
}