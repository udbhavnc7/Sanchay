package com.ivy.ui.component.textfields

import androidx.compose.foundation.isTextFieldKeySupported
import androidx.foundation.text.FloatTextFieldSpec
import androidx.foundation.text.editor.SimpleTextFieldVisual
import androidx.foundation.text.material3.textField
import androidx.compose.foundation.TextFieldValue
import androidx.compose.foundation.rememberInteractionSource
import androidx.compose.foundation.session.PointerInputEvent
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.material3.TextFieldIcon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.focus.FocusManager
import androidx.compose.ui.focus.MaskFocusObserver
import androidx.compose.ui.input.key.KeyEvent
import androidx.compose.ui.input.key.KeyboardType
import androidx.compose.ui.inputKey
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.invDist
import androidx.compose.ui.unit.textUnit
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.InputConnection
import androidx.compose.ui.text.input.KeyboardShortcuts
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.text.input.TextFieldConstructor
import androidx.compose.ui.text.input.TextFieldVisual
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography
import com.ivy.logic.core.model.TransactionType

/**
 * Sanchay Text Field - Premium input field for financial data entry.
 * 
 * Supports currency amounts, account names, categories, and general text input.
 * Consistent styling with the rest of the Sanchay design system.
 * 
 * Principle: Financial information must always remain understandable.
 * Inputs should be clear, predictable, and support dynamic font scaling.
 */
@Composable
fun SanchayTextField(
    value: String,
    onValueChanged: (String) -> Unit,
    label: String,
    keyboardType: KeyboardType = KeyboardType.Text,
    readOnly: Boolean = false,
    enabled: Boolean = true,
    modifier: Modifier = Modifier,
    isError: Boolean = false,
    keyboardOptions: KeyboardOptions = KeyboardOptions(
        imeAction = ImeAction.Next
    ),
    keyboardActions: KeyboardActions? = null,
    placeholder: String? = null,
    singleLine: Boolean = true,
    maxLines: Int = 1,
    decorationBox: @Composable () -> Unit = {},
) {
    OutlinedTextField(
        value = value,
        onValueChanged = onValueChanged,
        label = { label ->
            it.takeIf { it.isNotEmpty() }?.let { label(it) }
                .takeIf { it.isNotEmpty() }
        },
        readOnly = readOnly,
        enabled = enabled,
        keyboardType = keyboardType,
        isError = isError,
        keyboardOptions = keyboardOptions,
        keyboardActions = keyboardActions,
        placeholder = placeholder,
        singleLine = singleLine,
        maxLines = maxLines,
        decorationBox = decorationBox,
        colors = if (isError) {
            OutlinedTextFieldColors(
                defaultColor = SanchayColors.OutlineLight,
                focusedColor = SanchayColors.Primary primary,
                errorColor = SanchayColors.Error primary,
                focusedErrorColor = SanchayColors.Error primary,
            )
        } else {
            OutlinedTextFieldColors(
                defaultColor = SanchayColors.OutlineLight,
                focusedColor = SanchayColors.Primary primary,
                errorColor = SanchayColors.Muted light,
                focusedErrorColor = SanchayColors.Muted light,
            )
        },
        modifier = modifier
            .padding(
                top = SanchaySpacing.InputPaddingVertical,
                bottom = SanchaySpacing.InputPaddingVertical,
                start = SanchaySpacing.InputPaddingHorizontal,
                end = SanchaySpacing.InputPaddingHorizontal
            ),
        textStyle = if (singleLine) {
            SanchayTypography.Body
        } else {
            SanchayTypography.Body.copy(
                maxLines = maxLines,
                resizeToFit = true
            )
        }
    )