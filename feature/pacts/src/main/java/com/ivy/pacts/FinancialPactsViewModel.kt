package com.ivy.pacts

import androidx.compose.runtime.*
import androidx.compose.runtime.collectedStateOf
import androidx.compose.runtime.saveState
import androidx.lifecycle.viewModelScope
import com.ivy.base.BaseApp
import com.ivy.data.db.dao.read.FinancialPactDao
import com.ivy.data.db.dao.write.WriteFinancialPactDao
import com.ivy.data.db.entity.FinancialPactEntity
import com.ivy.data.model.primitive.UUID
import com.ivy.i18n.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.Instant

/** ViewModel that manages Financial Pacts state. */
class FinancialPactsViewModel(
    application: BaseApp,
    private val financialPactDao: FinancialPactDao,
    private val writeFinancialPactDao: WriteFinancialPactDao
) : BaseApp(application) {

    private val _pacts = mutableStateOf<List<FinancialPactEntity>>(emptyList())
    val pacts: Flow<List<FinancialPactEntity>>
        get() = _pacts.asFlow()

    private val _isLoading = mutableStateOf(false)
    val isLoading: Flow<Boolean>
        get() = _isLoading.asFlow()

    init {
        loadPacts()
    }

    /** Load all financial pacts from the database. */
    private fun loadPacts() {
        _isLoading.value = true
        withContext(Dispatchers.IO) {
            val pacts = financialPactDao.findAll()
            _pacts.value = pacts
            _isLoading.value = false
        }
    }

    /** Create a new Financial Pact. */
    fun createPact(
        counterpartyName: String,
        pactType: String,
        title: String?,
        originalAmount: Double,
        dueDate: Instant?,
        description: String?,
        notes: String?
    ) {
        val pact = FinancialPactEntity(
            counterpartyName = counterpartyName,
            type = pactType,
            title = title,
            description = description,
            originalAmount = originalAmount,
            remainingAmount = originalAmount,
            dueDate = dueDate,
            status = "ACTIVE",
            createdAt = Instant.now(),
            updatedAt = Instant.now(),
            notes = notes
        )

        viewModelScope.launch(Dispatchers.IO) {
            writeFinancialPactDao.save(pact)
            loadPacts()
        }
    }

    /** Record a repayment against a Financial Pact. */
    fun recordRepayment(
        pactId: UUID,
        amount: Double,
        date: Instant,
        note: String?
    ) {
        if (amount <= 0 || amount > remainingAmount(pactId)) {
            throw IllegalArgumentException("Invalid repayment amount")
        }

        viewModelScope.launch(Dispatchers.IO) {
            // Create repayment record
            // TODO: Add PactRepayment entity persistence
            // Update pact remaining amount
            updatePactRemaining(pactId, amount)
            loadPacts()
        }
    }

    /** Update the remaining amount of a pact. */
    private fun updatePactRemaining(pactId: UUID, amount: Double) {
        withContext(Dispatchers.IO) {
            val pact = financialPactDao.findById(pactId) ?: return
            pact.remainingAmount = max(0.0, pact.remainingAmount - amount)
            pact.updatedAt = Instant.now()
            // TODO: Save updated pact
        }
    }

    /** Get the remaining amount for a pact. */
    fun remainingAmount(pactId: UUID): Double {
        return financialPactDao.findById(pactId)?.remainingAmount ?: 0.0
    }

    /** Get the status of a pact. */
    fun getPactStatus(pactId: UUID): String {
        return financialPactDao.findById(pactId)?.status ?: "CANCELLED"
    }

    /** Check if a pact is overdue. */
    fun isOverdue(pactId: UUID): Boolean {
        val pact = financialPactDao.findById(pactId)
        if (pact == null || pact.status == "SETTLED" || pact.status == "CANCELLED") {
            return false
        }
        return pact.dueDate != null && pact.dueDate!!.isBefore(Instant.now()) && pact.remainingAmount > 0.0
    }

    /** Format due date for display. */
    fun formatDueDate(dueDate: Instant?): String {
        return when (dueDate) {
            null -> i18n("no_due_date")
            else -> {
                val now = Instant.now()
                val daysUntil = java.time.temporal.ChronoUnit.DAYS.between(dueDate.truncatedTo(java.time.temporal.ChronoUnit.DAYS), now.truncatedTo(java.time.temporal.ChronoUnit.DAYS))
                when {
                    daysUntil < 0 -> i18n("due_past").format(-daysUntil)
                    daysUntil == 0 -> i18n("due_today")
                    daysUntil == 1 -> i18n("due_in_1_day")
                    daysUntil == 2 -> i18n("due_in_2_days")
                    daysUntil <= 7 -> i18n("due_in_days").format(daysUntil)
                    else -> i18n("due_soon")
                }
            }
        }
    }

    /** Pact status display. */
    fun getStatusDisplay(status: String): String {
        return when (status) {
            "ACTIVE" -> i18n("active")
            "PARTIALLY_SETTLED" -> i18n("partially_settled")
            "SETTLED" -> i18n("settled")
            "CANCELLED" -> i18n("cancelled")
            else -> status
        }
    }

    /** Pact type display. */
    fun getTypeDisplay(type: String): String {
        return when (type) {
            "I_OWE" -> i18n("i_owe")
            "OWED_TO_ME" -> i18n("owed_to_me")
            "SHARED_EXPENSE" -> i18n("shared_expense")
            else -> type
        }
    }
}

/** Financial Pact State. */
@Immutable
data class FinancialPactState(

    /** List of all financial pacts. */
    val pacts: List<FinancialPactEntity> = emptyList(),

    /** Whether pacts are currently being loaded. */
    val isLoading: Boolean = false
)