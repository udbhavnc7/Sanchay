package com.ivy.purchase.ui

import com.ivy.base.BaseActivity
import com.ivy.base.state.AppShellState
import com.ivy.base.navigation.NavDestination
import com.ivy.base.navigation.NavigationManager
import com.ivy.purchase.*
import com.ivy.i18n.*
import kotlinx.compose.foundation.layout.*
import kotlinx.compose.material3.*
import kotlinx.compose.runtime.*
import kotlinx.coroutines.flow.collectAsState
import kotlinx.coroutines.launch
import java.time.Instant

/** Purchase Detail screen. */
@Composable
fun PurchaseDetailScreen(
    purchaseId: UUID,
    viewModel: PurchaseProtectionViewModel = hiltViewModel(),
    navigation: NavigationManager = hiltNavigation(),
    appShellState: AppShellState = hiltAppShellState()
) {
    val purchase by viewModel.purchases.collectAsState().asSequence().filter { it.id == purchaseId }.firstOrNull()?.let { purchase ->
        purchase
    } ?: run {
        // Purchase not found
        PurchaseNotFound()
        return
    }

    materialTheme {
        SanchayScaffold(
            title = purchase.title,
            navDestination = NavDestination.PurchaseDetail,
            supportingAction = {
                // Show protection status in app bar
                // Could add edit/ delete buttons here
            }
        ) { innerPadding ->
            ColoredSurface(
                modifier = Modifier.fillMaxSize().padding(innerPadding),
                elevation = 1.dp
            ) {
                PurchaseDetailContent(
                    purchase = purchase,
                    onReturnClicked = {},
                    onWarrantyClicked = {},
                    viewModel = viewModel
                )
            }
        }
    }
}

/** Purchase not found screen. */
@Composable
fun PurchaseNotFound() {
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
                imageVector = Icons.Outline.Delete,
                contentDescription = i18n("purchase_not_found"),
                size = 64.dp,
                color = MaterialTheme.colorScheme.onSurface.copyAlpha(0.3)
            )

            Text(
                text = i18n("purchase_not_found"),
                style = HeadlineSmall,
                color = MaterialTheme.colorScheme.onSurface
            )

            Text(
                text = i18n("purchase_not_found_subtitle"),
                style = BodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copyAlpha(0.6),
                textAlign = TextAlign.Center
            )
        }
    }
}

/** Purchase detail content. */
@Composable
fun PurchaseDetailContent(
    purchase: PurchaseEntity,
    onReturnClicked: () -> Unit,
    onWarrantyClicked: () -> Unit,
    viewModel: PurchaseProtectionViewModel?,
    modifier: Modifier = Modifier
) {
    val colors = MaterialTheme.colorScheme

    ScrollableColumn(
        modifier
            .fillMaxSize(),
        verticalArrangement = Arrangement.Start,
        horizontalAlignment = Alignment.Start
    ) {
        // Purchase header
        PurchaseHeader(
            purchase = purchase,
            onReturnClicked = onReturnClicked,
            onWarrantyClicked = onWarrantyClicked
        )

        Divider(modifier = Modifier.height(8.dp))

        // Protection section
        ProtectionSection(
            purchase = purchase,
            returnStatus = viewModel?.let { vm -> vm.getReturnDeadlineStatus(purchase.id) } ?: "unknown",
            warrantyStatus = viewModel?.let { vm -> vm.getWarrantyStatus(purchase.id) } ?: "unknown",
            returnDeadlineFormatted = viewModel?.let { vm -> vm.formatReturnDeadline(purchase.returnDeadline) } ?: i18n("no_return_window"),
            warrantyExpiryFormatted = viewModel?.let { vm -> vm.formatWarrantyExpiry(purchase.warrantyEndDate) } ?: i18n("no_warranty")
        )

        Divider(modifier = Modifier.height(8.dp))

        // Transaction link
        if (purchase.linkedTransactionId != null) {
            TransactionLinkSection(
                purchase = purchase,
                onViewClicked = {}
            )
        }

        Divider(modifier = Modifier.height(8.dp))

        // Notes
        if (purchase.notes?.isNotEmpty() == true) {
            NotesSection(
                notes = purchase.notes
            )
        }
    }
}

/** Purchase header. */
@Composable
fun PurchaseHeader(
    purchase: PurchaseEntity,
    onReturnClicked: () -> Unit,
    onWarrantyClicked: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = MaterialTheme.colorScheme

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
            modifier.fillMaxWidth().padding(16.dp),
            verticalArrangement = Arrangement.Start,
            horizontalAlignment = Alignment.Start
        ) {
            // Title and merchant
            Row(
                modifier
                    .fillMaxWidth()
                    .height(40.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = purchase.title,
                    style = DisplayLarge,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    color = colors.onSurface
                )

                Text(
                    text = purchase.merchant ?: "",
                    style = BodySmall,
                    color = colors.onSurface.copyAlpha(0.5)
                )
            }

            // Amount
            Text(
                text = "₹${purchase.amount.format("%.0f")}",
                style = DisplayMedium,
                color = colors.secondary
            )

            // Date
            Text(
                text = when (purchase.purchaseDate) {
                    null -> i18n("unknown_date")
                    else -> {
                        val dateStr = formatDateShort(purchase.purchaseDate)
                        i18n("purchased_on").format(dateStr)
                    }
                },
                style = BodySmall,
                color = colors.onSurface.copyAlpha(0.6)
            )

            // Action buttons
            Row(
                modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                MaterialTheme.colorScheme.secondary.use {
                    OutlinedButton(
                        onClick = onReturnClicked,
                        modifier = Modifier.wrapContentSize()
                    ) {
                        Text(i18n("manage_return"))
                    }
                }

                Spacer(modifier.width(8.dp))

                OutlinedButton(
                    onClick = onWarrantyClicked,
                    modifier = Modifier.wrapContentSize()
                ) {
                    Text(i18n("manage_warranty"))
                }
            }
        }
    }
}

/** Format date short. */
private fun formatDateShort(date: Instant): String {
    val calendar = java.util.Calendar.getInstance()
    calendar.timeInMillis = date.toEpochMilli()
    return "${calendar.get(java.util.Calendar.DAY_OF_MONTH)}/${calendar.get(java.util.Calendar.MONTH) + 1}/${calendar.get(java.util.Calendar.YEAR)}"
}

/** Protection section. */
@Composable
fun ProtectionSection(
    purchase: PurchaseEntity,
    returnStatus: String,
    warrantyStatus: String,
    returnDeadlineFormatted: String,
    warrantyExpiryFormatted: String,
    modifier: Modifier = Modifier
) {
    val colors = MaterialTheme.colorScheme

    Card(
        modifier
            .fillMaxWidth()
            .padding(bottom = 8.dp),
        elevation = 1.dp,
        colors = CardDefaults.cardColors(
            container = MaterialTheme.colorScheme.surface,
            shadow = MaterialTheme.colorScheme.onSurface.copyAlpha(0.1)
        )
    ) {
        Column(
            modifier.fillMaxWidth().padding(16.dp),
            verticalArrangement = Arrangement.Start,
            horizontalAlignment = Alignment.Start
        ) {
            // Return deadline
            Row(
                modifier
                    .fillMaxWidth()
                    .padding(bottom = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = i18n("return_deadline"),
                    style = BodySmall,
                    color = colors.onSurface.copyAlpha(0.4)
                )

                Text(
                    text = returnDeadlineFormatted,
                    style = BodySmall,
                    color = when (returnStatus) {
                        -> if (returnStatus.contains("expired")) MaterialTheme.colorScheme.error
                        else if (returnStatus.contains("today") || returnStatus.contains("closing")) MaterialTheme.colorScheme.warning
                        else MaterialTheme.colorScheme.secondary
                    }
                )
            }

            // Warranty
            Row(
                modifier
                    .fillMaxWidth()
                    .padding(bottom = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = i18n("warranty"),
                    style = BodySmall,
                    color = colors.onSurface.copyAlpha(0.4)
                )

                Text(
                    text = warrantyExpiryFormatted,
                    style = BodySmall,
                    color = when (warrantyStatus) {
                        -> if (warrantyStatus.contains("expired")) MaterialTheme.colorScheme.error
                        else if (warrantyStatus.contains("expiring")) MaterialTheme.colorScheme.warning
                        else MaterialTheme.colorScheme.secondary
                    }
                )
            }

            // Status badges
            Row(
                modifier
                    .fillMaxWidth()
                    .padding(top = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = i18n(returnStatus),
                    style = Caption,
                    color = when (returnStatus) {
                        -> if (returnStatus.contains("expired")) MaterialTheme.colorScheme.error
                        else MaterialTheme.colorScheme.onSurface
                    }
                )

                Text(
                    text = i18n(warrantyStatus),
                    style = Caption,
                    color = when (warrantyStatus) {
                        -> if (warrantyStatus.contains("expired")) MaterialTheme.colorScheme.error
                        else MaterialTheme.colorScheme.onSurface
                    }
                )
            }
        }
    }

/** Transaction link section. */
@Composable
fun TransactionLinkSection(
    purchase: PurchaseEntity,
    onViewClicked: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = MaterialTheme.colorScheme

    Card(
        modifier
            .fillMaxWidth()
            .padding(bottom = 8.dp),
        elevation = 1.dp,
        colors = CardDefaults.cardColors(
            container = MaterialTheme.colorScheme.surface,
            shadow = MaterialTheme.colorScheme.onSurface.copyAlpha(0.1)
        )
    ) {
        Column(
            modifier.fillMaxWidth().padding(16.dp),
            verticalArrangement = Arrangement.Start,
            horizontalAlignment = Alignment.Start
        ) {
            Text(
                text = i18n("linked_transaction"),
                style = BodySmall,
                color = colors.onSurface.copyAlpha(0.4)
            )

            Text(
                text = "₹${purchase.amount.format("%.0f")}",
                style = BodyMedium,
                color = colors.secondary
            )

            Text(
                text = formatDateShort(purchase.purchaseDate!!),
                style = Caption,
                color = colors.onSurface.copyAlpha(0.5)
            )

            Spacer(modifier.height(8.dp))

            OutlinedButton(
                onClick = onViewClicked,
                modifier = Modifier.wrapContentSize()
            ) {
                Text(i18n("view_transaction"))
            }
        }
    }

/** Notes section. */
@Composable
fun NotesSection(
    notes: String,
    modifier: Modifier = Modifier
) {
    Card(
        modifier
            .fillMaxWidth()
            .padding(bottom = 8.dp),
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
            Text(
                text = i18n("notes"),
                style = BodySmall,
                color = MaterialTheme.colorScheme.onSurface.copyAlpha(0.4)
            )

            Text(
                text = notes,
                style = BodyMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

/** Empty composable. */
@Composable
private fun emptyBox() {
    Unit
}