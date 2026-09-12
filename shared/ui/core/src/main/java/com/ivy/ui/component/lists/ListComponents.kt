package com.ivy.ui.component.lists

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Home
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography

@Composable
fun TransactionRow(
    title: String,
    subtitle: String,
    amount: String,
    onEdit: () -> Unit = {},
    onDelete: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = SanchaySpacing.ListItemSpacing)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Filled.Home,
                contentDescription = "Transaction",
                tint = SanchayColors.TextSecondaryLight,
                modifier = Modifier.size(SanchaySpacing.AvatarSizeSmall)
            )
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = SanchaySpacing.ListItemSpacing)
            ) {
                Text(
                    text = title,
                    style = SanchayTypography.Body,
                    color = SanchayColors.TextPrimaryLight,
                    maxLines = 1
                )
                Text(
                    text = subtitle,
                    style = SanchayTypography.Caption,
                    color = SanchayColors.TextSecondaryLight,
                    maxLines = 1
                )
            }
            Text(
                text = amount,
                style = SanchayTypography.Numerical,
                color = SanchayColors.TextPrimaryLight
            )
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            TextButton(onClick = onEdit) {
                Text(text = "Edit")
            }
            TextButton(onClick = onDelete) {
                Text(text = "Delete")
            }
        }
    }
}

@Composable
fun AccountRow(
    accountName: String,
    accountType: String,
    balance: String,
    currency: String = "USD",
    modifier: Modifier = Modifier,
    onToggle: () -> Unit = {},
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = SanchaySpacing.ListItemSpacing),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = accountName,
                style = SanchayTypography.Body,
                color = SanchayColors.TextPrimaryLight,
                maxLines = 1
            )
            Text(
                text = accountType,
                style = SanchayTypography.Caption,
                color = SanchayColors.TextSecondaryLight,
                maxLines = 1
            )
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(
                text = "$balance $currency",
                style = SanchayTypography.NumericalLarge,
                color = SanchayColors.TextPrimaryLight
            )
            TextButton(onClick = onToggle) {
                Text(text = "Toggle")
            }
        }
    }
}

@Composable
fun CategoryRow(
    categoryName: String,
    transactionCount: Int,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = SanchaySpacing.ListItemSpacing),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Filled.Home,
            contentDescription = categoryName,
            tint = SanchayColors.TextSecondaryLight,
            modifier = Modifier.size(SanchaySpacing.AvatarSizeSmall)
        )
        Text(
            text = categoryName,
            style = SanchayTypography.Body,
            color = SanchayColors.TextPrimaryLight,
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = SanchaySpacing.ListItemSpacing),
            maxLines = 1
        )
        Text(
            text = "$transactionCount transactions",
            style = SanchayTypography.Caption,
            color = SanchayColors.TextSecondaryLight
        )
    }
}

@Composable
fun UpcomingPaymentRow(
    payee: String,
    amount: String,
    dueDate: String,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = SanchaySpacing.ListItemSpacing),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = payee,
                style = SanchayTypography.Body,
                color = SanchayColors.TextPrimaryLight,
                maxLines = 1
            )
            Text(
                text = dueDate,
                style = SanchayTypography.Caption,
                color = SanchayColors.TextSecondaryLight,
                maxLines = 1
            )
        }
        Text(
            text = amount,
            style = SanchayTypography.Numerical,
            color = SanchayColors.TextPrimaryLight
        )
    }
}

@Composable
fun GoalRow(
    goalName: String,
    progress: Float,
    targetAmount: String,
    currentAmount: String,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = SanchaySpacing.ListItemSpacing),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = goalName,
                style = SanchayTypography.Body,
                color = SanchayColors.TextPrimaryLight,
                maxLines = 1
            )
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = SanchaySpacing.ListItemSpacing),
            )
            Text(
                text = targetAmount,
                style = SanchayTypography.Caption,
                color = SanchayColors.TextSecondaryLight,
                modifier = Modifier.padding(top = SanchaySpacing.ListItemSpacing)
            )
        }
        Text(
            text = currentAmount,
            style = SanchayTypography.NumericalLarge,
            color = SanchayColors.TextPrimaryLight,
            modifier = Modifier.padding(start = SanchaySpacing.ListItemSpacing)
        )
    }
}
