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
import com.ivy.model.core.Budget
import com.ivy.model.core.SummaryOverview

/**
 * Sanchay Amount Input - Specialized for financial amount entry.
 * 
 * Features:
 * - Numeric-only keyboard with decimal support
 * - Currency formatting assistance
 * - Large readable financial numbers
 * - Proper error/focus states
 * - Accessibility semantics
 * 
 * Principle: Financial numbers must be accurate and readable.
 */
@Composable
fun SanchayAmountInput(
    value: String,
    onValueChanged: (String) -> Unit,
    label: String,
    currency: String = "USD",
    keyboardType: KeyboardType = KeyboardType.Number,
    readOnly: Boolean = false,
    enabled: Boolean = true,
    modifier: Modifier = Modifier,
    isError: Boolean = false,
    placeholder: String? = null,
    showCurrency: Boolean = true,
) {
    var innerValue by remember { mutableStateOf(value) }
    
    OutlinedTextField(
        value = innerValue,
        onValueChanged = { onValueChanged(it); innerValue = it },
        label = { label ->
            it.takeIf { it.isNotEmpty() }?.let { label(it) }
                .takeIf { it.isNotEmpty() }
        },
        readOnly = readOnly,
        enabled = enabled,
        keyboardType = keyboardType,
        isError = isError,
        keyboardOptions = KeyboardOptions(
            imeAction = ImeAction.Done,
            keyboardType = keyboardType
        ),
        keyboardActions = null,
        placeholder = if (showCurrency) "$placeholder" else placeholder,
        singleLine = true,
        maxLines = 1,
        decorationBox = { currencyIcon(currency) },
        colors = if (isError) {
            OutlinedTextFieldColors(
                defaultColor = SanchayColors.OutlineLight,
                focusedColor = SanchayColors.Error primary,
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
        textStyle = SanchayTypography.Body,
    )
}

/** Currency icon inside decoration box */
@Composable
private fun currencyIcon(currency: String) {
    androidx.compose.material3.Icon(
        imageVector = androidx.compose.material3.icons.filled.Currency,
        contentDescription = "$currency currency",
        tint = SanchayColors.TextMutedLight,
        modifier = Modifier
            .padding(end = SanchaySpacing.ListItemSpacing)
    )
}

/** Search input field */
@Composable
fun SanchaySearchInput(
    value: String,
    onValueChanged: (String) -> Unit,
    label: String = "Search",
    enabled: Boolean = true,
    modifier: Modifier = Modifier,
    showClearButton: Boolean = true,
) {
    var searchValue by remember { mutableStateOf(value) }
    
    OutlinedTextField(
        value = searchValue,
        onValueChanged = { onValueChanged(it); searchValue = it },
        label = { label ->
            it.takeIf { it.isNotEmpty() }?.let { label(it) }
                .takeIf { it.isNotEmpty() }
        },
        enabled = enabled,
        keyboardType = KeyboardType.Text,
        isError = false,
        keyboardOptions = KeyboardOptions(
            imeAction = ImeAction.Search
        ),
        keyboardActions = null,
        placeholder = null,
        singleLine = true,
        maxLines = 1,
        decorationBox = {
            Box(
                Modifier
                    .padding(start = SanchaySpacing.ListItemSpacing)
                    .size(24.dp)
            ) {
                androidx.compose.material3.Icon(
                    imageVector = androidx.compose.material3.icons.filled.Search,
                    contentDescription = "Search",
                    tint = SanchayColors.TextMutedLight
                )
            }
        },
        colors = OutlinedTextFieldColors(
            defaultColor = SanchayColors.OutlineLight,
            focusedColor = SanchayColors.Primary primary,
            errorColor = SanchayColors.Error primary,
            focusedErrorColor = SanchayColors.Error primary,
        ),
        modifier = modifier
            .padding(
                top = SanchaySpacing.InputPaddingVertical,
                bottom = SanchaySpacing.InputPaddingVertical,
                start = SanchaySpacing.InputPaddingHorizontal,
                end = SanchaySpacing.InputPaddingHorizontal
            ),
        textStyle = SanchayTypography.Body,
    )
}

/** Dropdown/select input */
@Composable
fun SanchayDropdownInput(
    value: String,
    onValueChanged: (String) -> Unit,
    options: List<String>,
    label: String,
    enabled: Boolean = true,
    modifier: Modifier = Modifier,
    selectedOption: String? = null,
) {
    var dropdownValue by remember { mutableStateOf(selectedOption ?: value) }
    
    OutlinedTextField(
        value = dropdownValue,
        onValueChanged = { onValueChanged(it); dropdownValue = it },
        label = { label ->
            it.takeIf { it.isNotEmpty() }?.let { label(it) }
                .takeIf { it.isNotEmpty() }
        },
        enabled = enabled,
        keyboardType = KeyboardType.Text,
        isError = false,
        keyboardOptions = KeyboardOptions(
            imeAction = ImeAction.Next
        ),
        keyboardActions = null,
        placeholder = null,
        singleLine = true,
        maxLines = 1,
        decorationBox = {
            androidx.compose.material3.Icon(
                imageVector = androidx.compose.material3.icons.filled.ArrowDropDown,
                contentDescription = "Dropdown",
                tint = SanchayColors.TextMutedLight,
                modifier = Modifier.padding(end = SanchaySpacing.ListItemSpacing)
            )
        },
        colors = OutlinedTextFieldColors(
            defaultColor = SanchayColors.OutlineLight,
            focusedColor = SanchayColors.Primary primary,
            errorColor = SanchayColors.Error primary,
            focusedErrorColor = SanchayColors.Error primary,
        ),
        modifier = modifier
            .padding(
                top = SanchaySpacing.InputPaddingVertical,
                bottom = SanchaySpacing.InputPaddingVertical,
                start = SanchaySpacing.InputPaddingHorizontal,
                end = SanchaySpacing.InputPaddingHorizontal
            ),
        textStyle = SanchayTypography.Body,
    )
}

/** Date input field */
@Composable
fun SanchayDateInput(
    value: String,
    onValueChanged: (String) -> Unit,
    label: String = "Date",
    enabled: Boolean = true,
    modifier: Modifier = Modifier,
) {
    var dateValue by remember { mutableStateOf(value) }
    
    OutlinedTextField(
        value = dateValue,
        onValueChanged = { onValueChanged(it); dateValue = it },
        label = { label ->
            it.takeIf { it.isNotEmpty() }?.let { label(it) }
                .takeIf { it.isNotEmpty() }
        },
        enabled = enabled,
        keyboardType = KeyboardType.Date,
        isError = false,
        keyboardOptions = KeyboardOptions(
            imeAction = ImeAction.Next
        ),
        keyboardActions = null,
        placeholder = null,
        singleLine = true,
        maxLines = 1,
        decorationBox = {
            Box(
                Modifier
                    .padding(end = SanchaySpacing.ListItemSpacing)
                    .size(24.dp)
            ) {
                androidx.compose.material3.Icon(
                    imageVector = androidx.compose.material3.icons.filled.CalendarMonth,
                    contentDescription = "Date",
                    tint = SanchayColors.TextMutedLight
                )
            }
        },
        colors = OutlinedTextFieldColors(
            defaultColor = SanchayColors.OutlineLight,
            focusedColor = SanchayColors.Primary primary,
            errorColor = SanchayColors.Error primary,
            focusedErrorColor = SanchayColors.Error primary,
        ),
        modifier = modifier
            .padding(
                top = SanchaySpacing.InputPaddingVertical,
                bottom = SanchaySpacing.InputPaddingVertical,
                start = SanchaySpacing.InputPaddingHorizontal,
                end = SanchaySpacing.InputPaddingHorizontal
            ),
        textStyle = SanchayTypography.Body,
    )
}