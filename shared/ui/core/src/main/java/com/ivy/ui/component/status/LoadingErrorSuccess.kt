package com.ivy.ui.component.status

import androidx.compose.animation.AlphaAnimationSpec
import androidx.compose.animation.AnimationSpec
import androidx.compose.animation.tween
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.icons.filled.HourglassEmpty
import androidx.compose.material3.icons.filled.Close
import androidx.compose.material3.icons.filled.Check
import androidx.compose.material3.icons.filled.Warning
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
 * Loading, Error, and Success components for Sanchay.
 * 
 * Simple presentation-focused components with consistent
 * styling and accessible semantics.
 * 
 * Principle: Keep APIs simple and consistent.
 */
@Composable
fun LoadingState(
    message: String = "Loading",
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = SanchaySpacing.SectionSpacing,
                horizontal = SanchaySpacing.ContentInset),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Spinning progress indicator
        androidx.compose.material3.CircularProgressIndicator(
            modifier = Modifier.size(SanchaySpacing.AvatarSizeLarge),
            tint = SanchayColors.Primary primary
        )

        text(
            text = message,
            style = SanchayTypography.Body,
            color = SanchayColors.TextSecondaryLight,
            textAlign = TextAlign.Center,
            margin = androidx.compose.ui.platform.SpacerScope padding SanchaySpacing.ListItemSpacing
        )
    }
}

/** Error state component */
@Composable
fun ErrorState(
    message: String = "Something went wrong",
    onRetry: () -> Unit? = null,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = SanchaySpacing.SectionSpacing,
                horizontal = SanchaySpacing.ContentInset),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Error icon
        Icon(
            imageVector = Close,
            contentDescription = "Error",
            tint = SanchayColors.Error primary,
            modifier = Modifier.size(SanchaySpacing.AvatarSizeLarge)
        )

        text(
            text = message,
            style = SanchayTypography.Body,
            color = SanchayColors.TextPrimaryLight,
            textAlign = TextAlign.Center,
            margin = androidx.compose.ui.platform.SpacerScope padding SanchaySpacing.ListItemSpacing
        )

        // Retry button if provided
        if (onRetry != null) {
            SanchayPrimaryButton(
                onClick = onRetry,
                text = "Try Again",
                modifier = Modifier.padding(vertical = SanchaySpacing.ListItemSpacing)
            )
        }
    }
}

/** Success state component */
@Composable
fun SuccessState(
    message: String = "Operation successful",
    onDismiss: () -> Unit? = null,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = SanchaySpacing.SectionSpacing,
                horizontal = SanchaySpacing.ContentInset),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Success icon
        Icon(
            imageVector = Check,
            contentDescription = "Success",
            tint = SanchayColors.IncomePrimary,
            modifier = Modifier.size(SanchaySpacing.AvatarSizeLarge)
        )

        text(
            text = message,
            style = SanchayTypography.Body,
            color = SanchayColors.TextPrimaryLight,
            textAlign = TextAlign.Center,
            margin = androidx.compose.ui.platform.SpacerScope padding SanchaySpacing.ListItemSpacing
        )

        // Dismiss button if provided
        if (onDismiss != null) {
            SanchayPrimaryButton(
                onClick = onDismiss,
                text = "OK",
                modifier = Modifier.padding(vertical = SanchaySpacing.ListItemSpacing)
            )
        }
    }
}

/** Empty state (already compiled minimal version) */
@Composable
fun EmptyStateMinimal(
    title: String,
    description: String,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier.fillMaxWidth().padding(
            vertical = SanchaySpacing.SectionSpacing,
            horizontal = SanchaySpacing.ContentInset
        ),
        horizontalArrangement = androidx.compose.foundation.Arrangement.Center,
        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
    ) {
        text(
            text = title,
            style = SanchayTypography.Heading2,
            color = SanchayColors.TextPrimaryLight,
            textAlign = TextAlign.Center
        )

        text(
            text = description,
            style = SanchayTypography.Body,
            color = SanchayColors.TextSecondaryLight,
            textAlign = TextAlign.Center,
            margin = androidx.compose.ui.platform.SpacerScope padding SanchaySpacing.ListItemSpacing
        )
    }
}