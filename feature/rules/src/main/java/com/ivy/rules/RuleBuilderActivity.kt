package com.ivy.rules

import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.RadioGroup
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.viewbinding.ViewBinding
import com.ivy.base.resource.IvyViewModel
import com.ivy.base.threading.DispatchersProvider
import dagger.hilt.android.AndroidEntryPoint
import dagger.hilt.android.Hilt

@Hilt
@AndroidEntryPoint
class RuleBuilderActivity : AppCompatActivity() {

    private var viewModel: RuleBuilderViewModel? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_rule_builder)

        viewModel = RuleBuilderViewModel(
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

        setupStep1()
        observeViewModel()
        setupButtons()
    }

    private fun setupStep1() {
        val spendingRadio = findViewById<RadioGroup>(R.id.ruleTypeGroup).findViewById<RadioButton>(R.id.spendingRadio)
        val budgetRadio = findViewById<RadioGroup>(R.id.ruleTypeGroup).findViewById<RadioButton>(R.id.budgetRadio)
        val cashFlowRadio = findViewById<RadioGroup>(R.id.ruleTypeGroup).findViewById<RadioButton>(R.id.cashFlowRadio)
        val commitmentsRadio = findViewById<RadioGroup>(R.id.ruleTypeGroup).findViewById<RadioButton>(R.id.commitmentsRadio)
        val goalsRadio = findViewById<RadioGroup>(R.id.ruleTypeGroup).findViewById<RadioButton>(R.id.goalsRadio)
        val pactsRadio = findViewById<RadioGroup>(R.id.ruleTypeGroup).findViewById<RadioButton>(R.id.pactsRadio)
        val purchaseRadio = findViewById<RadioGroup>(R.id.ruleTypeGroup).findViewById<RadioButton>(R.id.purchaseRadio)

        val nextBtn = findViewById(R.id.nextBtn)

        spendingRadio.setOnCheckedChangeListener { _, _ ->
            viewModel?.setStep1Selection("spending_threshold", "Food")
        }
        budgetRadio.setOnCheckedChangeListener { _, _ ->
            viewModel?.setStep1Selection("budget_threshold", null)
        }
        cashFlowRadio.setOnCheckedChangeListener { _, _ ->
            viewModel?.setStep1Selection("projected_balance", null)
        }
        commitmentsradio.setOnCheckedChangeListener { _, _ ->
            viewModel?.setStep1Selection("commitment_due_soon", null)
        }
        goalsRadio.setOnCheckedChangeListener { _, _ ->
            viewModel?.setStep1Selection("goal_behind_pace", null)
        }
        pactsRadio.setOnCheckedChangeListener { _, _ ->
            viewModel?.setStep1Selection("pact_overdue", null)
        }
        purchaseRadio.setOnCheckedChangeListener { _, _ ->
            viewModel?.setStep1Selection("purchase_return", null)
        }

        nextBtn.setOnClickListener {
            viewModel?.nextStep()
        }
    }

    private fun observeViewModel() {
        viewModel?.step.collect { step ->
            // Update UI based on step
        }

        viewModel?.previewText.collect { preview ->
            // Show preview to user
        }

        viewModel?.validationErrors.collect { errors ->
            if (errors.isNotEmpty()) {
                Toast.makeText(this, errors.joinToString("\n"), Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun setupButtons() {
        val prevBtn = findViewById(R.id.prevBtn)
        val nextBtn = findViewById(R.id.nextBtn)
        val createBtn = findViewById(R.id.createBtn)

        prevBtn.setOnClickListener {
            viewModel?.prevStep()
        }

        nextBtn.setOnClickListener {
            viewModel?.nextStep()
        }

        createBtn.setOnClickListener {
            viewModel?.finalizeRule()
            Toast.makeText(this, "Guardrail created!", Toast.LENGTH_SHORT).show()
            finish()
        }
    }
}