package com.ivy.ui.component.status

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography

@Composable
fun StatusSuccess(
    message: String,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier.padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.ListItemSpacing),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Filled.Check,
            contentDescription = "Success",
            tint = SanchayColors.IncomePrimary,
            modifier = Modifier.size(SanchaySpacing.AvatarSizeSmall)
        )
        Text(
            text = message,
            style = SanchayTypography.Body,
            color = SanchayColors.TextPrimaryLight,
            modifier = Modifier.padding(start = 8.dp)
        )
    }
}

@Composable
fun StatusWarning(
    message: String,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier.padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.ListItemSpacing),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Filled.Warning,
            contentDescription = "Warning",
            tint = SanchayColors.Warning.primary,
            modifier = Modifier.size(SanchaySpacing.AvatarSizeSmall)
        )
        Text(
            text = message,
            style = SanchayTypography.Body,
            color = SanchayColors.TextPrimaryLight,
            modifier = Modifier.padding(start = 8.dp)
        )
    }
}

@Composable
fun StatusError(
    message: String,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier.padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.ListItemSpacing),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Filled.Close,
            contentDescription = "Error",
            tint = SanchayColors.Error.primary,
            modifier = Modifier.size(SanchaySpacing.AvatarSizeSmall)
        )
        Text(
            text = message,
            style = SanchayTypography.Body,
            color = SanchayColors.TextPrimaryLight,
            modifier = Modifier.padding(start = 8.dp)
        )
    }
}

@Composable
fun StatusPending(
    message: String,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier.padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.ListItemSpacing),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Filled.Info,
            contentDescription = "Pending",
            tint = SanchayColors.Warning.primary,
            modifier = Modifier.size(SanchaySpacing.AvatarSizeSmall)
        )
        Text(
            text = message,
            style = SanchayTypography.Body,
            color = SanchayColors.TextPrimaryLight,
            modifier = Modifier.padding(start = 8.dp)
        )
    }
}

@Composable
fun StatusOverdue(
    message: String,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier.padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.ListItemSpacing),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Filled.Close,
            contentDescription = "Overdue",
            tint = SanchayColors.Error.primary,
            modifier = Modifier.size(SanchaySpacing.AvatarSizeSmall)
        )
        Text(
            text = message,
            style = SanchayTypography.Body,
            color = SanchayColors.TextPrimaryLight,
            modifier = Modifier.padding(start = 8.dp)
        )
    }
}

@Composable
fun StatusNeutral(
    message: String,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier.padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.ListItemSpacing),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Filled.Check,
            contentDescription = "Neutral",
            tint = SanchayColors.Neutral.primary,
            modifier = Modifier.size(SanchaySpacing.AvatarSizeSmall)
        )
        Text(
            text = message,
            style = SanchayTypography.Body,
            color = SanchayColors.TextPrimaryLight,
            modifier = Modifier.padding(start = 8.dp)
        )
    }
}

enum class TransactionStatus {
    Income,
    Expense,
    Pending,
    Overdue,
    Transfer,
    Completed,
    Cancelled
}

@Composable
fun TransactionStatusChip(
    status: TransactionStatus,
    modifier: Modifier = Modifier,
) {
    val label = when (status) {
        TransactionStatus.Income -> "Income"
        TransactionStatus.Expense -> "Expense"
        TransactionStatus.Pending -> "Pending"
        TransactionStatus.Overdue -> "Overdue"
        TransactionStatus.Transfer -> "Transfer"
        TransactionStatus.Completed -> "Completed"
        TransactionStatus.Cancelled -> "Cancelled"
    }
    val icon = when (status) {
        TransactionStatus.Income -> Icons.Filled.Check
        TransactionStatus.Expense -> Icons.Filled.Close
        TransactionStatus.Pending -> Icons.Filled.Info
        TransactionStatus.Overdue -> Icons.Filled.Close
        TransactionStatus.Transfer -> Icons.Filled.Check
        TransactionStatus.Completed -> Icons.Filled.Check
        TransactionStatus.Cancelled -> Icons.Filled.Close
    }
    AssistChip(
        onClick = {},
        modifier = modifier,
        label = { Text(text = label, style = SanchayTypography.Caption) },
        leadingIcon = {
            Icon(imageVector = icon, contentDescription = label)
        }
    )
}

@Composable
fun AccountStatusIndicator(
    isActive: Boolean,
    modifier: Modifier = Modifier,
) {
    val description = if (isActive) "Active account" else "Inactive account"
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = if (isActive) Icons.Filled.Check else Icons.Filled.Close,
            contentDescription = description,
            tint = if (isActive) SanchayColors.IncomePrimary else SanchayColors.Muted.primary,
            modifier = Modifier.size(SanchaySpacing.AvatarSizeSmall)
        )
        Text(
            text = description,
            style = SanchayTypography.Caption,
            color = SanchayColors.TextPrimaryLight,
            modifier = Modifier.padding(start = 8.dp)
        )
    }
}
