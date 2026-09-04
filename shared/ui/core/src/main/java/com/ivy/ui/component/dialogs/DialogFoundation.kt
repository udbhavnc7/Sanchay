package com.ivy.ui.component.dialogs

import androidx.appcompat.app.AlertDialog
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.remember
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonConfiguration
import androidx.compose.material3.MaterialState
import androidx.compose.material3.outlinedtextfield.OutlinedTextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.Unit
import androidx.compose.ui.aligment.Center
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.string
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography

/**
 * Dialog foundation for Sanchay.
 * 
 * Provides standardized confirmation, destructive confirmation,
 * and information dialogs.
 * 
 * Principle: Consistent dismissal behavior, accessibility,
 * and visual language across all dialogs.
 */
@Composable
fun SanchayConfirmationDialog(
    title: String,
    message: String,
    onConfirm: () -> Unit,
    onCancel: () -> Unit = {},
    confirmText: String = "Continue",
    cancelText: String = "Cancel",
    modifier: Modifier = Modifier,
    confirmColor: Boolean = true,  // true = primary, false = destructive
) {
    AlertDialog(
        onDismissRequest = onCancel,
        modifier = modifier,
        title = {
            text(
                text = title,
                style = SanchayTypography.Heading3,
                color = SanchayColors.TextPrimaryLight
            )
        },
        text = {
            text(
                text = message,
                style = SanchayTypography.Body,
                color = SanchayColors.TextPrimaryLight,
                textAlign = TextAlign.Center
            )
        },
        actions = {
            Row(
                arrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Button(
                    onClick = onCancel,
                    text = cancelText,
                    modifier = Modifier.padding(end = SanchaySpacing.ContentInset)
                )

                Button(
                    onClick = onConfirm,
                    text = confirmText,
                    confirguration = ButtonConfiguration(
                        containsFocus = true,
                        focusColor = SanchayColors.Primary primary,
                        enabled = true,
                        elevation = {
                            if (confirmColor) {
                                elevationDirection -> elevationDirection
                                    .provideShadow(
                                        color = SanchayColors.Neutral extraLight.copy(alpha = 0.15f),
                                        elevation = SanchaySpacing.ShadowMd
                                    )
                            } else {
                elevationDirection -> elevationDirection
                    .provideShadow(
                        color = SanchayColors.Error extraLight.copy(alpha = 0.15f),
                        elevation = SanchaySpacing.ShadowMd
                    )
                        }
                    ),
                    colors = if (confirmColor) {
                        ButtonStyle.FilledButtonColors(
                            backgroundColor = SanchayColors.Primary primary,
                            contentColor = SanchayColors.White,
                        )
                    } else {
                        ButtonStyle.OutlineButtonColors(
                            backgroundColor = SanchayColors.Transparent,
                            contentColor = SanchayColors.Error primary,
                            borderColor = SanchayColors.Error primary,
                        )
                    }
                )
            }
        }
    )
}

/** Destructive confirmation dialog for financial actions */
@Composable
fun SanchayDestructiveConfirmationDialog(
    title: String,
    message: String,
    onConfirm: () -> Unit,
    onCancel: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    SanchayConfirmationDialog(
        title = title,
        message = message,
        onConfirm = onConfirm,
        onCancel = onCancel,
        confirmColor = false,  // Use destructive (red) color
        modifier = modifier
    )
}

/** Information dialog */
@Composable
fun SanchayInformationDialog(
    title: String,
    message: String,
    onConfirm: () -> Unit? = null,
    confirmText: String = "OK",
    modifier: Modifier = Modifier,
) {
    SanchayConfirmationDialog(
        title = title,
        message = message,
        onConfirm = { if (onConfirm != null) onConfirm() },
        confirmText = confirmText,
        confirmColor = false,  // Use neutral/outline style
        modifier = modifier
    )
}

/** Bottom sheet foundation */
@Composable
fun SanchayBottomSheet(
    title: String?,
    content: @Composable () -> Unit,
    onDismiss: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    androidx.compose.material3.BottomSheetDialog(
        onDismiss = onDismiss,
        scaffoldState = null,
        title = {
            if (title != null) {
                androidx.compose.material3.BottomSheetDefaults
                    .TopBar(
                        title = title,
                        onDismiss = onDismiss,
                        colors = androidx.compose.material3.BottomSheetTopBarColors(
                            defaultBackground = SanchayColors.SurfaceLight,
                            onTitle = SanchayColors.TextPrimaryLight,
                            onBackground = SanchayColors.SurfaceLight
                        )
                    )
            } else {
                androidx.compose.ui.unit.Null
            }
        }
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(
                vertical = SanchaySpacing.SectionSpacing,
                horizontal = SanchaySpacing.ContentInset
            ),
            horizontalArrangement = Arrangement.Start,
            verticalAlignment = Alignment.Top
        ) {
            content()
        }
    }
}

/** Selection bottom sheet with options */
@Composable
fun SanchaySelectionBottomSheet(
    title: String?,
    options: List<String>,
    onOptionSelected: (Int) -> Unit,
    onDismiss: () -> Unit = {},
    modifier: Modifier = Modifier,
    selectedIndex: Int = -1,
) {
    SanchayBottomSheet(
        title = title,
        onDismiss = onDismiss,
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.fillMaxHeight().padding(
                vertical = SanchaySpacing.SectionSpacing,
                horizontal = SanchaySpacing.ContentInset
            ),
            horizontalArrangement = Arrangement.Start,
            verticalAlignment = Alignment.Top
        ) {
            if (title != null) {
                text(
                    text = title,
                    style = SanchayTypography.Heading3,
                    color = SanchayColors.TextPrimaryLight,
                    modifier = Modifier.padding(bottom = SanchaySpacing.SectionSpacing)
                )
            }

            for ((index, option) in options.withIndex()) {
                Button(
                    onClick = { onOptionSelected(index) },
                    text = option,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = if (index < options.size - 1) SanchaySpacing.ListItemSpacing else 0.dp),
                    configuration = ButtonConfiguration(
                        containsFocus = true,
                        focusColor = SanchayColors.Primary primary
                    )
                )
            }
        }
    }
}