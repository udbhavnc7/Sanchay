package com.ivy.design.system

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.colors.SanchayColorShades

/**
 * Sanchay Material 3 Theme
 * 
 * Centralized theming for the Sanchay Personal Financial Operating System.
 * Supports light, dark, and AMOLED-friendly dark mode.
 * 
 * Principle: Financial clarity - information must always remain understandable.
 * Color communicates trust, control, and calm - never anxiety.
 * Never relies exclusively on color to communicate meaning.
 */
@Composable
fun SanchayMaterial3Theme(
    isTrueBlack: Boolean = false,
    dark: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val lightColorScheme = SanchayLightColorScheme
    val darkColorScheme = SanchayDarkColorScheme(isTrueBlack)

    MaterialTheme(
        colorScheme = if (dark) darkColorScheme else lightColorScheme,
        content = content,
    )
}

/** Light color scheme - clean, crisp, financial clarity */
private fun SanchayLightColorScheme(): ColorScheme = ColorScheme(
    /** Primary - sophisticated blue-teal communicating trust and intelligence */
    primary = SanchayColors.Primary.primary,
    onPrimary = SanchayColors.White,
    primaryContainer = SanchayColors.Primary.light,
    onPrimaryContainer = SanchayColors.White,
    inversePrimary = SanchayColors.Primary.kindaDark,

    /** Secondary complementary accent */
    secondary = SanchayColors.Secondary.primary,
    onSecondary = SanchayColors.White,
    secondaryContainer = SanchayColors.Secondary.light,
    onSecondaryContainer = SanchayColors.White,

    /** Income - calm green for positive financial movement */
    tertiary = SanchayColors.Income.primary,
    onTertiary = SanchayColors.White,
    tertiaryContainer = SanchayColors.Income.light,
    onTertiaryContainer = SanchayColors.White,

    /** Expense - restrained red for negative financial movement */
    error = SanchayColors.Expense.primary,
    onError = SanchayColors.White,
    errorContainer = SanchayColors.Expense.light,
    onErrorContainer = SanchayColors.White,

    /** Background and surfaces */
    background = SanchayColors.LightBackground,
    onBackground = SanchayColors.TextPrimaryLight,
    surface = SanchayColors.SurfaceLight,
    onSurface = SanchayColors.TextPrimaryLight,
    surfaceVariant = SanchayColors.SurfaceVariantLight,
    onSurfaceVariant = SanchayColors.TextPrimaryLight,

    /** Borders and separators */
    outline = SanchayColors.OutlineLight,
    outlineVariant = SanchayColors.Muted light,

    /** Subtle scrim for modals, bottom sheets */
    scrim = SanchayColors.Neutral.extraLight.copy(alpha = 0.8f)
)

/** Dark color scheme - soft dark, AMOLED-aware */
private fun SanchayDarkColorScheme(isTrueBlack: Boolean): ColorScheme = ColorScheme(
    /** Primary - maintains identity in dark mode */
    primary = SanchayColors.Primary.primary,
    onPrimary = SanchayColors.White,
    primaryContainer = SanchayColors.Primary.light,
    onPrimaryContainer = SanchayColors.White,
    inversePrimary = SanchayColors.Primary.kindaDark,

    /** Secondary */
    secondary = SanchayColors.Secondary.primary,
    onSecondary = SanchayColors.White,
    secondaryContainer = SanchayColors.Secondary.light,
    onSecondaryContainer = SanchayColors.White,

    /** Income in dark */
    tertiary = SanchayColors.Income.primary,
    onTertiary = SanchayColors.White,
    tertiaryContainer = SanchayColors.Income.light,
    onTertiaryContainer = SanchayColors.White,

    /** Expense in dark */
    error = SanchayColors.Expense.primary,
    onError = SanchayColors.White,
    errorContainer = SanchayColors.Expense.light,
    onErrorContainer = SanchayColors.White,

    /** Background and surfaces - soft dark, not harsh black */
    background = if (isTrueBlack) SanchayColors.TrueBlack else SanchayColors.Dark,
    onBackground = if (isTrueBlack) SanchayColors.White else SanchayColors.TextPrimaryLight,
    surface = if (isTrueBlack) SanchayColors.TrueBlack else SanchayColors.Dark,
    onSurface = if (isTrueBlack) SanchayColors.White else SanchayColors.TextPrimaryLight,
    surfaceVariant = SanchayColors.SurfaceVariantDark,
    onSurfaceVariant = if (isTrueBlack) SanchayColors.Black else SanchayColors.TextSecondaryLight,

    /** Borders and separators */
    outline = SanchayColors.OutlineDark,
    outlineVariant = SanchayColors.MutedDark,

    /** Subtle scrim */
    scrim = SanchayColors.Neutral.extraLight.copy(alpha = 0.8f)
)