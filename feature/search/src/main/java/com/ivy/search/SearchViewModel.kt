package com.ivy.search

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.viewModelScope
import com.ivy.base.legacy.TransactionHistoryItem
import com.ivy.data.model.primitive.NotBlankTrimmedString
import com.ivy.ui.ComposeViewModel
import com.ivy.data.model.Category
import com.ivy.data.model.getFromAccount
import com.ivy.data.model.getFromValue
import com.ivy.data.repository.CategoryRepository
import com.ivy.domain.features.Features
import com.ivy.legacy.datamodel.Account
import com.ivy.legacy.utils.getDefaultFIATCurrency
import com.ivy.legacy.utils.ioThread
import com.ivy.wallet.domain.action.account.AccountsAct
import com.ivy.wallet.domain.action.settings.BaseCurrencyAct
import com.ivy.wallet.domain.action.transaction.AllTrnsAct
import com.ivy.wallet.domain.action.transaction.TrnsWithDateDivsAct
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.collections.immutable.ImmutableList
import kotlinx.collections.immutable.persistentListOf
import kotlinx.collections.immutable.toImmutableList
import kotlinx.coroutines.launch
import javax.inject.Inject

@Stable
@HiltViewModel
class SearchViewModel @Inject constructor(
    private val trnsWithDateDivsAct: TrnsWithDateDivsAct,
    private val accountsAct: AccountsAct,
    private val categoryRepository: CategoryRepository,
    private val baseCurrencyAct: BaseCurrencyAct,
    private val allTrnsAct: AllTrnsAct,
    private val features: Features
) : ComposeViewModel<SearchState, SearchEvent>() {

    private val transactions =
        mutableStateOf<ImmutableList<TransactionHistoryItem>>(persistentListOf())
    private val baseCurrency = mutableStateOf<String>(getDefaultFIATCurrency().currencyCode)
    private val accounts = mutableStateOf<ImmutableList<Account>>(persistentListOf())
    private val categories = mutableStateOf<ImmutableList<Category>>(persistentListOf())
    private val searchQuery = mutableStateOf("")

    @Composable
    fun getShouldShowAccountSpecificColorInTransactions(): Boolean {
        return features.showAccountColorsInTransactions.asEnabledState()
    }

    @Composable
    override fun uiState(): SearchState {
        LaunchedEffect(Unit) {
            search(searchQuery.value)
        }

        return SearchState(
            searchQuery = searchQuery.value,
            transactions = transactions.value,
            baseCurrency = baseCurrency.value,
            accounts = accounts.value,
            categories = categories.value,
            shouldShowAccountSpecificColorInTransactions = getShouldShowAccountSpecificColorInTransactions()
        )
    }

    override fun onEvent(event: SearchEvent) {
        when (event) {
            is SearchEvent.Search -> search(event.query)
        }
    }

    private fun search(query: String) {
        searchQuery.value = query
        val normalizedQuery = query.lowercase().trim()

        viewModelScope.launch {
            val loadedAccounts = accountsAct(Unit)
            val loadedCategories = categoryRepository.findAll()
            val baseCurr = baseCurrencyAct(Unit)

            val queryResult = ioThread {
                val accountMap = loadedAccounts.associateBy { it.id }
                val categoryMap = loadedCategories.associateBy { it.id.value }

                // Parse amount filter if present
                val greaterThan = when {
                    normalizedQuery.startsWith(">") -> normalizedQuery.removePrefix(">").trim().toDoubleOrNull()
                    normalizedQuery.startsWith("above ") -> normalizedQuery.removePrefix("above ").trim().toDoubleOrNull()
                    else -> null
                }
                val lessThan = when {
                    normalizedQuery.startsWith("<") -> normalizedQuery.removePrefix("<").trim().toDoubleOrNull()
                    normalizedQuery.startsWith("below ") -> normalizedQuery.removePrefix("below ").trim().toDoubleOrNull()
                    else -> null
                }
                val exactAmount = normalizedQuery.toDoubleOrNull()

                val filteredTransactions = allTrnsAct(Unit)
                    .filter { transaction ->
                        if (normalizedQuery.isBlank()) return@filter true

                        val amount = transaction.getFromValue().amount.value

                        // Check amount comparison
                        if (greaterThan != null && amount > greaterThan) return@filter true
                        if (lessThan != null && amount < lessThan) return@filter true
                        if (exactAmount != null && Math.abs(amount - exactAmount) < 0.01) return@filter true

                        // Check title and description
                        if (transaction.title?.value?.lowercase()?.contains(normalizedQuery) == true) return@filter true
                        if (transaction.description?.value?.lowercase()?.contains(normalizedQuery) == true) return@filter true

                        // Check category name
                        val categoryName = transaction.category?.let { categoryMap[it.value]?.name?.value?.lowercase() }
                        if (categoryName?.contains(normalizedQuery) == true) return@filter true

                        // Check account name
                        val accountName = accountMap[transaction.getFromAccount().value]?.name?.lowercase()
                        if (accountName?.contains(normalizedQuery) == true) return@filter true

                        // Check transaction type
                        val typeName = when (transaction) {
                            is com.ivy.data.model.Expense -> "expense"
                            is com.ivy.data.model.Income -> "income"
                            is com.ivy.data.model.Transfer -> "transfer"
                        }
                        if (typeName.contains(normalizedQuery)) return@filter true

                        false
                    }
                trnsWithDateDivsAct(
                    TrnsWithDateDivsAct.Input(
                        baseCurrency = baseCurr,
                        transactions = filteredTransactions
                    )
                ).toImmutableList()
            }

            transactions.value = queryResult
            baseCurrency.value = baseCurr
            accounts.value = loadedAccounts
            categories.value = loadedCategories.toImmutableList()
        }
    }
}
