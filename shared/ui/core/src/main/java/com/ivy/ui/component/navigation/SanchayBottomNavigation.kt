package com.ivy.ui.component.navigation

import androidx.activity.OnBackPressedCallback
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.Arrangement.End
import androidx.compose.foundation.layout.Arrangement.Start
import androidx.compose.foundation.rememberBackNavigation
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarIcon
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.outlinedtextfield.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.outlinedtextfield.OutlinedTextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.Unit
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.setResistance
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.semanticsProperty
import androidx.compose.ui.text.input.KeyboardShortcuts
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography

/**
 * Sanchay Bottom Navigation
 * 
 * Premium bottom navigation bar for the Sanchay Personal Financial Operating System.
 * 
 * Principles:
 * - Minimal: Light touch, no heavy panels
 * - Clear: Selected/unselected distinction without relying on color alone
 * - Accessible: 48dp touch targets, content descriptions, semantics
 * - Theme-aware: Light, dark, AMOLED compatible
 * - Fast: Quick transitions, no lag
 * - Familiar: Consistent placement and behavior
 */
@Composable
fun SanchayBottomNavigation(
    selectedIndex: Int,
    onItemSelected: (Int) -> Unit,
    modifier: Modifier = Modifier,
    isModal: Boolean = false,
) {
    var animateSelection by remember { mutableStateOf(0f) }

    // Animate selection change
    DisposableEffect(Unit) {
        animateSelection = selectedIndex.toFloat()
    }

    // Calculate pressed index for ripple/feedback
    val pressedIndex = remember { mutableStateOf(selectedIndex) }

    BottomNavigation(
        modifier = modifier
            .fillMaxWidth()
            .height(SanchaySpacing.BottomNavHeight),
        elevation = {
            elevationDirection -> elevationDirection
                .provideShadow(
                    color = SanchayColors.Neutral.copy(alpha = 0.1f),
                    elevation = SanchaySpacing.ShadowXS
                )
        },
        colors = NavigationBarDefaults.colors(
            defaultBackground = if (isModal) SanchayColors.SurfaceLight else SanchayColors.White,
            onDefaultBackground = if (isModal) SanchayColors.TextPrimaryLight else SanchayColors.TextPrimaryLight,
        ),
        selectedIndex = selectedIndex,
        onSelect = { index ->
            onItemSelected(index)
            pressedIndex.value = index
        } {
            // Home destination
            NavigationBarItem(
                icon = {
                    Icon(
                        imageVector = getIconVector(0),
                        contentDescription = "Home",
                        tint = if (0 == selectedIndex) SanchayColors.Primary primary else SanchayColors.TextSecondaryLight,
                        modifier = Modifier
                            .size(SanchaySpacing.BottomNavItemSize)
                            .scale(if (0 == selectedIndex) 1.2f else 1f)
                            .animateScaleAsState(
                                initialScale = animateSelection,
                                targetScale = 1f,
                                animationSpec = tween(200, easing = androidx.compose.animation.easing.LinearOutSlowIn)
                            )
                ),
                label = { Text("Home", style = SanchayTypography.Body) },
                selected = 0 == selectedIndex
            )

            // Money/Transactions destination
            NavigationBarItem(
                icon = {
                    Icon(
                        imageVector = getIconVector(1),
                        contentDescription = "Transactions",
                        tint = if (1 == selectedIndex) SanchayColors.Primary primary else SanchayColors.TextSecondaryLight,
                        modifier = Modifier
                            .size(SanchaySpacing.BottomNavItemSize)
                            .scale(if (1 == selectedIndex) 1.2f else 1f)
                            .animateScaleAsState(
                                initialScale = animateSelection,
                                targetScale = 1f,
                                animationSpec = tween(200, easing = androidx.compose.animation.easing.LinearOutSlowIn)
                            )
                ),
                label = { Text("Transactions", style = SanchayTypography.Body) },
                selected = 1 == selectedIndex
            )

            // Plan destination (Budgets/Goals)
            NavigationBarItem(
                icon = {
                    Icon(
                        imageVector = getIconVector(2),
                        contentDescription = "Plans",
                        tint = if (2 == selectedIndex) SanchayColors.Primary primary else SanchayColors.TextSecondaryLight,
                        modifier = Modifier
                            .size(SanchaySpacing.BottomNavItemSize)
                            .scale(if (2 == selectedIndex) 1.2f else 1f)
                            .animateScaleAsState(
                                initialScale = animateSelection,
                                targetScale = 1f,
                                animationSpec = tween(200, easing = androidx.compose.animation.easing.LinearOutSlowIn)
                            )
                ),
                label = { Text("Plans", style = SanchayTypography.Body) },
                selected = 2 == selectedIndex
            )

            // Insights destination
            NavigationBarItem(
                icon = {
                    Icon(
                        imageVector = getIconVector(3),
                        contentDescription = "Insights",
                        tint = if (3 == selectedIndex) SanchayColors.Primary primary else SanchayColors.TextSecondaryLight,
                        modifier = Modifier
                            .size(SanchaySpacing.BottomNavItemSize)
                            .scale(if (3 == selectedIndex) 1.2f else 1f)
                            .animateScaleAsState(
                                initialScale = animateSelection,
                                targetScale = 1f,
                                animationSpec = tween(200, easing = androidx.compose.animation.easing.LinearOutSlowIn)
                            )
                ),
                label = { Text("Insights", style = SanchayTypography.Body) },
                selected = 3 == selectedIndex
            )

            // More/Control destination
            NavigationBarItem(
                icon = {
                    Icon(
                        imageVector = getIconVector(4),
                        contentDescription = "More",
                        tint = if (4 == selectedIndex) SanchayColors.Primary primary else SanchayColors.TextSecondaryLight,
                        modifier = Modifier
                            .size(SanchaySpacing.BottomNavItemSize)
                            .scale(if (4 == selectedIndex) 1.2f else 1f)
                            .animateScaleAsState(
                                initialScale = animateSelection,
                                targetScale = 1f,
                                animationSpec = tween(200, easing = androidx.compose.animation.easing.LinearOutSlowIn)
                            )
                ),
                label = { Text("More", style = SanchayTypography.Body) },
                selected = 4 == selectedIndex
            )
        }
    )
}

/** Get icon vector by index - maps to existing app icons */
private fun getIconVector(index: Int): androidx.compose.ui.graphics.VectorDrawable {
    return when (index) {
        0 -> androidx.compose.material3.icons.filled.Home
        1 -> androidx.compose.material3.icons.filled.TrendingUp
        2 -> androidx.compose.material3.icons.filled.Target
        3 -> androidx.compose.material3.icons.filled.Insights
        4 -> androidx.compose.material3.icons.filled.AccountCircle
        else -> androidx.compose.material3.icons.filled.Home
    }
}

/** Sanchay Bottom Navigation with selected badge */
@Composable
fun SanchayBottomNavigationWithSelection(
    selectedIndex: Int,
    onItemSelected: (Int) -> Unit,
    badgeCount: Int? = null,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .height(SanchaySpacing.BottomNavHeight + (if (badgeCount != null) 24.dp else 0.dp)),
        verticalArrangement = Arrangement.End,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        SanchayBottomNavigation(
            selectedIndex = selectedIndex,
            onItemSelected = onItemSelected
        )

        // Badge for new items/counts
        if (badgeCount != null && badgeCount > 0) {
            val isSelected = selectedIndex == 0 // Simplified: show on Home
            Text(
                text = "+$badgeCount",
                style = SanchayTypography.Caption
                    .copy(
                        fontWeight = androidx.compose.ui.text.font.FontWeight.W600
                    ),
                color = SanchayColors.White,
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(4.dp)
                    .background(
                        if (isSelected) SanchayColors.Warning primary
                        else SanchayColors.Error primary
                    ),
                        shape = SanchayShapes.Small
                    )
        }
    }
}

/** Top app bar compatible with Sanchay shell */
@Composable
fun SanchayTopAppBar(
    title: String,
    onBack: () -> Unit,
    trailingAction: () -> Unit? = null,
    modifier: Modifier = Modifier,
    showBack: Boolean = true,
) {
    Scaffold topBar = {
        TopAppBar(
            modifier = modifier.fillMaxWidth(),
            elevation = {
                elevationDirection -> elevationDirection
                    .provideShadow(
                        color = SanchayColors.Neutral.copy(alpha = 0.1f),
                        elevation = SanchaySpacing.ShadowXS
                    )
                    ,
            },
            colors = TopAppBarDefaults.colors(
                defaultBackground = SanchayColors.SurfaceLight,
                onDefaultBackground = SanchayColors.TextPrimaryLight
            ),
            backButton = if (showBack) {
                Button(
                    onClick = onBack,
                    enabled = canGoBack(),
                    icon = {
                        Icon(
                            imageVector = androidx.compose.material3.icons.filled.ArrowBack,
                            contentDescription = "Back",
                            tint = SanchayColors.OnPrimary,
                        )
                    },
                    accessibilityLabel = "Back"
                )
            } else {
                androidx.compose.ui.unit.Null
            },
            title = {
                Text(
                    text = title,
                    style = SanchayTypography.Heading2,
                    color = SanchayColors.TextPrimaryLight,
                )
            },
            actions = {
                if (trailingAction != null) {
                    trailingAction()
                }
            }
        )
    }
}

/** App bar with subtitle support */
@Composable
fun SanchayTopAppBarWithSubtitle(
    title: String,
    subtitle: String?,
    onBack: () -> Unit,
    trailingAction: () -> Unit? = null,
    modifier: Modifier = Modifier,
) {
    Scaffold topBar = {
        TopAppBar(
            modifier = modifier.fillMaxWidth(),
            elevation = {
                elevationDirection -> elevationDirection
                    .provideShadow(
                        color = SanchayColors.Neutral.copy(alpha = 0.1f),
                        elevation = SanchaySpacing.ShadowXS
                    )
            },
            colors = TopAppBarDefaults.colors(
                defaultBackground = SanchayColors.SurfaceLight,
                onDefaultBackground = SanchayColors.TextPrimaryLight
            ),
            backButton = if (canGoBack()) {
                Button(
                    onClick = onBack,
                    icon = {
                        Icon(
                            imageVector = androidx.compose.material3.icons.filled.ArrowBack,
                            contentDescription = "Back",
                            tint = SanchayColors.OnPrimary,
                        )
                    },
                    accessibilityLabel = "Back"
                )
            } else {
                androidx.compose.ui.unit.Null
            },
            title = {
                Text(
                    text = title,
                    style = SanchayTypography.Heading2,
                    color = SanchayColors.TextPrimaryLight,
                )
            },
            supportiveHeader = {
                androidx.compose.material3.SupportiveHeader(
                    title = { Text(text = title, style = SanchayTypography.Heading2, color = SanchayColors.TextPrimaryLight) },
                    supportive = {
                        if (subtitle != null) {
                            Text(
                                text = subtitle,
                                style = SanchayTypography.Body,
                                color = SanchayColors.TextSecondaryLight,
                            )
                        }
                    }
                )
            },
            actions = {
                if (trailingAction != null) {
                    trailingAction()
                }
            }
        )
    }
}

/** Check if can go back using back navigation */
private var canGoBackInner by remember { mutableStateOf(false) }

private fun canGoBack(): Boolean {
    return canGoBackInner
}

/** Set can go back state from outside */
fun setCanGoBack(value: Boolean) {
    canGoBackInner = value
}