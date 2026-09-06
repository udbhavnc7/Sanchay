package com.ivy.pacts

import com.ivy.base.BaseActivity
import com.ivy.base.state.AppShellState
import com.ivy.base.navigation.NavDestination
import com.ivy.base.navigation.NavigationManager
import com.ivy.pacts.ui.*
import com.ivy.i18n.*
import kotlinx.compose.foundation.layout.*
import kotlinx.compose.material3.*
import kotlinx.compose.runtime.*
import kotlinx.coroutines.flow.collectAsState
import kotlinx.coroutines.launch
import java.time.Instant

/** Financial Pacts screen. */
@Composable
fun FinancialPactsScreen(
    viewModel: FinancialPactsViewModel = hiltViewModel(),
    navigation: NavigationManager = hiltNavigation(),
    appShellState: AppShellState = hiltAppShellState()
) {
    val pacts by viewModel.pacts.collectAsState()

    materialTheme {
        SanchayScaffold(
            title = i18n("financial_pacts"),
            navDestination = NavDestination.FinancialPacts,
            floatingActionButton = {
                SanchayFab(
                    onClick = { /* open new pact creation */ }
                    icon = Icons.Outline.Add
                )
            }
        ) { innerPadding ->
            ColoredSurface(
                modifier = Modifier.fillMaxSize().padding(innerPadding),
                elevation = 1.dp
            ) {
                FinancialPactsContent(
                    pacts = pacts.value,
                    onPactSelected = { /* handle selection */ },
                    onRefresh = { viewModel.loadPacts() }
                )
            }
        }
    }
}

/** Financial Pacts content. */
@Composable
fun FinancialPactsContent(
    pacts: List<FinancialPactEntity>,
    onPactSelected: (FinancialPactEntity) -> Unit,
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier
) {
    if (pacts.isEmpty()) {
        EmptyPactsState(onRefresh = onRefresh)
        return
    }

    val colors = MaterialTheme.colorScheme

    Column(
        modifier
            .fillMaxSize(),
        verticalArrangement = Arrangement.Start,
        horizontalAlignment = Alignment.Start
    ) {
        // Header
        Card(
            modifier
                .fillMaxWidth()
                .padding(16.dp, 16.dp, 0.dp),
            elevation = 2.dp,
            colors = CardDefaults.cardColors(
                container = colors.surface,
                shadow = colors.onSurface.copyAlpha(0.1)
            )
        ) {
            Row(
                modifier.fillMaxWidth().padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = i18n("financial_pacts"),
                    style = Typography.h6
                )

                Button(
                    onClick = onRefresh,
                    style = Widget.Button.Small
                ) {
                    Text(i18n("refresh"))
                }
            }
        }

        // Pacts list
        Divider(modifier = Modifier.height(8.dp))

        Expanded(
            modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            if (pacts.isEmpty()) {
                Text(
                    text = i18n("no_pacts_found"),
                    style = BodyMedium,
                    color = colors.onSurface.copyAlpha(0.5),
                    textAlign = TextAlign.Center
                )
            } else {
                FinancialPactsList(
                    pacts = pacts,
                    onPactSelected = onPactSelected
                )
            }
        }
    }
}

/** Financial Pacts list item. */
@Composable
fun FinancialPactListItem(
    pact: FinancialPactEntity,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = MaterialTheme.colorScheme
    val statusDisplay = when (pact.status) {
        "ACTIVE" -> i18n("active")
        "PARTIALLY_SETTLED" -> i18n("partially_settled")
        "SETTLED" -> i18n("settled")
        "CANCELLED" -> i18n("cancelled")
        else -> pact.status
    }
    val typeDisplay = when (pact.type) {
        "I_OWE" -> i18n("i_owe")
        "OWED_TO_ME" -> i18n("owed_to_me")
        "SHARED_EXPENSE" -> i18n("shared_expense")
        else -> pact.type
    }

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
            modifier.fillMaxWidth().padding(12.dp),
            verticalArrangement = Arrangement.Start,
            horizontalAlignment = Alignment.Start
        ) {
            // Counterparty and type
            Row(
                modifier
                    .fillMaxWidth()
                    .height(32.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = pact.counterpartyName,
                    style = BodyMedium,
                    color = colors.onSurface
                )

                Text(
                    text = typeDisplay,
                    style = Caption,
                    color = colors.onSurface.copyAlpha(0.6)
                )
            }

            // Amount and due date
            Row(
                modifier
                    .fillMaxWidth()
                    .padding(top = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "₹${pact.originalAmount.format("%.0f")}",
                    style = BodySmall,
                    color = colors.secondary
                )

                Text(
                    text = viewModel().formatDueDate(pact.dueDate),
                    style = Caption,
                    color = colors.onSurface.copyAlpha(0.6)
                )
            }

            // Remaining amount and status
            Row(
                modifier
                    .fillMaxWidth()
                    .padding(top = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "₹${pact.remainingAmount.format("%.0f")} remaining",
                    style = Caption,
                    color = when (pact.remainingAmount) {
                        -> if (pact.remainingAmount <= 0.0) colors.error
                        else colors.secondary
                    }
                )

                Text(
                    text = viewModel().getStatusDisplay(pact.status),
                    style = Caption,
                    color = colors.onSurface.copyAlpha(0.6)
                )
            }

            // Description/notes
            if (pact.description?.isNotEmpty() == true) {
                Text(
                    text = pact.description,
                    style = Caption,
                    color = colors.onSurface.copyAlpha(0.5),
                    overflow = TextOverflow.Ellipsis,
                    maxLines = 1
                )
            }
        }

        // Action buttons
        Row(
            modifier
                .fillMaxWidth()
                .padding(top = 8.dp),
            horizontalArrangement = Arrangement.End,
            verticalAlignment = Alignment.CenterVertically
        ) {
            TextButton(
                onClick = {},
                modifier = Modifier.wrapContentSize()
            ) {
                Text(i18n("view_details"))
            }

            Spacer(modifier.width(8.dp))

            TextButton(
                onClick = {},
                modifier = Modifier.wrapContentSize()
            ) {
                Text(i18n("record_repayment"))
            }
        }
    }
}

/** Empty state for no pacts. */
@Composable
fun EmptyPactsState(
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier
            .fillMaxWidth()
            .padding(24.dp),
        elevation = 1.dp,
        colors = CardDefaults.cardColors(
            container = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier.fillMaxSize().padding(32.dp),
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
                text = i18n("no_pacts_yet"),
                style = HeadlineSmall,
                color = MaterialTheme.colorScheme.onSurface
            )

            Text(
                text = i18n("no_pacts_subtitle"),
                style = BodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copyAlpha(0.6),
                textAlign = TextAlign.Center
            )

            Spacer(modifier.height(16.dp))

            Button(
                onClick = onRefresh,
                style = Widget.Button.Elevated
            ) {
                Text(i18n("create_first_pact"))
            }
        }
    }
}

/** Financial Pacts overview summary. */
@Composable
fun FinancialPactsSummary(
    pacts: List<FinancialPactEntity>,
    modifier: Modifier = Modifier
) {
    val colors = MaterialTheme.colorScheme

    // Calculate summary stats
    val youOwe = pacts
        .filter { pact -> pact.type == "I_OWE" && pact.remainingAmount > 0 }
        .sumByDouble { pact.remainingAmount }

    val owedToYou = pacts
        .filter { pact -> pact.type == "OWED_TO_ME" && pact.remainingAmount > 0 }
        .sumByDouble { pact.remainingAmount }

    val netPosition = owedToYou - youOwe

    Card(
        modifier
            .fillMaxWidth()
            .padding(16.dp, 16.dp, 0.dp),
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
            Row(
                modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = i18n("financial_pacts"),
                    style = Typography.h6
                )
            }

            Row(
                modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                MetricCard(
                    label = i18n("you_owe"),
                    value = "₹${youOwe.format("%.0f")}",
                    icon = Icons.Outline.Outline,
                    color = MaterialTheme.colorScheme.warning
                )

                MetricCard(
                    label = i18n("owed_to_you"),
                    value = "₹${owedToYou.format("%.0f")}",
                    icon = Icons.Outline.TrendingUp,
                    color = MaterialTheme.colorScheme.secondary
                )
            }

            // Net position
            Row(
                modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = i18n("net_position"),
                    style = Caption,
                    color = colors.onSurface.copyAlpha(0.6)
                )

                Text(
                    text = when (netPosition) {
                        -> if (netPosition > 0) "₹${netPosition.format("%.0f")} " + i18n("owed_to_you")
                        else if (netPosition < 0) "₹${(-netPosition).format("%.0f")} " + i18n("you_owe")
                        else i18n("balanced")
                    },
                    style = Caption,
                    color = when (netPosition) {
                        -> if (netPosition > 0) colors.error
                        else if (netPosition < 0) colors.warning
                        else colors.secondary
                    }
                )
            }
        }
    }
}

/** Metric card component. */
@Composable
fun MetricCard(
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