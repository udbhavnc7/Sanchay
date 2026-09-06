package com.ivy.ui.component.lists

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.icons.filled.AccountBalance
import androidx.compose.material3.icons.filled.ArrowDropDown
import androidx.compose.material3.icons.filled.Money
import androidx.compose.material3.icons.filled.TrendingUp
import androidx.compose.material3.icons.filled.TrendingDown
import androidx.compose.material3 outlinetextfield
import androidx.compose.material3.TextButton
import androidx.compose.material3.Chip
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.GraphicsLevel
import androidx.compose.ui.Modifier
import androidx.compose.ui.Unit
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography
import com.ivy.model.core.Transaction

/** Transaction row for lists */
@Composable
fun TransactionRow(
    transaction: Transaction,
    onEdit: () -> Unit = {},
    onDelete: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    var selected by remember { mutableStateOf(false) }

    val (amountStyle, amountColor, amountIcon) = when (transaction.type) {
        TransactionType.Income -> (FinancialAmountStyle.Income, SanchayColors.IncomePrimary, TrendingUp)
        TransactionType.Expense -> (FinancialAmountStyle.Expense, SanchayColors.ExpensePrimary, TrendingDown)
        TransactionType.Transfer -> (FinancialAmountStyle.Neutral, SanchayColors.Neutral primary, AccountBalance)
        else -> (FinancialAmountStyle.Neutral, SanchayColors.TextMutedLight, Money)
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = SanchaySpacing.ListItemSpacing),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            modifier = Modifier.padding(start = SanchaySpacing.ContentInset),
            verticalAlignment = Alignment.CenterVertically,
            arrangement = Arrangement.SpaceBetween
        ) {
            // Left side - description and amount
            Column(
                horizontalArrangement = Arrangement.Start,
                verticalAlignment = Alignment.CenterVertically
            ) {
                text(
                    text = transaction.description,
                    style = SanchayTypography.Body,
                    color = SanchayColors.TextPrimaryLight,
                    overflow = TextOverflow.Ellipsis,
                    maxLines = 1
                )

                text(
                    text = transaction.date,
                    style = SanchayTypography.Caption,
                    color = SanchayColors.TextSecondaryLight,
                    overflow = TextOverflow.Ellipsis,
                    maxLines = 1
                )
            }

            // Amount on right
            FinancialAmount(
                amount = transaction.amount,
                style = amountStyle,
                modifier = Modifier.padding(end = SanchaySpacing.ContentInset)
            )

            // Right side - status indicators
            Row(
                verticalAlignment = Alignment.CenterVertically,
                arrangement = Arrangement.End
            ) {
                Icon(
                    imageVector = amountIcon,
                    contentDescription = "Amount type",
                    tint = amountColor,
                    modifier = Modifier.size(SanchaySpacing.AvatarSizeTiny)
                )

                if (selected) {
                    Icon(
                        imageVector = Check,
                        contentDescription = "Selected",
                        tint = SanchayColors.Primary primary,
                        modifier = Modifier.size(SanchaySpacing.AvatarSizeSmall)
                    )
                }
            }
        }

        // Divider or action buttons
        if (onEdit || onDelete) {
            androidx.compose.material3.Divider(
                color = SanchayColors.DividerLight,
                thickness = SanchaySpacing.DividerHeight
            )

            Row(
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(end = SanchaySpacing.ContentInset)
            ) {
                TextButton(
                    onClick = onEdit,
                    text = "Edit",
                    modifier = Modifier.padding(end = SanchaySpacing.ListItemSpacing)
                )

                TextButton(
                    onClick = onDelete,
                    text = "Delete",
                    colors = androidx.compose.material3.ButtonStyle.TextButtonColors(
                        contentColor = SanchayColors.Error primary
                    )
                )
            }
        }
    }
}

/** Account row for list displays */
@Composable
fun AccountRow(
    accountName: String,
    accountType: String,
    balance: String,
    currency: String = "USD",
    modifier: Modifier = Modifier,
    onToggle: () -> Unit = {},
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = SanchaySpacing.ListItemSpacing),
        verticalAlignment = Alignment.CenterVertically,
        arrangement = Arrangement.SpaceBetween
    ) {
        // Left side - account info
        Column(
            horizontalArrangement = Arrangement.Start,
            verticalAlignment = Alignment.CenterVertically
        ) {
            text(
                text = accountName,
                style = SanchayTypography.Body,
                color = SanchayColors.TextPrimaryLight,
                overflow = TextOverflow.Ellipsis,
                maxLines = 1
            )

            text(
                text = accountType,
                style = SanchayTypography.Caption,
                color = SanchayColors.TextSecondaryLight,
                overflow = TextOverflow.Ellipsis,
                maxLines = 1
            )
        }

        // Balance on right
        Column(
            horizontalArrangement = Arrangement.End,
            verticalAlignment = Alignment.CenterVertically
        ) {
            text(
                text = "$balance $currency",
                style = SanchayTypography.NumericalLarge,
                color = SanchayColors.TextPrimaryLight
            )

            AccountStatusIndicator(
                isActive = accountName != "Inactive",
                modifier = Modifier.padding(top = SanchaySpacing.XS)
            )
        }
    }
}

/** Category row */
@Composable
fun CategoryRow(
    categoryName: String,
    icon: androidx.compose.ui.graphics.Bitmap?,
    transactionCount: Int,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = SanchaySpacing.ListItemSpacing),
        verticalAlignment = Alignment.CenterVertically,
        arrangement = Arrangement.SpaceBetween
    ) {
        // Category with icon
        Row(
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (icon != null) {
                androidx.compose.ui.Image(
                    painter = androidx.compose.ui painter = androidx.compose.ui.graphics.vector.VectorPainter(icon),
                    contentDescription = categoryName,
                    contentScale = androidx.compose.ui.unit.ContentScale.Fill,
                    modifier = Modifier
                        .size(SanchaySpacing.AvatarSizeSmall)
                        .padding(end = SanchaySpacing.ListItemSpacing)
                )
            } else {
                androidx.compose.material3.Icon(
                    imageVector = AccountBalance,
                    contentDescription = categoryName,
                    tint = SanchayColors.TextMutedLight,
                    modifier = Modifier
                        .size(SanchaySpacing.AvatarSizeSmall)
                        .padding(end = SanchaySpacing.ListItemSpacing)
                )
            }

            text(
                text = categoryName,
                style = SanchayTypography.Body,
                color = SanchayColors.TextPrimaryLight,
                overflow = TextOverflow.Ellipsis,
                maxLines = 1
            )
        }

        // Transaction count
        text(
            text = "$transactionCount transactions",
            style = SanchayTypography.Caption,
            color = SanchayColors.TextSecondaryLight
        )
    }
}

/** Upcoming payment row */
@Composable
fun UpcomingPaymentRow(
    payee: String,
    amount: String,
    dueDate: String,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = SanchaySpacing.ListItemSpacing),
        verticalAlignment = Alignment.CenterVertically,
        arrangement = Arrangement.SpaceBetween
    ) {
        // Left - payee and date
        Column(
            horizontalArrangement = Arrangement.Start,
            verticalAlignment = Alignment.CenterVertically
        ) {
            text(
                text = payee,
                style = SanchayTypography.Body,
                color = SanchayColors.TextPrimaryLight,
                overflow = TextOverflow.Ellipsis,
                maxLines = 1
            )

            text(
                text = dueDate,
                style = SanchayTypography.Caption,
                color = SanchayColors.TextSecondaryLight,
                overflow = TextOverflow.Ellipsis,
                maxLines = 1
            )
        }

        // Amount on right
        FinancialAmount(
            amount = amount,
            style = FinancialAmountStyle.Expense,
            modifier = Modifier.padding(end = SanchaySpacing.ContentInset)
        )
    }
}

/** Goal row */
@Composable
fun GoalRow(
    goalName: String,
    progress: Float,
    targetAmount: String,
    currentAmount: String,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = SanchaySpacing.ListItemSpacing),
        verticalAlignment = Alignment.CenterVertically,
        arrangement = Arrangement.SpaceBetween
    ) {
        // Left - goal info
        Column(
            horizontalArrangement = Arrangement.Start,
            verticalAlignment = Alignment.CenterVertically
        ) {
            text(
                text = goalName,
                style = SanchayTypography.Body,
                color = SanchayColors.TextPrimaryLight,
                overflow = TextOverflow.Ellipsis,
                maxLines = 1
            )

            FinancialProgress(
                progress = progress,
                label = "Progress",
                target = targetAmount,
                showPercentage = true,
                modifier = Modifier.padding(top = SanchaySpacing.XS)
            )
        }

        // Right - current amount
        Column(
            horizontalArrangement = Arrangement.End,
            verticalAlignment = Alignment.CenterVertically
        ) {
            text(
                text = currentAmount,
                style = SanchayTypography.NumericalLarge,
                color = SanchayColors.TextPrimaryLight
            )
        }
    }
}