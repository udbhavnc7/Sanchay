package com.ivy.rules

import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import dagger.hilt.android.AndroidEntryPoint
import dagger.hilt.android.Hilt
import com.ivy.base.resource.IvyViewModel
import com.ivy.base.threading.DispatchersProvider
import kotlinx.coroutines.launch

@Hilt
@AndroidEntryPoint
class RuleDetailActivity : AppCompatActivity() {

    private var viewModel: RuleViewModel? = null
    private var ruleId: UUID? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_rule_detail)

        // Get rule ID from intent
        ruleId = intent.getLongExtra("ruleId", 0) as UUID? 

        viewModel = RuleViewModel(
            ruleRepository = RuleRepository(
                ruleDao = /* FinancialRuleDao */,
                writeDao = /* WriteFinancialRuleDao */,
                transactionDao = /* TransactionDao */,
                budgetDao = /* BudgetDao */,
                goalDao = /* GoalDao */,
                purchaseDao = /* PurchaseDao */,
                pactDao = /* FinancialPactDao */,
                cashFlowCalculator = /* CashFlowCalculator */
            ),
            context = this,
            resourceProvider = /* ResourceProvider */,
            dispatchers = /* DispatchersProvider */
        )

        setupRuleDetail()
        observeViewModel()
        setupButtons()
    }

    private fun setupRuleDetail() {
        if (ruleId == null) {
            finish()
            return
        }

        val evaluation = viewModel?.evaluateRule(ruleId!!)
        val rule = viewModel?.findActiveRule(ruleId!!)

        // Update UI
        findViewById<TextView>(R.id.ruleName).text = rule?.name

        when (rule?.triggerType) {
            "spending_threshold" -> {
                findViewById<TextView>(R.id.conditionText).text =
                    "Food spending ${rule.conditionOperator} ${formatCurrency(rule.thresholdValue)}/week"
                findViewById<TextView>(R.id.currentValueText).text =
                    "₹${rule.relevantAmount ?: 0}"
                findViewById<TextView>(R.id.thresholdText).text =
                    "₹${rule.thresholdValue}"
            }
            "budget_threshold" -> {
                findViewById<TextView>(R.id.conditionText).text =
                    "${rule.name} budget ${rule.conditionOperator} ${rule.thresholdValue.toInt()}%"
                findViewById<TextView>(R.id.currentValueText).text =
                    "${(rule.relevantAmount ?? 0).toInt}%"
                findViewById<TextView>(R.id.thresholdText).text =
                    "${rule.thresholdValue.toInt}%"
            }
            "projected_balance" -> {
                findViewById<TextView>(R.id.conditionText).text =
                    "Projected balance ${rule.conditionOperator} ${formatCurrency(rule.thresholdValue)}"
                findViewById<TextView>(R.id.currentValueText).text =
                    "₹${rule.relevantAmount ?: 0}"
                findViewById<TextView>(R.id.thresholdText).text =
                    "₹${rule.thresholdValue}"
            }
            "commitment_due_soon" -> {
                findViewById<TextView>(R.id.conditionText).text =
                    "Payment due within ${rule.days} days"
                findViewById<TextView>(R.id.currentValueText).text = ""
                findViewById<TextView>(R.id.thresholdText).text = ""
            }
            "pact_overdue" -> {
                findViewById<TextView>(R.id.conditionText).text =
                    "₹${rule.relevantAmount} overdue"
                findViewById<TextView>(R.id.currentValueText).text = ""
                findViewById<TextView>(R.id.thresholdText).text = ""
            }
            "goal_behind_pace" -> {
                findViewById<TextView>(R.id.conditionText).text =
                    "${rule.name} goal behind pace"
                findViewById<TextView>(R.id.currentValueText).text = ""
                findViewById<TextView>(R.id.thresholdText).text = ""
            }
            "purchase_return" -> {
                findViewById<TextView>(R.id.conditionText).text =
                    "Return deadline: ${rule.deadlineText}"
                findViewById<TextView>(R.id.currentValueText).text = ""
                findViewById<TextView>(R.id.thresholdText).text = ""
            }
            "purchase_warranty" -> {
                findViewById<TextView>(R.id.conditionText).text =
                    "Warranty expiry: ${rule.warrantyText}"
                findViewById<TextView>(R.id.currentValueText).text = ""
                findViewById<TextView>(R.id.thresholdText).text = ""
            }
        }

        // Update status
        val triggered = evaluation?.triggered ?: false
        val severity = if (triggered) "warning" else "info"
        findViewById<TextView>(R.id.statusText).text = if (triggered) "Triggered" : "Healthy"
        findViewById<TextView>(R.id.statusIcon).setImageResource(
            if (triggered) R.drawable.ic_baseline_error_24 else R.drawable.ic_baseline_check_24
        )

        // Explanation
        findViewById<TextView>(R.id.explanationText).text =
            evaluation?.explanation ?: "No explanation available"

        // Last triggered
        findViewById<TextView>(R.id.lastTriggeredText).text =
            if (rule.lastTriggeredAt != null) {
                " ${java.text.DateFormat.getDateInstance().format(rule.lastTriggeredAt!!)}"
            } else {
                "Never"
            }
    }

    private fun observeViewModel() {
        // Observe and update UI
    }

    private fun setupButtons() {
        val editBtn = findViewById(R.id.editBtn)
        val deleteBtn = findViewById(R.id.deleteBtn)
        val testNowBtn = findViewById(R.id.testNowBtn)
        val enableDisableBtn = findViewById(R.id.enableDisableBtn)

        editBtn.setOnClickListener {
            // Navigate back or show edit mode
            Toast.makeText(this, "Edit mode", Toast.LENGTH_SHORT).show()
        }

        deleteBtn.setOnClickListener {
            viewModel?.deleteRule(ruleId!!)
            finish()
        }

        testNowBtn.setOnClickListener {
            viewModel?.testRuleEvaluation()
        }

        enableDisableBtn.setOnClickListener {
            viewModel?.toggleRule(ruleId!!)
            setupRuleDetail() // Refresh UI
        }
    }
}