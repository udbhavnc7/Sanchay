package com.ivy.ui.component.cards

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.ivy.design.system.typography.SanchayTypography

@Composable
fun SanchayCard(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        content()
    }
}

@Composable
fun SanchayCardWithHeader(
    title: String,
    modifier: Modifier = Modifier,
    subtitle: String? = null,
    showDivider: Boolean = true,
    content: @Composable () -> Unit,
) {
    SanchayCard(modifier = modifier) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = title, style = SanchayTypography.Heading3)
            if (subtitle != null) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = subtitle, style = SanchayTypography.BodySecondary)
            }
            if (showDivider) {
                Spacer(modifier = Modifier.height(8.dp))
                HorizontalDivider()
                Spacer(modifier = Modifier.height(8.dp))
            }
            content()
        }
    }
}

@Composable
fun SanchayIncomeExpenseCard(
    income: String,
    expense: String,
    modifier: Modifier = Modifier,
    title: String = "",
    content: @Composable () -> Unit = {},
) {
    SanchayCard(modifier = modifier) {
        Column(modifier = Modifier.padding(16.dp)) {
            if (title.isNotEmpty()) {
                Text(text = title, style = SanchayTypography.Heading3)
                Spacer(modifier = Modifier.height(8.dp))
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Column {
                    Text(text = income, style = SanchayTypography.Numerical)
                    Text(text = "Income", style = SanchayTypography.Caption)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(text = expense, style = SanchayTypography.Numerical)
                    Text(text = "Expense", style = SanchayTypography.Caption)
                }
            }
            content()
        }
    }
}

@Composable
fun SanchayBudgetProgressCard(
    progress: Float,
    label: String,
    target: String,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit = {},
) {
    SanchayCard(modifier = modifier) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = label, style = SanchayTypography.Body)
            Text(text = target, style = SanchayTypography.Caption)
            Spacer(modifier = Modifier.height(8.dp))
            LinearProgressIndicator(progress = progress.coerceIn(0f, 1f))
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "${(progress.coerceIn(0f, 1f) * 100).toInt()}%",
                style = SanchayTypography.Numerical,
            )
            content()
        }
    }
}

@Composable
fun SanchayGoalProgressCard(
    progress: Float,
    target: String,
    current: String,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit = {},
) {
    SanchayCard(modifier = modifier) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = current, style = SanchayTypography.NumericalLarge)
            Text(text = target, style = SanchayTypography.Caption)
            Spacer(modifier = Modifier.height(8.dp))
            LinearProgressIndicator(progress = progress.coerceIn(0f, 1f))
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "${(progress.coerceIn(0f, 1f) * 100).toInt()}%",
                style = SanchayTypography.Numerical,
            )
            content()
        }
    }
}
