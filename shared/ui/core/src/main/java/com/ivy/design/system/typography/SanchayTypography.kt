package com.ivy.design.system.typography

import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
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
object SanchayTypography {

    /** Base font family - clean, readable, works well at all sizes */
    val SanchayFontFamily: FontFamily = FontFamily.Default

    /** Hero financial amount - large, prominent balance display */
    val HeroFinancial: TextStyle = TextStyle(
        fontFamily = SanchayFontFamily,
        fontWeight = FontWeight.W700,
        fontSize = 48.sp,
        color = SanchayColors.TextPrimaryLight,
        letterSpacing = 0.5.sp,
    )

    /** Balance display - slightly smaller than hero, still prominent */
    val Balance: TextStyle = TextStyle(
        fontFamily = SanchayFontFamily,
        fontWeight = FontWeight.W600,
        fontSize = 32.sp,
        color = SanchayColors.TextPrimaryLight,
        letterSpacing = 0.25.sp,
    )

    /** Section heading - divides sections clearly */
    val Heading1: TextStyle = TextStyle(
        fontFamily = SanchayFontFamily,
        fontWeight = FontWeight.W600,
        fontSize = 24.sp,
        color = SanchayColors.TextPrimaryLight,
        letterSpacing = 0.1.sp,
    )

    /** Page title - screen titles */
    val Heading2: TextStyle = TextStyle(
        fontFamily = SanchayFontFamily,
        fontWeight = FontWeight.W500,
        fontSize = 20.sp,
        color = SanchayColors.TextPrimaryLight,
        letterSpacing = 0.05.sp,
    )

    /** Card title - category names, section headers within cards */
    val Heading3: TextStyle = TextStyle(
        fontFamily = SanchayFontFamily,
        fontWeight = FontWeight.W500,
        fontSize = 16.sp,
        color = SanchayColors.TextPrimaryLight,
        letterSpacing = 0.02.sp,
    )

    /** Body text - primary reading text */
    val Body: TextStyle = TextStyle(
        fontFamily = SanchayFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        color = SanchayColors.TextPrimaryLight,
        letterSpacing = 0.sp,
    )

    /** Secondary text - less prominent descriptions */
    val BodySecondary: TextStyle = TextStyle(
        fontFamily = SanchayFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        color = SanchayColors.TextSecondaryLight,
        letterSpacing = 0.sp,
    )

    /** Caption - small, secondary information */
    val Caption: TextStyle = TextStyle(
        fontFamily = SanchayFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 11.sp,
        color = SanchayColors.TextMutedLight,
        letterSpacing = 0.sp,
    )

    /** Labels - form labels, section labels */
    val Label: TextStyle = TextStyle(
        fontFamily = SanchayFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        color = SanchayColors.TextPrimaryLight,
        letterSpacing = 0.05.sp,
    )

    /** Button text */
    val Button: TextStyle = TextStyle(
        fontFamily = SanchayFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        color = SanchayColors.White,
        letterSpacing = 0.1.sp,
    )

    /** Small button text */
    val ButtonSmall: TextStyle = TextStyle(
        fontFamily = SanchayFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        color = SanchayColors.White,
        letterSpacing = 0.1.sp,
    )

    /** Numeric/statistical values - financial numbers */
    val Numerical: TextStyle = TextStyle(
        fontFamily = SanchayFontFamily,
        fontWeight = FontWeight.W600,
        fontSize = 16.sp,
        color = SanchayColors.TextPrimaryLight,
        letterSpacing = 0.sp,
    )

    /** Large numeric - big balance numbers */
    val NumericalLarge: TextStyle = TextStyle(
        fontFamily = SanchayFontFamily,
        fontWeight = FontWeight.W700,
        fontSize = 24.sp,
        color = SanchayColors.TextPrimaryLight,
        letterSpacing = 0.sp,
    )

    /** Small numeric - secondary financial data */
    val NumericalSmall: TextStyle = TextStyle(
        fontFamily = SanchayFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        color = SanchayColors.TextSecondaryLight,
        letterSpacing = 0.sp,
    )

    /** Special: Income amount highlight */
    val IncomeAmount: TextStyle = TextStyle(
        fontFamily = SanchayFontFamily,
        fontWeight = FontWeight.W600,
        fontSize = 18.sp,
        color = SanchayColors.IncomePrimary,
        letterSpacing = 0.sp,
    )

    /** Special: Expense amount highlight */
    val ExpenseAmount: TextStyle = TextStyle(
        fontFamily = SanchayFontFamily,
        fontWeight = FontWeight.W600,
        fontSize = 18.sp,
        color = SanchayColors.ExpensePrimary,
        letterSpacing = 0.sp,
    )

    /** Special: Budget progress value */
    val BudgetProgressValue: TextStyle = TextStyle(
        fontFamily = SanchayFontFamily,
        fontWeight = FontWeight.W600,
        fontSize = 14.sp,
        color = SanchayColors.BudgetWarning,
        letterSpacing = 0.sp,
    )
}
