package com.ivy.ui.component.states

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.ivy.design.system.typography.SanchayTypography

@Composable
private fun SanchayEmptyBase(
    title: String,
    message: String?,
    actionLabel: String?,
    modifier: Modifier = Modifier,
    onAction: (() -> Unit)? = null,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            text = title,
            style = SanchayTypography.Heading2,
            textAlign = TextAlign.Center,
        )
        if (message != null) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = message,
                style = SanchayTypography.Body,
                textAlign = TextAlign.Center,
            )
        }
        if (onAction != null && actionLabel != null) {
            Spacer(modifier = Modifier.height(8.dp))
            TextButton(onClick = onAction) {
                Text(text = actionLabel)
            }
        }
    }
}

@Composable
fun SanchayEmptyTransactionsState(
    message: String? = null,
    modifier: Modifier = Modifier,
    onAction: (() -> Unit)? = null,
) {
    SanchayEmptyBase(
        title = "No transactions yet",
        message = message ?: "Your financial journey starts with your first transaction.",
        actionLabel = "Add First Transaction",
        modifier = modifier,
        onAction = onAction,
    )
}

@Composable
fun SanchayEmptyBudgetsState(
    message: String? = null,
    modifier: Modifier = Modifier,
    onAction: (() -> Unit)? = null,
) {
    SanchayEmptyBase(
        title = "No budgets yet",
        message = message ?: "Set a budget to track your spending limits.",
        actionLabel = "Add First Budget",
        modifier = modifier,
        onAction = onAction,
    )
}

@Composable
fun SanchayEmptyCategoriesState(
    message: String? = null,
    modifier: Modifier = Modifier,
    onAction: (() -> Unit)? = null,
) {
    SanchayEmptyBase(
        title = "No categories yet",
        message = message ?: "Organize your transactions with categories.",
        actionLabel = "Add First Category",
        modifier = modifier,
        onAction = onAction,
    )
}

@Composable
fun SanchayEmptyLoansState(
    message: String? = null,
    modifier: Modifier = Modifier,
    onAction: (() -> Unit)? = null,
) {
    SanchayEmptyBase(
        title = "No loans yet",
        message = message ?: "Manage debt and lending with loan tracking.",
        actionLabel = "Add First Loan",
        modifier = modifier,
        onAction = onAction,
    )
}

@Composable
fun SanchayEmptyAccountsState(
    message: String? = null,
    modifier: Modifier = Modifier,
    onAction: (() -> Unit)? = null,
) {
    SanchayEmptyBase(
        title = "No accounts yet",
        message = message ?: "Add accounts to track your money.",
        actionLabel = "Add First Account",
        modifier = modifier,
        onAction = onAction,
    )
}

@Composable
fun SanchayEmptyGoalState(
    message: String? = null,
    modifier: Modifier = Modifier,
    onAction: (() -> Unit)? = null,
) {
    SanchayEmptyBase(
        title = "No goals yet",
        message = message ?: "Set financial goals to work toward.",
        actionLabel = "Add First Goal",
        modifier = modifier,
        onAction = onAction,
    )
}
