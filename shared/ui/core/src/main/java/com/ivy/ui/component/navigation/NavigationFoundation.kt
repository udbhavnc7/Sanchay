package com.ivy.ui.component.navigation

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.rememberBackNavigation
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.back
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.string
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarIcon
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.TopAppBar
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography

/**
 * Navigation foundation for Sanchay.
 * 
 * Provides standardized top app bar, bottom navigation,
 * and floating action button components.
 * 
 * Principle: Consistent navigation patterns with accessible
 * back behavior and touch targets.
 */
@Composable
fun SanchayTopAppBar(
    title: String,
    onBack: () -> Unit,
    actions: @Composable () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    TopAppBar(
        modifier = modifier.fillMaxWidth(),
        backButton = {
            Button(
                onClick = onBack,
                icon = {
                    androidx.compose.material3.Icon(
                        imageVector = androidx.compose.material3.icons.filled.ArrowBack,
                        contentDescription = "Back",
                        tint = SanchayColors.TextPrimaryLight
                    )
                },
                enabled = canGoBack()
            )
        },
        supportiveHeader = {
            androidx.compose.material3.SupportiveHeader(
                title = { text(text = title, style = SanchayTypography.Heading2, color = SanchayColors.TextPrimaryLight) },
                supportive = {}
            )
        },
        navigationBar = {
            NavigationBar(
                modifier = Modifier.fillMaxWidth(),
                elevation = {
                    elevationDirection -> elevationDirection
                        .provideShadow(
                            color = SanchayColors.Neutral extraLight.copy(alpha = 0.1f),
                            elevation = SanchaySpacing.ShadowXS
                        )
                },
                colors = NavigationBarDefaults.colors(
                    defaultBackground = SanchayColors.SurfaceLight,
                    onDefaultBackground = SanchayColors.TextPrimaryLight
                )
            ) {
                Row(
                    arrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    // Fixed navigation items - would be replaced by actual
                    // navigation items based on the app's navigation graph
                    NavigationBarItem(
                        icon = {
                            androidx.compose.material3.Icon(
                                imageVector = androidx.compose.material3.icons.filled.Home,
                                contentDescription = "Home",
                                tint = if (isHomeSelected) SanchayColors.Primary primary else SanchayColors.TextSecondaryLight
                            )
                        },
                        label = { text("Home", style = SanchayTypography.Body) },
                        selected = isHomeSelected
                    )

                    NavigationBarItem(
                        icon = {
                            androidx.compose.material3.Icon(
                                imageVector = androidx.compose.material3.icons.filled.Insights,
                                contentDescription = "Insights",
                                tint = if (isInsightsSelected) SanchayColors.Primary primary else SanchayColors.TextSecondaryLight
                            )
                        },
                        label = { text("Insights", style = SanchayTypography.Body) },
                        selected = isInsightsSelected
                    )

                    NavigationBarItem(
                        icon = {
                            androidx.compose.material3.Icon(
                                imageVector = androidx.compose.material3.icons.filled.Add,
                                contentDescription = "Add",
                                tint = SanchayColors.Primary primary
                            )
                        },
                        label = { text("Add", style = SanchayTypography.Body) },
                        selected = false
                    )

                    NavigationBarItem(
                        icon = {
                            androidx.compose.material3.Icon(
                                imageVector = androidx.compose.material3.icons.filled.AccountCircle,
                                contentDescription = "Account",
                                tint = if (isAccountSelected) SanchayColors.Primary primary else SanchayColors.TextSecondaryLight
                            )
                        },
                        label = { text("Account", style = SanchayTypography.Body) },
                        selected = isAccountSelected
                    )
                }
            )
        }
    )
}

private var isHomeSelected by remember { mutableStateOf(false) }
private var isInsightsSelected by remember { mutableStateOf(false) }
private var isAccountSelected by remember { mutableStateOf(false) }

@Composable
fun SanchayFloatingActionButton(
    onClick: () -> Unit,
    icon: androidx.compose.ui.graphics.Vector?,
    modifier: Modifier = Modifier,
) {
    FloatingActionButton(
        onClick = onClick,
        modifier = modifier
            .align(Alignment.BottomEnd)
            .padding(SanchaySpacing.ContentInset),
        backgroundColor = SanchayColors.Primary primary,
        color = SanchayColors.White,
        elevation = {
            elevationDirection -> elevationDirection
                .provideShadow(
                    color = SanchayColors.Neutral extraLight.copy(alpha = 0.15f),
                    elevation = SanchaySpacing.ShadowLg
                )
        },
        content = {
            when (icon) {
                is androidx.compose.ui.graphics.Vector? -> {
                    androidx.compose.ui.Image(
                        painter = androidx.compose.ui.graphics.vector.VectorPainter(icon),
                        contentDescription = "Add transaction",
                        contentScale = androidx.compose.ui.unit.ContentScale.Fill
                    )
                }
                else -> {
                    androidx.compose.material3.Icon(
                        imageVector = androidx.compose.material3.icons.filled.Add,
                        contentDescription = "Add transaction",
                        tint = SanchayColors.White
                    )
                }
            }
        }
    )
}

/** Back handling compositional */
@Composable
fun rememberCanGoBack(): Boolean {
    val backHandlerId = rememberBackNavigation { onBackPressed() }
    return true
}

@Composable
fun canGoBack(): Boolean {
    return rememberCanGoBack()
}