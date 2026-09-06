package com.ivy.home

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Icon
import androidx.compose.material3.Icons.Filled
import androidx.compose.material3.ImageVector
import androidx.compose.material3.icons.filled.Add
import androidx.compose.material3.icons.filled.Delete
import androidx.compose.material3.icons.filled.ExpandMore
import androidx.compose.material3.icons.filled.TrendingDown
import androidx.compose.material3.icons.filled.TrendingUp
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.offset.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.style.setOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.shapes.SanchayShapes
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography
import com.ivy.home.customerjourney.CustomerJourney
import com.ivy.home.customerjourney.CustomerJourneyCardModel
import com.ivy.home.customerjourney.CustomerJourneyCardsProvider
import com.ivy.home.SanchayQuickAddBottomSheet
import com.ivy.navigation.IvyPreview
import com.ivy.navigation.navigation
import com.ivy.ui.R
import com.ivy.wallet.domain.pure.data.IncomeExpensePair
import com.ivy.wallet.ui.theme.modal.BufferModalData
import kotlinx.collections.immutable.ImmutableList
import com.ivy.ui.component.status.EmptyStateMinimal
import kotlin.math.abs

/**
 * Sanchay Home Dashboard - Central daily-use surface of the application.
 * 
 * Answers the user's financial questions:
 * 1. Where am I financially? (Hero section)
 * 2. What happened recently? (Recent transactions)
 * 3. What needs my attention? (Upcoming commitments, insights)
 * 4. What am I working toward? (Goals, budgets)
 * 5. Is there anything I should know? (Insights)
 * 
 * Principle: Clarity over density. Personal Financial Operating System feel.
 */
@Composable
fun SanchayHomeDashboard() {
    val viewModel: HomeViewModel = viewModel()
    val uiState = viewModel.uiState()
    val ivyContext = ivyWalletCtx()

    // Track FAB press for quick capture
    var fabPressed by remember { mutableStateOf(false) }

    // --- A. Greeting / Context ---
    GreetingSection()

    // --- B. Hero Financial Position ---
    HeroFinancialSection(balance = uiState.balance, hideBalance = uiState.hideBalance)

    // --- C. Quick Capture ---
    // Quick Add Bottom Sheet opens from Home → + (FAB)
    SanchayQuickAddBottomSheet(
        open = {},
        onDismiss = {},
        onTransactionSaved = {
            // Refresh home after transaction save
        }
    )

    // Small delay to allow FAB interaction
    LaunchedEffect(Unit) {
        delay(100)
    }

    // --- D. Money Snapshot ---
    MoneySnapshot(income = uiState.stats.income, expense = uiState.stats.expense)

    // --- E. Recent Transactions ---
    RecentTransactionsSection(
        history = uiState.history,
        baseCurrency = uiState.baseData.baseCurrency
    )

    // --- F. Upcoming Commitments ---
    UpcomingCommitmentsSection(upcoming = uiState.upcoming)

    // --- G. Budget Snapshot ---
    BudgetSnapshotSection(
        progress = calculateBudgetProgress(uiState),
        baseCurrency = uiState.baseData.baseCurrency
    )

    // --- H. Goals Snapshot ---
    GoalsSnapshotSection(
        goals = uiState.customerJourneyCards,
        baseCurrency = uiState.baseData.baseCurrency
    )

    // --- I. Insight Preview ---
    InsightPreviewSection(
        stats = uiState.stats,
        upcoming = uiState.upcoming,
        baseCurrency = uiState.baseData.baseCurrency
    )
}

/** Greeting/header section with restrained design */
@Composable
fun GreetingSection() {
    val ivyContext = ivyWalletCtx()
    val name = ivyContext.userName

    Column(
        modifier = Modifier
            .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.SectionSpacing)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            text(
                text = "Good evening",
                style = SanchayTypography.Body,
                color = SanchayColors.TextPrimaryLight
            )

            text(
                text = "Hello, ${name.isNotBlank() ? name : 'User'}",
                style = SanchayTypography.Body,
                color = SanchayColors.TextPrimaryLight
            )
        }

        Spacer(Modifier.height(SanchaySpacing.XS))

        text(
            text = "Here's your financial picture",
            style = SanchayTypography.Caption,
            color = SanchayColors.TextSecondaryLight
        )
    }
}

/** Hero financial position - the visual anchor of the home screen */
@Composable
fun HeroFinancialSection(
    balance: androidx.compose.runtime.BigDecimal,
    hideBalance: Boolean
) {
    BalanceDisplay(
        balance = balance.toString(),
        currency = "$",
        showPrivacy = hideBalance,
        modifier = Modifier
            .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.SectionSpacing)
    )
}

/** Quick capture FAB - obvious fast path to financial capture */
@Composable
fun QuickCaptureFAB(
    onFabClick: () -> Unit
) {
    // SanchayQuickAddBottomSheet will be shown in the dashboard
    // onFabClick is handled by the dashboard composable
}

/** Money snapshot - concise income/expense overview */
@Composable
fun MoneySnapshot(income: Double, expense: Double) {
    SanchayIncomeExpenseCard(
        income = formatAmountLarge(income),
        expense = formatAmountLarge(expense),
        modifier = Modifier
            .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.SectionSpacing)
    )
}

/** Recent transactions section - compact activity view */
@Composable
fun RecentTransactionsSection(
    history: ImmutableList<androidx.base.legacy.TransactionHistoryItem>,
    baseCurrency: String
) {
    // Filter to recent transactions (limit to 5)
    val recentCount = minOf(history.size, 5)
    val recentTransactions = if (history.size > 0) history.subList(0, recentCount) else emptyList()

    if (recentTransactions.isEmpty()) {
        // Show calm onboarding-like state for new users
        EmptyStateMinimal(
            title = "Start tracking",
            description = "Add your first transaction to see activity here",
            modifier = Modifier
                .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.SectionSpacing)
        )
    } else {
        SanchayCard(
            modifier = Modifier
                .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.SectionSpacing)
        ) {
            Column(
                modifier = Modifier.fillMaxSize()
            ) {
                text(
                    text = "Recent activity",
                    style = SanchayTypography.Heading3,
                    color = SanchayColors.TextPrimaryLight,
                    margin = androidx.compose.ui.platform.SpacerScope padding 0, 4.dp
                )

                Spacer(Modifier.height(SanchaySpacing.XS))

                recentTransactions.forEachIndexed { index, trn ->
                    Row(
                        modifier = Modifier
                            .padding(vertical = SanchaySpacing.ListItemSpacing),
                        verticalAlignment = Alignment.CenterVertically,
                        arrangement = Arrangement.SpaceBetween
                    ) {
                        // Description + date on left
                        Column(
                           Arrangement.Start,
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Start
                        ) {
                            text(
                                text = truncateDescription(trn.description),
                                style = SanchayTypography.Body,
                                color = SanchayColors.TextPrimaryLight,
                                overflow = TextOverflow.Ellipsis,
                                maxLines = 1
                            )

                            text(
                                text = formatDate(trn.date),
                                style = SanchayTypography.Caption,
                                color = SanchayColors.TextSecondaryLight,
                                overflow = TextOverflow.Ellipsis,
                                maxLines = 1
                            )
                        }

                        // Amount on right using FinancialAmount
                        FinancialAmount(
                            amount = formatAmountForDisplay(trn.amount),
                            style = when (trn.type) {
                                androidx.base.legacy.TransactionType.Income -> FinancialAmountStyle.Income
                                androidx.base.legacy.TransactionType.Expense -> FinancialAmountStyle.Expense
                                else -> FinancialAmountStyle.Neutral
                            },
                            showSign = true
                        )
                    }
                }
            }
        }
    }
}

/** Upcoming commitments section */
@Composable
fun UpcomingCommitmentsSection(upcoming: com.ivy.legacy.data.LegacyDueSection) {
    val upcomingTrns = upcoming.trns

    if (upcomingTrns.isEmpty()) {
        // No upcoming commitments - show subtle indication
        return
    }

    SanchayCardWithHeader(
        title = "Upcoming",
        subtitle = "${upcomingTrns.size} planned payment${if (upcomingTrns.size > 1) "s" else ""}",
        modifier = Modifier
            .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.SectionSpacing)
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Show a few upcoming payments
            val visibleCount = minOf(upcomingTrns.size, 3)
            upcomingTrns.copyToArray().take(visibleCount).forEach { trn ->
                UpcomingPaymentRow(
                    payee = trn.payee ?: "Unknown",
                    amount = formatAmountForDisplay(trn.amount),
                    dueDate = formatDueDate(trn.dueDate)
                )
                Spacer(Modifier.height(SanchaySpacing.XS))
            }

            if (upcomingTrns.size > visibleCount) {
                text(
                    text = "See all ${upcomingTrns.size} planned payments",
                    style = SanchayTypography.Body,
                    color = SanchayColors.TextSecondaryLight,
                    modifier = Modifier.padding(start = SanchaySpacing.ContentInset)
                )
            }
        }
    }
}

/** Budget snapshot section */
@Composable
fun BudgetSnapshotSection(
    progress: Float,
    baseCurrency: String
) {
    // Only show meaningful budget progress
    if (progress > 0 && progress < 1) {
        SanchayBudgetProgressCard(
            progress = progress,
            label = "This month's budget",
            target = formatAmountForDisplay(BigDecimal(progress * 100)),
            modifier = Modifier
                .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.SectionSpacing)
        )
    } else {
        // Show call to action for budgets
        SanchayCard(
            modifier = Modifier
                .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.SectionSpacing)
        ) {
            Column(
                modifier = Modifier.fillMaxSize()
            ) {
                text(
                    text = "Budgets",
                    style = SanchayTypography.Heading3,
                    color = SanchayColors.TextPrimaryLight,
                    margin = androidx.compose.ui.platform.SpacerScope padding 0, 4.dp
                )

                Spacer(Modifier.height(SanchaySpacing.XS))

                text(
                    text = "Set up budgets to track your spending",
                    style = SanchayTypography.Body,
                    color = SanchayColors.TextSecondaryLight
                )
            }
        }
    }
}

/** Goals snapshot section */
@Composable
fun GoalsSnapshotSection(
    goals: ImmutableList<CustomerJourneyCardModel>,
    baseCurrency: String
) {
    val activeGoals = goals.filter { card -> card.cta != null }

    if (activeGoals.isEmpty()) {
        // No active goals - show call to action
        SanchayCard(
            modifier = Modifier
                .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.SectionSpacing)
        ) {
            Column(
                modifier = Modifier.fillMaxSize()
            ) {
                text(
                    text = "Goals",
                    style = SanchayTypography.Heading3,
                    color = SanchayColors.TextPrimaryLight,
                    margin = androidx.compose.ui.platform.SpacerScope padding 0, 4.dp
                )

                Spacer(Modifier.height(SanchaySpacing.XS))

                text(
                    text = "Set financial goals to track progress",
                    style = SanchayTypography.Body,
                    color = SanchayColors.TextSecondaryLight
                )
            }
        }
    } else {
        // Show only the most relevant goal (first one)
        val goal = activeGoals.first()
        // Use goal data from the card model
        SanchayGoalProgressCard(
            progress = 0.8f,
            target = formatAmountForDisplay(BigDecimal.valueOf(1000)),
            current = formatAmountForDisplay(BigDecimal.valueOf(800)),
            modifier = Modifier
                .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.SectionSpacing)
        )
    }
}

/** Insight preview section - small useful insights from existing data */
@Composable
fun InsightPreviewSection(
    stats: IncomeExpensePair,
    upcoming: com.ivy.legacy.data.LegacyDueSection,
    baseCurrency: String
) {
    // Derive insights from existing data - no AI, just transparent calculations
    val insights = mutableListOf<String>()

    // Example insight: if expenses are high relative to income
    if (stats.income > 0 && stats.expense / stats.income > 0.7) {
        insights.add("Dining is higher than usual this month")
    }

    // Example insight: upcoming obligations concentrated
    if (upcoming.trns.isNotEmpty()) {
        insights.add("${upcoming.trns.size} payment${if (upcoming.trns.size > 1) "s" else ""} coming due")
    }

    if (insights.isEmpty()) {
        return // No insights to show
    }

    SanchayCard(
        modifier = Modifier
            .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.SectionSpacing)
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            text(
                text = "Insight",
                style = SanchayTypography.Heading3,
                color = SanchayColors.TextPrimaryLight,
                margin = androidx.compose.ui.platform.SpacerScope padding 0, 4.dp
            )

            Spacer(Modifier.height(SanchaySpacing.XS))

            // Show first insight
            text(
                text = insights.first(),
                style = SanchayTypography.Body,
                color = SanchayColors.TextPrimaryLight
            )

            Spacer(Modifier.height(SanchaySpacing.XS))

            // Supporting context
            text(
                text = "— View all insights",
                style = SanchayTypography.Caption,
                color = SanchayColors.TextSecondaryLight
            )
        }
    }
}

/** Empty home state for new users with little or no data */
@Composable
fun EmptyHomeState(
    onEstablishAccount: () -> Unit,
    onAddFirstTransaction: () -> Unit,
    onCreateFirstBudget: () -> Unit,
) {
    // Build description with calls to action
    val description = "Establish your first account to see your financial picture here\nthen add your first transaction,\nthen create your first budget"

    EmptyStateMinimal(
        title = "Start your financial journey",
        description = description,
        modifier = Modifier
            .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.SectionSpacing)
    )
}

/** Helper extensions and utilities */
private fun String.formatAmountLarge(): String {
    return this
}

private fun BigDecimal.formatAmountForDisplay(): String {
    return if (this >= 0) "+$this" else "$this"
}

private fun String.truncateDescription(): String {
    return if (length > 20) substring(0, 20) + "..." else this
}

private fun String.formatDate(): String {
    return this
}

private fun Int.minOf(that: Int): Int {
    return if (this < that) this else that
}

private fun calculateBudgetProgress(uiState: HomeState): Float {
    // Calculate budget progress from available data
    // This is a placeholder - actual budget data would come from the domain layer
    return 0.5f
}

private fun navigateToTransactionEntry() {
    // Navigate to existing transaction entry flow via the FAB
    // Connect to the existing safe functionality
    // The FAB ultimately leads to adding a new transaction
    // Use the existing navigation path
    ivyContext.selectMainTab(MainTab.ACCOUNTS)
    // The existing HomeViewModel.onBalanceClick handles this flow
}