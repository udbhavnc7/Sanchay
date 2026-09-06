package com.ivy.agent

import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import dagger.hilt.android.AndroidEntryPoint
import dagger.hilt.android.Hilt
import com.ivy.base.resource.IvyViewModel
import com.ivy.base.threading.DispatchersProvider
import kotlinx.android.synthetic.main.activity_agent.*
import kotlinx.coroutines.launch

@Hilt
@AndroidEntryPoint
class AgentActivity : AppCompatActivity() {

    private var viewModel: AgentViewModel? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_agent)

        viewModel = AgentViewModel(
            context = this,
            resourceProvider = /* ResourceProvider */,
            dispatchers = /* DispatchersProvider */
        )

        setupConversations()
        observeViewModel()
        setupSuggestedPrompts()
        setupListeners()
    }

    private fun setupConversations() {
        // Set up conversation history display
        val conversationHistory = viewModel?.getConversationHistory() ?: return
        // In a full implementation, set up the RecyclerView adapter
    }

    private fun observeViewModel() {
        viewModel?.conversationHistory.collect { history ->
            // Update conversation display
        }

        viewModel?.isProcessing.collect { processing ->
            sendBtn.isEnabled = !processing
        }
    }

    private fun setupSuggestedPrompts() {
        send1Btn.setOnClickListener {
            val prompt = "Where did my money go?"
            viewModel?.processUserInput(prompt)
        }

        send2Btn.setOnClickListener {
            val prompt = "What's coming up?"
            viewModel?.processUserInput(prompt)
        }

        send3Btn.setOnClickListener {
            val prompt = "Can I afford ₹10,000?"
            viewModel?.processUserInput(prompt)
        }
    }

    private fun setupListeners() {
        sendBtn.setOnClickListener {
            val text = messageEt.text.toString().trim()
            if (text.isNotEmpty()) {
                viewModel?.processUserInput(text)
                messageEt.text.clear()
            }
        }
    }
}