package com.ivy.planned.list

import androidx.compose.foundation.layout.BoxWithConstraintsScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.ivy.base.model.TransactionType
import com.ivy.data.model.Category
import com.ivy.data.model.CategoryId
import com.ivy.data.model.IntervalType
import com.ivy.data.model.primitive.ColorInt
import com.ivy.data.model.primitive.NotBlankTrimmedString
import com.ivy.design.l0_system.Purple
import com.ivy.design.l0_system.UI
import com.ivy.design.l0_system.style
import com.ivy.i18n.*
import com.ivy.cashflow.*
import com.ivy.base.navigation.NavDestination
import com.ivy.base.navigation.NavigationManager
import com.ivy.base.state.AppShellState
import kotlinx.collections.immutable.persistentListOf
import java.time.ZoneOffset
import java.util.UUID

@Composable
fun BoxWithConstraintsScope.PlannedPaymentsScreen(screen: PlannedPaymentsScreen) {
    val viewModel: PlannedPaymentsViewModel = screenScopedViewModel()
    val uiState = viewModel.uiState()

    // Cash flow integration
    val cashFlowViewModel: CashFlowViewModel = hiltViewModel()
    val navigation = navigation()
    val appShellState = appShellState()

    // Calculate cash flow forecast
    LaunchedEffect(key = Unit()) {
        cashFlowViewModel.calculateForecast(horizonDays = 30)
    }

    UI(
        state = uiState,
        onEvent = viewModel::onEvent,
        cashFlowViewModel = cashFlowViewModel,
        navigation = navigation,
        appShellState = appShellState
    )
}

@Composable
private fun BoxWithConstraintsScope.UI(
    state: PlannedPaymentsScreenState,
    onEvent: (PlannedPaymentsScreenEvent) -> Unit = {},
    cashFlowViewModel: CashFlowViewModel? = null,
    navigation: NavigationManager? = null,
    appShellState: AppShellState? = null
) {
    val colors = MaterialTheme.colorScheme

    // Build cash flow summary section
    val cashFlowSection = if (cashFlowViewModel != null) {
        val forecastState = cashFlowViewModel.forecastState.collectAsState().value
        when (forecastState) {
            is CashFlowForecastState.Loaded -> cashFlowSummarySection(forecast = forecastState.forecast)
            else -> emptyBox()
        }
    } else {
        emptyBox()
    }

    PlannedPaymentsLazyColumn(
        Header = {
            Spacer(Modifier.height(32.dp))

            Text(
                modifier = Modifier.padding(start = 24.dp),
                text = stringResource(R.string.planned_payments_inline),
                style = UI.typo.h2.style(
                    fontWeight = FontWeight.ExtraBold,
                    color = UI.colors.pureInverse
                )
            )

            Spacer(Modifier.height(24.dp))
        },

        // Cash flow summary inserted after header
        cashFlowSection,

        currency = state.currency,
        categories = state.categories,
        accounts = state.accounts,
        oneTime = state.oneTimePlannedPayment,
        oneTimeIncome = state.oneTimeIncome,
        oneTimeExpenses = state.oneTimeExpenses,
        recurring = state.recurringPlannedPayment,
        recurringIncome = state.recurringIncome,
        recurringExpenses = state.recurringExpenses,
        oneTimeExpanded = state.isOneTimePaymentsExpanded,
        recurringExpanded = state.isRecurringPaymentsExpanded,
        setOneTimeExpanded = {
            onEvent(PlannedPaymentsScreenEvent.OnOneTimePaymentsExpanded(it))
        },
        setRecurringExpanded = {
            onEvent(PlannedPaymentsScreenEvent.OnRecurringPaymentsExpanded(it))
        },
        listState = rememberScrollPositionListState(key = "plannedPayments")
    )

    val nav = navigation
    PlannedPaymentsBottomBar(
        onClose = {
            nav.back()
        },
        onAdd = {
            nav.navigateTo(
                EditPlannedScreen(
                    type = TransactionType.EXPENSE,
                    plannedPaymentRuleId = null
                )
            )
        }
    )
}

/** Empty composable for no cash flow section. */
@Composable
private fun emptyBox() {
    Unit
}

/** Cash flow summary section for PLAN screen. */
@Composable
private fun cashFlowSummarySection(
    forecast: CashFlowForecast,
    onRefresh: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val colors = MaterialTheme.colorScheme

    Card(
        modifier
            .fillMaxWidth()
            .padding(16.dp, 16.dp, 16.dp, 0.dp),
        elevation = 2.dp,
        colors = CardDefaults.cardColors(
            container = colors.surface,
            shadow = colors.onSurface.copyAlpha(0.1)
        )
    ) {
        Column(
            modifier.fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.Start,
            horizontalAlignment = Alignment.Start
        ) {
            // Summary header
            Row(
                modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = i18n("plan_cash_flow"),
                    style = Typography.h6
                )

                Button(
                    onClick = onRefresh,
                    style = Widget.Button.Small
                ) {
                    Text(i18n("refresh"))
                }
            }

            // Key metrics row
            Row(
                modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Budgeted
                MetricCard(
                    label = i18n("budgeted"),
                    value = "₹${forecast.currentBalance.format("%.0f")}",
                    icon = Icons.Outline.AccountBalance
                )

                // Committed
                MetricCard(
                    label = i18n("committed"),
                    value = "₹${forecast.totalCommitted.format("%.0f")}",
                    icon = Icons.Outline.Outline,
                    color = MaterialTheme.colorScheme.warning
                )

                // Goals
                MetricCard(
                    label = i18n("goals"),
                    value = "₹${forecast.totalGoalContributions.format("%.0f")}",
                    icon = Icons.Outline.TrendingUp,
                    color = MaterialTheme.colorScheme.secondary
                )
            }

            // Cash flow projection
            Row(
                modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Projected end of month
                MetricCard(
                    label = i18n("projected_end_month"),
                    value = "₹${forecast.endingBalance.format("%.0f")}",
                    icon = Icons.Outline.TrendingUp,
                    color = when (forecast.healthState) {
                        is CashFlowHealth.Healthy -> MaterialTheme.colorScheme.secondary
                        is CashFlowHealth.Tight -> MaterialTheme.colorScheme.warning
                        is CashFlowHealth.AtRisk -> MaterialTheme.colorScheme.error
                    }
                )

                // Lowest projected
                MetricCard(
                    label = i18n("lowest_projected"),
                    value = "₹${forecast.lowestProjectedBalance.format("%.0f")}",
                    icon = Icons.Outline.TrendingDown,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }

            // Health state
            CashFlowHealthIndicator(
                health = forecast.healthState,
                explanation = forecast.healthExplanation
            )

            // Divider
            Divider(modifier = Modifier.height(8.dp))

            // Timeline preview
            Text(
                text = i18n("next_30_days"),
                style = Caption,
                color = MaterialTheme.colorScheme.onSurface.copyAlpha(0.6)
            )

            // Brief timeline
            CashFlowTimelinePreview(forecast = forecast)
        }
    }
}

/** Simple timeline preview for PLAN screen. */
@Composable
private fun CashFlowTimelinePreview(
    forecast: CashFlowForecast,
    modifier: Modifier = Modifier
) {
    val colors = MaterialTheme.colorScheme

    if (forecast.timeline.isNotEmpty()) {
        // Show first few timeline points
        val previewPoints = forecast.timeline.take(5)

        for ((index, point) in previewPoints.withIndex() if index > 0) {
            val dateStr = formatDateShort(point.date)
            CashFlowTimelineItem(
                date = point.date,
                startingBalance = if (index == 1) forecast.currentBalance else 0.0,
                events = emptyList(),
                endingBalance = point.endingBalance,
                isStarting = index == 1,
                isFinal = false,
                onClick = {}
            )
        }
    } else {
        Text(
            text = i18n("no_timeline_data"),
            style = BodySmall,
            color = colors.onSurface.copyAlpha(0.5)
        )
    }
}

/** Format date short. */
private fun formatDateShort(date: Instant): String {
    // Simple date formatting
    val calendar = java.util.Calendar.getInstance()
    calendar.timeInMillis = date.toEpochMilli()
    return "${calendar.get(java.util.Calendar.DAY_OF_MONTH)}/${calendar.get(java.util.Calendar.MONTH) + 1}"
}

/** Metric card component. */
@Composable
private fun MetricCard(
    label: String,
    value: String,
    icon: Icons.Default,
    color: MaterialColor = MaterialTheme.colorScheme.onSurface,
    modifier: Modifier = Modifier
) {
    Row(
        modifier
            .wrapContentSize()
            .height(40.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        HStack(
            verticalAlignment = Alignment.CenterVertically,
            {
                Icon(icon, contentDescription = null, tint = color)
                Text(
                    text = label,
                    style = Caption,
                    color = color.copyAlpha(0.6)
                )
            },
            {
                Text(
                    text = value,
                    style = Caption,
                    color = color
                )
            }
        )
    }
}