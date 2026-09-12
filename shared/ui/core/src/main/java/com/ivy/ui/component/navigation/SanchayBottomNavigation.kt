package com.ivy.ui.component.navigation

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography

@Composable
fun SanchayBottomNavigation(
    selectedIndex: Int,
    onItemSelected: (Int) -> Unit,
    modifier: Modifier = Modifier,
    isModal: Boolean = false,
) {
    NavigationBar(modifier = modifier.fillMaxWidth()) {
        NavigationBarItem(
            selected = selectedIndex == 0,
            onClick = { onItemSelected(0) },
            icon = {
                Icon(
                    imageVector = Icons.Filled.Home,
                    contentDescription = "Home"
                )
            },
            label = { Text(text = "Home", style = SanchayTypography.Caption) }
        )
        NavigationBarItem(
            selected = selectedIndex == 1,
            onClick = { onItemSelected(1) },
            icon = {
                Icon(
                    imageVector = Icons.Filled.Search,
                    contentDescription = "Transactions"
                )
            },
            label = { Text(text = "Transactions", style = SanchayTypography.Caption) }
        )
        NavigationBarItem(
            selected = selectedIndex == 2,
            onClick = { onItemSelected(2) },
            icon = {
                Icon(
                    imageVector = Icons.Filled.Add,
                    contentDescription = "Plans"
                )
            },
            label = { Text(text = "Plans", style = SanchayTypography.Caption) }
        )
        NavigationBarItem(
            selected = selectedIndex == 3,
            onClick = { onItemSelected(3) },
            icon = {
                Icon(
                    imageVector = Icons.Filled.Info,
                    contentDescription = "Insights"
                )
            },
            label = { Text(text = "Insights", style = SanchayTypography.Caption) }
        )
    }
}

@Composable
fun SanchayBottomNavigationWithSelection(
    selectedIndex: Int,
    onItemSelected: (Int) -> Unit,
    badgeCount: Int? = null,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        SanchayBottomNavigation(
            selectedIndex = selectedIndex,
            onItemSelected = onItemSelected
        )
        if (badgeCount != null && badgeCount > 0) {
            Text(
                text = "+$badgeCount",
                style = SanchayTypography.Caption,
                color = SanchayColors.White,
                modifier = Modifier.padding(top = SanchaySpacing.ListItemSpacing)
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SanchayTopAppBar(
    title: String,
    onBack: () -> Unit,
    trailingAction: @Composable (() -> Unit)? = null,
    modifier: Modifier = Modifier,
    showBack: Boolean = true,
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
            if (showBack) {
                IconButton(onClick = onBack) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = SanchayColors.TextPrimaryLight
                    )
                }
            }
        },
        actions = {
            if (trailingAction != null) {
                trailingAction()
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SanchayTopAppBarWithSubtitle(
    title: String,
    subtitle: String?,
    onBack: () -> Unit,
    trailingAction: @Composable (() -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    TopAppBar(
        modifier = modifier,
        title = {
            Column {
                Text(
                    text = title,
                    style = SanchayTypography.Heading2,
                    color = SanchayColors.TextPrimaryLight
                )
                if (subtitle != null) {
                    Text(
                        text = subtitle,
                        style = SanchayTypography.Body,
                        color = SanchayColors.TextSecondaryLight
                    )
                }
            }
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
        actions = {
            if (trailingAction != null) {
                trailingAction()
            }
        }
    )
}
