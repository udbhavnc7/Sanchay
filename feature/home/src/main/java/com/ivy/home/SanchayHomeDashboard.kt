package com.ivy.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.ivy.base.legacy.TransactionHistoryItem
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography
import com.ivy.home.customerjourney.CustomerJourneyCardModel
import com.ivy.legacy.data.LegacyDueSection
import com.ivy.ui.component.cards.SanchayBudgetProgressCard
import com.ivy.ui.component.cards.SanchayCard
import com.ivy.ui.component.cards.SanchayCardWithHeader
import com.ivy.ui.component.cards.SanchayGoalProgressCard
import com.ivy.ui.component.cards.SanchayIncomeExpenseCard
import com.ivy.ui.component.financial.BalanceDisplay
import com.ivy.ui.component.financial.FinancialAmount
import com.ivy.ui.component.financial.FinancialAmountStyle
import com.ivy.ui.component.status.EmptyStateMinimal
import com.ivy.wallet.domain.pure.data.IncomeExpensePair
import kotlinx.collections.immutable.ImmutableList
import java.math.BigDecimal

@Composable
fun SanchayHomeDashboard() {
    val viewModel: HomeViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
    val uiState = viewModel.uiState()

    var fabPressed by remember { mutableStateOf(false) }

    GreetingSection()

    HeroFinancialSection(balance = uiState.balance, hideBalance = uiState.hideBalance)

    SanchayQuickAddBottomSheet(
        open = {},
        onDismiss = {},
        onTransactionSaved = {}
    )

    MoneySnapshot(income = uiState.stats.income, expense = uiState.stats.expense)

    RecentTransactionsSection(
        history = uiState.history,
        baseCurrency = uiState.baseData.baseCurrency
    )

    UpcomingCommitmentsSection(upcoming = uiState.upcoming)

    BudgetSnapshotSection(
        progress = calculateBudgetProgress(uiState),
        baseCurrency = uiState.baseData.baseCurrency
    )

    GoalsSnapshotSection(
        goals = uiState.customerJourneyCards,
        baseCurrency = uiState.baseData.baseCurrency
    )

    InsightPreviewSection(
        stats = uiState.stats,
        upcoming = uiState.upcoming,
        baseCurrency = uiState.baseData.baseCurrency
    )
}

@Composable
fun GreetingSection() {
    val name = "User"

    Column(
        modifier = Modifier
            .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.SectionSpacing)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "Good evening",
                style = SanchayTypography.Body,
                color = SanchayColors.TextPrimaryLight
            )

            Text(
                text = "Hello, ${if (name.isNotBlank()) name else "User"}",
                style = SanchayTypography.Body,
                color = SanchayColors.TextPrimaryLight
            )
        }

        Spacer(Modifier.height(4.dp))

        Text(
            text = "Here\u2019s your financial picture",
            style = SanchayTypography.Caption,
            color = SanchayColors.TextSecondaryLight
        )
    }
}

@Composable
fun HeroFinancialSection(
    balance: BigDecimal,
    hideBalance: Boolean
) {
    BalanceDisplay(
        balance = balance.toPlainString(),
        currency = "$",
        showPrivacy = hideBalance,
        modifier = Modifier
            .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.SectionSpacing)
    )
}

@Composable
fun QuickCaptureFAB(
    onFabClick: () -> Unit
) {
}

@Composable
fun MoneySnapshot(income: BigDecimal, expense: BigDecimal) {
    SanchayIncomeExpenseCard(
        income = "\u20B9${income.toPlainString()}",
        expense = "\u20B9${expense.toPlainString()}",
        modifier = Modifier
            .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.SectionSpacing)
    )
}

@Composable
fun RecentTransactionsSection(
    history: ImmutableList<TransactionHistoryItem>,
    baseCurrency: String
) {
    val recentCount = minOf(history.size, 5)
    val recentTransactions = if (history.size > 0) history.subList(0, recentCount) else emptyList()

    if (recentTransactions.isEmpty()) {
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
                Text(
                    text = "Recent activity",
                    style = SanchayTypography.Heading3,
                    color = SanchayColors.TextPrimaryLight
                )

                Spacer(Modifier.height(4.dp))

                recentTransactions.forEachIndexed { index, trn ->
                    Row(
                        modifier = Modifier
                            .padding(vertical = SanchaySpacing.ListItemSpacing),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(
                            Modifier.weight(1f),
                            verticalArrangement = Arrangement.Center,
                            horizontalAlignment = Alignment.Start
                        ) {
                            Text(
                                text = trn.toString(),
                                style = SanchayTypography.Body,
                                color = SanchayColors.TextPrimaryLight,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = "",
                                style = SanchayTypography.Caption,
                                color = SanchayColors.TextSecondaryLight,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }

                        FinancialAmount(
                            amount = "0",
                            style = FinancialAmountStyle.Neutral,
                            showSign = true
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun UpcomingCommitmentsSection(upcoming: LegacyDueSection) {
    val upcomingTrns = upcoming.trns
    if (upcomingTrns.isEmpty()) return

    SanchayCardWithHeader(
        title = "Upcoming",
        subtitle = "${upcomingTrns.size} planned payment${if (upcomingTrns.size > 1) "s" else ""}",
        modifier = Modifier
            .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.SectionSpacing)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            val visibleCount = minOf(upcomingTrns.size, 3)
            upcomingTrns.toList().take(visibleCount).forEach { trn ->
                UpcomingPaymentRow(
                    payee = trn.title ?: "Unknown",
                    amount = "\u20B9${trn.amount.toPlainString()}",
                    dueDate = trn.dueDate?.toString() ?: ""
                )
                Spacer(Modifier.height(SanchaySpacing.ListItemSpacing))
            }

            if (upcomingTrns.size > visibleCount) {
                Text(
                    text = "See all ${upcomingTrns.size} planned payments",
                    style = SanchayTypography.Body,
                    color = SanchayColors.TextSecondaryLight,
                    modifier = Modifier.padding(start = SanchaySpacing.ContentInset)
                )
            }
        }
    }
}

@Composable
fun BudgetSnapshotSection(
    progress: Float,
    baseCurrency: String
) {
    if (progress > 0 && progress < 1) {
        SanchayBudgetProgressCard(
            progress = progress,
            label = "This month\u2019s budget",
            target = "\u20B9${String.format("%.0f", progress * 100.0)}",
            modifier = Modifier
                .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.SectionSpacing)
        )
    } else {
        SanchayCard(
            modifier = Modifier
                .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.SectionSpacing)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                Text(
                    text = "Budgets",
                    style = SanchayTypography.Heading3,
                    color = SanchayColors.TextPrimaryLight
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    text = "Set up budgets to track your spending",
                    style = SanchayTypography.Body,
                    color = SanchayColors.TextSecondaryLight
                )
            }
        }
    }
}

@Composable
fun GoalsSnapshotSection(
    goals: ImmutableList<CustomerJourneyCardModel>,
    baseCurrency: String
) {
    val activeGoals = goals.filter { card -> card.cta != null }

    if (activeGoals.isEmpty()) {
        SanchayCard(
            modifier = Modifier
                .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.SectionSpacing)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                Text(
                    text = "Goals",
                    style = SanchayTypography.Heading3,
                    color = SanchayColors.TextPrimaryLight
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    text = "Set financial goals to track progress",
                    style = SanchayTypography.Body,
                    color = SanchayColors.TextSecondaryLight
                )
            }
        }
    } else {
        SanchayGoalProgressCard(
            progress = 0.8f,
            target = "\u20B91,000",
            current = "\u20B9800",
            modifier = Modifier
                .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.SectionSpacing)
        )
    }
}

@Composable
fun InsightPreviewSection(
    stats: IncomeExpensePair,
    upcoming: LegacyDueSection,
    baseCurrency: String
) {
    val insights = mutableListOf<String>()

    if (stats.income > BigDecimal.ZERO && stats.expense.toDouble() / stats.income.toDouble() > 0.7) {
        insights.add("Dining is higher than usual this month")
    }

    if (upcoming.trns.isNotEmpty()) {
        insights.add("${upcoming.trns.size} payment${if (upcoming.trns.size > 1) "s" else ""} coming due")
    }

    if (insights.isEmpty()) return

    SanchayCard(
        modifier = Modifier
            .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.SectionSpacing)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            Text(
                text = "Insight",
                style = SanchayTypography.Heading3,
                color = SanchayColors.TextPrimaryLight
            )
            Spacer(Modifier.height(4.dp))
            Text(
                text = insights.first(),
                style = SanchayTypography.Body,
                color = SanchayColors.TextPrimaryLight
            )
            Spacer(Modifier.height(SanchaySpacing.ListItemSpacing))
            Text(
                text = "\u2014 View all insights",
                style = SanchayTypography.Caption,
                color = SanchayColors.TextSecondaryLight
            )
        }
    }
}

@Composable
fun EmptyHomeState(
    onEstablishAccount: () -> Unit,
    onAddFirstTransaction: () -> Unit,
    onCreateFirstBudget: () -> Unit,
) {
    EmptyStateMinimal(
        title = "Start your financial journey",
        description = "Establish your first account to see your financial picture here",
        modifier = Modifier
            .padding(horizontal = SanchaySpacing.ContentInset, vertical = SanchaySpacing.SectionSpacing)
    )
}

@Composable
private fun UpcomingPaymentRow(payee: String, amount: String, dueDate: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = SanchaySpacing.ListItemSpacing),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = payee, style = SanchayTypography.Body, color = SanchayColors.TextPrimaryLight)
        Text(text = amount, style = SanchayTypography.Numerical, color = SanchayColors.TextPrimaryLight)
    }
}

private fun calculateBudgetProgress(uiState: HomeState): Float {
    return 0.5f
}
