package com.ivy.purchase

import com.ivy.base.BaseActivity
import com.ivy.base.state.AppShellState
import com.ivy.base.navigation.NavDestination
import com.ivy.base.navigation.NavigationManager
import com.ivy.purchase.ui.*
import com.ivy.i18n.*
import kotlinx.compose.foundation.layout.*
import kotlinx.compose.material3.*
import kotlinx.compose.runtime.*
import kotlinx.coroutines.flow.collectAsState
import kotlinx.coroutines.launch
import java.time.Instant

/** Purchase Protection screen. */
@Composable
fun PurchaseProtectionScreen(
    viewModel: PurchaseProtectionViewModel = hiltViewModel(),
    navigation: NavigationManager = hiltNavigation(),
    appShellState: AppShellState = hiltAppShellState()
) {
    val purchases by viewModel.purchases.collectAsState()

    materialTheme {
        SanchayScaffold(
            title = i18n("purchase_protection"),
            navDestination = NavDestination.PurchaseProtection,
            floatingActionButton = {
                SanchayFab(
                    onClick = { /* open new purchase creation */ }
                    icon = Icons.Outline.Add
                )
            }
        ) { innerPadding ->
            ColoredSurface(
                modifier = Modifier.fillMaxSize().padding(innerPadding),
                elevation = 1.dp
            ) {
                PurchaseProtectionContent(
                    purchases = purchases.value,
                    onPurchaseSelected = { /* handle selection */ },
                    onRefresh = { viewModel.loadPurchases() }
                )
            }
        }
    }
}

/** Purchase Protection content. */
@Composable
fun PurchaseProtectionContent(
    purchases: List<PurchaseEntity>,
    onPurchaseSelected: (PurchaseEntity) -> Unit,
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier
) {
    if (purchases.isEmpty()) {
        EmptyPurchasesState(onRefresh = onRefresh)
        return
    }

    val colors = MaterialTheme.colorScheme

    // Calculate attention summary
    val overdueReturns = purchases.count { isReturnDeadlineOverdue(it.id) }
    val closingSoonReturns = purchases.count { viewModel().isReturnDeadlineClosingSoon(it.id) }
    val expiringWarranties = purchases.count { viewModel().isWarrantyExpiringSoon(it.id) }
    val expiredWarranties = purchases.count { viewModel().isWarrantyExpired(it.id) }

    Column(
        modifier
            .fillMaxSize(),
        verticalArrangement = Arrangement.Start,
        horizontalAlignment = Alignment.Start
    ) {
        // Summary header with attention count
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
                Column(
                    crossAxisAlignment = CrossAxisAlignment.Start(Alignment.Start),
                    {
                        Text(
                            text = i18n("purchase_protection"),
                            style = Typography.h6
                        )

                        Text(
                            text = i18n("protection_subtitle"),
                            style = Caption,
                            color = colors.onSurface.copyAlpha(0.6)
                        )
                    }
                )

                // Attention badges
                Row(
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (overdueReturns > 0) {
                        MaterialTheme.colorScheme.error.use {
                            Text(
                                text = i18n("overdue_returns").format(overdueReturns),
                                style = Caption,
                                color = it
                            )
                        }
                    }
                    if (closingSoonReturns > 0) {
                        MaterialTheme.colorScheme.warning.use {
                            Text(
                                text = i18n("closing_soon").format(closingSoonReturns),
                                style = Caption,
                                color = it
                            )
                        }
                    }
                    if (expiringWarranties > 0) {
                        MaterialTheme.colorScheme.secondary.use {
                            Text(
                                text = i18n("expiring_warranties").format(expiringWarranties),
                                style = Caption,
                                color = it
                            )
                        }
                    }
                    if (expiredWarranties > 0) {
                        MaterialTheme.colorScheme.error.use {
                            Text(
                                text = i18n("expired_warranties").format(expiredWarranties),
                                style = Caption,
                                color = it
                            )
                        }
                    }
                }
            }
        }

        Divider(modifier = Modifier.height(8.dp))

        // Purchases list
        Expanded(
            modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            if (purchases.isEmpty()) {
                Text(
                    text = i18n("no_purchases_found"),
                    style = BodyMedium,
                    color = colors.onSurface.copyAlpha(0.5),
                    textAlign = TextAlign.Center
                )
            } else {
                PurchaseProtectionList(
                    purchases = purchases,
                    onPurchaseSelected = onPurchaseSelected,
                    viewModelRef = viewModel
                )
            }
        }
    }
}

/** Purchase Protection list item. */
@Composable
fun PurchaseProtectionListItem(
    purchase: PurchaseEntity,
    onClick: () -> Unit,
    onReturnClicked: () -> Unit,
    onWarrantyClicked: () -> Unit,
    viewModel: androidx.lifecycle.ViewModel?,
    modifier: Modifier = Modifier
) {
    val colors = MaterialTheme.colorScheme
    val returnStatus = viewModel?.let { vm -> vm.getReturnDeadlineStatus(purchase.id) } ?: "unknown"
    val warrantyStatus = viewModel?.let { vm -> vm.getWarrantyStatus(purchase.id) } ?: "unknown"
    val returnDeadlineFormatted = viewModel?.let { vm -> vm.formatReturnDeadline(purchase.returnDeadline) } ?: i18n("no_return_window")
    val warrantyExpiryFormatted = viewModel?.let { vm -> vm.formatWarrantyExpiry(purchase.warrantyEndDate) } ?: i18n("no_warranty")

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
            // Header with title and merchant
            Row(
                modifier
                    .fillMaxWidth()
                    .height(32.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = purchase.title,
                    style = BodyMedium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    color = colors.onSurface
                )

                Text(
                    text = purchase.merchant ?: "",
                    style = Caption,
                    color = colors.onSurface.copyAlpha(0.5)
                )
            }

            // Amount
            Text(
                text = "₹${purchase.amount.format("%.0f")}",
                style = BodySmall,
                color = colors.secondary
            )

            // Return deadline
            Row(
                modifier
                    .fillMaxWidth()
                    .padding(top = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = i18n("return_deadline"),
                    style = Caption,
                    color = colors.onSurface.copyAlpha(0.4)
                )

                Text(
                    text = returnDeadlineFormatted,
                    style = Caption,
                    color = when (returnStatus) {
                        -> if (returnStatus.contains("expired")) colors.error
                        else if (returnStatus.contains("today") || returnStatus.contains("closing")) colors.warning
                        else colors.secondary
                    }
                )
            }

            // Warranty
            Row(
                modifier
                    .fillMaxWidth()
                    .padding(top = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = i18n("warranty"),
                    style = Caption,
                    color = colors.onSurface.copyAlpha(0.4)
                )

                Text(
                    text = warrantyExpiryFormatted,
                    style = Caption,
                    color = when (warrantyStatus) {
                        -> if (warrantyStatus.contains("expired")) colors.error
                        else if (warrantyStatus.contains("expiring")) colors.warning
                        else colors.secondary
                    }
                )
            }

            // Attention indicators
            if (viewModel != null) {
                val vm = viewModel
                val hasOverdue = vm.isReturnDeadlineOverdue(purchase.id)
                val hasClosingSoon = vm.isReturnDeadlineClosingSoon(purchase.id)
                val hasExpiring = vm.isWarrantyExpiringSoon(purchase.id)

                Row(
                    modifier
                        .fillMaxWidth()
                        .padding(top = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (hasOverdue) {
                        MaterialTheme.colorScheme.error.use {
                            Text(
                                text = i18n("overdue"),
                                style = Caption2,
                                color = it
                            )
                        }
                    }
                    if (hasClosingSoon) {
                        MaterialTheme.colorScheme.warning.use {
                            Text(
                                text = i18n("closing_soon"),
                                style = Caption2,
                                color = it
                            )
                        }
                    }
                    if (hasExpiring) {
                        MaterialTheme.colorScheme.secondary.use {
                            Text(
                                text = i18n("expiring_soon"),
                                style = Caption2,
                                color = it
                            )
                        }
                    }
                }
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
            Button(
                onClick = onReturnClicked,
                modifier = Modifier.wrapContentSize(),
                enabled = purchase.returnDeadline != null
            ) {
                Text(i18n("manage_return"))
            }

            Spacer(modifier.width(8.dp))

            Button(
                onClick = onWarrantyClicked,
                modifier = Modifier.wrapContentSize()
            ) {
                Text(i18n("manage_warranty"))
            }
        }
    }
}

/** Empty state for no purchases. */
@Composable
fun EmptyPurchasesState(
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
                text = i18n("no_purchases_yet"),
                style = HeadlineSmall,
                color = MaterialTheme.colorScheme.onSurface
            )

            Text(
                text = i18n("no_purchases_subtitle"),
                style = BodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copyAlpha(0.6),
                textAlign = TextAlign.Center
            )

            Spacer(modifier.height(16.dp))

            Button(
                onClick = onRefresh,
                style = Widget.Button.Elevated
            ) {
                Text(i18n("add_first_purchase"))
            }
        }
    }
}

/** Purchase Protection overview summary for attention. */
@Composable
fun PurchaseProtectionSummary(
    purchases: List<PurchaseEntity>,
    modifier: Modifier = Modifier
) {
    val colors = MaterialTheme.colorScheme

    // Calculate attention counts
    val overdueReturns = purchases.count { isReturnDeadlineOverdue(it.id) }
    val closingSoonReturns = purchases.count { viewModel()?.isReturnDeadlineClosingSoon(it.id) ?: false }
    val expiringWarranties = purchases.count { viewModel()?.isWarrantyExpiringSoon(it.id) ?: false }
    val expiredWarranties = purchases.count { viewModel()?.isWarrantyExpired(it.id) ?: false }

    if (overdueReturns + closingSoonReturns + expiringWarranties + expiredWarranties == 0) {
        return emptyBox()
    }

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
            Text(
                text = i18n("attention_required"),
                style = Caption,
                color = colors.error
            )

            Row(
                modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                MaterialTheme.colorScheme.error.use {
                    Text(
                        text = i18n("overdue_returns").format(overdueReturns),
                        style = BodySmall,
                        color = it
                    )
                }

                MaterialTheme.colorScheme.warning.use {
                    Text(
                        text = i18n("closing_soon").format(closingSoonReturns),
                        style = BodySmall,
                        color = it
                    )
                }

                MaterialTheme.colorScheme.secondary.use {
                    Text(
                        text = i18n("expiring_warranties").format(expiringWarranties),
                        style = BodySmall,
                        color = it
                    )
                }

                MaterialTheme.colorScheme.error.use {
                    Text(
                        text = i18n("expired_warranties").format(expiredWarranties),
                        style = BodySmall,
                        color = it
                    )
                }
            }
        }
    }
}

/** Empty composable. */
@Composable
private fun emptyBox() {
    Unit
}

/** Format money. */
private fun formatMoney(amount: Double): String {
    return "₹${amount.format("%.0f")}"
}