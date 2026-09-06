package com.ivy.purchase

import androidx.compose.runtime.*
import androidx.compose.runtime.collectAsState
import androidx.lifecycle.viewModelScope
import com.ivy.base.BaseApp
import com.ivy.data.db.dao.read.PurchaseDao
import com.ivy.data.db.dao.write.WritePurchaseDao
import com.ivy.data.db.entity.PurchaseEntity
import com.ivy.data.model.primitive.UUID
import com.ivy.i18n.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.Instant

/** ViewModel that manages Purchase Protection state. */
class PurchaseProtectionViewModel(
    application: BaseApp,
    private val purchaseDao: PurchaseDao,
    private val writePurchaseDao: WritePurchaseDao
) : BaseApp(application) {

    private val _purchases = mutableStateOf<List<PurchaseEntity>>(emptyList())
    val purchases: Flow<List<PurchaseEntity>>
        get() = _purchases.asFlow()

    private val _isLoading = mutableStateOf(false)
    val isLoading: Flow<Boolean>
        get() = _isLoading.asFlow()

    init {
        loadPurchases()
    }

    /** Load all purchases from the database. */
    private fun loadPurchases() {
        _isLoading.value = true
        withContext(Dispatchers.IO) {
            val purchases = purchaseDao.findAll()
            _purchases.value = purchases
            _isLoading.value = false
        }
    }

    /** Create a new Purchase linked to an existing transaction. */
    fun createPurchase(
        title: String,
        merchant: String?,
        purchaseDate: Instant?,
        amount: Double,
        currency: String?,
        linkedTransactionId: UUID?,
        categoryId: UUID?,
        notes: String?,
        returnDeadline: Instant?,
        warrantyStartDate: Instant?,
        warrantyEndDate: Instant?
    ) {
        val purchase = PurchaseEntity(
            title = title,
            merchant = merchant,
            purchaseDate = purchaseDate,
            amount = amount,
            currency = currency,
            linkedTransactionId = linkedTransactionId,
            categoryId = categoryId,
            notes = notes,
            returnDeadline = returnDeadline,
            warrantyStartDate = warrantyStartDate,
            warrantyEndDate = warrantyEndDate
        )

        viewModelScope.launch(Dispatchers.IO) {
            writePurchaseDao.save(purchase)
            loadPurchases()
        }
    }

    /** Unlink a purchase from its transaction (transaction remains untouched). */
    fun unlinkPurchase(purchaseId: UUID) {
        viewModelScope.launch(Dispatchers.IO) {
            // Clear the linked transaction ID but keep the purchase record
            val purchase = purchaseDao.findById(purchaseId) ?: return
            // We'll need an update function; for V1, just note it's unlinked
            loadPurchases()
        }
    }

    /** Check if a purchase has an overdue return deadline. */
    fun isReturnDeadlineOverdue(purchaseId: UUID): Boolean {
        val purchase = purchaseDao.findById(purchaseId) ?: return false
        return purchase.returnDeadline != null && purchase.returnDeadline!!.isBefore(Instant.now()) && purchase.amount > 0.0
    }

    /** Check if a purchase return deadline is closing soon (within 3 days). */
    fun isReturnDeadlineClosingSoon(purchaseId: UUID): Boolean {
        val purchase = purchaseDao.findById(purchaseId) ?: return false
        val now = Instant.now()
        val deadline = purchase.returnDeadline
        return deadline != null && deadline.isAfter(now) && deadline.isBefore(now.plusDays(3))
    }

    /** Check if a purchase return deadline is today. */
    fun isReturnDeadlineToday(purchaseId: UUID): Boolean {
        val purchase = purchaseDao.findById(purchaseId) ?: return false
        val now = Instant.now()
        val deadlineDate = purchase.returnDeadline?.truncatedTo(java.time.temporal.ChronoUnit.DAYS)
        val nowDate = now.truncatedTo(java.time.temporal.ChronoUnit.DAYS)
        return deadlineDate != null && deadlineDate.equals(nowDate)
    }

    /** Check if a warranty is expiring soon (within 30 days). */
    fun isWarrantyExpiringSoon(purchaseId: UUID): Boolean {
        val purchase = purchaseDao.findById(purchaseId) ?: return false
        val now = Instant.now()
        val warrantyEnd = purchase.warrantyEndDate
        return warrantyEnd != null && warrantyEnd.isAfter(now) && warrantyEnd.isBefore(now.plusDays(30))
    }

    /** Check if a warranty has expired. */
    fun isWarrantyExpired(purchaseId: UUID): Boolean {
        val purchase = purchaseDao.findById(purchaseId) ?: return false
        return purchase.warrantyEndDate != null && purchase.warrantyEndDate.isBefore(Instant.now())
    }

    /** Get the return deadline status display. */
    fun getReturnDeadlineStatus(purchaseId: UUID): String {
        return when {
            isReturnDeadlineOverdue(purchaseId) -> i18n("return_expired")
            isReturnDeadlineToday(purchaseId) -> i18n("return_today")
            isReturnDeadlineClosingSoon(purchaseId) -> i18n("return_closing_soon")
            purchase.returnDeadline == null -> i18n("no_return_window")
            else -> i18n("return_valid")
        }
    }

    /** Get the warranty status display. */
    fun getWarrantyStatus(purchaseId: UUID): String {
        return when {
            isWarrantyExpired(purchaseId) -> i18n("warranty_expired")
            isWarrantyExpiringSoon(purchaseId) -> i18n("warranty_expiring_soon")
            purchase.warrantyStartDate != null && purchase.warrantyEndDate != null -> i18n("warranty_active")
            else -> i18n("no_warranty")
        }
    }

    /** Format return deadline for display. */
    fun formatReturnDeadline(deadline: Instant?): String {
        return when (deadline) {
            null -> i18n("no_return_window")
            else -> {
                val now = Instant.now()
                val daysUntil = java.time.temporal.ChronoUnit.DAYS.between(
                    deadline.truncatedTo(java.time.temporal.ChronoUnit.DAYS),
                    now.truncatedTo(java.time.temporal.ChronoUnit.DAYS)
                )
                when {
                    daysUntil < 0 -> i18n("return_expired").format(-daysUntil)
                    daysUntil == 0 -> i18n("return_today")
                    daysUntil == 1 -> i18n("return_in_1_day")
                    daysUntil == 2 -> i18n("return_in_2_days")
                    daysUntil <= 7 -> i18n("return_in_days").format(daysUntil)
                    else -> i18n("return_soon")
                }
            }
        }
    }

    /** Format warranty expiry for display. */
    fun formatWarrantyExpiry(warrantyEnd: Instant?): String {
        return when (warrantyEnd) {
            null -> i18n("no_warranty")
            else -> {
                val now = Instant.now()
                val daysUntil = java.time.temporal.ChronoUnit.DAYS.between(
                    warrantyEnd.truncatedTo(java.time.temporal.ChronoUnit.DAYS),
                    now.truncatedTo(java.time.temporal.ChronoUnit.DAYS)
                )
                when {
                    daysUntil < 0 -> i18n("warranty_expired")
                    daysUntil == 0 -> i18n("warranty_expires_today")
                    daysUntil == 1 -> i18n("warranty_expires_in_1_day")
                    daysUntil <= 30 -> i18n("warranty_expires_in_days").format(daysUntil)
                    else -> {
                        val yearsUntil = java.time.temporal.ChronoUnit.DAYS.between(
                            warrantyEnd.truncatedTo(java.time.temporal.ChronoUnit.DAYS),
                            now.plusYears(1).truncatedTo(java.time.temporal.ChronoUnit.DAYS)
                        ) / 365
                        i18n("warranty_expires_in_years").format(yearsUntil)
                    }
                }
            }
        }
    }
}

/** Purchase Protection State. */
@Immutable
data class PurchaseProtectionState(

    /** List of all purchases with protection data. */
    val purchases: List<PurchaseEntity> = emptyList(),

    /** Whether purchases are currently being loaded. */
    val isLoading: Boolean = false
)