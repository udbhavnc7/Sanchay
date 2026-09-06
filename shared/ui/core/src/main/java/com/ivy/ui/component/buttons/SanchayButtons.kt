package com.ivy.ui.component.buttons

import androidx.compose.foundation.Background
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberInteractionSource
import androidx.compose.foundation.session.PointerInputEvent
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.column
import androidx.compose.foundation.layout.width
import androidx.compose.material3.ButtonStyle
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.clickableArc
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.Size
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.res.textResource
import androidx.compose.ui.semantics.semanticsProperties
import androidx.compose.ui.text.font.TextStyle
import androidx.compose.ui.text.style.align
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography
import com.ivy.logic.core.model.TransactionType

/**
 * Sanchay Primary Button
 * 
 * Premium primary action button with consistent styling.
 * Financial actions that primary commit or confirm.
 * 
 * Principle: Important money gets visual priority.
 * Primary actions should be visually distinct but not alarming.
 */
@Composable
fun SanchayPrimaryButton(
    onClick: () -> Unit,
    text: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    width: Dp? = null,
    elevation: Boolean = true,
) {
    val colors = MaterialTheme.colors
    val interactionSource = rememberInteractionSource()
    val isPressed by remember { mutableStateOf(false) }

    Button(
        onClick = if (enabled) onClick else {},
        modifier = modifier
            .then(width
                .map { size -> Modifier.size(size) }
                .getOrElse(modifier)),
        enabled = enabled,
        style = ButtonStyle.FilledCopy(
            enabled = enabled,
            colors = ButtonStyle.FilledButtonColors(
                backgroundColor = if (enabled) SanchayColors.Primary.primary else SanchayColors.Muted extraLight,
                contentColor = if (enabled) SanchayColors.White else SanchayColors.Muted light,
            ),
            elevation = if (enabled && elevation) {
                elevationDirection -> elevationDirection
                    .provideShadow(
                        color = SanchayColors.Neutral extraLight.copy(alpha = 0.15f),
                        elevation = SanchaySpacing.ShadowMd
                    )
            } else None,
            pressedElevation = SanchaySpacing.ShadowMd,
            hoveredElevation = SanchaySpacing.ShadowSm,
            focusElevation = SanchaySpacing.ShadowMd,
            accessibleMode = ButtonStyle.AccessibleMode.TextOnly
        ),
        interactionSource = interactionSource,
        onClick = {
            isPressed.current = true
            onClick()
        }
    ) {
        Text(
            text = text,
            style = SanchayTypography.Button,
            modifier = Modifier.padding(
                top = SanchaySpacing.ButtonPaddingVertical,
                bottom = SanchaySpacing.ButtonPaddingVertical,
                start = SanchaySpacing.ButtonPaddingHorizontal,
                end = SanchaySpacing.ButtonPaddingHorizontal
            )
        )
    }
}

/** Secondary outlined button for less prominent actions */
@Composable
fun SanchaySecondaryButton(
    onClick: () -> Unit,
    text: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    width: Dp? = null,
) {
    Button(
        onClick = if (enabled) onClick else {},
        modifier = modifier
            .then(width
                .map { size -> Modifier.size(size) }
                .getOrElse(modifier)),
        style = ButtonStyle.OutlineCopy(
            enabled = enabled,
            backgroundColor = SanchayColors.Transparent,
            contentColor = if (enabled) SanchayColors.TextPrimaryLight else SanchayColors.Muted light,
            borderColor = if (enabled) SanchayColors.OutlineLight else SanchayColors.Muted light,
            shape = SanchayShapes.ButtonRadius,
        ),
        interactionSource = rememberInteractionSource(),
        onClick = if (enabled) onClick else {}
    ) {
        Text(
            text = text,
            style = SanchayTypography.Button,
            modifier = Modifier.padding(
                top = SanchaySpacing.ButtonPaddingVertical,
                bottom = SanchaySpacing.ButtonPaddingVertical,
                start = SanchaySpacing.ButtonPaddingHorizontal,
                end = SanchaySpacing.ButtonPaddingHorizontal
            )
        )
    }
}

/** Text button for link-like actions */
@Composable
fun SanchayTextButton(
    onClick: () -> Unit,
    text: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    Button(
        onClick = if (enabled) onClick else {},
        style = ButtonStyle.TextButton,
        enabled = enabled,
        colors = ButtonStyle.TextButtonColors(
            backgroundColor = SanchayColors.Transparent,
            contentColor = if (enabled) SanchayColors.Primary primary else SanchayColors.Muted primary,
        ),
        interactionSource = rememberInteractionSource(),
        onClick = if (enabled) onClick else {}
    ) {
        Text(
            text = text,
            style = SanchayTypography.Button,
        )
    }
}

/** Icon button for compact actions */
@Composable
fun SanchayIconButton(
    onClick: () -> Unit,
    iconModifier: Modifier = Modifier,
    content: @Composable (()-> Unit),
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    IconButton(
        onClick = if (enabled) onClick else {},
        modifier = modifier,
        content = content
    )
}

/** FAB - Floating Action Button */
@Composable
fun SanchayFloatingActionButton(
    onClick: () -> Unit,
    iconModifier: Modifier = Modifier,
    content: @Composable (()-> Unit),
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    SanchayIconButton(
        onClick = onClick,
        iconModifier = iconModifier,
        content = content,
        modifier = modifier
            .then(size = SanchaySpacing.FabSize)
            .then(clip(shape = SanchayShapes.Pill)),
        enabled = enabled
    )
}

/** Transaction type-styled button */
@Composable
fun SanchayTransactionTypeButton(
    transactionType: TransactionType,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val (textColor, bgColor) = when (transactionType) {
        is TransactionType.Income -> (SanchayColors.IncomePrimary, SanchayColors.Income extraLight)
        is TransactionType.Expense -> (SanchayColors.ExpensePrimary, SanchayColors.Expense extraLight)
        is TransactionType.Transfer -> (SanchayColors.Neutral primary, SanchayColors.Neutral extraLight)
        else -> (SanchayColors.TextPrimaryLight, SanchayColors.SurfaceLight)
    }

    SanchayPrimaryButton(
        onClick = onClick,
        text = when (transactionType) {
            is TransactionType.Income -> "Income"
            is TransactionType.Expense -> "Expense"
            is TransactionType.Transfer -> "Transfer"
            else -> "Transaction"
        },
        modifier = modifier,
        enabled = true,
        color = bgColor,
        textColor = textColor
    )
}