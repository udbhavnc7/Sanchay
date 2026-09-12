package com.ivy.ui.component.states

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography

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
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        CircularProgressIndicator(
            modifier = Modifier.size(32.dp),
            color = SanchayColors.Primary.primary
        )
        if (text != null) {
            Text(
                text = text,
                style = SanchayTypography.Body,
                color = SanchayColors.TextSecondaryLight,
                modifier = Modifier.padding(top = SanchaySpacing.ListItemSpacing)
            )
        }
    }
}

@Composable
fun SanchayLoadingListItem(
    modifier: Modifier = Modifier,
    height: Dp = 72.dp
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(height),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator(
            modifier = Modifier.size(32.dp),
            color = SanchayColors.Primary.primary
        )
    }
}

@Composable
fun SanchayLoadingCard(
    modifier: Modifier = Modifier,
    height: Dp = 120.dp
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .height(height)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(height),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator(
                modifier = Modifier.size(32.dp),
                color = SanchayColors.Primary.primary
            )
        }
    }
}

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
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        CircularProgressIndicator(
            modifier = Modifier.size(24.dp),
            color = SanchayColors.Muted.primary
        )
        if (title != null) {
            Text(
                text = title,
                style = SanchayTypography.Body,
                color = SanchayColors.TextSecondaryLight,
                modifier = Modifier.padding(top = SanchaySpacing.ListItemSpacing)
            )
        }
    }
}
