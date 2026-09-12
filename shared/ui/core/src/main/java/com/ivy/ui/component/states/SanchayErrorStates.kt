package com.ivy.ui.component.states

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography

@Composable
fun SanchayErrorState(
    message: String,
    actionLabel: String,
    onAction: () -> Unit,
    modifier: Modifier = Modifier,
    showDismiss: Boolean = false,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(
                vertical = SanchaySpacing.SectionSpacing,
                horizontal = SanchaySpacing.ContentInset
            ),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = Icons.Filled.Warning,
            contentDescription = "Error state",
            tint = SanchayColors.Error.primary,
            modifier = Modifier.size(SanchaySpacing.AvatarSizeLarge)
        )
        Text(
            text = message,
            style = SanchayTypography.Body,
            color = SanchayColors.TextPrimaryLight,
            modifier = Modifier.padding(top = SanchaySpacing.ListItemSpacing)
        )
        Button(
            onClick = onAction,
            modifier = Modifier.padding(top = SanchaySpacing.ListItemSpacing)
        ) {
            Text(text = actionLabel)
        }
    }
}

@Composable
fun SanchayErrorTransactionState(
    errorMessage: String,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    SanchayErrorState(
        message = errorMessage,
        actionLabel = "Retry",
        onAction = onRetry,
        modifier = modifier
    )
}

@Composable
fun SanchayErrorImportState(
    errorMessage: String,
    onRetry: () -> Unit,
    onDismiss: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    SanchayErrorState(
        message = errorMessage,
        actionLabel = if (onDismiss != null) "Retry" else "Try Again",
        onAction = onRetry,
        modifier = modifier
    )
}

@Composable
fun SanchayErrorNetworkState(
    onRetry: () -> Unit,
    modifier: Modifier = Modifier,
    showOfflineInfo: Boolean = false
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(
                vertical = SanchaySpacing.SectionSpacing,
                horizontal = SanchaySpacing.ContentInset
            ),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = Icons.Filled.Warning,
            contentDescription = "Network error",
            tint = SanchayColors.Muted.primary,
            modifier = Modifier.size(SanchaySpacing.AvatarSizeLarge)
        )
        Text(
            text = "Connection unavailable",
            style = SanchayTypography.Body,
            color = SanchayColors.TextSecondaryLight,
            modifier = Modifier.padding(top = SanchaySpacing.ListItemSpacing)
        )
        if (showOfflineInfo) {
            Text(
                text = "The app will work when you're back online.",
                style = SanchayTypography.Caption,
                color = SanchayColors.TextSecondaryLight,
                modifier = Modifier.padding(top = SanchaySpacing.ListItemSpacing)
            )
        }
        Button(
            onClick = onRetry,
            modifier = Modifier.padding(top = SanchaySpacing.ListItemSpacing)
        ) {
            Text(text = "Retry")
        }
    }
}

@Composable
fun SanchayErrorBudgetState(
    errorMessage: String,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    SanchayErrorState(
        message = errorMessage,
        actionLabel = "Retry",
        onAction = onRetry,
        modifier = modifier
    )
}
