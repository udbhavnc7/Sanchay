package com.ivy.wallet

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography

@Composable
fun SanchaySplash(
    onSplashComplete: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val fadeIn = remember { Animatable(0f) }
    val scale = remember { Animatable(0.85f) }

    LaunchedEffect(Unit) {
        fadeIn.animateTo(
            targetValue = 1f,
            animationSpec = tween(durationMillis = 700)
        )
        scale.animateTo(
            targetValue = 1f,
            animationSpec = tween(durationMillis = 700)
        )
        onSplashComplete()
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(SanchayColors.White),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .padding(horizontal = SanchaySpacing.ContentInset),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = Icons.Filled.AccountBalance,
                contentDescription = "Sanchay",
                tint = SanchayColors.TextPrimaryLight.copy(alpha = fadeIn.value),
                modifier = Modifier
                    .size(SanchaySpacing.AvatarSizeLarge)
                    .scale(scale.value)
            )

            Text(
                text = "Sanchay",
                style = SanchayTypography.HeroFinancial.copy(
                    color = SanchayColors.TextPrimaryLight.copy(alpha = fadeIn.value)
                ),
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .padding(vertical = 24.dp)
                    .alpha(fadeIn.value)
            )

            Text(
                text = "A calm, intelligent place for your money",
                style = SanchayTypography.Body.copy(
                    color = SanchayColors.TextSecondaryLight.copy(alpha = fadeIn.value)
                ),
                textAlign = TextAlign.Center,
                modifier = Modifier.alpha(fadeIn.value)
            )
        }
    }
}
