package com.ivy.ui.component.financial

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.icons.filled.ChevronDown
import androidx.compose.material3.icons.filled.ChevronUp
import androidx.compose.material3.TextButton
import androidx.compose.material3.TextView
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.Unit
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.setOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography

/**
 * FinancialAmount - Display component for financial amounts.
 * 
 * Shows income, expense, neutral, pending, or overdue amounts
 * with appropriate coloring and semantics.
 * 
 * Principle: Financial numbers must always remain understandable.
 * Color communicates positive/negative meaning but is never the only cue.
 */
@Composable
fun FinancialAmount(
    amount: String,
    style: FinancialAmountStyle = FinancialAmountStyle.Neutral,
    showSign: Boolean = true,
    modifier: Modifier = Modifier,
) {
    val (amountText, textColor, iconVector) = when (style) {
        is FinancialAmountStyle.Income -> {
            val display = if (showSign && amount.toDoubleOrNull() ?: 0 >= 0) amount else "+$amount"
            (display, SanchayColors.IncomePrimary,
                androidx.compose.material3.icons.filled.TrendingUp)
        }
        is FinancialAmountStyle.Expense -> {
            val display = if (showSign && amount.toDoubleOrNull() ?: 0 <= 0) amount else "$amount"
            (display, SanchayColors.ExpensePrimary,
                androidx.compose.material3.icons.filled.TrendingDown)
        }
        is FinancialAmountStyle.Neutral -> (amount, SanchayColors.TextPrimaryLight,
            androidx.compose.material3.icons.filled.Equalizer)
        is FinancialAmountStyle.Pending -> (amount, SanchayColors.Warning primary,
            androidx.compose.material3.icons.filled.HourglassEmpty)
        is FinancialAmountStyle.Overdue -> (amount, SanchayColors.Error primary,
            androidx.compose.material3.icons.filled.Close)
    }

    Row(
        modifier = modifier
            .padding(vertical = SanchaySpacing.ListItemSpacing),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        text(
            text = amountText,
            style = if (showSign) SanchayTypography.Numerical else SanchayTypography.Body,
            color = textColor,
            textAlign = TextAlign.Start
        )

        if (showSign) {
            Icon(
                imageVector = iconVector,
                contentDescription = when (style) {
                    FinancialAmountStyle.Income -> "Positive financial movement"
                    FinancialAmountStyle.Expense -> "Negative financial movement"
                    FinancialAmountStyle.Neutral -> "Neutral amount"
                    FinancialAmountStyle.Pending -> "Pending transaction"
                    FinancialAmountStyle.Overdue -> "Overdue payment"
                },
                tint = textColor
            )
        }
    }
}

/** Styles for FinancialAmount */
enum class FinancialAmountStyle {
    Income,
    Expense,
    Neutral,
    Pending,
    Overdue
}

/**
 * BalanceDisplay - Display component for account balances.
 * 
 * Supports:
 * - Large balance display
 * - Hidden balance/privacy mode
 * - Currency
 * - Positive/negative/neutral states
 */
@Composable
fun BalanceDisplay(
    balance: String,
    currency: String = "USD",
    showPrivacy: Boolean = false,
    modifier: Modifier = Modifier,
) {
    var isPrivate by remember { mutableStateOf(showPrivacy) }

    Column(
        modifier = modifier.fillMaxWidth().padding(vertical = SanchaySpacing.ListItemSpacing) {
            if (!isPrivate) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                   Arrangement = Arrangement.SpaceBetween
                ) {
                    text(
                        text = "$balance $currency",
                        style = SanchayTypography.HeroFinancial,
                        color = SanchayColors.TextPrimaryLight,
                        textAlign = TextAlign.Start
                    )

                    TextButton(
                        onClick = { isPrivate = true },
                        text = "Hide"
                    )
                }

                // Small text with subtler info
                text(
                    text = "Current balance",
                    style = SanchayTypography.Caption,
                    color = SanchayColors.TextSecondaryLight,
                    textAlign = TextAlign.Start
                )
            } else {
                // Privacy mode - show masked balance
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    arrangement = Arrangement.SpaceBetween
                ) {
                    text(
                        text = "•••••• ••••••",
                        style = SanchayTypography.HeroFinancial,
                        color = SanchayColors.TextMutedLight,
                        textAlign = TextAlign.Start
                    )

                    TextButton(
                        onClick = { isPrivate = false },
                        text = "Show"
                    )
                }

                text(
                    text = "Balance hidden for privacy",
                    style = SanchayTypography.Caption,
                    color = SanchayColors.TextSecondaryLight,
                    textAlign = TextAlign.Start
                )
            }
        }
    )
}

/** Progress component for budget or goal tracking */
@Composable
fun FinancialProgress(
    progress: Float,  // 0.0 to 1.0
    label: String,
    target: String,
    showPercentage: Boolean = true,
    modifier: Modifier = Modifier,
) {
    val progressPercent = if (showPercentage) {
        String.format("%.0f%%", progress * 100)
    } else ""

    Column(
        modifier = modifier.fillMaxWidth().padding(vertical = SanchaySpacing.ListItemSpacing) {
            Row(
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                column(verticalAlignment = Alignment.CenterVertically) {
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

                column(verticalAlignment = Alignment.CenterVertically, modifier = modifier.fillMaxWidth()) {
                    text(
                        text = progressPercent,
                        style = SanchayTypography.NumericalLarge,
                        color = progressColor(progress),
                    )
                }
            }

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

            // Accessible text description
            text(
                text = when {
                    progress >= 1.0 -> "Complete"
                    progress >= 0.9 -> "Almost there"
                    progress >= 0.75 -> "Good progress"
                    else -> "Continue working toward goal"
                },
                style = SanchayTypography.Caption,
                color = SanchayColors.TextMutedLight,
                textAlign = TextAlign.Center
            )
        }
    )
}