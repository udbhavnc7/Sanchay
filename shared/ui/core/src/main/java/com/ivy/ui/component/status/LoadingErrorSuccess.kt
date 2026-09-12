package com.ivy.ui.component.status

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography

@Composable
fun LoadingState(
    message: String = "Loading",
    modifier: Modifier = Modifier,
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
        CircularProgressIndicator(
            modifier = Modifier.size(SanchaySpacing.AvatarSizeLarge),
            color = SanchayColors.Primary.primary
        )
        Text(
            text = message,
            style = SanchayTypography.Body,
            color = SanchayColors.TextSecondaryLight,
            modifier = Modifier.padding(top = SanchaySpacing.ListItemSpacing)
        )
    }
}

@Composable
fun ErrorState(
    message: String = "Something went wrong",
    onRetry: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
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
            imageVector = Icons.Filled.Close,
            contentDescription = "Error",
            tint = SanchayColors.Error.primary,
            modifier = Modifier.size(SanchaySpacing.AvatarSizeLarge)
        )
        Text(
            text = message,
            style = SanchayTypography.Body,
            color = SanchayColors.TextPrimaryLight,
            modifier = Modifier.padding(top = SanchaySpacing.ListItemSpacing)
        )
        if (onRetry != null) {
            Button(
                onClick = onRetry,
                modifier = Modifier.padding(top = SanchaySpacing.ListItemSpacing)
            ) {
                Text(text = "Try Again")
            }
        }
    }
}

@Composable
fun SuccessState(
    message: String = "Operation successful",
    onDismiss: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
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
            imageVector = Icons.Filled.Check,
            contentDescription = "Success",
            tint = SanchayColors.IncomePrimary,
            modifier = Modifier.size(SanchaySpacing.AvatarSizeLarge)
        )
        Text(
            text = message,
            style = SanchayTypography.Body,
            color = SanchayColors.TextPrimaryLight,
            modifier = Modifier.padding(top = SanchaySpacing.ListItemSpacing)
        )
        if (onDismiss != null) {
            Button(
                onClick = onDismiss,
                modifier = Modifier.padding(top = SanchaySpacing.ListItemSpacing)
            ) {
                Text(text = "OK")
            }
        }
    }
}

@Composable
fun EmptyStateMinimal(
    title: String,
    description: String,
    modifier: Modifier = Modifier,
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
        Text(
            text = title,
            style = SanchayTypography.Heading2,
            color = SanchayColors.TextPrimaryLight
        )
        Text(
            text = description,
            style = SanchayTypography.Body,
            color = SanchayColors.TextSecondaryLight,
            modifier = Modifier.padding(top = SanchaySpacing.ListItemSpacing)
        )
    }
}
