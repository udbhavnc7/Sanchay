package com.ivy.design.system.shapes

import androidx.compose.ui.graphics.RoundedCornerShape
import com.ivy.design.system.spacing.SanchayRadius

/**
 * Sanchay Shape System
 * 
 * Consistent rounded corners for the entire application.
 * Uses rounded surfaces intelligently - not every component is excessively rounded.
 * Establishes consistent elevation and surface hierarchy.
 * 
 * Principle: Premium without looking like a collection of floating cards.
 */

/** Pre-defined radius tokens from the spacing system */
val Tiny: RoundedCornerShape = RoundedCornerShape(SanchayRadius.Tiny)
val Small: RoundedCornerShape = RoundedCornerShape(SanchayRadius.Small)
val Medium: RoundedCornerShape = RoundedCornerShape(SanchayRadius.Medium)
val Large: RoundedCornerShape = RoundedCornerShape(SanchayRadius.Large)
val Pill: RoundedCornerShape = RoundedCornerShape(SanchayRadius.Pill)

/** Common shape usages */
val ButtonRadius: RoundedCornerShape = Medium
val CardRadius: RoundedCornerShape = Large
val TextFieldRadius: RoundedCornerShape = Medium
val ListItemRadius: RoundedCornerShape = Small
val ChipRadius: RoundedCornerShape = Small
val DialogRadius: RoundedCornerShape = Large

/** Surface shapes - different radii for different surface types */
val SurfaceCardRadius: RoundedCornerShape = Large
val SurfaceElevationRadius: RoundedCornerShape = Medium
val NavItemRadius: RoundedCornerShape = Medium