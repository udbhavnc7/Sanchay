package com.ivy.home

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.Layout
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Icon
import androidx.compose.material3.icons.filled.Check
import androidx.compose.material3.icons.filled.Close
import androidx.compose.material3.outlinetextfield.outlinedTextField
import androidx.compose.material3.textfield.TextFieldValue
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.isActive
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.requestFocus
import androidx.compose.ui.input.keyboard.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.intDp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.style.setOverflow
import androidx.compose.ui.text.textOf
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.semanticsPropertyKey
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.shapes.SanchayShapes
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography
import com.ivy.home.SmartCategorizer
import com.ivy.home.SuggestionConfidence
import com.ivy.home.categorySuggestion
import com.ivy.home.SmartCategorizationResult
import com.ivy.ui.R
import com.ivy.wallet.domain.pure.data.IncomeExpensePair
import com.ivy.wallet.ui.theme.modal.BufferModalData
import com.ivy.base.model.TransactionType
import com.ivy.base.legacy.TransactionType as BaseTransactionType
import kotlinx.collections.immutable.ImmutableList
import java.time.Instant
import java.time.ZoneId
import kotlin.text.isNotBlank
import kotlin.text.trim
import kotlin.text.lowercase
import com.ivy.navigation.navigation
import com.ivy.ui.R
import com.ivy.wallet.domain.pure.data.IncomeExpensePair
import com.ivy.wallet.ui.theme.modal.BufferModalData
import com.ivy.base.model.TransactionType
import com.ivy.base.legacy.TransactionType as BaseTransactionType
import kotlinx.collections.immutable.ImmutableList
import java.time.Instant
import java.time.ZoneId

/**
 * Sanchay Quick Add - Fastest way to capture a financial event.
 * 
 * Opens from Home → + (FAB).
 * Amount is the primary visual element.
 * Three transaction types: Expense, Income, Transfer.
 * Smart defaults from existing application data.
 * 
 * Principle: Recording a financial event should take as little thought and time as possible.
 * 
 * Quick Add captures the minimum required: amount + type.
 * Smart defaults apply: last used account, today's date.
 * Optional details (category, notes) accessible but not forced.
 */
@Composable
fun SanchayQuickAddBottomSheet(
    open: () -> Unit,
    onDismiss: () -> Unit,
    onTransactionSaved: () -> Unit
) {
    val ivyContext = ivyWalletCtx()

    // Quick add state - minimal fields for fast capture
    var quickAddAmount by remember { mutableStateOf("") }
    var quickAddTransactionType by remember { mutableStateOf(TransactionType.EXPENSE) }
    var quickAddAccountId by remember { mutableStateOf<UUID?>(null) }
    var quickAddDescription by remember { mutableStateOf("") }
    var isKeyboardVisible by remember { mutableStateOf(false) }

    // Track sheet state
    var sheetOpen by remember { mutableStateOf(true) }

    // Focus requester for amount field
    val focusRequesterAmount = remember { androidx.compose.ui.focus.FocusRequester() }

    // Get last used account from preferences
    val lastUsedAccount = remember {
        ivyContext.lastUsedAccount
    }

    // Get available accounts
    val availableAccounts = remember {
        ivyContext.baseData.accounts
    }

    // Get first account as default
    val defaultAccount = availableAccounts.firstOrNull()

    // Request focus when sheet opens
    LaunchedEffect(sheetOpen) {
        if (sheetOpen) {
            delay(100)
            focusRequesterAmount.requestFocus()
            // Also try showing soft keyboard
            val imm = androidx.compose.ui.platform.inputMethodManager(
                Modifier.absoluteInsets(0, 0)
            )
            imm?.showSoftInput(focusRequesterAmount, true)
        }
    }

    // Parse amount to BigDecimal for persistence
    val amountBigDecimal by animateFloatAsState {
        quickAddAmount.toDoubleOrNull()?.let { BigDecimal(it) } ?: BigDecimal.ZERO
    }

    // Transaction to persist
    val transactionToPersist = remember {
        com.ivy.data.model.Transaction(
            accountId = quickAddAccountId ?: lastUsedAccount?.id ?: UUID.randomUUID(),
            type = quickAddTransactionType,
            amount = amountBigDecimal,
            title = "",
            description = quickAddDescription,
            dateTime = Instant.now(),
            categoryId = null,
            isSynced = false
        )
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .height(WindowInsets.height - SanchaySpacing.BottomNavItemSize - SanchaySpacing.ContentInset * 2)
            .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.ContentInset),
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Header with close button
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = SanchaySpacing.SectionSpacing),
            arrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            text(
                text = "Add Transaction",
                style = SanchayTypography.Heading3,
                color = SanchayColors.TextPrimaryLight
            )

            IvyIcon(
                icon = Close,
                contentDescription = "Close quick add",
                tint = SanchayColors.TextMutedLight,
                modifier = Modifier.clickable {
                    onDismiss()
                }
            )
        }

        // --- Amount Section (Primary - largest, focused) ---
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(SanchayTypography.HeroFinancial.lineHeight * 2f)
                .padding(bottom = SanchaySpacing.ListItemSpacing),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Start
        ) {
            // Label
            text(
                text = "₹",
                style = SanchayTypography.HeroFinancial,
                color = SanchayColors.TextPrimaryLight,
                margin = androidx.compose.ui.platform.SpacerScope padding 0, 4.dp
            )

            // Amount input - large, focused
            outlinedTextField(
                value = quickAddAmount,
                onValueChange = { quickAddAmount = it },
                label = { /* empty label, amount is enough */ },
                placeholder = "0.00",
                modifier = Modifier
                    .weight(1f)
                    .padding(end = 4.dp),
                keyboardType = KeyboardType.Number,
                capitalize = false,
                routerStyle = true,
                singleLine = true,
                maxLines = 1
            )
        }

        // --- Transaction Type Section ---
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = SanchaySpacing.ListItemSpacing),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            // Expense button
            expenseTypeButton(
                selected = quickAddTransactionType == TransactionType.EXPENSE,
                onClick = { quickAddTransactionType = TransactionType.EXPENSE }
            )

            // Income button
            incomeTypeButton(
                selected = quickAddTransactionType == TransactionType.INCOME,
                onClick = { quickAddTransactionType = TransactionType.INCOME }
            )

            // Transfer button
            transferTypeButton(
                selected = quickAddTransactionType == TransactionType.TRANSFER,
                onClick = { quickAddTransactionType = TransactionType.TRANSFER }
            )
        }

        // --- Account Section (smart default) ---
        if (quickAddTransactionType == TransactionType.TRANSFER) {
            // For transfers, show "From" account
            Row(
                modifier = Modifier.fillMaxWidth().padding(bottom = SanchaySpacing.ListItemSpacing),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                text(
                    text = "From",
                    style = SanchayTypography.Caption,
                    color = SanchayColors.TextSecondaryLight
                )
                text(
                    text = lastUsedAccount?.name ?: "Account",
                    style = SanchayTypography.Body,
                    color = SanchayColors.TextPrimaryLight,
                    overflow = TextOverflow.Ellipsis,
                    maxLines = 1
                )
            }
        } else {
            // For expense/income, show account optionally or omit for truly quick path
            // Show account as subtle text below
            text(
                text = lastUsedAccount?.name ?: "Your account",
                style = SanchayTypography.Caption,
                color = SanchayColors.TextSecondaryLight,
                margin = androidx.compose.ui.platform.SpacerScope padding 0, 4.dp
            )
        }

        // --- Description (optional, collapsed) ---
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = SanchaySpacing.ListItemSpacing),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            text(
                text = "Note (optional)",
                style = SanchayTypography.Caption,
                color = SanchayColors.TextSecondaryLight,
                margin = androidx.compose.ui.platform.SpacerScope padding 0, 4.dp
            )
            outlinedTextField(
                value = quickAddDescription,
                onValueChange = { quickAddDescription = it },
                label = { /* hidden */ },
                placeholder = "Add a note...",
                modifier = Modifier
                    .weight(1f),
                singleLine = true,
                maxLines = 1,
                isReadOnly = true, // Collapsed in quick mode
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text)
            )
        }

        // --- Category Suggestion (smart categorization) ---
        when (val result = categorizeDescription()) {
            is SmartCategorizationResult -> result.shouldShowSuggestion -> {
                SanchayCard(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.XS)
                ) {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        Arrangement.Start
                    ) {
                        text(
                            text = "Suggested",
                            style = SanchayTypography.Body,
                            color = SanchayColors.TextSecondaryLight,
                            margin = androidx.compose.ui.platform.SpacerScope padding 0, 4.dp
                        )

                        text(
                            text = result.suggestion!!.category.name,
                            style = SanchayTypography.Body,
                            color = SanchayColors.TextPrimaryLight,
                            margin = androidx.compose.ui.platform.SpacerScope padding 0, 4.dp
                        )

                        text(
                            text = result.suggestion!!.reason,
                            style = SanchayTypography.Caption,
                            color = SanchayColors.TextMutedLight
                        )
                    }
                }
            }
            else -> Unit
        }

        // --- Save Button ---
        SanchayPrimaryButton(
            onClick = {
                saveTransactionAndDismiss()
                onDismiss()
                onTransactionSaved()
            },
            text = when (quickAddTransactionType) {
                TransactionType.EXPENSE → "Add expense"
                TransactionType.INCOME → "Add income"
                TransactionType.TRANSFER → "Add transfer"
                else → "Save"
            },
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = SanchaySpacing.SectionSpacing)
        )
    }
}

/** Expandable type button */
private fun expenseTypeButton(
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .padding(2.dp)
            .thenIf(selected) {
                .background(
                    SanchayColors.ExpensePrimary,
                    shape = SanchayShapes.Small
                )
                .copy(contentColor = SanchayColors.ExpensePrimaryLight)
            }
            .thenIf(!selected) {
                .border(
                    1.dp,
                    SanchayColors.TextSecondaryLight,
                    shape = SanchayShapes.Small
                )
            }
            .clickable(onClick = onClick)
    ) {
        text(
            text = "Expense",
            style = SanchayTypography.Body.copy(
                fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal
            ),
            color = if (selected) SanchayColors.ExpensePrimaryLight else SanchayColors.TextPrimaryLight
        )
    }
}

private fun incomeTypeButton(
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .padding(2.dp)
            .thenIf(selected) {
                .background(
                    SanchayColors.IncomePrimary,
                    shape = SanchayShapes.Small
                )
                .copy(contentColor = SanchayColors.IncomePrimaryLight)
            }
            .thenIf(!selected) {
                .border(
                    1.dp,
                    SanchayColors.TextSecondaryLight,
                    shape = SanchayShapes.Small
                )
            }
            .clickable(onClick = onClick)
    ) {
        text(
            text = "Income",
            style = SanchayTypography.Body.copy(
                fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal
            ),
            color = if (selected) SanchayColors.IncomePrimaryLight else SanchayColors.TextPrimaryLight
        )
    }
}

private fun transferTypeButton(
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .padding(2.dp)
            .thenIf(selected) {
                .background(
                    SanchayColors.NeutralPrimary,
                    shape = SanchayShapes.Small
                )
                .copy(contentColor = SanchayColors.NeutralPrimaryLight)
            }
            .thenIf(!selected) {
                .border(
                    1.dp,
                    SanchayColors.TextSecondaryLight,
                    shape = SanchayShapes.Small
                )
            }
            .clickable(onClick = onClick)
    ) {
        text(
            text = "Transfer",
            style = SanchayTypography.Body.copy(
                fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal
            ),
            color = if (selected) SanchayColors.NeutralPrimaryLight else SanchayColors.TextPrimaryLight
        )
    }
}

/** Save transaction and show confirmation */
private suspend fun saveTransactionAndDismiss() {
    // Validate: amount must not be empty/zero
    val amountValue = quickAddAmount.toDoubleOrNull()
    if (amountValue == null || amountValue == 0.0) {
        // Show error - amount is required
        return
    }

    // Get the selected category from the suggestion
    val selectedCategory = when (val result = categorizeDescription()) {
        is SmartCategorizationResult -> result.shouldShowSuggestion -> result.suggestion!!.category.id
        else -> null
    }

    // Persist transaction using existing repository
    // Use the existing transaction repository path
    try {
        // Create transaction via the domain layer
        // Use the transaction repository to save
        val transaction = com.ivy.data.model.Transaction(
            accountId = quickAddAccountId ?: lastUsedAccount?.id ?: UUID.randomUUID(),
            type = quickAddTransactionType,
            amount = BigDecimal(amountValue),
            title = "",
            description = quickAddDescription,
            dateTime = Instant.now(),
            categoryId = selectedCategory,
            isSynced = false
        )

        // Save via repository
        ivyContext.transactionRepo.save(transaction)

        // Refresh balance widget
        androidx.compose.ui.platform.sendAndroidEvent(
            android.view.KeyEvent(android.view.KeyEvent.KEYCODE_BACK)
        )

        // Show success state
        // The Home dashboard will update via reactive state
    } catch (e: Exception) {
        // Log error - but don't crash
        e.printStackTrace()
    }
}

/** Categorize the description using smart categorization */
private fun categorizeDescription(): SmartCategorizationResult {
    // Get available categories
    val availableCategories = ivyContext.baseData.accounts.isNotEmpty()
        // In a real implementation, would get categories from the repository
        emptyList() // Placeholder - actual categories from repo

    // Get transaction type
    val transactionType = when (quickAddTransactionType) {
        TransactionType.EXPENSE -> TransactionType.EXPENSE
        TransactionType.INCOME -> TransactionType.INCOME
        TransactionType.TRANSFER -> TransactionType.TRANSFER
        else -> TransactionType.EXPENSE
    }

    // Run smart categorization
    return SmartCategorizer.categorize(
        quickAddDescription,
        transactionType,
        /* categoryRepository */ ivyContext.categoryRepository!!,
        availableCategories
    )
}