package com.ivy.ui.component.navigation

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SanchayTopAppBarFoundation(
    title: String,
    onBack: () -> Unit,
    actions: @Composable () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    TopAppBar(
        modifier = modifier,
        title = {
            Text(
                text = title,
                style = SanchayTypography.Heading2,
                color = SanchayColors.TextPrimaryLight
            )
        },
        navigationIcon = {
            IconButton(onClick = onBack) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = SanchayColors.TextPrimaryLight
                )
            }
        },
        actions = { actions() }
    )
}

@Composable
fun SanchayFloatingActionButtonSimple(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    androidx.compose.material3.Button(
        onClick = onClick,
        modifier = modifier
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = Icons.Filled.Add,
                contentDescription = "Add transaction",
                tint = SanchayColors.White,
                modifier = Modifier.size(SanchaySpacing.AvatarSizeSmall)
            )
            Text(
                text = "Add",
                modifier = Modifier.padding(start = 8.dp)
            )
        }
    }
}

@Composable
fun rememberCanGoBack(): Boolean {
    return true
}

@Composable
fun canGoBack(): Boolean {
    return true
}
