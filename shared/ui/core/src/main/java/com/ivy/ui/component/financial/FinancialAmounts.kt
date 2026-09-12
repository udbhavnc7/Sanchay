package com.ivy.ui.component.financial

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.ivy.design.system.typography.SanchayTypography

enum class FinancialAmountStyle {
    Income,
    Expense,
    Neutral,
    Pending,
    Overdue,
}

@Composable
fun FinancialAmount(
    amount: String,
    modifier: Modifier = Modifier,
    style: FinancialAmountStyle = FinancialAmountStyle.Neutral,
    showSign: Boolean = true,
) {
    val displayText = if (showSign) {
        when (style) {
            FinancialAmountStyle.Income -> "+$amount"
            FinancialAmountStyle.Expense -> "-$amount"
            FinancialAmountStyle.Neutral,
            FinancialAmountStyle.Pending,
            FinancialAmountStyle.Overdue -> amount
        }
    } else {
        amount
    }
    Text(
        text = displayText,
        style = SanchayTypography.Numerical,
        modifier = modifier,
    )
}

@Composable
fun BalanceDisplay(
    balance: String,
    modifier: Modifier = Modifier,
    currency: String = "USD",
    showPrivacy: Boolean = false,
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = if (showPrivacy) "••••••" else "$balance $currency",
            style = SanchayTypography.HeroFinancial,
        )
        Text(
            text = "Current balance",
            style = SanchayTypography.Caption,
        )
    }
}

@Composable
fun FinancialProgress(
    progress: Float,
    label: String,
    target: String,
    modifier: Modifier = Modifier,
    showPercentage: Boolean = true,
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(text = label, style = SanchayTypography.Body)
            if (showPercentage) {
                Text(
                    text = "${(progress.coerceIn(0f, 1f) * 100).toInt()}%",
                    style = SanchayTypography.Numerical,
                )
            }
        }
        Text(text = target, style = SanchayTypography.Caption)
        Spacer(modifier = Modifier.height(8.dp))
        LinearProgressIndicator(progress = progress.coerceIn(0f, 1f))
    }
}
