package com.ivy.ui.component.dialogs

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography

@Composable
fun SanchayConfirmationDialog(
    title: String,
    message: String,
    onConfirm: () -> Unit,
    onCancel: () -> Unit = {},
    confirmText: String = "Continue",
    cancelText: String = "Cancel",
    modifier: Modifier = Modifier,
    confirmColor: Boolean = true,
) {
    AlertDialog(
        onDismissRequest = onCancel,
        modifier = modifier,
        title = {
            Text(
                text = title,
                style = SanchayTypography.Heading3,
                color = SanchayColors.TextPrimaryLight
            )
        },
        text = {
            Text(
                text = message,
                style = SanchayTypography.Body,
                color = SanchayColors.TextPrimaryLight
            )
        },
        confirmButton = {
            Button(onClick = onConfirm) {
                Text(text = confirmText)
            }
        },
        dismissButton = {
            TextButton(onClick = onCancel) {
                Text(text = cancelText)
            }
        }
    )
}

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
        confirmColor = false,
        modifier = modifier
    )
}

@Composable
fun SanchayInformationDialog(
    title: String,
    message: String,
    onConfirm: (() -> Unit)? = null,
    confirmText: String = "OK",
    modifier: Modifier = Modifier,
) {
    SanchayConfirmationDialog(
        title = title,
        message = message,
        onConfirm = { onConfirm?.invoke() },
        confirmText = confirmText,
        confirmColor = false,
        modifier = modifier
    )
}

@Composable
fun SanchayBottomSheet(
    title: String?,
    content: @Composable () -> Unit,
    onDismiss: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    Card(modifier = modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(
                vertical = SanchaySpacing.SectionSpacing,
                horizontal = SanchaySpacing.ContentInset
            ),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            if (title != null) {
                Text(
                    text = title,
                    style = SanchayTypography.Heading3,
                    color = SanchayColors.TextPrimaryLight,
                    modifier = Modifier.padding(bottom = SanchaySpacing.ListItemSpacing)
                )
            }
            content()
            TextButton(onClick = onDismiss) {
                Text(text = "Close")
            }
        }
    }
}

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
        content = {
            Column(modifier = Modifier.fillMaxWidth()) {
                if (title != null) {
                    Text(
                        text = title,
                        style = SanchayTypography.Heading3,
                        color = SanchayColors.TextPrimaryLight,
                        modifier = Modifier.padding(bottom = SanchaySpacing.ListItemSpacing)
                    )
                }
                options.forEachIndexed { index, option ->
                    TextButton(
                        onClick = { onOptionSelected(index) },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(text = option)
                    }
                }
            }
        },
        onDismiss = onDismiss,
        modifier = modifier
    )
}
