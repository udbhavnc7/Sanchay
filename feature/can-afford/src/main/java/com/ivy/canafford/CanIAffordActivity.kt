package com.ivy.canafford

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import dagger.hilt.android.AndroidEntryPoint
import dagger.hilt.android.Hilt
import com.ivy.base.resource.IvyViewModel
import com.ivy.base.threading.DispatchersProvider
import kotlinx.android.synthetic.main.activity_canafford.*

@Hilt
@AndroidEntryPoint
class CanIAffordActivity : AppCompatActivity() {

    private var viewModel: CanIAffordViewModel? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_canafford)

        viewModel = CanIAffordViewModel(
            context = this,
            resourceProvider = /* ResourceProvider */,
            dispatchers = /* DispatchersProvider */
        )

        setupViews()
        observeViewModel()
        setupListeners()
    }

    private fun setupViews() {
        // Set up initial state
        val today = java.text.SimpleDateFormat("MMM dd, yyyy", java.util.Locale.getDefault())
            .format(java.util.Date())

        findViewById<TextView>(R.id.dateTv).text = "Today: $today"
    }

    private fun observeViewModel() {
        viewModel?.scenario.collect { scenario ->
            if (scenario != null) {
                // Update UI with scenario details
            }
        }

        viewModel?.result.collect { result ->
            if (result != null) {
                displayResult(result)
            }
        }

        viewModel?.validationErrors.collect { errors ->
            if (errors.isNotEmpty()) {
                Toast.makeText(this, errors.joinToString("\n"), Toast.LENGTH_LONG).show()
            }
        }

        viewModel?.isCalculating.collect { calculating ->
            // Show/hide progress
        }

        viewModel?.previewText.collect { preview ->
            findViewById<TextView>(R.id.previewTv).text = preview
            findViewById<TextView>(R.id.previewTitle).visibility = View.VISIBLE
            findViewById<TextView>(R.id.previewTv).visibility = View.VISIBLE
        }
    }

    private fun displayResult(result: CanIAffordResult) {
        findViewById<LinearLayout>(R.id.resultContainer).visibility = View.VISIBLE

        when (result.state) {
            com.ivy.canafford.AffordabilityState.COMFORTABLE -> {
                findViewById<TextView>(R.id.previewTv).textColor = android.graphics.Color.GREEN
                findViewById<TextView>(R.id.previewTv).text = "✅ " + (result.why ?: "You can make this purchase without violating any guardrails.")
            }
            com.ivy.canafford.AffordabilityState.TIGHT -> {
                findViewById<TextView>(R.id.previewTv).textColor = android.graphics.Color.parseColor("#FFA000")
                findViewById<TextView>(R.id.previewTv).text = "⚠️ " + (result.why ?: "This purchase would impact your financial position.")
            }
            com.ivy.canafford.AffordabilityState.NOT_AFFORDABLE -> {
                findViewById<TextView>(R.id.previewTv).textColor = android.graphics.Color.RED
                findViewById<TextView>(R.id.previewTv).text = "❌ " + (result.why ?: "This purchase is not affordable given your current financial position.")
            }
            com.ivy.canafford.AffordabilityState.INSUFFICIENT_DATA -> {
                findViewById<TextView>(R.id.previewTv).textColor = android.graphics.Color.parseColor("#666666")
                findViewById<TextView>(R.id.previewTv).text = "ℹ️ " + (result.why ?: "Not enough information to confidently simulate this purchase.")
            }
        }
    }

    private fun setupListeners() {
        findViewById<Button>(R.id.calculateBtn).setOnClickListener {
            viewModel?.calculateAffordability()
        }

        findViewById<Button>(R.id.cancelBtn).setOnClickListener {
            finish()
        }

        findViewById<Button>(R.id.testNowBtn).setOnClickListener {
            viewModel?.testScenario()
        }
    }
}