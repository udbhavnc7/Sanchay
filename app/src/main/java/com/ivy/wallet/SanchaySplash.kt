package com.ivy.wallet

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.splashscreen.SplashScreen
import androidx.activity.splashscreen.SplashScreenConfiguration
import androidx.activity.splashscreen.SplashScreenView
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.color.Medium
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.isSystemInDarkTheme
import androidx.compose.ui.res.paintPicture
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography

/**
 * Sanchay Splash Screen
 * 
 * Premium launch experience that communicates the Sanchay brand
 * before transitioning to the application.
 * 
 * Principles:
 * - Immediate: Shows instantly, no blocking initialization
 * - Subtle animation: Fade-in and scale, not distracting
 * - Theme-aware: Works in light, dark, and AMOLED
 * - Quick transition: Hands off to app once ready
 * - Accessible: Proper contrast, content descriptions
 */
@Composable
fun SanchaySplash(
    onSplashComplete: () -> Unit,
    scaffoldState: androidx.compose.runtime.remember.ScaffoldState? = null,
    modifier: Modifier = Modifier,
) {
    // Read SplashScreen from Activity if available
    val configuration = rememberSplashScreenConfiguration()
    val isAMOLED = configuration.isAMOLED
    val isDarkTheme = isSystemInDarkTheme()

    // Background color based on theme
    val splashBackground = when (isDarkTheme) {
        true -> if (isAMOLED) SanchayColors.TrueBlack else SanchayColors.Dark
        false -> SanchayColors.White
    }

    // Animated values for entrance
    val fadeIn by remember { mutableStateOf(0f) }
    val scale by remember { mutableStateOf(0.85f) }

    // Trigger animation and transition
    DisposableEffect(Unit) {
        // Animate entrance: fade in + scale up
        fadeIn.animateTo(
            targetValue = 1f,
            animationSpec = tween(
                duration = 700,
                easing = androidx.compose.animation.easing.LinearOutSlowIn
            )
        )
        scale.animateTo(
            targetValue = 1f,
            animationSpec = tween(
                duration = 700,
                easing = androidx.compose.animation.easing.LinearOutSlowIn
            )
        )
    }

    // Transition after splash entrance completes
    val transitionReady = remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        // Wait for entrance animation, then transition
        transitionReady.value = true
    }

    // Content displayed during splash
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(splashBackground)
            .then(modifier),
        content = {
            Column(
                modifier = Modifier
                    .align(Alignment.Center)
                    .padding(horizontal = SanchaySpacing.ContentInset),
                verticalArrangement = Arrangement.Center
            ) {
                // Sanchay mark - appears first
                Icon(
                    imageVector = androidx.compose.material3.icons.filled.AccountBalance,
                    contentDescription = "Sanchay financial operating system",
                    tint = SanchayColors.TextPrimaryLight.copy(alpha = fadeIn),
                    modifier = Modifier
                        .size(SanchaySpacing.AvatarSizeLarge)
                        .animateScaleAsState(
                            initialScale = 0.85f,
                            targetScale = 1f,
                            animationSpec = tween(700, easing = androidx.compose.animation.easing.LinearOutSlowIn)
                        )
                )

                // Sanchay wordmark - fades in after mark
                Text(
                    text = "Sanchay",
                    style = SanchayTypography.HeroFinancial
                        .copy(
                            letterSpacing = 0.3f,
                            color = SanchayColors.TextPrimaryLight.copy(alpha = fadeIn)
                        ),
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .padding(vertical = 24.dp)
                        .animateAlpha(targetValue = fadeIn)
                )

                // Subtitle - appears later
                Text(
                    text = "A calm, intelligent place for your money",
                    style = SanchayTypography.Body
                        .copy(
                            color = SanchayColors.TextSecondaryLight.copy(alpha = fadeIn)
                        ),
                    textAlign = TextAlign.Center,
                    modifier = Modifier.animateAlpha(targetValue = fadeIn)
                )
            }
        }
    )

    // After transition is ready, call completion
    if (transitionReady.value) {
        onSplashComplete()
    }
}