package com.ivy.cashflow.ui

import com.ivy.base.BaseActivity
import com.ivy.base.state.AppShellState
import com.ivy.base.navigation.NavDestination
import com.ivy.base.navigation.NavigationManager
import com.ivy.cashflow.*
import com.ivy.ui.core.*
import com.ivy.ui.component.*
import com.ivy.data.model.primitive.UUID
import com.ivy.data.model.account.AccountEntity
import com.ivy.data.model.Category
import com.ivy.data.model.Transaction
import com.ivy.data.db.dao.read.TransactionDao
import com.ivy.data.db.dao.read.BudgetDao
import com.ivy.data.db.dao.read.GoalDao
import com.ivy.data.db.dao.read.PlannedPaymentRuleDao
import com.ivy.i18n.*
import kotlinx.compose.foundation.layout.*
import kotlinx.compose.material3.*
import kotlinx.compose.runtime.*
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import java.time.Instant
import com.ivy.data.model.TransactionType

/** Dedicated Cash Flow screen. */
@Composable
fun CashFlowScreen(
    viewModel: CashFlowViewModel = hiltViewModel(),
    navigation: NavigationManager = hiltNavigation(),
    appShellState: AppShellState = hiltAppShellState()
) {
    var horizonDays by remember { mutableStateOf(30) }
    var selectedEvent: CashFlowEvent? = null
    var showEventDetail by remember { mutableStateOf(false) }

    // Collect forecast state
    val forecastState by viewModel.forecastState.collectAsState()

    // Trigger initial calculation
    LaunchedEffect(key = Unit()) {
        viewModel.calculateForecast(horizonDays = horizonDays)
    }

    materialTheme {
        SanchayScaffold(
            title = i18n("cash_flow"),
            navDestination = NavDestination.CashFlow,
            floatingActionButton = {
                SanchayFab(
                    onClick = { /* Add recurring income/commitment */ }
                    icon = Icons.Outline.Add
                )
            }
        ) { innerPadding ->
            // Content using inner padding from scaffold
            ColoredSurface(
                modifier = Modifier.fillMaxSize().padding(innerPadding),
                elevation = 1.dp
            ) {
                CashFlowContent(
                    horizonDays = horizonDays,
                    onHorizonChanged = { horizonDays = it },
                    forecastState = forecastState,
                    onEventSelected = { selectedEvent = it; showEventDetail = true },
                    onRefresh = { viewModel.calculateForecast(horizonDays = horizonDays) }
                )
            }

            // Event detail bottom sheet when selected
            if (showEventDetail && selectedEvent != null) {
                CashFlowEventDetailBottomSheet(
                    event = selectedEvent,
                    onClose = { showEventDetail = false }
                )
            }
        }
    }
}

/** Main cash flow content. */
@Composable
fun CashFlowContent(
    horizonDays: Int = 30,
    onHorizonChanged: (Int) -> Unit,
    forecastState: androidx.lifecycle.State<CashFlowForecastState?>,
    onEventSelected: (CashFlowEvent) -> Unit,
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier
) {
    when (forecastState.value) {
        is CashFlowForecastState.Loaded -> {
            val forecast = forecastState.value.forecast

            ScrollableColumn(
                modifier
                    .fillMaxSize(),
                horizontalArrangement = Arrangement.Start,
                verticalArrangement = Arrangement.Start
            ) {
                // Summary header
                CashFlowSummaryHeader(
                    forecast = forecast,
                    onRefresh = onRefresh
                )

                // Timeline
                CashFlowTimeline(
                    forecast = forecast,
                    onEventClick = { onEventSelected(it) }
                )

                // Health indicator
                CashFlowHealthIndicator(
                    health = forecast.healthState,
                    explanation = forecast.healthExplanation
                )

                // Events summary
                CashFlowEventsSummary(
                    forecast = forecast
                )
            }
        }
        CashFlowForecastState.Empty -> {
            EmptyCashFlowState(onRefresh = onRefresh)
        }
    }
}

/** Cash flow summary header. */
@Composable
fun CashFlowSummaryHeader(
    forecast: CashFlowForecast,
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = when (forecast.healthState) {
        is CashFlowHealth.Healthy -> MaterialTheme.colorScheme.secondary to MaterialTheme.colorScheme.secondaryContainer
        is CashFlowHealth.Tight -> MaterialTheme.colorScheme.error to MaterialTheme.colorScheme.errorContainer
        is CashFlowHealth.AtRisk -> MaterialTheme.colorScheme.error to MaterialTheme.colorScheme.errorContainer
    }

    Card(
        modifier
            .fillMaxWidth()
            .padding(bottom = 8.dp),
        elevation = 2.dp,
        colors = CardDefaults.cardColors(
            container = colors.secondary,
            shadow = colors.secondary.copyAlpha(0.1)
        )
    ) {
        Column(
            modifier.fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.Start,
            horizontalAlignment = Alignment.Start
        ) {
            Row(
                modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(
                    crossAxisAlignment = CrossAxisAlignment.Start(Alignment.Start),
                    {
                        Text(
                            text = i18n("current_balance"),
                            style = Caption,
                            color = colors.secondary
                        )
                        Text(
                            text = "₹${forecast.currentBalance.format("%.0f")}",
                            style = DisplayLarge,
                            color = colors.secondaryContainer
                        )
                    }
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
                // Current balance
                MetricCard(
                    label = i18n("current"),
                    value = "₹${forecast.currentBalance.format("%.0f")}",
                    icon = Icons.Outline.AccountBalance
                )

                // Ending projection
                MetricCard(
                    label = i18n("projected_end"),
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
        }
    }
}

/** Timeline of cash flow events. */
@Composable
fun CashFlowTimeline(
    forecast: CashFlowForecast,
    onEventClick: (CashFlowEvent) -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = MaterialTheme.colorScheme

    if (forecast.timeline.isEmpty()) {
        Text(
            text = i18n("no_timeline_data"),
            style = BodyMedium,
            color = colors.onSurface.copyAlpha(0.5)
        )
        return
    }

    // Build event list from timeline
    val eventItems = buildTimelineEvents(forecast.timeline)

    Column(
        modifier.fillMaxSize(),
        verticalArrangement = Arrangement.SpaceEvenly,
        horizontalAlignment = Alignment.Start
    ) {
        // Starting balance
        CashFlowTimelineItem(
            date = forecast.timeline.first().date,
            startingBalance = forecast.currentBalance,
            isStarting = true,
            onClick = {}
        )

        // Timeline events
        for ((index, point) in forecast.timeline.withIndex() if index > 0) {
            val prevPoint = forecast.timeline[index - 1]
            val events = buildSingleTimelineEvents(point, prevPoint)

            CashFlowTimelineItem(
                date = point.date,
                events = events,
                endingBalance = point.endingBalance,
                onClick = { onEventSelected(events.firstOrNull() ?: CashFlowEvent.Baseline) }
            )
        }

        // Final balance
        CashFlowTimelineItem(
            date = forecast.timeline.last().date,
            endingBalance = forecast.endingBalance,
            isFinal = true,
            onClick = {}
        )
    }
}

/** Build event items for a timeline point. */
private fun buildSingleTimelineEvents(
    point: CashFlowPoint,
    prevPoint: CashFlowPoint
): List<CashFlowEvent> {
    val events = mutableListOf<CashFlowEvent>()

    // Calculate inflows
    val inflow = point.inflow - prevPoint.inflow
    if (inflow != 0.0) {
        events.add(CashFlowEvent.Inflow(
            date = point.date,
            amount = inflow,
            source = "Projected",
            description = "Expected inflow",
            confidence = CashFlowConfidence.EXPECTED
        ))
    }

    // Calculate outflows
    val outflow = point.outflow - prevPoint.outflow
    if (outflow != 0.0) {
        events.add(CashFlowEvent.Outflow(
            date = point.date,
            amount = outflow,
            source = "Projected",
            description = "Expected outflow",
            confidence = CashFlowConfidence.EXPECTED
        ))
    }

    // Calculate committed
    val committed = point.committedAmount - prevPoint.committedAmount
    if (committed != 0.0) {
        events.add(CashFlowEvent.Commitment(
            date = point.date,
            amount = committed,
            source = "Committed",
            description = "Planned commitment",
            confidence = CashFlowConfidence.KNOWN
        ))
    }

    // Calculate goal contribution
    val goalContrib = point.goalContribution - prevPoint.goalContribution
    if (goalContrib != 0.0) {
        events.add(CashFlowEvent.GoalContribution(
            date = point.date,
            amount = goalContrib,
            goalName = "Goal",
            confidence = CashFlowConfidence.EXPECTED
        ))
    }

    return events
}

/** Single timeline item. */
@Composable
fun CashFlowTimelineItem(
    date: Instant,
    startingBalance: Double = 0.0,
    events: List<CashFlowEvent> = emptyList(),
    endingBalance: Double,
    isStarting: Boolean = false,
    isFinal: Boolean = false,
    onClick: (CashFlowEvent) -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = MaterialTheme.colorScheme

    Card(
        modifier
            .fillMaxWidth()
            .padding(4.dp),
        elevation = 1.dp,
        colors = CardDefaults.cardColors(
            container = MaterialTheme.colorScheme.surface,
            shadow = MaterialTheme.colorScheme.onSurface.copyAlpha(0.1)
        )
    ) {
        Column(
            modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalArrangement = Arrangement.Start,
            horizontalAlignment = Alignment.Start
        ) {
            // Date
            Row(
                modifier
                    .fillMaxWidth()
                    .height(32.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (isStarting) {
                    Text(
                        text = i18n("today"),
                        style = BodySmall,
                        color = colors.onSurface.copyAlpha(0.6)
                    )
                } else if (isFinal) {
                    // Format date
                    val dateStr = formatDate(date)
                    Text(
                        text = dateStr,
                        style = BodySmall,
                        color = colors.onSurface.copyAlpha(0.6)
                    )
                } else {
                    val dateStr = formatDate(date)
                    Text(
                        text = dateStr,
                        style = BodySmall,
                        color = colors.onSurface.copyAlpha(0.6)
                    )
                }
            }

            // Events
            if (events.isNotEmpty()) {
                Text(
                    text = events.first().let { event ->
                        when (event) {
                            is CashFlowEvent.Inflow -> i18n("inflow_format").format(event.amount.format("%.0f"))
                            is CashFlowEvent.Outflow -> i18n("outflow_format").format(event.amount.format("%.0f"))
                            is CashFlowEvent.Commitment -> i18n("commitment_format").format(event.amount.format("%.0f"))
                            is CashFlowEvent.GoalContribution -> i18n("goal_contribution_format").format(event.amount.format("%.0f"))
                            else -> ""
                        }
                    },
                    style = BodySmall,
                    color = when (event) {
                        is CashFlowEvent.Inflow -> colors.secondary
                        is CashFlowEvent.Outflow -> colors.error
                        is CashFlowEvent.Commitment -> colors.warning
                        is CashFlowEvent.GoalContribution -> colors.onSurface
                        else -> colors.onSurface
                    }
                )
            }

            // Balance change
            val balanceChange = endingBalance - startingBalance
            Text(
                text = "₹${balanceChange.format("%.0f")}",
                style = BodyMedium,
                color = when (balanceChange) {
                    -> if (balanceChange >= 0) colors.secondary else colors.error
                }
            )
        }
    }
}

/** Empty state for cash flow. */
@Composable
fun EmptyCashFlowState(
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier
            .fillMaxWidth()
            .padding(16.dp),
        elevation = 1.dp,
        colors = CardDefaults.cardColors(
            container = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier.fillMaxSize().padding(24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Outline.TrendingFlat,
                contentDescription = i18n("empty_state_icon_description"),
                size = 64.dp,
                color = MaterialTheme.colorScheme.onSurface.copyAlpha(0.3)
            )

            Text(
                text = i18n("cash_flow_no_data"),
                style = HeadlineSmall,
                color = MaterialTheme.colorScheme.onSurface
            )

            Text(
                text = i18n("cash_flow_no_data_subtitle"),
                style = BodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copyAlpha(0.6),
                textAlign = TextAlign.Center
            )

            Spacer(modifier.height(16.dp))

            Button(
                onClick = onRefresh,
                style = Widget.Button.Elevated
            ) {
                Text(i18n("add_income_or_commitments"))
            }
        }
    }
}

/** Cash flow event detail bottom sheet. */
@Composable
fun CashFlowEventDetailBottomSheet(
    event: CashFlowEvent,
    onClose: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = MaterialTheme.colorScheme

    when (event) {
        is CashFlowEvent.Inflow -> {
            OutlinedBottomSheet(
                modifier
                    .fillMaxWidth(),
                onDismiss = { onClose() }
            ) {
                CashFlowEventDetailCard(
                    title = i18n("expected_income"),
                    amount = event.amount,
                    source = event.source ?: "",
                    description = event.description ?: "",
                    confidence = event.confidence,
                    onClose = onClose
                )
            }
        }
        is CashFlowEvent.Outflow -> {
            OutlinedBottomSheet(
                modifier
                    .fillMaxWidth(),
                onDismiss = { onClose() }
            ) {
                CashFlowEventDetailCard(
                    title = i18n("expected_expense"),
                    amount = event.amount,
                    source = event.source ?: "",
                    description = event.description ?: "",
                    confidence = event.confidence,
                    onClose = onClose
                )
            }
        }
        is CashFlowEvent.Commitment -> {
            OutlinedBottomSheet(
                modifier
                    .fillMaxWidth(),
                onDismiss = { onClose() }
            ) {
                CashFlowEventDetailCard(
                    title = i18n("recurring_commitment"),
                    amount = event.amount,
                    source = event.source ?: "",
                    description = event.description ?: "",
                    confidence = event.confidence,
                    onClose = onClose
                )
            }
        }
        is CashFlowEvent.GoalContribution -> {
            OutlinedBottomSheet(
                modifier
                    .fillMaxWidth(),
                onDismiss = { onClose() }
            ) {
                CashFlowEventDetailCard(
                    title = i18n("goal_contribution"),
                    amount = event.amount,
                    source = event.goalName ?: "",
                    description = "",
                    confidence = event.confidence,
                    onClose = onClose
                )
            }
        }
        CashFlowEvent.Baseline -> {
            TextButton(
                onClick = onClose,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(i18n("close"))
            }
        }
    }
}

/** Cash flow event detail card. */
@Composable
fun CashFlowEventDetailCard(
    title: String,
    amount: Double,
    source: String,
    description: String,
    confidence: CashFlowConfidence,
    onClose: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = when (confidence) {
        CashFlowConfidence.KNOWN -> MaterialTheme.colorScheme.secondary to MaterialTheme.colorScheme.secondaryContainer
        CashFlowConfidence.EXPECTED -> MaterialTheme.colorScheme.warning to MaterialTheme.colorScheme.warningContainer
        CashFlowConfidence.SUGGESTED -> MaterialTheme.colorScheme.onSurface to MaterialTheme.colorScheme.surface
        CashFlowConfidence.ESTIMATED -> MaterialTheme.colorScheme.onSurface to MaterialTheme.colorScheme.surface
        CashFlowConfidence.UNKNOWN -> MaterialTheme.colorScheme.onSurface to MaterialTheme.colorScheme.surface
    }

    Column(
        modifier
            .fillMaxWidth()
            .padding(24.dp),
        verticalArrangement = Arrangement.Start,
        horizontalAlignment = Alignment.Start
    ) {
        Text(
            text = title,
            style = HeadlineSmall,
            color = colors.primary
        )

        Spacer(modifier.height(8.dp))

        Text(
            text = "₹${amount.format("%.0f")}",
            style = DisplayLarge,
            color = colors.primaryContainer
        )

        Spacer(modifier.height(8.dp))

        Row(
            modifier
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = i18n("source_label"),
                style = BodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copyAlpha(0.6)
            )

            Text(
                text = source ?: "",
                style = BodyMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
        }

        if (description.isNotEmpty()) {
            Spacer(modifier.height(4.dp))

            Text(
                text = description,
                style = BodySmall,
                color = MaterialTheme.colorScheme.onSurface.copyAlpha(0.6)
            )
        }

        Spacer(modifier.height(16.dp))

        Row(
            modifier
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.End,
            verticalAlignment = Alignment.CenterVertically
        ) {
            TextButton(
                onClick = onClose,
                modifier = Modifier.wrapContentSize()
            ) {
                Text(i18n("close"))
            }
        }
    }
}

/** Timeline event builder. */
private fun buildTimelineEvents(timeline: List<CashFlowPoint>): List<TimelineEvent> {
    val events = mutableListOf<TimelineEvent>()
    // ... build events from timeline points
    return events
}

/** Timeline event data class. */
@Immutable
data class TimelineEvent(
    val date: Instant,
    val label: String,
    val amount: Double,
    val event: CashFlowEvent,
    val color: Boolean  // true = income, false = expense
)