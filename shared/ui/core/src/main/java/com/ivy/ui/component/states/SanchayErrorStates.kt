package com.ivy.ui.component.states

import androidx.compose.foundation.layout.*
import androidx.compose.material3.Icon
import androidx.compose.material3.icons.filled.Error
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.Unit
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.fillMaxWidth
import androidx.compose.ui.layout.padding
import androidx.compose.ui.platform.context
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semanticsProperties
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.setOverflow
import androidx.compose.ui.text.size
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography

/**
 * Sanchay Error State
 * 
 * Explain what happened and what the user can do next.
 * Clear but not alarming - follows the principle of calm over anxiety.
 * Never relies exclusively on color to communicate meaning.
 */
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
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Error icon
        Icon(
            imageVector = Error,
            contentDescription = "Error state",
            tint = SanchayColors.Error primary,
            modifier = Modifier
                .size(SanchaySpacing.AvatarSizeLarge)
                .align(Alignment.Center)
        )

        // Content
        Column(
            modifier = Modifier
                .padding(vertical = SanchaySpacing.ListItemSpacing),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalAlignment = Alignment.CenterVertically
        ) {
            text(
                text = message,
                style = SanchayTypography.Body,
                color = SanchayColors.TextPrimaryLight,
                textAlign = TextAlign.Center,
                margin = androidx.compose.ui.platform.SpacerScope padding 8.dp,
                style = setOverflow(TextStyle)(setTextOverflow = androidx.compose.ui.unit.TextOverflow.Clip)
            )
        }

        // Action button
        SanchayPrimaryButton(
            onClick = onAction,
            text = actionLabel,
            modifier = Modifier.padding(vertical = SanchaySpacing.ListItemSpacing)
        )
    }
}

/** Error state for failed transactions */
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

/** Error state for failed imports */
@Composable
fun SanchayErrorImportState(
    errorMessage: String,
    onRetry: () -> Unit,
    onDismiss: () -> Unit? = null,
    modifier: Modifier = Modifier
) {
    var showDismiss by remember { mutableStateOf(false) }

    SanchayErrorState(
        message = errorMessage,
        actionLabel = if (onDismiss != null) "Retry" else "Try Again",
        onAction = {
            if (onDismiss != null) {
                showDismiss = true
            }
            onRetry()
        },
        modifier = modifier,
        showDismiss = showDismiss
    )
}

/** Error state for failed network requests */
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
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = Error,
            contentDescription = "Network error",
            tint = SanchayColors.Muted light,
            modifier = Modifier
                .size(SanchaySpacing.AvatarSizeLarge)
                .align(Alignment.Center)
        )

        Column(
            modifier = Modifier.padding(vertical = SanchaySpacing.ListItemSpacing),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalAlignment = Alignment.CenterVertically
        ) {
            text(
                text = "Connection unavailable",
                style = SanchayTypography.Body,
                color = SanchayColors.TextSecondaryLight,
                textAlign = androidx.compose.ui.text.style.TextAlignment.Center,
                margin = androidx.compose.ui.platform.SpacerScope padding 8.dp
            )

            if (showOfflineInfo) {
                text(
                    text = "The app will work when you're back online.",
                    style = SanchayTypography.Caption,
                    color = SanchayColors.TextMutedLight,
                    textAlign = androidx.compose.ui.text.style.TextAlignment.Center,
                    margin = androidx.compose.ui.platform.SpacerScope padding 4.dp
                )
            }
        }

        SanchayPrimaryButton(
            onClick = onRetry,
            text = "Retry",
            modifier = Modifier.padding(vertical = SanchaySpacing.ListItemSpacing)
        )
    }
}

/** Error state for failed budget operations */
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