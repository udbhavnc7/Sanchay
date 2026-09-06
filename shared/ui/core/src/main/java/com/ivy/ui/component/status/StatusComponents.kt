package com.ivy.ui.component.status

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.icons.filled.Check
import androidx.compose.material3.icons.filled.Error
import androidx.compose.material3.icons.filled.Warning
import androidx.compose.material3.icons.filled.Info
import androidx.compose.material3.icons.filled.Close
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.GraphicsLayer
import androidx.compose.ui.Unit
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography

/**
 * Status components for Sanchay financial app.
 * 
 * Each component provides visual status indication without relying
 * exclusively on color. Uses appropriate text, icons, and semantics.
 * 
 * Principle: Never rely exclusively on color to communicate meaning.
 */
@Composable
fun StatusSuccess(
    message: String,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.ListItemSpacing),
        arrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Check,
            contentDescription = "Success",
            tint = SanchayColors.IncomePrimary,
            modifier = Modifier.size(SanchaySpacing.AvatarSizeSmall)
        )

        text(
            text = message,
            style = SanchayTypography.Body,
            color = SanchayColors.TextPrimaryLight
        )
    }
}

@Composable
fun StatusWarning(
    message: String,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.ListItemSpacing),
        arrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Warning,
            contentDescription = "Warning",
            tint = SanchayColors.Warning primary,
            modifier = Modifier.size(SanchaySpacing.AvatarSizeSmall)
        )

        text(
            text = message,
            style = SanchayTypography.Body,
            color = SanchayColors.TextPrimaryLight
        )
    }
}

@Composable
fun StatusError(
    message: String,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.ListItemSpacing),
        arrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Error,
            contentDescription = "Error",
            tint = SanchayColors.Error primary,
            modifier = Modifier.size(SanchaySpacing.AvatarSizeSmall)
        )

        text(
            text = message,
            style = SanchayTypography.Body,
            color = SanchayColors.TextPrimaryLight
        )
    }
}

@Composable
fun StatusPending(
    message: String,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.ListItemSpacing),
        arrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Info,
            contentDescription = "Pending",
            tint = SanchayColors.Warning primary,
            modifier = Modifier.size(SanchaySpacing.AvatarSizeSmall)
        )

        text(
            text = message,
            style = SanchayTypography.Body,
            color = SanchayColors.TextPrimaryLight
        )
    }
}

@Composable
fun StatusOverdue(
    message: String,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.ListItemSpacing),
        arrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Close,
            contentDescription = "Overdue",
            tint = SanchayColors.Error primary,
            modifier = Modifier.size(SanchaySpacing.AvatarSizeSmall)
        )

        text(
            text = message,
            style = SanchayTypography.Body,
            color = SanchayColors.TextPrimaryLight
        )
    }
}

@Composable
fun StatusNeutral(
    message: String,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.ListItemSpacing),
        arrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Check,
            contentDescription = "Neutral",
            tint = SanchayColors.Neutral primary,
            modifier = Modifier.size(SanchaySpacing.AvatarSizeSmall)
        )

        text(
            text = message,
            style = SanchayTypography.Body,
            color = SanchayColors.TextPrimaryLight
        )
    }
}

/** Transaction status chip */
@Composable
fun TransactionStatusChip(
    status: TransactionStatus,
    modifier: Modifier = Modifier,
) {
    var isSelected by remember { mutableStateOf(false) }

    val (text, color, icon) = when (status) {
        is TransactionStatus.Income -> ("Income", SanchayColors.IncomePrimary, Check)
        is TransactionStatus.Expense -> ("Expense", SanchayColors.ExpensePrimary, Close)
        is TransactionStatus.Pending -> ("Pending", SanchayColors.Warning primary, Info)
        is TransactionStatus.Overdue -> ("Overdue", SanchayColors.Error primary, Close)
        is TransactionStatus.Transfer -> ("Transfer", SanchayColors.Neutral primary, Check)
        is TransactionStatus.Completed -> ("Completed", SanchayColors.IncomePrimary, Check)
        is TransactionStatus.Cancelled -> ("Cancelled", SanchayColors.Muted primary, Close)
        else -> ("Unknown", SanchayColors.TextMutedLight, Info)
    }

    Chip(
        modifier = modifier
            .padding(horizontal = SanchaySpacing.ListItemSpacing, vertical = SanchaySpacing.ListItemSpacing),
        backgroundColor = color.copy(alpha = if (isSelected) 0.15f else 0.08f),
        label = text,
        onClick = { isSelected = !isSelected },
        avatar = if (!isSelected) {
            Icon(
                imageVector = icon,
                contentDescription = status.toString(),
                tint = color,
                modifier = Modifier.size(SanchaySpacing.AvatarSizeSmall)
            )
        } else {
            androidx.compose.ui.unit.Null
        }
    )
}

/** Enum for transaction status */
enum class TransactionStatus {
    Income,
    Expense,
    Pending,
    Overdue,
    Transfer,
    Completed,
    Cancelled
}

/** Account status indicator */
@Composable
fun AccountStatusIndicator(
    isActive: Boolean,
    modifier: Modifier = Modifier,
) {
    val (color, description) = when (isActive) {
        true -> (SanchayColors.IncomePrimary, "Active account")
        false -> (SanchayColors.Muted primary, "Inactive account")
    }

    Icon(
        imageVector = if (isActive) Check else Close,
        contentDescription = description,
        tint = color,
        modifier = Modifier.size(SanchaySpacing.AvatarSizeSmall)
    )

    text(
        text = description,
        style = SanchayTypography.Caption,
        color = color,
        modifier = Modifier.padding(start = SanchaySpacing.XS)
    )
}