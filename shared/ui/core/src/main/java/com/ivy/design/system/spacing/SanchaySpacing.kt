package com.ivy.design.system.spacing

import androidx.compose.ui.unit.Dp

/**
 * Sanchay Spacing System
 * 
 * A consistent spacing scale for the entire application.
 * Generous but efficient whitespace.
 * Avoids arbitrary padding values throughout the application.
 * 
 * Principle: Consistency - the same concept should have the same spacing everywhere.
 */

/** Global screen padding - used on screens with edge-to-edge content */
val ScreenPadding: Dp = 16.dp

/** Standard content inset - inside screen padding */
val ContentInset: Dp = 24.dp

/** Section spacing - vertical space between distinct sections */
val SectionSpacing: Dp = 24.dp

/** Card spacing - vertical space between cards */
val CardSpacing: Dp = 16.dp

/** List item spacing - vertical space between list rows */
val ListItemSpacing: Dp = 8.dp

/** Input spacing - vertical padding inside text fields */
val InputPaddingVertical: Dp = 12.dp
val InputPaddingHorizontal: Dp = 16.dp

/** Button spacing - vertical padding inside buttons */
val ButtonPaddingVertical: Dp = 12.dp
val ButtonPaddingHorizontal: Dp = 24.dp

/** Divider height - thin separator lines */
val DividerHeight: Dp = 1.dp
val DividerThickHeight: Dp = 2.dp

/** Avatar/icon sizes */
val AvatarSizeSmall: Dp = 24.dp
val AvatarSizeMedium: Dp = 32.dp
val AvatarSizeLarge: Dp = 48.dp

/** Icon sizes */
val IconSizeTiny: Dp = 12.dp
val IconSizeSmall: Dp = 16.dp
val IconSizeMedium: Dp = 20.dp
val IconSizeLarge: Dp = 24.dp
val IconSizeXLarge: Dp = 32.dp

/** Border radius sizes */
val RadiusNone: Dp = 0.dp
val RadiusTiny: Dp = 4.dp
val RadiusSmall: Dp = 8.dp
val RadiusMedium: Dp = 12.dp
val RadiusLarge: Dp = 16.dp
val RadiusPill: Dp = 9999.dp

/** Shadow/elevation offsets */
val ShadowXS: Dp = 2.dp
val ShadowSm: Dp = 4.dp
val ShadowMd: Dp = 8.dp
val ShadowLg: Dp = 16.dp

/** Quick FAB floating action button size */
val FabSize: Dp = 56.dp

/** Minimal padding tokens for compact UI */
val Prolog: Dp = 4.dp
val Epilog: Dp = 4.dp

/** Touch target minimum size */
val TouchTargetMin: Dp = 48.dp

/** Bottom navigation */
val BottomNavHeight: Dp = 56.dp
val BottomNavItemSize: Dp = 28.dp
val BottomNavItemSelectedPadding: Dp = 8.dp
val BottomNavUnselectedPadding: Dp = 4.dp