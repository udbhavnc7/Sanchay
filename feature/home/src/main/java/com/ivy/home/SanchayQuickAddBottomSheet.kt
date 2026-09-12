package com.ivy.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.shapes.Small
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography
import com.ivy.base.model.TransactionType
import com.ivy.ui.component.buttons.SanchayPrimaryButton
import com.ivy.ui.component.cards.SanchayCard
import java.math.BigDecimal
import java.util.UUID

@Composable
fun SanchayQuickAddBottomSheet(
    open: () -> Unit,
    onDismiss: () -> Unit,
    onTransactionSaved: () -> Unit
) {
    var quickAddAmount by remember { mutableStateOf("") }
    var quickAddTransactionType by remember { mutableStateOf(TransactionType.EXPENSE) }
    var quickAddAccountId by remember { mutableStateOf<UUID?>(null) }
    var quickAddDescription by remember { mutableStateOf("") }

    val lastUsedAccountName = "Your account"

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .height(400.dp)
            .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.ContentInset),
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = SanchaySpacing.SectionSpacing),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Add Transaction",
                style = SanchayTypography.Heading3,
                color = SanchayColors.TextPrimaryLight
            )

            Icon(
                imageVector = Icons.Filled.Close,
                contentDescription = "Close quick add",
                tint = SanchayColors.TextMutedLight,
                modifier = Modifier.padding(8.dp)
            )
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(96.dp)
                .padding(bottom = SanchaySpacing.ListItemSpacing),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Start
        ) {
            Text(
                text = "\u20B9",
                style = SanchayTypography.HeroFinancial,
                color = SanchayColors.TextPrimaryLight
            )

            OutlinedTextField(
                value = quickAddAmount,
                onValueChange = { quickAddAmount = it },
                label = { },
                placeholder = { Text("0.00") },
                modifier = Modifier
                    .weight(1f)
                    .padding(end = 4.dp),
                singleLine = true
            )
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = SanchaySpacing.ListItemSpacing),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            expenseTypeButton(
                selected = quickAddTransactionType == TransactionType.EXPENSE,
                onClick = { quickAddTransactionType = TransactionType.EXPENSE }
            )
            incomeTypeButton(
                selected = quickAddTransactionType == TransactionType.INCOME,
                onClick = { quickAddTransactionType = TransactionType.INCOME }
            )
            transferTypeButton(
                selected = quickAddTransactionType == TransactionType.TRANSFER,
                onClick = { quickAddTransactionType = TransactionType.TRANSFER }
            )
        }

        if (quickAddTransactionType == TransactionType.TRANSFER) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(bottom = SanchaySpacing.ListItemSpacing),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "From",
                    style = SanchayTypography.Caption,
                    color = SanchayColors.TextSecondaryLight
                )
                Text(
                    text = lastUsedAccountName,
                    style = SanchayTypography.Body,
                    color = SanchayColors.TextPrimaryLight,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        } else {
            Text(
                text = lastUsedAccountName,
                style = SanchayTypography.Caption,
                color = SanchayColors.TextSecondaryLight
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = SanchaySpacing.ListItemSpacing),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "Note (optional)",
                style = SanchayTypography.Caption,
                color = SanchayColors.TextSecondaryLight
            )
            OutlinedTextField(
                value = quickAddDescription,
                onValueChange = { quickAddDescription = it },
                label = { },
                placeholder = { Text("Add a note...") },
                modifier = Modifier.weight(1f),
                singleLine = true
            )
        }

        val result = categorizeDescription(quickAddDescription, quickAddTransactionType)
        if (result.shouldShowSuggestion && result.suggestion != null) {
            SanchayCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.ListItemSpacing)
            ) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.Top
                ) {
                    Text(
                        text = "Suggested",
                        style = SanchayTypography.Body,
                        color = SanchayColors.TextSecondaryLight
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = result.suggestion.category.name.toString(),
                        style = SanchayTypography.Body,
                        color = SanchayColors.TextPrimaryLight
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = result.suggestion.reason,
                        style = SanchayTypography.Caption,
                        color = SanchayColors.TextMutedLight
                    )
                }
            }
        }

        SanchayPrimaryButton(
            onClick = {
                onDismiss()
                onTransactionSaved()
            },
            text = when (quickAddTransactionType) {
                TransactionType.EXPENSE -> "Add expense"
                TransactionType.INCOME -> "Add income"
                TransactionType.TRANSFER -> "Add transfer"
                else -> "Save"
            },
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = SanchaySpacing.SectionSpacing)
        )
    }
}

@Composable
private fun expenseTypeButton(
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .padding(2.dp)
            .let { mod ->
                if (selected) mod.background(SanchayColors.Expense.primary, shape = Small)
                else mod.border(1.dp, SanchayColors.TextSecondaryLight, shape = Small)
            }
    ) {
        Text(
            text = "Expense",
            style = SanchayTypography.Body.copy(
                fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal
            ),
            color = if (selected) SanchayColors.Expense.light else SanchayColors.TextPrimaryLight
        )
    }
}

@Composable
private fun incomeTypeButton(
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .padding(2.dp)
            .let { mod ->
                if (selected) mod.background(SanchayColors.Income.primary, shape = Small)
                else mod.border(1.dp, SanchayColors.TextSecondaryLight, shape = Small)
            }
    ) {
        Text(
            text = "Income",
            style = SanchayTypography.Body.copy(
                fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal
            ),
            color = if (selected) SanchayColors.Income.light else SanchayColors.TextPrimaryLight
        )
    }
}

@Composable
private fun transferTypeButton(
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .padding(2.dp)
            .let { mod ->
                if (selected) mod.background(SanchayColors.Neutral.primary, shape = Small)
                else mod.border(1.dp, SanchayColors.TextSecondaryLight, shape = Small)
            }
    ) {
        Text(
            text = "Transfer",
            style = SanchayTypography.Body.copy(
                fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal
            ),
            color = if (selected) SanchayColors.Neutral.light else SanchayColors.TextPrimaryLight
        )
    }
}

private fun categorizeDescription(
    description: String,
    transactionType: TransactionType
): SmartCategorizationResult {
    return SmartCategorizationResult(
        suggestion = null,
        allCategories = kotlinx.collections.immutable.persistentListOf(),
        shouldShowSuggestion = false,
        userCanOverride = true
    )
}
