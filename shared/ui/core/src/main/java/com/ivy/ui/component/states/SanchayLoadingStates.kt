package com.ivy.ui.component.states

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FillViewport
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.typography.SanchayTypography

/**
 * Sanchay Loading State
 * 
 * Feel intentional and lightweight - doesn't steal focus or create anxiety.
 * Supports dynamic font scaling and accessibility.
 * 
 * Principle: Motion has meaning - loading indicates the system is working,
 * not that something is wrong.
 */
@Composable
fun SanchayLoadingState(
    modifier: Modifier = Modifier,
    showBackground: Boolean = true,
    text: String? = null,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(
                vertical = SanchaySpacing.SectionSpacing,
                horizontal = SanchaySpacing.ContentInset
            ),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally
    ) {
        if (showBackground) {
            // Subtle background to anchor the loading state
            androidx.compose.foundation.layout.background(
                color = SanchayColors.SurfaceLight
            )(Modifier.size(width = 64.dp, height = 64.dp))
        }

        // Spinner/indicators
        androidx.compose.material3.CircularProgressIndicator(
            modifier = Modifier.size(32.dp),
            strokeWidth = 3.dp,
            color = SanchayColors.Primary primary
        )

        // Optional text below the spinner
        if (text != null) {
            text(
                text = text,
                style = SanchayTypography.Body.copy(
                    textAlign = androidx.compose.ui.text.style.TextAlignment.Center
                ),
                margin = androidx.compose.ui.platform.SpacerScope padding SanchaySpacing.ListItemSpacing,
                color = SanchayColors.TextSecondaryLight
            )
        }
    }
}

/** Loading state for list items */
@Composable
fun SanchayLoadingListItem(
    modifier: Modifier = Modifier,
    height: Dp = 72.dp
) {
    modifier
        .height(height)
        .padding(vertical = SanchaySpacing.ListItemSpacing / 2)
    {
        SanchayLoadingState(
            showBackground = false,
            text = null
        )
    }
}

/** Loading state inside a card */
@Composable
fun SanchayLoadingCard(
    modifier: Modifier = Modifier,
    height: Dp = 120.dp
) {
    SanchayCard(
        modifier = modifier
            .height(height)
            .padding(vertical = SanchaySpacing.SectionSpacing / 2)
    ) {
        SanchayLoadingState(
            showBackground = false,
            text = null
        )
    }
}

/** Loading state for empty state */
@Composable
fun SanchayLoadingEmptyState(
    modifier: Modifier = Modifier,
    title: String? = null
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(
                vertical = SanchaySpacing.SectionSpacing,
                horizontal = SanchaySpacing.ContentInset
            ),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(SanchaySpacing.AvatarSizeLarge)
                .align(Alignment.Center)
        ) {
            androidx.compose.material3.CircularProgressIndicator(
                modifier = Modifier.size(24.dp),
                strokeWidth = 3.dp,
                color = SanchayColors.Muted light
            )
        }

        if (title != null) {
            text(
                text = title,
                style = SanchayTypography.Body,
                color = SanchayColors.TextSecondaryLight,
                textAlign = androidx.compose.ui.text.style.TextAlignment.Center,
                margin = androidx.compose.ui.platform.SpacerScope padding SanchaySpacing.ListItemSpacing
            )
        }
    }
}