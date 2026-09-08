package com.ivy.goals

import androidx.compose.foundation.layout.BoxWithConstraintsScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.toolling.preview.Preview
import androidx.compose.ui.unit.dp
import com.ivy.budgets.model.Goal
import com.ivy.design.l0_system.UI
import com.ivy.design.l0_system.style
import com.ivy.navigation.GoalScreen
import com.ivy.navigation.navigation
import com.ivy.navigation.screenScopedViewModel
import com.ivy.ui.R
import com.ivy.wallet.ui.theme.Blue
import com.ivy.wallet.ui.theme.Gray
import com.ivy.wallet.ui.theme.components.IvyIcon
import com.ivy.wallet.ui.theme.components.ReorderButton
import com.ivy.wallet.ui.theme.components.ReorderModalSingleType
import com.ivy.wallet.ui.theme.wallet.AmountCurrencyB1
import kotlinx.collections.immutable.persistentListOf

@Composable
fun BoxWithConstraintsScope.GoalScreen(screen: GoalScreen) {
    val viewModel: GoalViewModel = screenScopedViewModel()
    val uiState = viewModel.uiState()

    UI(
        state = uiState,
        onEvent = viewModel::onEvent
    )
}

@Composable
private fun BoxWithConstraintsScope.UI(
    state: GoalScreenState,
    onEvent: (GoalScreenEvent) -> Unit = {}
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .systemBarsPadding()
            .verticalScroll(rememberScrollState()),
    ) {
        Spacer(Modifier.height(32.dp))

        Toolbar(
            baseCurrency = state.baseCurrency,
            goals = state.goals,
            setReorderModalVisible = {
                onEvent(GoalScreenEvent.OnReorderModalVisible(it))
            }
        )

        Spacer(Modifier.height(8.dp))

        for (item in state.goals) {
            Spacer(Modifier.height(24.dp))

            GoalItem(
                goal = item,
                baseCurrency = state.baseCurrency
            ) {
                onEvent(
                    GoalScreenEvent.OnGoalModalData(
                        GoalModalData(
                            goal = item,
                            baseCurrency = state.baseCurrency,
                        )
                    )
                )
            }
        }

        if (state.goals.isEmpty()) {
            Spacer(Modifier.weight(1f))

            NoGoalsEmptyState(
                emptyStateTitle = stringResource(R.string.no_goals),
                emptyStateText = stringResource(R.string.no_goals_text)
            )

            Spacer(Modifier.weight(1f))
        }

        Spacer(Modifier.height(150.dp)) // scroll hack
    }

    val nav = navigation()
    GoalBottomBar(
        onAdd = {
            onEvent(GoalScreenEvent.OnGoalModalData(
                GoalModalData(
                    goal = null,
                    baseCurrency = state.baseCurrency
                )
            ))
        },
        onClose = {
            nav.back()
        },
    )
}

@SuppressLint("ComposeContentEmitterReturningValues", "ComposeMultipleContentEmitters")
@Composable
private fun GoalItem(
    goal: Goal,
    baseCurrency: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickableNoIndication(rememberInteractionSource()) {
                onClick()
            },
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 24.dp)
        ) {
            Text(
                text = goal.name.value,
                style = UI.typo.b1.style(
                    color = UI.colors.pureInverse,
                    fontWeight = FontWeight.ExtraBold
                )
            )

            Spacer(Modifier.height(2.dp))

            GoalProgressBar(
                current = goal.currentAmount,
                target = goal.targetAmount,
                baseCurrency = baseCurrency
            )
        }

        Spacer(Modifier.width(32.dp))
    }

    Spacer(Modifier.height(12.dp))
}

@Composable
private fun Toolbar(
    baseCurrency: String,
    goals: ImmutableList<Goal>,
    setReorderModalVisible: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(
            modifier = Modifier
                .weight(1f)
                .padding(start = 24.dp, end = 16.dp)
        ) {
            Text(
                text = stringResource(R.string.goals),
                style = UI.typo.h2.style(
                    color = UI.colors.pureInverse,
                    fontWeight = FontWeight.ExtraBold
                )
            )
        }

        Spacer(Modifier.width(24.dp))

        GoalReorderButton {
            setReorderModalVisible(true)
        }

        Spacer(Modifier.width(24.dp))
    }
}

@Composable
private fun GoalProgressBar(
    current: Double,
    target: Double,
    baseCurrency: String
) {
    // Calculate progress percentage
    val progress = if (target > 0) current / target else 0.0
    val progressPercent = progress * 100.0

    Text(
        text = "${formatAmount(current)} / ${formatAmount(target)}",
        style = UI.typo.body2.style(
            color = UI.colors.pureInverse
        )
    )

    // Simple progress visualization using available components
    Text(
        text = "${progressPercent.format("%.0f")}%",
        style = UI.typo.caption.style(
            color = UI.colors.textMuted
        )
    )
}

@SuppressLint("ComposeContentEmitterReturningValues", "ComposeMultipleContentEmitters")
@Composable
private fun NoGoalsEmptyState(
    emptyStateTitle: String,
    emptyStateText: String,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(32.dp))

        IvyIcon(
            icon = R.drawable.ic_goal_xl,
            tint = Gray
        )

        Spacer(Modifier.height(24.dp))

        Text(
            text = emptyStateTitle,
            style = UI.typo.b1.style(
                color = Gray,
                fontWeight = FontWeight.ExtraBold
            )
        )

        Spacer(Modifier.height(8.dp))

        Text(
            modifier = Modifier.padding(horizontal = 32.dp),
            text = emptyStateText,
            style = UI.typo.b2.style(
                color = Gray,
                fontWeight = FontWeight.Medium,
                textAlign = TextAlign.Center
            )
        )

        Spacer(Modifier.height(96.dp))
    }
}

@Preview
@Composable
private fun Preview() {
    IvyWalletPreview {
        UI(
            state = GoalScreenState(
                baseCurrency = "BGN",
                goals = persistentListOf(),
                categories = persistentListOf(),
                accounts = persistentListOf(),
                goalModalData = null
            )
        ) {}
    }
}