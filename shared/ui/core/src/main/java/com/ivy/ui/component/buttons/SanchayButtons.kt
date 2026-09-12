package com.ivy.ui.component.buttons

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography

@Composable
fun SanchayPrimaryButton(
    onClick: () -> Unit,
    text: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    Button(
        onClick = onClick,
        modifier = modifier,
        enabled = enabled
    ) {
        Text(text = text, style = SanchayTypography.Button)
    }
}

@Composable
fun SanchaySecondaryButton(
    onClick: () -> Unit,
    text: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier,
        enabled = enabled
    ) {
        Text(text = text, style = SanchayTypography.Button)
    }
}

@Composable
fun SanchayTextButton(
    onClick: () -> Unit,
    text: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    TextButton(
        onClick = onClick,
        modifier = modifier,
        enabled = enabled
    ) {
        Text(text = text, style = SanchayTypography.Button)
    }
}

@Composable
fun SanchayIconButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    content: @Composable () -> Unit,
) {
    IconButton(
        onClick = onClick,
        modifier = modifier,
        enabled = enabled,
        content = content
    )
}

@Composable
fun SanchayFloatingActionButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    content: @Composable () -> Unit = {},
) {
    Button(
        onClick = onClick,
        modifier = modifier.size(SanchaySpacing.FabSize),
        enabled = enabled,
        content = { content() }
    )
}

@Composable
fun SanchayTransactionTypeButton(
    transactionType: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val label = when (transactionType) {
        "Income" -> "Income"
        "Expense" -> "Expense"
        "Transfer" -> "Transfer"
        else -> "Transaction"
    }
    SanchayPrimaryButton(
        onClick = onClick,
        text = label,
        modifier = modifier.fillMaxWidth()
    )
}
