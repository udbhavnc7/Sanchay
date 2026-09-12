package com.ivy.design.system.colors

import androidx.compose.runtime.Immutable
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

    /** Dark mode background - luxury deep black matching logo */
    val Dark = Color(0xFF0A0A0C)

    /** AMOLED-friendly true black */
    val TrueBlack = Color(0xFF000000)

    /** Primary color - radiant imperial gold matching Sanchay emblem */
    val Primary = ColorShades(
        extraLight = Color(0xFFFAF3AA),
        light = Color(0xFFF5E5AD),
        kindaLight = Color(0xFFE5C875),
        primary = Color(0xFFD4AF37),
        kindaDark = Color(0xFFB89228),
        dark = Color(0xFF94721A),
        extraDark = Color(0xFF6E520F),
    )

    /** Secondary color - warm champagne gold accent for depth and action */
    val Secondary = ColorShades(
        extraLight = Color(0xFFFFFDF5),
        light = Color(0xFFFCEFC7),
        kindaLight = Color(0xFFF7DE8A),
        primary = Color(0xFFE5B842),
        kindaDark = Color(0xFFC7982B),
        dark = Color(0xFFA67B18),
        extraDark = Color(0xFF7A570C),
    )

    /** Income / positive financial movement - calm, trustworthy green */
    val Income = ColorShades(
        extraLight = Color(0xFFDCFCE7),
        light = Color(0xFFBBF7D0),
        kindaLight = Color(0xFF86EFAC),
        primary = Color(0xFF22C55E),
        kindaDark = Color(0xFF16A34A),
        dark = Color(0xFF15803D),
        extraDark = Color(0xFF145A3D),
    )

    /** Expense / negative financial movement - restrained red */
    val Expense = ColorShades(
        extraLight = Color(0xFFFEF3F2),
        light = Color(0xFFFECACA),
        kindaLight = Color(0xFFF87171),
        primary = Color(0xFFEF4444),
        kindaDark = Color(0xFFDC2626),
        dark = Color(0xFFB91C1C),
        extraDark = Color(0xFF991B1B),
    )

    /** Neutral / general text and borders - balanced gray */
    val Neutral = ColorShades(
        extraLight = Color(0xFFFBFBFC),
        light = Color(0xFFF3F4F6),
        kindaLight = Color(0xFFE5E7EB),
        primary = Color(0xFF6B7280),
        kindaDark = Color(0xFF4B5563),
        dark = Color(0xFF374151),
        extraDark = Color(0xFF1F2937),
    )

    /** Muted / secondary text - subtle, low-priority information */
    val Muted = ColorShades(
        extraLight = Color(0xFFE5E7EB),
        light = Color(0xFFD1D5DB),
        kindaLight = Color(0xFF9CA3AF),
        primary = Color(0xFF6B7280),
        kindaDark = Color(0xFF4B5563),
        dark = Color(0xFF374151),
        extraDark = Color(0xFF1F2937),
    )

    /** Informational / link/interactive color */
    val Informational = ColorShades(
        extraLight = Color(0xFFDBEAFE),
        light = Color(0xFFBFDBFE),
        kindaLight = Color(0xFF93C5FD),
        primary = Color(0xFF3B82F6),
        kindaDark = Color(0xFF2563EB),
        dark = Color(0xFF1D4ED8),
        extraDark = Color(0xFF1E40AF),
    )

    /** Success state - checkmark, completion */
    val Success = ColorShades(
        extraLight = Color(0xFFDDF8ED),
        light = Color(0xFFBBF7D0),
        kindaLight = Color(0xFF86EFAC),
        primary = Color(0xFF22C55E),
        kindaDark = Color(0xFF16A34A),
        dark = Color(0xFF15803D),
        extraDark = Color(0xFF145A3D),
    )

    /** Warning state - attention without anxiety */
    val Warning = ColorShades(
        extraLight = Color(0xFFFB923C),
        light = Color(0xFFF59E0B),
        kindaLight = Color(0xFFFBBF24),
        primary = Color(0xFFF59E0B),
        kindaDark = Color(0xFFEAB308),
        dark = Color(0xFFCA8A04),
        extraDark = Color(0xFFA16207),
    )

    /** Error state - clear but not alarming */
    val Error = ColorShades(
        extraLight = Color(0xFFFEE2E2),
        light = Color(0xFFF87171),
        kindaLight = Color(0xFFFEBFBD),
        primary = Color(0xFFEF4444),
        kindaDark = Color(0xFFDC2626),
        dark = Color(0xFFB91C1C),
        extraDark = Color(0xFF991B1B),
    )

    /** Financial semantic colors */
    val IncomePositive = Color(0xFF22C55E)
    val ExpenseNegative = Color(0xFFEF4444)
    val BudgetWarning = Color(0xFFF59E0B)
    val GoalProgress = Color(0xFFD4AF37)
    val IncomePrimary = Income.primary
    val ExpensePrimary = Expense.primary

    /** Surface colors */
    val LightBackground = Color(0xFFFFFFFF)
    val DarkBackground = Color(0xFF0A0A0C)
    val SurfaceLight = Color(0xFFFFFFFF)
    val SurfaceDark = Color(0xFF121215)
    val SurfaceVariantLight = Color(0xFFFBFDFF)
    val SurfaceVariantDark = Color(0xFF1C1C20)

    /** Outline and border colors */
    val OutlineLight = Color(0xFFE5E7EB)
    val OutlineDark = Color(0xFF2E2A20)

    /** Text colors */
    val TextPrimaryLight = Color(0xFF111827)
    val TextPrimaryDark = Color(0xFFFDFBF7)
    val TextSecondaryLight = Color(0xFF6B7280)
    val TextSecondaryDark = Color(0xFFC7BAA0)
    val TextMutedLight = Color(0xFF9CA3AF)
    val TextMutedDark = Color(0xFF8C8270)

    /** Border and separator colors */
    val DividerLight = Color(0xFFE5E7EB)
    val DividerDark = Color(0xFF2E2A20)
}