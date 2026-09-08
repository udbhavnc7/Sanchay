package com.ivy.design.system.typography

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.font.FontWeight
import com.ivy.design.system.colors.SanchayColors

/**
 * Sanchay Typography System
 * 
 * Hierarchy designed for financial clarity and visual importance
 * of monetary values without overwhelming the interface.
 * 
 * Principle: Important money gets visual priority.
 * Financial numbers should feel significant but not noisy.
 */

/** Base font family - clean, readable, works well at all sizes */
val FontFamily = "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

/**
 * Typography scale - carefully calibrated for financial UI.
 * Avoids excessive font weights or sizes.
 * All sizes respect dynamic font scaling.
 */

/** Hero financial amount - large, prominent balance display */
val HeroFinancial: TextStyle =
    androidx.compose.ui.text.style.textStyle(
        fontFamily = FontFamily,
        fontWeight = FontWeight.W700,
        fontSize = 48.sp,
        textColor = SanchayColors.TextPrimaryLight,
        letterSpacing = 0.5f,
    )

/** Balance display - slightly smaller than hero, still prominent */
val Balance: TextStyle =
    androidx.compose.ui.text.style.textStyle(
        fontFamily = FontFamily,
        fontWeight = FontWeight.W600,
        fontSize = 32.sp,
        textColor = SanchayColors.TextPrimaryLight,
        letterSpacing = 0.25f,
    )

/** Section heading - divides sections clearly */
val Heading1: TextStyle =
    androidx.compose.ui.text.style.textStyle(
        fontFamily = FontFamily,
        fontWeight = FontWeight.W600,
        fontSize = 24.sp,
        textColor = SanchayColors.TextPrimaryLight,
        letterSpacing = 0.1f,
    )

/** Page title - screen titles */
val Heading2: TextStyle =
    androidx.compose.ui.text.style.textStyle(
        fontFamily = FontFamily,
        fontWeight = FontWeight.W500,
        fontSize = 20.sp,
        textColor = SanchayColors.TextPrimaryLight,
        letterSpacing = 0.05f,
    )

/** Card title - category names, section headers within cards */
val Heading3: TextStyle =
    androidx.compose.ui.text.style.textStyle(
        fontFamily = FontFamily,
        fontWeight = FontWeight.W500,
        fontSize = 16.sp,
        textColor = SanchayColors.TextPrimaryLight,
        letterSpacing = 0.02f,
    )

/** Body text - primary reading text */
val Body: TextStyle =
    androidx.compose.ui.text.style.textStyle(
        fontFamily = FontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        textColor = SanchayColors.TextPrimaryLight,
        letterSpacing = 0.0f,
    )

/** Secondary text - less prominent descriptions */
val BodySecondary: TextStyle =
    androidx.compose.ui.text.style.textStyle(
        fontFamily = FontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        textColor = SanchayColors.TextSecondaryLight,
        letterSpacing = 0.0f,
    )

/** Caption - small, secondary information */
val Caption: TextStyle =
    androidx.compose.ui.text.style.textStyle(
        fontFamily = FontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 11.sp,
        textColor = SanchayColors.TextMutedLight,
        letterSpacing = 0.0f,
    )

/** Labels - form labels, section labels */
val Label: TextStyle =
    androidx.compose.ui.text.style.textStyle(
        fontFamily = FontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        textColor = SanchayColors.TextPrimaryLight,
        letterSpacing = 0.05f,
    )

/** Button text */
val Button: TextStyle =
    androidx.compose.ui.text.style.textStyle(
        fontFamily = FontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        textColor = SanchayColors.White,
        letterSpacing = 0.1f,
    )

/** Small button text */
val ButtonSmall: TextStyle =
    androidx.compose.ui.text.style.textStyle(
        fontFamily = FontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        textColor = SanchayColors.White,
        letterSpacing = 0.1f,
    )

/** Numeric/statistical values - financial numbers */
val Numerical: TextStyle =
    androidx.compose.ui.text.style.textStyle(
        fontFamily = FontFamily,
        fontWeight = FontWeight.W600,
        fontSize = 16.sp,
        textColor = SanchayColors.TextPrimaryLight,
        letterSpacing = 0.0f,
    )

/** Large numeric - big balance numbers */
val NumericalLarge: TextStyle =
    androidx.compose.ui.text.style.textStyle(
        fontFamily = FontFamily,
        fontWeight = FontWeight.W700,
        fontSize = 24.sp,
        textColor = SanchayColors.TextPrimaryLight,
        letterSpacing = 0.0f,
    )

/** Small numeric - secondary financial data */
val NumericalSmall: TextStyle =
    androidx.compose.ui.text.style.textStyle(
        fontFamily = FontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        textColor = SanchayColors.TextSecondaryLight,
        letterSpacing = 0.0f,
    )

/** Special: Income amount highlight */
val IncomeAmount: TextStyle =
    androidx.compose.ui.text.style.textStyle(
        fontFamily = FontFamily,
        fontWeight = FontWeight.W600,
        fontSize = 18.sp,
        textColor = SanchayColors.IncomePrimary,
        letterSpacing = 0.0f,
    )

/** Special: Expense amount highlight */
val ExpenseAmount: TextStyle =
    androidx.compose.ui.text.style.textStyle(
        fontFamily = FontFamily,
        fontWeight = FontWeight.W600,
        fontSize = 18.sp,
        textColor = SanchayColors.ExpensePrimary,
        letterSpacing = 0.0f,
    )

/** Special: Budget progress value */
val BudgetProgressValue: TextStyle =
    androidx.compose.ui.text.style.textStyle(
        fontFamily = FontFamily,
        fontWeight = FontWeight.W600,
        fontSize = 14.sp,
        textColor = SanchayColors.BudgetWarning,
        letterSpacing = 0.0f,
    )