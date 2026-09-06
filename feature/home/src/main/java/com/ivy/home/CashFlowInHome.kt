package com.ivy.home

import com.ivy.base.BaseActivity
import com.ivy.base.state.AppShellState
import com.ivy.base.navigation.NavDestination
import com.ivy.base.navigation.NavigationManager
import com.ivy.cashflow.CashFlowViewModel
import com.ivy.cashflow.CashFlowForecast
import com.ivy.cashflow.CashFlowHealth
import com.ivy.cashflow.CashFlowCalculator
import com.ivy.data.model.TransactionType
import com.ivy.data.model.account.AccountEntity
import kotlinx.compose.foundation.layout.*
import kotlinx.compose.material3.*
import kotlinx.compose.runtime.*
import com.ivy.ui.core.*
import com.ivy.ui.component.*
import com.ivy.data.model.primitive.UUID
import com.ivy.data.model.Category
import com.ivy.data.model.Transaction
import com.ivy.data.db.dao.read.TransactionDao
import com.ivy.data.db.dao.read.BudgetDao
import com.ivy.data.db.dao.read.GoalDao
import com.ivy.data.db.dao.read.PlannedPaymentRuleDao
import com.ivy.base.kotlinxserilzation.KSerializerInstant
import com.ivy.base.kotlinxserilzation.KSerializerUUID
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import java.time.Instant
import com.ivy.i18n.*

/** Home screen with cash flow integration. */
@Composable
fun SanchayHomeDashboard(
    viewModel: CashFlowViewModel = hiltViewModel(),
    navigation: NavigationManager = hiltNavigation(),
    appShellState: AppShellState = hiltAppShellState()
) {
    var horizonDays by remember { mutableStateOf(30) }
    var showDetailedForecast by remember { mutableStateOf(false) }

    // Calculate forecast when state changes
    viewModel.forecastState.collectLatest { forecastState ->
        when (forecastState) {
            is CashFlowForecastState.Loaded -> {
                val forecast = forecastState.forecast
                // Store for UI use
                Unremembered { forecast }
            }
            CashFlowForecastState.Empty -> {
                // No data yet
            }
        }
    }

    // Trigger calculation
    launch {
        viewModel.calculateForecast(horizonDays = horizonDays)
    }

    materialTheme {
        SanchayScaffold(
            title = i18n("home_dashboard_title"),
            navDestination = NavDestination.Home,
            floatingActionButton = {
                // Quick Add FAB (existing)
                SanchayFab(
                    onClick = { /* open Quick Add */ }
                )
            }
        ) {
            // Main content
            Column(
                modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.Top,
                horizontalAlignment = Alignment.Start
            ) {
                // Cash Flow Summary Section
                CashFlowSummaryCard(
                    horizonDays = horizonDays,
                    onRefresh = { viewModel.calculateForecast(horizonDays = horizonDays) }
                )

                // Section divider
                Divider(modifier = Modifier.height(8.dp))

                // Quick stats or other dashboard content
                // ...
            }
        }
    }
}

/** Cash flow summary card for Home Dashboard. */
@Composable
fun CashFlowSummaryCard(
    horizonDays: Int = 30,
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier
) {
    var forecastState by remember { mutableStateOf<CashFlowForecastState?>(null) }

    // Collect forecast state
    // In a real implementation, this would observe the ViewModel
    // For now, use a simple approach

    Card(
        modifier
            .fillMaxWidth()
            .padding(bottom = 8.dp),
        elevation = 2.dp,
        colors = CardDefaults.cardColors(
            container = MaterialTheme.colorScheme.surface,
            shadow = MaterialTheme.colorScheme.onSurface.copyAlpha(0.1)
        )
    ) {
        Column(
            modifier
                .padding(16.dp),
            verticalArrangement = Arrangement.Start,
            horizontalAlignment = Alignment.Start
        ) {
            // Header
            Row(
                modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = i18n("cash_flow"),
                    style = Typography.headlineSmall
                )

                Button(
                    onClick = onRefresh,
                    style = Widget.Button.Small
                ) {
                    Text(i18n("refresh"))
                }
            }

            // If no forecast data, show empty state
            // If forecast available, show summary
            // ...

            // Placeholder - will be connected to ViewModel
            Text(
                text = i18n("cash_flow_summary_placeholder"),
                style = BodyMedium
            )
        }
    }
}

/** Cash flow health indicator. */
@Composable
fun CashFlowHealthIndicator(
    health: CashFlowHealth?,
    explanation: String?
) {
    if (health == null) return

    val colors = when (health) {
        is CashFlowHealth.Healthy -> {
            val scheme = MaterialTheme.colorScheme
            (scheme.secondary, scheme.secondaryContainer)
        }
        is CashFlowHealth.Tight -> {
            val scheme = MaterialTheme.colorScheme
            (scheme.error, scheme.errorContainer)
        }
        is CashFlowHealth.AtRisk -> {
            val scheme = MaterialTheme.colorScheme
            (scheme.error, scheme.errorContainer)
        }
    }

    Row(
        modifier
            .padding(bottom = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = health.display,
            style = BodySmall,
            color = colors.secondary
        )

        Text(
            text = health.value,
            style = Caption,
            color = colors.secondaryContainer
        )
    }

    if (explanation != null) {
        Text(
            text = explanation,
            style = Caption,
            color = MaterialTheme.colorScheme.onSurface.copyAlpha(0.6)
        )
    }
}