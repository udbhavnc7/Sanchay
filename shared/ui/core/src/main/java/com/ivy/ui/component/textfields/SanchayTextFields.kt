package com.ivy.ui.component.textfields

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import com.ivy.design.system.typography.SanchayTypography

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
    keyboardOptions: KeyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
    keyboardActions: KeyboardActions = KeyboardActions(),
    placeholder: String? = null,
    singleLine: Boolean = true,
    maxLines: Int = 1,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChanged,
        modifier = modifier.fillMaxWidth(),
        label = { Text(text = label) },
        placeholder = {
            if (placeholder != null) {
                Text(text = placeholder)
            }
        },
        enabled = enabled,
        readOnly = readOnly,
        isError = isError,
        singleLine = singleLine,
        textStyle = SanchayTypography.Body,
        keyboardOptions = keyboardOptions,
        keyboardActions = keyboardActions
    )
}
