package com.ivy.ui.component.charts

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.ivy.design.system.typography.SanchayTypography

@Composable
fun ChartBudgetProgress(
    progress: Float,
    label: String,
    target: String,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(text = label, style = SanchayTypography.Body)
            Text(text = target, style = SanchayTypography.Caption)
        }
        Spacer(modifier = Modifier.height(8.dp))
        LinearProgressIndicator(progress = progress.coerceIn(0f, 1f))
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "${(progress.coerceIn(0f, 1f) * 100).toInt()}%",
            style = SanchayTypography.Numerical,
        )
    }
}

@Composable
fun ChartSpendingProgress(
    spent: Float,
    budget: Float,
    label: String,
    modifier: Modifier = Modifier,
) {
    val progress = if (budget > 0f) (spent / budget).coerceIn(0f, 1f) else 0f
    Column(modifier = modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(text = label, style = SanchayTypography.Body)
            Text(text = budget.toString(), style = SanchayTypography.Caption)
        }
        Spacer(modifier = Modifier.height(8.dp))
        LinearProgressIndicator(progress = progress)
        Spacer(modifier = Modifier.height(4.dp))
        Text(text = spent.toString(), style = SanchayTypography.Numerical)
    }
}

@Composable
fun ChartGoalProgress(
    progress: Float,
    target: String,
    current: String,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Text(text = current, style = SanchayTypography.NumericalLarge)
        Text(text = target, style = SanchayTypography.Caption)
        Spacer(modifier = Modifier.height(8.dp))
        LinearProgressIndicator(progress = progress.coerceIn(0f, 1f))
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "${(progress.coerceIn(0f, 1f) * 100).toInt()}%",
            style = SanchayTypography.Numerical,
        )
    }
}

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
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(text = label, style = SanchayTypography.Body)
        Text(
            text = "${percentage}%",
            style = SanchayTypography.Caption,
            color = color,
        )
    }
}
