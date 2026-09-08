package com.ivy.goals

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.mutableDoubleStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.viewModelScope
import com.ivy.base.legacy.SharedPrefs
import com.ivy.base.time.TimeConverter
import com.ivy.base.time.TimeProvider
import com.ivy.goals.model.Goal
import com.ivy.data.db.dao.read.GoalDao
import com.ivy.data.model.Category
import com.ivy.data.model.Expense
import com.ivy.data.model.Income
import com.ivy.data.model.Transaction
import com.ivy.data.model.Transfer
import com.ivy.data.repository.CategoryRepository
import com.ivy.data.temp.migration.getAccountId
import com.ivy.data.temp.migration.getValue
import com.ivy.frp.sumOfSuspend
import com.ivy.legacy.data.model.FromToTimeRange
import com.ivy.legacy.data.model.toCloseTimeRange
import com.ivy.legacy.datamodel.Account
import com.ivy.legacy.datamodel.Budget
import com.ivy.legacy.domain.deprecated.logic.BudgetCreator
import com.ivy.legacy.utils.format
import com.ivy.legacy.utils.isNotNullOrBlank
import com.ivy.ui.ComposeViewModel
import com.ivy.ui.R
import com.ivy.wallet.domain.action.account.AccountsAct
import com.ivy.wallet.domain.action.budget.BudgetsAct
import com.ivy.wallet.domain.action.exchange.ExchangeAct
import com.ivy.wallet.domain.action.settings.BaseCurrencyAct
import com.ivy.wallet.domain.action.transaction.HistoryTrnsAct
import com.ivy.wallet.domain.deprecated.logic.model.CreateBudgetData
import com.ivy.wallet.domain.pure.exchange.ExchangeData
import com.ivy.wallet.domain.pure.transaction.trnCurrency
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.collections.immutable.ImmutableList
import kotlinx.collections.immutable.persistentListOf
import kotlinx.collections.immutable.toImmutableList
import kotlinx.coroutines.launch
import javax.inject.Inject
import kotlin.math.abs

@Stable
@HiltViewModel
class GoalViewModel @Inject constructor(
    private val sharedPrefs: SharedPrefs,
    private val goalDao: GoalDao,
    private val budgetCreator: BudgetCreator,
    private val ivyContext: com.ivy.legacy.IvyWalletCtx,
    private val accountsAct: AccountsAct,
    private val categoryRepository: CategoryRepository,
    private val budgetsAct: BudgetsAct,
    private val baseCurrencyAct: BaseCurrencyAct,
    private val historyTrnsAct: HistoryTrnsAct,
    private val exchangeAct: ExchangeAct,
    private val timeProvider: TimeProvider,
    private val timeConverter: TimeConverter,
) : ComposeViewModel<GoalScreenState, GoalScreenEvent>() {

    private val baseCurrency = mutableStateOf("")
    private val timeRange = mutableStateOf<com.ivy.legacy.data.model.FromToTimeRange?>(null)
    private val goals = mutableStateOf<ImmutableList<Goal>>(persistentListOf())
    private val categories = mutableStateOf<ImmutableList<Category>>(persistentListOf())
    private val accounts = mutableStateOf<ImmutableList<Account>>(persistentListOf())
    private val goalModalData = mutableStateOf<GoalModalData?>(null)

    @Composable
    override fun uiState(): GoalScreenState {
        LaunchedEffect(Unit) {
            start()
        }

        return GoalScreenState(
            baseCurrency = getBaseCurrency(),
            goals = getGoals(),
            categories = getCategories(),
            accounts = getAccounts(),
            goalModalData = getGoalModalData()
        )
    }

    @Composable
    private fun getBaseCurrency(): String {
        return baseCurrency.value
    }

    @Composable
    private fun getGoals(): ImmutableList<Goal> {
        return goals.value
    }

    @Composable
    private fun getCategories(): ImmutableList<Category> {
        return categories.value
    }

    @Composable
    private fun getAccounts(): ImmutableList<Account> {
        return accounts.value
    }

    @Composable
    private fun getGoalModalData(): GoalModalData? {
        return goalModalData.value
    }

    override fun onEvent(event: GoalScreenEvent) {
        when (event) {
            is GoalScreenEvent.OnCreateGoal -> {
                createGoal(event.goalData)
            }
            is GoalScreenEvent.OnEditGoal -> {
                editGoal(event.goal)
            }
            is GoalScreenEvent.OnDeleteGoal -> {
                deleteGoal(event.goal)
            }
            is GoalScreenEvent.OnGoalModalData -> {
                goalModalData.value = event.goalModalData
            }
        }
    }

    private fun start() {
        viewModelScope.launch {
            categories.value = categoryRepository.findAll().toImmutableList()
            val accounts = accountsAct(Unit)
            val baseCurrency = baseCurrencyAct(Unit)
            val startDateOfMonth = ivyContext.initStartDayOfMonthInMemory(sharedPrefs = sharedPrefs)
            val timeRange = com.ivy.legacy.data.model.TimePeriod.currentMonth(
                startDayOfMonth = startDateOfMonth
            ).toRange(startDateOfMonth = startDateOfMonth, timeConverter, timeProvider)
            val goals = goalDao.findAll().map { it.toGoal() }

            this@GoalViewModel.goals.value = goals.toImmutableList()
            this@GoalViewModel.baseCurrency.value = baseCurrency
            this@GoalViewModel.timeRange.value = timeRange
            this@GoalViewModel.accounts.value = accounts
        }
    }

    private fun createGoal(data: GoalModalData) {
        viewModelScope.launch {
            // Create goal using the goalDao directly
            goalDao.save(data.toGoalEntity()) {
                start()
            }
        }
    }

    private fun editGoal(goal: Goal) {
        viewModelScope.launch {
            // For editing, we need to update the goal in the database
            val goalEntity = goal.toGoalEntity()
            goalEntity.id = goal.id
            goalDao.save(goalEntity) {
                start()
            }
        }
    }

    private fun deleteGoal(goal: Goal) {
        viewModelScope.launch {
            goalDao.deleteById(goal.id) {
                start()
            }
        }
    }
}

fun Goal.toGoalEntity(): GoalEntity {
    return GoalEntity(
        name = name.value,
        targetAmount = targetAmount,
        currentAmount = currentAmount,
        targetDate = targetDate,
        startDate = null,
        status = status.value,
        notes = notes,
        linkedAccountId = linkedAccountId,
        linkedCategoryId = linkedCategoryId,
        orderId = orderId,
        id = id
    )
}