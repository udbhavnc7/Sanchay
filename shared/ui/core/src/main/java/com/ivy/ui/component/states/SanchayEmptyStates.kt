package com.ivy.ui.component.states

import androidx.compose.foundation.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.Arrangement.Center
import androidx.compose.material3.Icon
import androidx.compose.material3.icons.filled.ContentAdd
import androidx.compose.material3.icons.filled.Budget
import androidx.compose.material3.icons.filled.Category
import androidx.compose.material3.icons.filled.Loan
import androidx.compose.material3.icons.filled.AccountBalance
import androidx.compose.material3.icons.filled.Target
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.Unit
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography

/**
 * Sanchay Empty State components
 * 
 * Displayed when no data exists for a given section.
 * Principle: Clarity over decoration - users should immediately
 * understand the state and take action if needed.
 */
@Composable
fun SanchayEmptyTransactionsState(
    onAddTransaction: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(SanchaySpacing.AvatarSizeLarge)
                .align(Alignment.Center)
        ) {
            Icon(
                imageVector = ContentAdd,
                contentDescription = "Add transaction",
                tint = SanchayColors.TextMutedLight
            )
        }

        Column(
            modifier = Modifier.padding(vertical = SanchaySpacing.ListItemSpacing),
            horizontalArrangement = Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            text(
                text = "No transactions yet",
                style = SanchayTypography.Heading2,
                color = SanchayColors.TextPrimaryLight,
                textAlign = TextAlign.Center
            )

            text(
                text = "Your financial journey starts with your first transaction.\nRecord income, expenses, or transfers to get started.",
                style = SanchayTypography.Body,
                color = SanchayColors.TextSecondaryLight,
                textAlign = TextAlign.Center,
                margin = androidx.compose.ui.platform.SpacerScope padding 8.dp
            )

            androidx.compose.material3.TextButton(
                onClick = onAddTransaction,
                text = "Add First Transaction"
            )
        }
    }
}

@Composable
fun SanchayEmptyBudgetsState(
    onAddBudget: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(SanchaySpacing.AvatarSizeLarge)
                .align(Alignment.Center)
        ) {
            Icon(
                imageVector = Budget,
                contentDescription = "Add budget",
                tint = SanchayColors.TextMutedLight
            )
        }

        Column(
            modifier = Modifier.padding(vertical = SanchaySpacing.ListItemSpacing),
            horizontalArrangement = Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            text(
                text = "No budgets yet",
                style = SanchayTypography.Heading2,
                color = SanchayColors.TextPrimaryLight,
                textAlign = TextAlign.Center
            )

            text(
                text = "Set a budget to track your spending limits.\nDefine amounts and categories to stay on track financially.",
                style = SanchayTypography.Body,
                color = SanchayColors.TextSecondaryLight,
                textAlign = TextAlign.Center,
                margin = androidx.compose.ui.platform.SpacerScope padding 8.dp
            )

            androidx.compose.material3.TextButton(
                onClick = onAddBudget,
                text = "Add First Budget"
            )
        }
    }
}

@Composable
fun SanchayEmptyCategoriesState(
    onAddCategory: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(SanchaySpacing.AvatarSizeLarge)
                .align(Alignment.Center)
        ) {
            Icon(
                imageVector = Category,
                contentDescription = "Add category",
                tint = SanchayColors.TextMutedLight
            )
        }

        Column(
            modifier = Modifier.padding(vertical = SanchaySpacing.ListItemSpacing),
            horizontalArrangement = Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            text(
                text = "No categories yet",
                style = SanchayTypography.Heading2,
                color = SanchayColors.TextPrimaryLight,
                textAlign = TextAlign.Center
            )

            text(
                text = "Organize your transactions with categories.\nCreate categories for income, expenses, and transfers.",
                style = SanchayTypography.Body,
                color = SanchayColors.TextSecondaryLight,
                textAlign = TextAlign.Center,
                margin = androidx.compose.ui.platform.SpacerScope padding 8.dp
            )

            androidx.compose.material3.TextButton(
                onClick = onAddCategory,
                text = "Add First Category"
            )
        }
    }
}

@Composable
fun SanchayEmptyLoansState(
    onAddLoan: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(SanchaySpacing.AvatarSizeLarge)
                .align(Alignment.Center)
        ) {
            Icon(
                imageVector = Loan,
                contentDescription = "Add loan",
                tint = SanchayColors.TextMutedLight
            )
        }

        Column(
            modifier = Modifier.padding(vertical = SanchaySpacing.ListItemSpacing),
            horizontalArrangement = Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            text(
                text = "No loans yet",
                style = SanchayTypography.Heading2,
                color = SanchayColors.TextPrimaryLight,
                textAlign = TextAlign.Center
            )

            text(
                text = "Manage debt and lending with loan tracking.\nAdd loans to monitor balances and interest over time.",
                style = SanchayTypography.Body,
                color = SanchayColors.TextSecondaryLight,
                textAlign = TextAlign.Center,
                margin = androidx.compose.ui.platform.SpacerScope padding 8.dp
            )

            androidx.compose.material3.TextButton(
                onClick = onAddLoan,
                text = "Add First Loan"
            )
        }
    }
}

@Composable
fun SanchayEmptyAccountsState(
    onAddAccount: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(SanchaySpacing.AvatarSizeLarge)
                .align(Alignment.Center)
        ) {
            Icon(
                imageVector = AccountBalance,
                contentDescription = "Add account",
                tint = SanchayColors.TextMutedLight
            )
        }

        Column(
            modifier = Modifier.padding(vertical = SanchaySpacing.ListItemSpacing),
            horizontalArrangement = Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            text(
                text = "No accounts yet",
                style = SanchayTypography.Heading2,
                color = SanchayColors.TextPrimaryLight,
                textAlign = TextAlign.Center
            )

            text(
                text = "Add accounts to track your money across different currencies.\nSet up accounts for cash, bank, crypto, and more.",
                style = SanchayTypography.Body,
                color = SanchayColors.TextSecondaryLight,
                textAlign = TextAlign.Center,
                margin = androidx.compose.ui.platform.SpacerScope padding 8.dp
            )

            androidx.compose.material3.TextButton(
                onClick = onAddAccount,
                text = "Add First Account"
            )
        }
    }
}

@Composable
fun SanchayEmptyGoalState(
    onAddGoal: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(SanchaySpacing.AvatarSizeLarge)
                .align(Alignment.Center)
        ) {
            Icon(
                imageVector = Target,
                contentDescription = "Add goal",
                tint = SanchayColors.TextMutedLight
            )
        }

        Column(
            modifier = Modifier.padding(vertical = SanchaySpacing.ListItemSpacing),
            horizontalArrangement = Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            text(
                text = "No goals yet",
                style = SanchayTypography.Heading2,
                color = SanchayColors.TextPrimaryLight,
                textAlign = TextAlign.Center
            )

            text(
                text = "Set financial goals to work toward.\nCreate savings goals, investment targets, or debt payoff objectives.",
                style = SanchayTypography.Body,
                color = SanchayColors.TextSecondaryLight,
                textAlign = TextAlign.Center,
                margin = androidx.compose.ui.platform.SpacerScope padding 8.dp
            )

            androidx.compose.material3.TextButton(
                onClick = onAddGoal,
                text = "Add First Goal"
            )
        }
    }
}