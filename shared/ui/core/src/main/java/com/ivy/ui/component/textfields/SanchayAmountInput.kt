package com.ivy.ui.component.textfields

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import com.ivy.design.system.typography.SanchayTypography

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
    OutlinedTextField(
        value = value,
        onValueChange = onValueChanged,
        modifier = modifier.fillMaxWidth(),
        label = { Text(text = label) },
        placeholder = {
            if (placeholder != null) {
                Text(text = if (showCurrency) "$currency $placeholder" else placeholder)
            }
        },
        enabled = enabled,
        readOnly = readOnly,
        isError = isError,
        singleLine = true,
        textStyle = SanchayTypography.Body,
        keyboardOptions = KeyboardOptions(
            keyboardType = keyboardType,
            imeAction = ImeAction.Done
        )
    )
}

@Composable
fun SanchaySearchInput(
    value: String,
    onValueChanged: (String) -> Unit,
    label: String = "Search",
    enabled: Boolean = true,
    modifier: Modifier = Modifier,
    showClearButton: Boolean = true,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChanged,
        modifier = modifier.fillMaxWidth(),
        label = { Text(text = label) },
        enabled = enabled,
        singleLine = true,
        textStyle = SanchayTypography.Body,
        keyboardOptions = KeyboardOptions(
            keyboardType = KeyboardType.Text,
            imeAction = ImeAction.Search
        )
    )
}

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
    OutlinedTextField(
        value = selectedOption ?: value,
        onValueChange = onValueChanged,
        modifier = modifier.fillMaxWidth(),
        label = { Text(text = label) },
        enabled = enabled,
        readOnly = true,
        singleLine = true,
        textStyle = SanchayTypography.Body,
        keyboardOptions = KeyboardOptions(
            keyboardType = KeyboardType.Text,
            imeAction = ImeAction.Next
        )
    )
}

@Composable
fun SanchayDateInput(
    value: String,
    onValueChanged: (String) -> Unit,
    label: String = "Date",
    enabled: Boolean = true,
    modifier: Modifier = Modifier,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChanged,
        modifier = modifier.fillMaxWidth(),
        label = { Text(text = label) },
        enabled = enabled,
        readOnly = true,
        singleLine = true,
        textStyle = SanchayTypography.Body,
        keyboardOptions = KeyboardOptions(
            keyboardType = KeyboardType.Text,
            imeAction = ImeAction.Next
        )
    )
}
