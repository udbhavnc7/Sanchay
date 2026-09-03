package com.ivy.design.system.colors

import androidx.compose.ui.graphics.Color

/**
 * Sanchay Color System
 * 
 * A premium, minimal financial operating system palette.
 * Communicates clarity, trust, control, and calmness.
 * 
 * Principle: Financial information must always remain understandable.
 * Primary color communicates intelligence and trust.
 * Income/positive uses calm green. Expense/negative uses restrained red.
 * Never relies exclusively on color to communicate meaning.
 */
@Immutable
object SanchayColors {

    /** Light mode background - clean, crisp white */
    val White = Color(0xFFFFFFFF)

    /** Dark mode background - soft black that's easier on eyes than true black */
    val Dark = Color(0xFF0B0B0C)

    /** AMOLED-friendly true black */
    val TrueBlack = Color(0xFF000000)

    /** Primary color - sophisticated blue-teal communicating trust and intelligence */
    val Primary = ColorShades(
        extraLight = Color(0xFFE8EEF5),
        light = Color(0xFFCBDDE8),
        kindaLight = Color(0xFF98ABCC),
        primary = Color(0xFF3B82F6),
        kindaDark = Color(0xFF2563EB),
        dark = Color(0xFF1D4ED8),
        extraDark = Color(0xFF1E40AF),
    )

    /** Secondary color - complementary accent for depth and action */
    val Secondary = ColorShades(
        extraLight = Color(0xFFF0F4FF),
        light = Color(0xE2E8F5),
        kindaLight = Color(0x93C5FD),
        primary = Color(0xFF6366F1),
        kindaDark = Color(0x4F46E5),
        dark = Color(0x4338CA),
        extraDark = Color(0x3730A3),
    )

    /** Income / positive financial movement - calm, trustworthy green */
    val Income = ColorShades(
        extraLight = Color(0xFFDCFCE7),
        light = Color(0xBBF7D0),
        kindaLight = Color(0x86EFAC),
        primary = Color(0x22C55E),
        kindaDark = Color(0x16A34A),
        dark = Color(0x15803D),
        extraDark = Color(0x145A3D),
    )

    /** Expense / negative financial movement - restrained red */
    val Expense = ColorShades(
        extraLight = Color(0xFEF3F2),
        light = Color(0xFECACA),
        kindaLight = Color(0xF87171),
        primary = Color(0xEF4444),
        kindaDark = Color(0xDC2626),
        dark = Color(0xB91C1C),
        extraDark = Color(0x991B1B),
    )

    /** Neutral / general text and borders - balanced gray */
    val Neutral = ColorShades(
        extraLight = Color(0xFFFBFBFC),
        light = Color(0xF3F4F6),
        kindaLight = Color(0xE5E7EB),
        primary = Color(0x6B7280),
        kindaDark = Color(0x4B5563),
        dark = Color(0x374151),
        extraDark = Color(0x1F2937),
    )

    /** Muted / secondary text - subtle, low-priority information */
    val Muted = ColorShades(
        extraLight = Color(0xFFE5E7EB),
        light = Color(0xD1D5DB),
        kindaLight = Color(0x9CA3AF),
        primary = Color(0x6B7280),
        kindaDark = Color(0x4B5563),
        dark = Color(0x374151),
        extraDark = Color(0x1F2937),
    )

    /** Informational / link/interactive color */
    val Informational = ColorShades(
        extraLight = Color(0xFFDBEAFE),
        light = Color(0xBFDBFE),
        kindaLight = Color(0x93C5FD),
        primary = Color(0x3B82F6),
        kindaDark = Color(0x2563EB),
        dark = Color(0x1D4ED8),
        extraDark = Color(0x1E40AF),
    )

    /** Success state - checkmark, completion */
    val Success = ColorShades(
        extraLight = Color(0xDDF8ED),
        light = Color(0xBBF7D0),
        kindaLight = Color(0x86EFAC),
        primary = Color(0x22C55E),
        kindaDark = Color(0x16A34A),
        dark = Color(0x15803D),
        extraDark = Color(0x145A3D),
    )

    /** Warning state - attention without anxiety */
    val Warning = ColorShades(
        extraLight = Color(0xFFFB923C),
        light = Color(0xF59E0B),
        kindaLight = Color(0xFBBF24),
        primary = Color(0xF59E0B),
        kindaDark = Color(0xEAB308),
        dark = Color(0xCA8A04),
        extraDark = Color(0xA16207),
    )

    /** Error state - clear but not alarming */
    val Error = ColorShades(
        extraLight = Color(0xFEE2E2),
        light = Color(0xF87171),
        kindaLight = Color(0xFEBFBD),
        primary = Color(0xEF4444),
        kindaDark = Color(0xDC2626),
        dark = Color(0xB91C1C),
        extraDark = Color(0x991B1B),
    )

    /** Financial semantic colors */
    val IncomePositive = Color(0x22C55E)
    val ExpenseNegative = Color(0xEF4444)
    val BudgetWarning = Color(0xF59E0B)
    val GoalProgress = Color(0x3B82F6)

    /** Surface colors */
    val LightBackground = Color(0xFFFFFFFF)
    val DarkBackground = Color(0xFF0B0B0C)
    val SurfaceLight = Color(0xFFFFFFFF)
    val SurfaceDark = Color(0xFF0B0B0C)
    val SurfaceVariantLight = Color(0xFFFBFDFF)
    val SurfaceVariantDark = Color(0xFF18181B)

    /** Outline and border colors */
    val OutlineLight = Color(0xFFE5E7EB)
    val OutlineDark = Color(0x3F3F46)

    /** Text colors */
    val TextPrimaryLight = Color(0x111827)
    val TextPrimaryDark = Color(0xF8FAFC)
    val TextSecondaryLight = Color(0x6B7280)
    val TextSecondaryDark = Color(0x9CA3AF)
    val TextMutedLight = Color(0x9CA3AF)
    val TextMutedDark = Color(0x737373)

    /** Border and separator colors */
    val DividerLight = Color(0xFFE5E7EB)
    val DividerDark = Color(0x3F3F46)
}